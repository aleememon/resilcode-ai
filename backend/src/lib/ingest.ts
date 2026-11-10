import AdmZip from "adm-zip";
import fs from "node:fs/promises";
import path from "node:path";

const MAX_ENTRIES = 10_000;
const MAX_TOTAL_BYTES = 300 * 1024 * 1024;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "__pycache__",
  "venv",
  ".venv",
]);
const ALLOWED_EXT = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".py",
  ".json",
  ".yml",
  ".yaml",
]);

export const cleanup = (dir: string) =>
  fs.rm(dir, { recursive: true, force: true });

export async function ingestZip(buffer: Buffer, scanId: string) {
  const entries = new AdmZip(buffer).getEntries().filter((e) => !e.isDirectory);
  if (entries.length > MAX_ENTRIES)
    throw new Error("Archive contain two many files");

  // GitHub zipballs wrap everything in one root; strip it
  const names = entries.map((e) => e.entryName.replace(/\\/g, "/"));
  const roots = new Set(names.map((n) => n.split("/")[0]));
  const stripRoot = roots.size === 1 && names.every((n) => n.includes("/"));

  const scanDir = path.join(process.cwd(), "scans", scanId);
  await fs.mkdir(scanDir, { recursive: true });

  const files: { path: string; size: number }[] = [];
  let skipped = 0;
  let totalBytes = 0;
  try {
    for (const entry of entries) {
      let rel = path.posix.normalize(entry.entryName.replace(/\\/g, "/"));
      if (stripRoot) rel = rel.split("/").slice(1).join("/");
      if (!rel || rel.startsWith("..") || path.posix.isAbsolute(rel)) {
        skipped++;
        continue;
      }

      const parts = rel.split("/");
      const base = parts[parts.length - 1];
      const allowed =
        ALLOWED_EXT.has(path.posix.extname(base).toLowerCase()) ||
        base.startsWith(".env");
      if (parts.some((p) => IGNORED_DIRS.has(p)) || !allowed) {
        skipped++;
        continue;
      }

      const target = path.resolve(scanDir, ...parts);
      if (!target.startsWith(path.resolve(scanDir) + path.sep)) {
        skipped++;
        continue;
      } // zip-slip guard

      /*
      const data = entry.getData();
      if (data.length > MAX_FILE_BYTES) {
        skipped++;
        continue;
      }
      totalBytes += data.length;
      if (totalBytes > MAX_TOTAL_BYTES)
        throw new Error("Archive is too large once extracted.");
      */
      if (entry.header.size > MAX_FILE_BYTES) {
        skipped++;
        continue;
      }
      if (totalBytes + entry.header.size > MAX_TOTAL_BYTES)
        throw new Error("Archive is too large once extracted.");

      // 2. Decompress, then re-check the real size in case the zip lied
      const data = entry.getData();
      if (data.length > MAX_FILE_BYTES) {
        skipped++;
        continue;
      }
      totalBytes += data.length;
      if (totalBytes > MAX_TOTAL_BYTES)
        throw new Error("Archive is two large once extracted.");
      
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, data);
      files.push({ path: rel, size: data.length });
    }
  } catch (error) {
    await cleanup(scanDir);
    throw error;
  }

  return { scanDir, files, skipped, totalBytes };
}
