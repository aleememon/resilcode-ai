import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";
import { scans } from "../db/app-schema";
import { ingestZip, cleanup } from "../lib/ingest";
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
        projectName: repoFullName.split("/")[1],
        repoFullName,
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
