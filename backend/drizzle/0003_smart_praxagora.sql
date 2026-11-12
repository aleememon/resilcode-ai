ALTER TABLE "scans" ADD COLUMN "scanned_files" integer;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "warnings" jsonb;