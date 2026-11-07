import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const scans = pgTable("scans", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // "zip" | "github"
  projectName: text("project_name").notNull(),
  repoFullName: text("repo_full_name"),
  branch: text("branch"),
  status: text("status").notNull().default("ingested"),
  fileCount: integer("file_count").notNull().default(0),
  totalBytes: integer("total_bytes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
