import type { ScanDetail } from "./scans";

/**
 * The backend does not stream granular Semgrep progress, so the bar advances
 * with elapsed time up to 92% while `scanning` and snaps to 100% when the
 * scan finishes.
 */
export function scanProgress(scan: ScanDetail | null, now: number): number {
  if (!scan) return 0;
  if (scan.status === "completed" || scan.status === "failed") return 100;
  if (scan.status === "ingested") return 2;

  const start = Date.parse(scan.startedAt ?? scan.createdAt);
  if (!Number.isFinite(start)) return 6;
  const elapsed = Math.max(0, now - start);
  return Math.min(92, Math.round(6 + (elapsed / 30_000) * 86));
}

/** Seconds spent scanning (or since ingestion if it has not started yet). */
export function scanElapsedSeconds(scan: ScanDetail | null, now: number) {
  if (!scan) return 0;
  const start = Date.parse(scan.startedAt ?? scan.createdAt);
  if (!Number.isFinite(start)) return 0;
  const end = scan.completedAt ? Date.parse(scan.completedAt) : now;
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 1000));
}

/** `mm:ss`, or `h:mm:ss` for long scans. */
export function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** `HH:MM:SS.mmm`, used by the live terminal log. */
export function formatLogTime(value: string | null | undefined) {
  if (!value) return "--:--:--.---";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--:--.---";
  return `${date.toLocaleTimeString("en-GB", { hour12: false })}.${String(
    date.getMilliseconds(),
  ).padStart(3, "0")}`;
}
