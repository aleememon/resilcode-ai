import { pgTable, text, integer, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const SCAN_STATUSES = ["ingested", "scanning", "completed", "failed"] as const;
export type ScanStatus = (typeof SCAN_STATUSES)[number];

export const scans = pgTable("scans", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // "zip" | "github"
  projectName: text("project_name").notNull(),
  repoFullName: text("repo_full_name"),
  branch: text("branch"),
  status: text("status").$type<ScanStatus>().notNull().default("ingested"),
  error: text("error"), // why a scan failed (null otherwise)
  fileCount: integer("file_count").notNull().default(0),
  totalBytes: integer("total_bytes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"), // set when the scan starts
  completedAt: timestamp("completed_at"), // set when it completes or fails
  scannedFiles: integer("scanned_files"), // files Semgrep actually analysed
  warnings: jsonb("warnings").$type<string[]>(), // non-fatal scan problems
});

export const findings = pgTable(
  "findings",
  {
    id: text("id").primaryKey(),
    scanId: text("scan_id")
      .notNull()
      .references(() => scans.id, { onDelete: "cascade" }),
    ruleId: text("rule_id").notNull(), // e.g. "sql-injection"
    category: text("category").notNull(), // injection, secrets, weak-crypto, xss, misconfiguration
    cwe: text("cwe"), // e.g. "CWE-89"
    owasp: text("owasp"), // e.g. "A03:2021"
    severity: text("severity").notNull(), // Semgrep's value: ERROR | WARNING | INFO
    confidence: text("confidence"), // HIGH | MEDIUM | LOW, from the rule metadata
    filePath: text("file_path").notNull(), // relative to the project root
    startLine: integer("start_line").notNull(),
    endLine: integer("end_line").notNull(),
    message: text("message").notNull(),
    snippet: text("snippet").notNull().default(""), // a few lines around the finding
    snippetStartLine: integer("snippet_start_line").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("findings_scan_id_idx").on(t.scanId)],
);