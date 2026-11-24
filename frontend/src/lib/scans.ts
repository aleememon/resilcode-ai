const API = process.env.NEXT_PUBLIC_API_URL;

/** Result of a successful ZIP upload or GitHub import. */
export type ScanResult = {
  scanId: string;
  projectName: string;
  fileCount: number;
  skipped: number;
  files: { path: string; size: number }[];
};

export type FindingSeverity = "ERROR" | "WARNING" | "INFO";

/** Mirrors the finding shape returned by `GET /api/scans/:id`. */
export type Finding = {
  id: string;
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

export type ScanStatus = "ingested" | "scanning" | "completed" | "failed";

export type ScanDetail = {
  scanId: string;
  projectName: string;
  source: string;
  repoFullName: string | null;
  branch: string | null;
  status: ScanStatus;
  error: string | null;
  fileCount: number;
  totalBytes: number;
  /** Files Semgrep actually analysed (it skips vendor and test paths). */
  scannedFiles: number | null;
  /** Non-fatal scanner problems, e.g. files with syntax errors. */
  warnings: string[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  findings: Finding[];
};

/**
 * Error thrown when a scan request fails. `status` is the HTTP status (0 for a
 * network failure) so callers can stop polling on a 404 but retry transient
 * errors.
 */
export class ScanRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ScanRequestError";
    this.status = status;
  }
}

async function request(path: string, init: RequestInit): Promise<ScanDetail> {
  const res = await fetch(`${API}/api/scans${path}`, {
    ...init,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ScanRequestError(data.error ?? "Request failed", res.status);
  }
  return data as ScanDetail;
}

async function post(path: string, init: RequestInit): Promise<ScanResult> {
  const res = await fetch(`${API}/api/scans${path}`, {
    ...init,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as ScanResult;
}

export function uploadProject(file: File) {
  const body = new FormData();
  body.append("file", file); // don't set Content-Type yourself
  return post("/upload", { method: "POST", body });
}

export function importRepo(repoFullName: string, branch: string) {
  return post("/github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoFullName, branch }),
  });
}

/** Reads a scan's status, metadata, and findings. */
export function getScan(scanId: string) {
  return request(`/${encodeURIComponent(scanId)}`, {
    method: "GET",
    cache: "no-store",
  });
}

/**
 * Claims an `ingested` scan and starts the scanner. The backend returns `202`
 * with the claimed (now `scanning`) scan, so keep polling `getScan` until the
 * status becomes `completed` or `failed`.
 */
export function startScan(scanId: string) {
  return request(`/${encodeURIComponent(scanId)}/start`, { method: "POST" });
}
