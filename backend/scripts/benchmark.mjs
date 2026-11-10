#!/usr/bin/env node
// ResilCode AI - Semgrep benchmark.
// Runs the rules against backend/benchmark and compares the result to benchmark/expected.json.
//   node scripts/benchmark.mjs            -> uses the resilcode-semgrep Docker container
//   node scripts/benchmark.mjs --local    -> uses a semgrep installed on this machine
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const LOCAL = process.argv.includes("--local");
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BENCH = path.join(ROOT, "benchmark");
const RULES = path.join(ROOT, "rules");
const SEMGREP_FLAGS = ["--json", "--quiet", "--metrics=off", "--disable-version-check", "--no-git-ignore"];

const parse = (s) => { const [rule, n] = s.split("@"); return { rule, n: n ? Number(n) : 1 }; };
const pct = (a, b) => (b === 0 ? "n/a" : ((100 * a) / b).toFixed(1) + "%");

function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p).map((f) => e.name + "/" + f));
    else out.push(e.name);
  }
  return out;
}

async function semgrep(args) {
  const [cmd, base] = LOCAL
    ? ["semgrep", []]
    : ["docker", ["exec", "resilcode-semgrep", "semgrep"]];
  return run(cmd, [...base, ...args], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
}

async function main() {
  const expected = JSON.parse(fs.readFileSync(path.join(BENCH, "expected.json"), "utf8"));

  // Every rule id defined in backend/rules
  const ruleIds = fs
    .readdirSync(RULES)
    .filter((f) => f.endsWith(".yml"))
    .flatMap((f) => [...fs.readFileSync(path.join(RULES, f), "utf8").matchAll(/^\s*- id:\s*(\S+)/gm)].map((m) => m[1]));

  // Check the answer key against the files on disk
  const vulnFiles = listFiles(path.join(BENCH, "vuln"));
  const safeFiles = listFiles(path.join(BENCH, "safe"));
  const limitFiles = listFiles(path.join(BENCH, "limits"));
  const problems = [];
  for (const f of vulnFiles) if (!expected.vuln[f]) problems.push(`vuln/${f} has no entry in expected.json`);
  for (const f of Object.keys(expected.vuln)) if (!vulnFiles.includes(f)) problems.push(`expected.json lists vuln/${f} but the file does not exist`);
  for (const f of limitFiles) if (!expected.limits[f]) problems.push(`limits/${f} has no entry in expected.json`);
  for (const f of Object.keys(expected.limits)) if (!limitFiles.includes(f)) problems.push(`expected.json lists limits/${f} but the file does not exist`);
  for (const [f, rules] of Object.entries(expected.vuln)) for (const r of rules) if (!ruleIds.includes(parse(r).rule)) problems.push(`vuln/${f} expects unknown rule "${parse(r).rule}"`);
  if (problems.length) {
    console.error("Answer key problems:\n  " + problems.join("\n  "));
    process.exit(2);
  }

  // Run Semgrep
  const target = LOCAL ? ["--config", "rules", "benchmark"] : ["--config", "/rules", "/benchmark"];
  let version = "unknown";
  try { version = (await semgrep(["--version"])).stdout.trim(); } catch {}
  let data;
  try {
    const { stdout } = await semgrep([...target.slice(0, 2), ...SEMGREP_FLAGS, target[2]]);
    data = JSON.parse(stdout);
  } catch (e) {
    let detail = (e.stderr || "").trim();
    try {
      const j = JSON.parse((e.stdout || "").trim());
      detail = (j.errors || []).map((x) => x.message || JSON.stringify(x)).join("\n") || detail;
    } catch {
      detail = detail || (e.stdout || "").trim();
    }
    console.error("Could not run Semgrep:\n" + (detail || e.message));
    console.error(LOCAL ? "Is semgrep installed?" : "Is the container running? Try: docker compose up -d");
    process.exit(2);
  }
  if (data.errors.length) {
    console.error("Semgrep reported errors, so the results cannot be trusted:");
    for (const e of data.errors) console.error("  - " + (e.message || JSON.stringify(e)).split("\n")[0]);
    process.exit(2);
  }

  // file (relative to benchmark/) -> list of rule ids
  const found = {};
  for (const r of data.results) {
    const m = r.path.replace(/\\/g, "/").match(/(?:^|\/)benchmark\/(.+)$/);
    if (!m) continue;
    (found[m[1]] ??= []).push(r.check_id.split(".").pop());
  }
  const rulesIn = (key) => new Set(found[key] ?? []);

  // ---- Core benchmark: vuln/ and safe/ ----
  const misses = [];
  const extras = [];
  let filesDetected = 0, instTotal = 0, instFound = 0, tpFindings = 0;
  const perRule = Object.fromEntries(ruleIds.map((id) => [id, { planted: 0, caught: 0, falseAlarms: 0 }]));
  for (const f of vulnFiles) {
    const want = expected.vuln[f].map(parse);
    const gotList = found["vuln/" + f] ?? [];
    let all = true;
    for (const { rule, n } of want) {
      const have = gotList.filter((x) => x === rule).length;
      const caught = Math.min(have, n);
      perRule[rule].planted += n;
      perRule[rule].caught += caught;
      instTotal += n;
      instFound += caught;
      if (caught < n) { all = false; misses.push({ file: "vuln/" + f, rule, expected: n, found: have }); }
    }
    if (all) filesDetected++;
    for (const r of gotList) {
      if (want.some((w) => w.rule === r)) tpFindings++;
      else extras.push({ file: "vuln/" + f, rule: r });
    }
  }
  const safeFlagged = [];
  let fpFindings = 0;
  for (const f of safeFiles) {
    const hits = found["safe/" + f] ?? [];
    if (hits.length) {
      safeFlagged.push({ file: "safe/" + f, rules: [...new Set(hits)] });
      fpFindings += hits.length;
      for (const r of hits) perRule[r] && perRule[r].falseAlarms++;
    }
  }

  // ---- Known limitations ----
  const limits = Object.entries(expected.limits).map(([f, info]) => {
    const fires = rulesIn("limits/" + f).has(info.rule);
    const asDocumented = info.kind === "false_positive" ? fires : !fires;
    return { file: f, ...info, fires, asDocumented };
  });
  const limFP = limits.filter((l) => l.kind === "false_positive");
  const limFN = limits.filter((l) => l.kind === "false_negative");

  // ---- Summary numbers ----
  const core = {
    vulnFiles: vulnFiles.length, filesDetected,
    detectionRate: pct(filesDetected, vulnFiles.length),
    plantedProblems: instTotal, plantedFound: instFound,
    safeFiles: safeFiles.length, safeFlagged: safeFlagged.length,
    falsePositiveRate: pct(safeFlagged.length, safeFiles.length),
    precision: pct(tpFindings, tpFindings + fpFindings),
  };
  const stressVuln = vulnFiles.length + limFN.length;
  const stressDetected = filesDetected + limFN.filter((l) => l.fires).length;
  const stressSafe = safeFiles.length + limFP.length;
  const stressFlagged = safeFlagged.length + limFP.filter((l) => l.fires).length;
  const stress = {
    vulnFiles: stressVuln, filesDetected: stressDetected, detectionRate: pct(stressDetected, stressVuln),
    safeFiles: stressSafe, safeFlagged: stressFlagged, falsePositiveRate: pct(stressFlagged, stressSafe),
  };

  // ---- Console output ----
  const L = [];
  const date = new Date().toLocaleDateString("en-CA");
  L.push(`ResilCode AI - Semgrep benchmark (${date}, Semgrep ${version}, ${ruleIds.length} rules)`);
  L.push("");
  L.push("CORE BENCHMARK (vuln/ and safe/)");
  L.push(`  Detection rate:       ${core.filesDetected}/${core.vulnFiles} vulnerable files (${core.detectionRate})`);
  L.push(`  Planted problems:     ${core.plantedFound}/${core.plantedProblems} found`);
  L.push(`  Missed (false neg.):  ${core.plantedProblems - core.plantedFound}`);
  L.push(`  False-positive rate:  ${core.safeFlagged}/${core.safeFiles} safe files flagged (${core.falsePositiveRate})`);
  L.push(`  Precision:            ${core.precision} (correct findings / all findings, extras on vuln files not counted)`);
  L.push("");
  L.push("WITH KNOWN LIMITATIONS ADDED (stress view)");
  L.push(`  Detection rate:       ${stress.filesDetected}/${stress.vulnFiles} (${stress.detectionRate})`);
  L.push(`  False-positive rate:  ${stress.safeFlagged}/${stress.safeFiles} (${stress.falsePositiveRate})`);
  L.push("");
  L.push("PER RULE            planted  caught  false alarms");
  for (const [id, v] of Object.entries(perRule)) L.push(`  ${id.padEnd(34)} ${String(v.planted).padStart(3)}  ${String(v.caught).padStart(5)}  ${String(v.falseAlarms).padStart(8)}`);
  if (misses.length) { L.push(""); L.push("MISSED (regressions):"); for (const m of misses) L.push(`  ${m.file}: ${m.rule} expected ${m.expected}, found ${m.found}`); }
  if (safeFlagged.length) { L.push(""); L.push("FALSE POSITIVES (regressions):"); for (const s of safeFlagged) L.push(`  ${s.file} flagged by ${s.rules.join(", ")}`); }
  if (extras.length) {
    const counts = {};
    for (const e of extras) counts[`${e.file} -> ${e.rule}`] = (counts[`${e.file} -> ${e.rule}`] ?? 0) + 1;
    L.push(""); L.push("EXTRA FINDINGS on vulnerable files (other rules also fired; not scored):");
    for (const [k, n] of Object.entries(counts)) L.push(`  ${k}${n > 1 ? " x" + n : ""}`);
  }
  L.push(""); L.push("KNOWN LIMITATIONS");
  for (const l of limits) {
    const status = l.asDocumented ? "as documented" : "CHANGED (rule behaviour differs from the answer key)";
    L.push(`  [${l.kind === "false_positive" ? "FP" : "FN"}] ${l.file.padEnd(24)} ${l.rule.padEnd(32)} ${status}`);
  }
  console.log(L.join("\n"));

  // ---- Write results.json and RESULTS.md ----
  const result = { date, semgrepVersion: version, ruleCount: ruleIds.length, core, stress, perRule, misses, safeFlagged, extras, limits };
  fs.writeFileSync(path.join(BENCH, "results.json"), JSON.stringify(result, null, 2));
  const md = [
    `# Benchmark results`, ``,
    `Run on ${date} with Semgrep ${version} and ${ruleIds.length} custom rules.`, ``,
    `## Core benchmark`, ``,
    `| Metric | Result |`, `|---|---|`,
    `| Vulnerable files fully detected | ${core.filesDetected} of ${core.vulnFiles} (${core.detectionRate}) |`,
    `| Planted problems found | ${core.plantedFound} of ${core.plantedProblems} |`,
    `| Safe files wrongly flagged | ${core.safeFlagged} of ${core.safeFiles} (${core.falsePositiveRate}) |`,
    `| Precision | ${core.precision} |`, ``,
    `## Including known limitations`, ``,
    `| Metric | Result |`, `|---|---|`,
    `| Vulnerable files detected | ${stress.filesDetected} of ${stress.vulnFiles} (${stress.detectionRate}) |`,
    `| Safe files wrongly flagged | ${stress.safeFlagged} of ${stress.safeFiles} (${stress.falsePositiveRate}) |`, ``,
    `## Per rule`, ``,
    `| Rule | Planted | Caught | False alarms |`, `|---|---|---|---|`,
    ...Object.entries(perRule).map(([id, v]) => `| ${id} | ${v.planted} | ${v.caught} | ${v.falseAlarms} |`), ``,
    `## Known limitations`, ``,
    `| Type | File | Rule | Why |`, `|---|---|---|---|`,
    ...limits.map((l) => `| ${l.kind === "false_positive" ? "False positive" : "False negative"} | ${l.file} | ${l.rule} | ${l.note} |`), ``,
  ].join("\n");
  fs.writeFileSync(path.join(BENCH, "RESULTS.md"), md);
  console.log("\nWrote benchmark/results.json and benchmark/RESULTS.md");

  process.exit(misses.length || safeFlagged.length ? 1 : 0);
}
main();
