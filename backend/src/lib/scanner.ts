import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * The Semgrep container defined in docker-compose.yml. It stays alive with
 * `sleep infinity`, and the backend invokes the CLI through `docker exec`.
 * The scans and rules folders are mounted read-only at /scans and /rules.
 */
const SEMGREP_CONTAINER = process.env.SEMGREP_CONTAINER ?? "resilcode-semgrep";
const CONTAINER_SCANS_ROOT = "/scans";
const CONTAINER_RULES_ROOT = process.env.SEMGREP_RULES_PATH ?? "/rules";

/** A full-project scan must finish within this window or it fails. */
export const SCAN_TIMEOUT_MS = 5 * 60 * 1000;
/**
 * Node's own timer is only a backup. Killing the `docker exec` client does NOT
 * stop Semgrep inside the container, so the real limit is the `timeout`
 * command run inside the container (see buildArgs). This one fires later.
 */
const OUTER_TIMEOUT_MS = SCAN_TIMEOUT_MS + 15_000;
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;

/** How many lines of context to include above and below a finding. */
const SNIPPET_CONTEXT_LINES = 3;
/** A finding can span a whole function; never store more than this. */
const MAX_SNIPPET_LINES = 40;
/** Keep the warnings list readable when a project has many broken files. */
const MAX_WARNINGS = 50;

export type FindingSeverity = "ERROR" | "WARNING" | "INFO";

/**
 * Normalized finding, shaped to match the `findings` table in
 * db/app-schema.ts (minus the database-managed id/scanId/createdAt).
 */
export type Finding = {
  ruleId: string;
  category: string;
  cwe: string | null;
  owasp: string | null;
  severity: FindingSeverity;
  confidence: string | null;
  /** Path relative to the scanned project root, using forward slashes. */
  filePath: string;
  startLine: number;
  endLine: number;
  message: string;
  snippet: string;
  snippetStartLine: number;
};

export type ScanResult = {
  findings: Finding[];
  /**
   * How many files Semgrep actually analysed. It skips some paths on its own
   * (node_modules, test/ and tests/ folders, *.min.js), so this can be lower
   * than the number of files that were uploaded.
   */
  scannedFiles: number;
  /** Non-fatal problems, e.g. a file with a syntax error that was only partly analysed. */
  warnings: string[];
};

/** Thrown whenever the scan cannot produce a trustworthy result set. */
export class ScanError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ScanError";
  }
}

type SemgrepResult = {
  check_id?: unknown;
  path?: unknown;
  start?: { line?: unknown } | null;
  end?: { line?: unknown } | null;
  extra?: {
    message?: unknown;
    severity?: unknown;
    lines?: unknown;
    metadata?: Record<string, unknown> | null;
  } | null;
};

type SemgrepReport = {
  results?: unknown;
  errors?: unknown;
  paths?: { scanned?: unknown } | null;
};

type SemgrepErrorEntry = {
  level?: unknown;
  type?: unknown;
  path?: unknown;
  long_msg?: unknown;
  message?: unknown;
  short_msg?: unknown;
};

type ExecFailure = Error & {
  code?: string | number | null;
  killed?: boolean;
  signal?: NodeJS.Signals | null;
  stdout?: string;
  stderr?: string;
};

function runDocker(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    // execFile (not exec): arguments are passed straight to the binary, so no
    // scan path or rule value can be interpreted by a shell.
    execFile(
      "docker",
      args,
      {
        encoding: "utf8",
        timeout: OUTER_TIMEOUT_MS,
        killSignal: "SIGKILL",
        maxBuffer: MAX_OUTPUT_BYTES,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (!error) {
          resolve({ stdout, stderr });
          return;
        }
        const failure = error as ExecFailure;
        failure.stdout = stdout;
        failure.stderr = stderr;
        reject(failure);
      },
    );
  });
}

function describeFailure(failure: ExecFailure): string {
  const seconds = Math.round(SCAN_TIMEOUT_MS / 1000);

  if (
    failure.killed ||
    failure.signal === "SIGKILL" ||
    failure.signal === "SIGTERM"
  ) {
    return `Semgrep timed out after ${seconds} seconds.`;
  }
  // 137 = the process inside the container was SIGKILLed: our `timeout`
  // command fired, or the container ran out of memory.
  if (failure.code === 137) {
    return `Semgrep was stopped (timeout after ${seconds} seconds, or out of memory).`;
  }
  if (failure.code === "ENOENT") {
    return "Could not run docker. Is Docker installed and on PATH?";
  }

  const stderr = (failure.stderr ?? "").trim();
  const detail = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);

  return detail
    ? `Semgrep failed (exit ${failure.code ?? "unknown"}): ${detail}`
    : `Semgrep failed (exit ${failure.code ?? "unknown"}).`;
}

function parseReport(raw: string): SemgrepReport {
  const text = raw.trim();
  if (!text) throw new ScanError("Semgrep returned no output.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ScanError("Semgrep returned output that wasn't valid JSON.", {
      cause: error,
    });
  }

  if (!parsed || typeof parsed !== "object") {
    throw new ScanError("Semgrep returned an unexpected report.");
  }
  return parsed as SemgrepReport;
}

/** Reads a string, or joins an array of strings, from Semgrep metadata. */
function textValue(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (Array.isArray(value)) {
    const parts = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

function positiveInt(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function toSeverity(value: unknown): FindingSeverity {
  const severity = typeof value === "string" ? value.toUpperCase() : "";
  return severity === "ERROR" || severity === "WARNING" || severity === "INFO"
    ? severity
    : "INFO";
}

/** Resolves a Semgrep-reported path, refusing anything outside the scan dir. */
function resolveInside(root: string, relative: string): string | null {
  const rootPath = path.resolve(root);
  const target = path.resolve(rootPath, relative);
  if (target !== rootPath && !target.startsWith(rootPath + path.sep)) {
    return null;
  }
  return target;
}

/**
 * Semgrep reports absolute container paths when the target is absolute
 * (e.g. /scans/<id>/src/app.ts). Convert that back to a path relative to the
 * project root, and reject anything that tries to escape it.
 */
function toProjectPath(rawPath: string, containerDir: string): string | null {
  const prefix = containerDir.replace(/\\/g, "/").replace(/\/+$/, "");
  let relative = rawPath.replace(/\\/g, "/");

  if (relative === prefix) return null;
  if (relative.startsWith(prefix + "/")) {
    relative = relative.slice(prefix.length + 1);
  }

  relative = relative.replace(/^\.\//, "");
  if (!relative || relative.startsWith("/") || relative === "..") return null;

  const segments = relative.split("/");
  if (segments.some((segment) => segment === ".." || segment === "")) {
    return null;
  }

  return relative;
}

/** Semgrep's `type` is either a string or an array whose first item is the name. */
function errorKind(type: unknown): string {
  if (typeof type === "string") return type;
  if (Array.isArray(type) && typeof type[0] === "string") return type[0];
  return "Error";
}

function errorText(entry: SemgrepErrorEntry): string | null {
  return (
    textValue(entry.long_msg) ??
    textValue(entry.message) ??
    textValue(entry.short_msg)
  );
}

function describeWarning(kind: string): string {
  if (kind === "PartialParsing" || kind === "SyntaxError") {
    return "has a syntax error and was only partly analysed";
  }
  if (kind === "Timeout") return "took too long to analyse and was skipped";
  return `could not be fully analysed (${kind})`;
}

/**
 * Splits Semgrep's `errors` array in two:
 *  - fatal: level "error" (bad rule file, missing folder). The results cannot
 *    be trusted, so the whole scan fails.
 *  - warnings: level "warn" (one file had a syntax error or timed out). The
 *    scan is still valid; the user is told which files were affected.
 */
function splitErrors(
  report: SemgrepReport,
  containerDir: string,
): { fatal: string | null; warnings: string[] } {
  if (!Array.isArray(report.errors)) return { fatal: null, warnings: [] };

  const fatalParts: string[] = [];
  const warnings = new Set<string>();

  for (const raw of report.errors) {
    const entry = (raw ?? {}) as SemgrepErrorEntry;
    const kind = errorKind(entry.type);
    const level = typeof entry.level === "string" ? entry.level.toLowerCase() : "error";

    if (level === "error") {
      fatalParts.push(errorText(entry) ?? kind);
      continue;
    }

    const rawPath = textValue(entry.path);
    const file = rawPath ? toProjectPath(rawPath, containerDir) : null;
    warnings.add(`${file ?? "A file"} ${describeWarning(kind)}.`);
  }

  const fatal =
    fatalParts.length > 0
      ? `Semgrep error: ${[...new Set(fatalParts)].slice(0, 3).join("; ")}`
      : null;

  return { fatal, warnings: [...warnings].slice(0, MAX_WARNINGS) };
}

async function readSnippet(
  absolutePath: string,
  startLine: number,
  endLine: number,
  cache: Map<string, string[]>,
): Promise<{ snippet: string; snippetStartLine: number } | null> {
  let lines = cache.get(absolutePath);
  if (!lines) {
    try {
      lines = (await fs.readFile(absolutePath, "utf8")).split(/\r?\n/);
    } catch {
      return null; // Semgrep may report a path we cannot read; keep the finding.
    }
    cache.set(absolutePath, lines);
  }

  const from = Math.max(1, startLine - SNIPPET_CONTEXT_LINES);
  let to = Math.min(
    lines.length,
    Math.max(startLine, endLine) + SNIPPET_CONTEXT_LINES,
  );
  to = Math.min(to, from + MAX_SNIPPET_LINES - 1);

  const slice = lines.slice(from - 1, Math.max(from, to));
  while (slice.length > 0 && slice[slice.length - 1].trim() === "") {
    slice.pop(); // don't end a snippet with blank lines from the file tail
  }

  return {
    snippet: slice.join("\n"),
    snippetStartLine: from,
  };
}

async function toFinding(
  result: SemgrepResult,
  scanDir: string,
  containerDir: string,
  cache: Map<string, string[]>,
): Promise<Finding | null> {
  const ruleId = textValue(result.check_id);
  const rawPath = textValue(result.path);
  const startLine = positiveInt(result.start?.line);
  if (!ruleId || !rawPath || !startLine) return null;

  const endLine = Math.max(startLine, positiveInt(result.end?.line) ?? startLine);
  const filePath = toProjectPath(rawPath, containerDir);
  if (!filePath) return null;

  const absolutePath = resolveInside(scanDir, filePath);
  const snippet = absolutePath
    ? await readSnippet(absolutePath, startLine, endLine, cache)
    : null;

  const extra = result.extra ?? {};
  const metadata = extra.metadata ?? {};
  const fallbackSnippet = textValue(extra.lines);

  return {
    ruleId,
    category: textValue(metadata.category) ?? "uncategorized",
    cwe: textValue(metadata.cwe),
    owasp: textValue(metadata.owasp),
    severity: toSeverity(extra.severity),
    confidence: textValue(metadata.confidence)?.toUpperCase() ?? null,
    filePath,
    startLine,
    endLine,
    message: textValue(extra.message) ?? ruleId,
    snippet: snippet?.snippet ?? fallbackSnippet ?? "",
    snippetStartLine: snippet?.snippetStartLine ?? startLine,
  };
}

async function collectResult(
  raw: string,
  scanDir: string,
  containerDir: string,
): Promise<ScanResult> {
  const report = parseReport(raw);

  const { fatal, warnings } = splitErrors(report, containerDir);
  if (fatal) throw new ScanError(fatal);

  if (!Array.isArray(report.results)) {
    throw new ScanError("Semgrep returned a report without a results array.");
  }

  const cache = new Map<string, string[]>();
  const findings: Finding[] = [];

  for (const entry of report.results) {
    const finding = await toFinding(
      entry as SemgrepResult,
      scanDir,
      containerDir,
      cache,
    );
    if (finding) findings.push(finding);
  }

  const scanned = report.paths?.scanned;
  return {
    findings,
    scannedFiles: Array.isArray(scanned) ? scanned.length : 0,
    warnings,
  };
}

function buildArgs(containerDir: string): string[] {
  return [
    "exec",
    SEMGREP_CONTAINER,
    // Real time limit: kills Semgrep inside the container. Killing only the
    // `docker exec` client from Node would leave it running and using CPU.
    "timeout",
    "-s",
    "KILL",
    String(Math.round(SCAN_TIMEOUT_MS / 1000)),
    "semgrep",
    "scan",
    "--json",
    "--quiet",
    "--metrics=off",
    "--disable-version-check",
    "--no-git-ignore", // extracted projects often gitignore .env and secrets
    "--no-rewrite-rule-ids", // keep ids like "sql-injection", not "rules.sql-injection"
    "--config",
    CONTAINER_RULES_ROOT,
    containerDir,
  ];
}

/**
 * Runs the bundled Semgrep rules against a folder under backend/scans and
 * returns normalized findings (each with a few lines of surrounding source),
 * how many files were analysed, and any non-fatal warnings.
 *
 * `folder` may be an absolute path (e.g. the `scanDir` returned by
 * ingestZip) or a path relative to backend/scans.
 *
 * A fatal Semgrep failure (non-zero exit, timeout, bad rules, missing folder)
 * throws ScanError so the caller can mark the scan as failed. A syntax error
 * in one scanned file does NOT fail the scan; it is returned as a warning.
 */
export async function scanFolder(folder: string): Promise<ScanResult> {
  const scansRoot = path.resolve(process.cwd(), "scans");
  const scanDir = path.isAbsolute(folder)
    ? path.resolve(folder)
    : path.resolve(scansRoot, folder);

  const relative = path.relative(scansRoot, scanDir);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ScanError(`Scan folder must be inside ${scansRoot}.`);
  }

  let stats;
  try {
    stats = await fs.stat(scanDir);
  } catch {
    // Don't expose the server's folder layout; this is also the normal case
    // once old projects are cleaned up.
    throw new ScanError(
      "The project files are no longer available. Please upload the project again.",
    );
  }
  if (!stats.isDirectory()) {
    throw new ScanError(`Scan path is not a folder: ${scanDir}`);
  }

  const containerDir = path.posix.join(
    CONTAINER_SCANS_ROOT,
    relative.split(path.sep).join("/"),
  );

  try {
    const { stdout } = await runDocker(buildArgs(containerDir));
    return await collectResult(stdout, scanDir, containerDir);
  } catch (error) {
    if (error instanceof ScanError) throw error;

    const failure = error as ExecFailure;
    // Semgrep exits non-zero in some modes even when it produced a valid
    // report, so prefer parseable JSON from stdout over the exit code.
    if (failure.stdout?.trim()) {
      try {
        return await collectResult(failure.stdout, scanDir, containerDir);
      } catch (reportError) {
        if (reportError instanceof ScanError) throw reportError;
      }
    }

    throw new ScanError(describeFailure(failure), { cause: error });
  }
}
