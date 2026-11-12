import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { and, asc, eq, lt, ne, or } from "drizzle-orm";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";
import { findings, scans } from "../db/app-schema";
import { ingestZip, cleanup } from "../lib/ingest";
import {
  scanFolder,
  ScanError,
  SCAN_TIMEOUT_MS,
  type Finding,
} from "../lib/scanner";
import { db } from "../db";

export const scansRouter = Router();

async function requireSession(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  res.locals.userId = session.user.id;
  next();
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 150 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    cb(null, file.originalname.toLowerCase().endsWith(".zip")),
});

async function saveScan(
  res: Response,
  values: {
    scanId: string;
    source: "zip" | "github";
    projectName: string;
    repoFullName?: string;
    branch?: string;
  },
  result: Awaited<ReturnType<typeof ingestZip>>,
) {
  if (result.files.length === 0) {
    await cleanup(result.scanDir);
    return res
      .status(422)
      .json({ error: "No scannable JS/TS/Python files found." });
  }

  try {
    await db.insert(scans).values({
      id: values.scanId,
      userId: res.locals.userId,
      source: values.source,
      projectName: values.projectName,
      repoFullName: values.repoFullName,
      branch: values.branch,
      fileCount: result.files.length,
      totalBytes: result.totalBytes,
    });
  } catch (error) {
    await cleanup(result.scanDir); // don't leave extracted code behind
    console.error("Failed to save scan:", error);
    return res
      .status(500)
      .json({ error: "Could not save the scan. Please try again." });
  }

  return res.status(201).json({
    scanId: values.scanId,
    projectName: values.projectName,
    fileCount: result.files.length,
    skipped: result.skipped,
    files: result.files,
  });
}

const MAX_DOWNLOAD_BYTES = 150 * 1024 * 1024;

async function readCapped(
  zipRes: { headers: Headers; body: ReadableStream<Uint8Array> | null },
  max: number,
): Promise<Buffer> {
  const declared = Number(zipRes.headers.get("content-length"));
  if (declared > max) throw new Error("Repository is too large (limit 150 MB)");
  if (!zipRes.body) throw new Error("Empty response from GitHub");

  const reader = zipRes.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await reader.cancel();
      throw new Error("Repository is too large (limit 150 MB).");
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

scansRouter.post(
  "/upload",
  requireSession,
  upload.single("file"),
  async (req, res) => {
    if (!req.file)
      return res.status(400).json({ error: "Upload a .zip file." });
    const scanId = randomUUID();
    try {
      const result = await ingestZip(req.file.buffer, scanId);
      await saveScan(
        res,
        {
          scanId,
          source: "zip",
          projectName: req.file.originalname.replace(/\.zip$/i, ""),
        },
        result,
      );
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid archive.",
      });
    }
  },
);

scansRouter.post("/github", requireSession, async (req, res) => {
  const { repoFullName, branch } = req.body ?? {};

  const parts = String(repoFullName ?? "").split("/");
  const validPart = (s: string | undefined) =>
    !!s && /^[\w.-]+$/.test(s) && s !== "." && s !== "..";

  if (
    parts.length !== 2 ||
    !validPart(parts[0]) ||
    !validPart(parts[1]) ||
    typeof branch !== "string" ||
    !branch ||
    branch.length > 255 ||
    branch.includes("..") // git forbids ".." in branch names
  ) {
    return res.status(400).json({ error: "Invalid repository or branch." });
  }
  const [owner, repo] = parts;
  const scanId = randomUUID();
  try {
    const accounts = await auth.api.listUserAccounts({
      headers: fromNodeHeaders(req.headers),
    });
    const githubAccount = accounts.find((a) => a.providerId === "github");
    if (!githubAccount) {
      return res.status(400).json({ error: "GitHub account not linked." });
    }

    const { accessToken } = await auth.api.getAccessToken({
      body: { accountId: githubAccount.id },
      headers: fromNodeHeaders(req.headers),
    });
    if (!accessToken) {
      return res.status(400).json({ error: "GitHub access token not found." });
    }
    const zipRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/zipball/${encodeURIComponent(branch)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
        },
        signal: AbortSignal.timeout(60_000), // give up after 60 seconds
      },
    );
    if (!zipRes.ok)
      return res
        .status(zipRes.status)
        .json({ error: "GitHub refused the download." });

    const zipBuffer = await readCapped(zipRes, MAX_DOWNLOAD_BYTES);
    const result = await ingestZip(zipBuffer, scanId);
    await saveScan(
      res,
      {
        scanId,
        source: "github",
        projectName: repo,
        repoFullName: `${owner}/${repo}`,
        branch,
      },
      result,
    );
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Import failed.",
    });
  }
});

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Finds a scan only when it belongs to the given user. */
async function findOwnedScan(scanId: string, userId: string) {
  const [scan] = await db
    .select()
    .from(scans)
    .where(and(eq(scans.id, scanId), eq(scans.userId, userId)))
    .limit(1);
  return scan ?? null;
}

function shapeScan(scan: typeof scans.$inferSelect) {
  return {
    scanId: scan.id,
    projectName: scan.projectName,
    source: scan.source,
    repoFullName: scan.repoFullName,
    branch: scan.branch,
    status: scan.status,
    error: scan.error,
    fileCount: scan.fileCount,
    totalBytes: scan.totalBytes,
    // How many files Semgrep actually analysed (it skips node_modules, test
    // folders and minified files) and any non-fatal problems, so "no
    // findings" is never mistaken for "everything was checked".
    scannedFiles: scan.scannedFiles,
    warnings: scan.warnings ?? [],
    createdAt: scan.createdAt,
    startedAt: scan.startedAt,
    completedAt: scan.completedAt,
  };
}

async function scanWithFindings(scan: typeof scans.$inferSelect) {
  // Only a completed scan has trustworthy findings. While a re-run is in
  // progress, or after it failed, the previous run's rows are never shown.
  const rows =
    scan.status === "completed"
      ? await db
          .select()
          .from(findings)
          .where(eq(findings.scanId, scan.id))
          .orderBy(
            asc(findings.filePath),
            asc(findings.startLine),
            asc(findings.ruleId),
          )
      : [];

  return {
    ...shapeScan(scan),
    findings: rows.map((finding) => ({
      id: finding.id,
      ruleId: finding.ruleId,
      category: finding.category,
      cwe: finding.cwe,
      owasp: finding.owasp,
      severity: finding.severity,
      confidence: finding.confidence,
      filePath: finding.filePath,
      startLine: finding.startLine,
      endLine: finding.endLine,
      message: finding.message,
      snippet: finding.snippet,
      snippetStartLine: finding.snippetStartLine,
    })),
  };
}

/** Postgres caps parameters per statement, so insert findings in batches. */
const FINDINGS_BATCH_SIZE = 500;

/** Postgres text columns cannot hold NUL bytes; one would fail the whole scan. */
const stripNul = (text: string) => text.replace(/\u0000/g, "");

/**
 * At most this many scans run at once. Each one is a Semgrep process in the
 * shared container, so unlimited parallel scans could exhaust its CPU/memory.
 */
const MAX_CONCURRENT_SCANS = 2;
let activeScans = 0;

/**
 * A scan marked "scanning" for longer than this has almost certainly been
 * lost (server restart, crash) and may be started again. It must be longer
 * than the scanner's own timeout.
 */
const STALE_SCAN_MS = SCAN_TIMEOUT_MS + 2 * 60 * 1000;

/**
 * Call once at startup. A scan that was running when the server stopped will
 * never finish, so mark it failed instead of leaving it "scanning".
 */
export async function recoverInterruptedScans() {
  const recovered = await db
    .update(scans)
    .set({
      status: "failed",
      error: "The scan was interrupted by a server restart. Please run it again.",
      completedAt: new Date(),
    })
    .where(eq(scans.status, "scanning"))
    .returning({ id: scans.id });

  if (recovered.length > 0) {
    console.warn(`Marked ${recovered.length} interrupted scan(s) as failed.`);
  }
}

/**
 * Runs one scan in the background and records the outcome. `startedAt` is the
 * identity of this run: if the scan was reclaimed as stale by a newer run, the
 * updates below match no row and this (old) run changes nothing.
 */
async function runScan(scanId: string, userId: string, startedAt: Date) {
  const thisRun = and(
    eq(scans.id, scanId),
    eq(scans.userId, userId),
    eq(scans.status, "scanning"),
    eq(scans.startedAt, startedAt),
  );

  try {
    // The extracted project lives at backend/scans/<scanId>.
    const result = await scanFolder(scanId);

    // One transaction: the scan only becomes "completed" together with ALL of
    // its findings, and the previous run's findings are replaced in the same
    // step. If anything fails, nothing is saved.
    await db.transaction(async (tx) => {
      const [completed] = await tx
        .update(scans)
        .set({
          status: "completed",
          error: null,
          completedAt: new Date(),
          scannedFiles: result.scannedFiles,
          warnings: result.warnings,
        })
        .where(thisRun)
        .returning({ id: scans.id });
      if (!completed) throw new Error("This scan run was superseded.");

      await tx.delete(findings).where(eq(findings.scanId, scanId));

      for (let i = 0; i < result.findings.length; i += FINDINGS_BATCH_SIZE) {
        const batch = result.findings
          .slice(i, i + FINDINGS_BATCH_SIZE)
          .map((finding: Finding) => ({
            id: randomUUID(),
            scanId,
            ...finding,
            message: stripNul(finding.message),
            snippet: stripNul(finding.snippet),
          }));
        await tx.insert(findings).values(batch);
      }
    });
  } catch (error) {
    const message =
      error instanceof ScanError
        ? error.message
        : "The scan failed unexpectedly. Please try again.";
    if (!(error instanceof ScanError)) {
      console.error(`Scan ${scanId} failed:`, error);
    }

    try {
      await db
        .update(scans)
        .set({ status: "failed", error: message, completedAt: new Date() })
        .where(thisRun);
    } catch (updateError) {
      console.error(`Scan ${scanId}: could not record the failure:`, updateError);
    }
  } finally {
    activeScans--;
  }
}

scansRouter.post("/:id/start", requireSession, async (req, res) => {
  const scanId = req.params.id;
  if (typeof scanId !== "string" || !UUID_PATTERN.test(scanId)) {
    return res.status(400).json({ error: "Invalid scan id." });
  }
  const userId = res.locals.userId as string;

  if (activeScans >= MAX_CONCURRENT_SCANS) {
    return res
      .status(429)
      .json({ error: "The scanner is busy. Please try again in a minute." });
  }
  activeScans++; // reserve a slot before any await, so parallel requests can't overshoot
  let handedOff = false;

  try {
    // Claim the scan atomically so two requests can't run it at once. A
    // completed or failed scan may be re-run, and so may one stuck in
    // "scanning" long enough that it must have been lost.
    const startedAt = new Date();
    const [claimed] = await db
      .update(scans)
      .set({
        status: "scanning",
        error: null,
        startedAt,
        completedAt: null,
      })
      .where(
        and(
          eq(scans.id, scanId),
          eq(scans.userId, userId),
          or(
            ne(scans.status, "scanning"),
            lt(scans.startedAt, new Date(Date.now() - STALE_SCAN_MS)),
          ),
        ),
      )
      .returning();

    if (!claimed) {
      const owned = await findOwnedScan(scanId, userId);
      if (!owned) return res.status(404).json({ error: "Scan not found." });
      return res.status(409).json({ error: "Scan is already running." });
    }

    handedOff = true; // runScan releases the slot when it finishes
    void runScan(scanId, userId, startedAt);

    // Respond now; the client polls GET /:id for progress.
    return res.status(202).json({ ...shapeScan(claimed), findings: [] });
  } finally {
    if (!handedOff) activeScans--;
  }
});

scansRouter.get("/:id", requireSession, async (req, res) => {
  const scanId = req.params.id;
  if (typeof scanId !== "string" || !UUID_PATTERN.test(scanId)) {
    return res.status(400).json({ error: "Invalid scan id." });
  }

  const scan = await findOwnedScan(scanId, res.locals.userId as string);
  if (!scan) return res.status(404).json({ error: "Scan not found." });

  return res.json(await scanWithFindings(scan));
});

scansRouter.use(
  (err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ error: "File too large. Maximum allowed size is 150MB." });
      }
      return res.status(400).json({ error: err.message });
    }
    next(err);
  },
);
