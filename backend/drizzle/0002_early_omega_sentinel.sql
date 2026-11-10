CREATE TABLE "findings" (
	"id" text PRIMARY KEY NOT NULL,
	"scan_id" text NOT NULL,
	"rule_id" text NOT NULL,
	"category" text NOT NULL,
	"cwe" text,
	"owasp" text,
	"severity" text NOT NULL,
	"confidence" text,
	"file_path" text NOT NULL,
	"start_line" integer NOT NULL,
	"end_line" integer NOT NULL,
	"message" text NOT NULL,
	"snippet" text DEFAULT '' NOT NULL,
	"snippet_start_line" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "error" text;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_scan_id_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "findings_scan_id_idx" ON "findings" USING btree ("scan_id");