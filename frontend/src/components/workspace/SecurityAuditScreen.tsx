"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { useScan } from "@/hooks/use-scan";
import { cn } from "@/lib/cn";
import { formatSize } from "@/lib/format";
import {
  formatDuration,
  formatLogTime,
  scanElapsedSeconds,
  scanProgress,
} from "@/lib/scan-progress";
import type {
  Finding,
  FindingSeverity,
  ScanDetail,
  ScanStatus,
} from "@/lib/scans";
import { WorkspaceFooter } from "./WorkspaceFooter";
import { WorkspaceHeader } from "./WorkspaceHeader";
import styles from "./SecurityAuditScreen.module.css";

type LogTone = "info" | "warn" | "llm" | "audit";

const TONE_TAG_CLASS: Record<LogTone, string> = {
  info: "text-primary-container",
  warn: "text-error",
  llm: "text-secondary",
  audit: "text-tertiary-fixed",
};

const SEVERITY_STYLE: Record<
  FindingSeverity,
  { badge: string; soft: string }
> = {
  ERROR: {
    badge: "border-error/40 bg-error-container/40 text-error",
    soft: "bg-error-container/30 text-error",
  },
  WARNING: {
    badge: "border-alert-amber/40 bg-alert-amber/15 text-alert-amber",
    soft: "bg-alert-amber/15 text-alert-amber",
  },
  INFO: {
    badge: "border-primary-container/40 bg-primary-container/10 text-primary",
    soft: "bg-surface-container-high/80 text-primary-container",
  },
};

const STATUS_META: Record<
  ScanStatus,
  { label: string; dot: string; text: string }
> = {
  ingested: { label: "Queued", dot: "bg-outline", text: "text-outline" },
  scanning: {
    label: "Scanning",
    dot: "bg-primary-container animate-pulse",
    text: "text-primary",
  },
  completed: {
    label: "Complete",
    dot: "bg-tertiary-container",
    text: "text-tertiary-fixed",
  },
  failed: { label: "Failed", dot: "bg-error", text: "text-error" },
};

function LogLine({
  time,
  tag,
  tone,
  children,
}: {
  time: string;
  tag: string;
  tone: LogTone;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-space-xs leading-relaxed">
      <span className="shrink-0 text-on-surface-variant">{time}</span>
      <span className={cn("shrink-0 font-semibold", TONE_TAG_CLASS[tone])}>
        [{tag}]
      </span>
      <span
        className={cn(
          tone === "warn"
            ? "text-error"
            : tone === "llm"
              ? "text-secondary"
              : "text-on-surface",
        )}
      >
        {children}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: ScanStatus }) {
  const meta = STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-glass-line/15 bg-surface-container-lowest/70 px-2 py-0.5 font-label-code-sm text-[10px] font-semibold uppercase tracking-wider",
        meta.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

function RadarCore() {
  return (
    <div className="relative flex h-44 w-44 shrink-0 items-center justify-center sm:h-56 sm:w-56">
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-tr from-primary-container/20 via-transparent to-secondary-container/30 shadow-[0_0_30px_rgba(0,240,255,0.15)]",
          styles.radarSpin,
        )}
      />
      <div
        className={cn(
          "absolute inset-4 rounded-full bg-gradient-to-bl from-transparent via-primary/10 to-secondary/20",
          styles.radarSpinReverse,
        )}
      />
      <div className="absolute inset-8 flex items-center justify-center rounded-full bg-surface-container-lowest/95 shadow-[inset_0_0_24px_rgba(0,240,255,0.4)] backdrop-blur-md sm:inset-10">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-xl bg-surface-container-high/50 p-2">
          <Icon
            name="shield"
            filled
            className="text-[40px] text-primary-container drop-shadow-[0_0_12px_rgba(0,240,255,0.85)]"
          />
          <div
            className={cn(
              "pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-primary-container/30 to-transparent",
              styles.sweep,
            )}
          />
        </div>
      </div>
    </div>
  );
}

function FindingBadge({ finding }: { finding: Finding }) {
  const style = SEVERITY_STYLE[finding.severity];

  return (
    <div className="flex w-full flex-col gap-space-3xs rounded-xl border border-glass-line/10 bg-surface-container-lowest/90 p-space-xs backdrop-blur-xl">
      <div className="flex items-center justify-between gap-space-xs">
        <span
          className="truncate font-label-code-md text-label-code-md font-medium text-primary"
          title={`${finding.filePath}:${finding.startLine}`}
        >
          {finding.filePath}:{finding.startLine}
        </span>
        <span
          className={cn(
            "shrink-0 rounded border px-1.5 py-0.5 font-label-code-sm text-[10px] font-bold uppercase tracking-wider",
            style.badge,
          )}
        >
          {finding.severity}
        </span>
      </div>
      <div
        className={cn(
          "flex items-center gap-space-3xs rounded px-space-2xs py-space-3xs font-label-code-sm text-label-code-sm",
          style.soft,
        )}
      >
        <Icon name="bug_report" className="text-[14px]" />
        <span className="truncate" title={finding.message}>
          {finding.cwe ? `${finding.cwe} · ` : ""}
          {finding.category}
        </span>
      </div>
    </div>
  );
}

function AuditBar({
  scan,
  scanId,
  now,
}: {
  scan: ScanDetail | null;
  scanId: string | null;
  now: number;
}) {
  const status = scan?.status ?? "ingested";
  const elapsed = scanElapsedSeconds(scan, now);
  const completed = status === "completed";

  return (
    <div className="flex flex-wrap items-center justify-between gap-space-xs rounded-xl border border-glass-line/10 bg-surface-container-low/60 px-space-sm py-2 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-space-xs">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary-container">
          <Icon
            name={scan?.source === "github" ? "hub" : "folder_zip"}
            className="text-[18px]"
          />
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-label-code-md text-label-code-md font-semibold text-primary">
              {scan?.projectName ??
                (scanId ? "Loading scan…" : "No scan selected")}
            </span>
            <StatusPill status={status} />
          </div>
          <p className="truncate font-label-code-sm text-[10px] text-on-surface-variant">
            {scan
              ? `${
                  scan.source === "github"
                    ? (scan.repoFullName ?? "GitHub import")
                    : "Local ZIP upload"
                }${scan.branch ? ` · ${scan.branch}` : ""}`
              : scanId
                ? "Fetching scan metadata"
                : "Upload or import a project to begin"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-space-xs">
        <div className="flex items-center gap-space-2xs rounded-lg bg-surface-container px-space-xs py-1 font-label-code-sm text-[11px] tracking-wider text-on-surface">
          <Icon name="timer" className="text-[14px] text-primary-fixed-dim" />
          {formatDuration(elapsed)}
        </div>
        {scanId ? (
          <Link
            href={`/scan/${scanId}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-label-code-sm text-[11px] font-bold transition-colors",
              completed
                ? "bg-tertiary-container text-on-tertiary shadow-[0_0_16px_rgba(0,249,130,0.3)] hover:bg-tertiary-fixed-dim"
                : "border border-primary-container/30 bg-primary-container/10 text-primary hover:bg-primary-container/20",
            )}
          >
            <Icon
              name={completed ? "fact_check" : "visibility"}
              className="text-[14px]"
            />
            {completed ? "View findings" : "Open dashboard"}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function ProgressPanel({
  scan,
  now,
}: {
  scan: ScanDetail | null;
  now: number;
}) {
  const status = scan?.status ?? "ingested";
  const percent = scanProgress(scan, now);
  const elapsed = scanElapsedSeconds(scan, now);
  const findings = scan?.findings.length ?? 0;

  const label =
    status === "scanning"
      ? "Running Semgrep AST analysis"
      : status === "completed"
        ? findings > 0
          ? "Audit complete — findings ready"
          : "Audit complete — no findings"
        : status === "failed"
          ? "Scan failed"
          : "Preparing scan workspace";

  const icon =
    status === "scanning"
      ? "sync"
      : status === "completed"
        ? "check_circle"
        : status === "failed"
          ? "error"
          : "hourglass_top";

  return (
    <section className="glass-sheen relative w-full rounded-xl bg-surface-container/70 p-space-md shadow-xl backdrop-blur-xl">
      <div className="flex flex-col justify-between gap-space-xs md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-space-sm">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest">
            <Icon
              name={icon}
              className={cn(
                "text-[20px]",
                status === "scanning"
                  ? "animate-spin text-primary-container"
                  : status === "completed"
                    ? "text-tertiary-fixed"
                    : status === "failed"
                      ? "text-error"
                      : "text-outline",
              )}
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
                {percent}% Complete
              </span>
              <span className="font-label-code-md text-label-code-md text-outline-variant">
                —
              </span>
              <span className="truncate font-headline-sm text-headline-sm font-semibold text-on-surface">
                {label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-space-xs font-label-code-sm text-label-code-sm text-on-surface-variant">
              <span className="font-semibold text-primary-container">
                {scan
                  ? (scan.status === "completed" && scan.scannedFiles != null
                      ? scan.scannedFiles
                      : scan.fileCount
                    ).toLocaleString()
                  : "—"}
              </span>
              <span>
                {scan?.status === "completed" && scan.scannedFiles != null
                  ? "files analysed"
                  : "files in scope"}
              </span>
              <span className="text-outline-variant">•</span>
              <span className="text-tertiary-fixed">
                {formatDuration(elapsed)} elapsed
              </span>
              {findings > 0 ? (
                <>
                  <span className="text-outline-variant">•</span>
                  <span className="text-error">
                    {findings} {findings === 1 ? "finding" : "findings"}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-space-xs self-start md:self-auto">
          <div className="flex items-center gap-space-2xs rounded bg-surface-container-lowest px-space-xs py-space-3xs font-label-code-sm text-label-code-sm text-on-surface-variant">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-container" />
            <span>{scan ? formatSize(scan.totalBytes) : "MEM —"}</span>
          </div>
          <div className="flex items-center gap-space-2xs rounded bg-surface-container-lowest px-space-xs py-space-3xs font-label-code-sm text-label-code-sm text-tertiary-fixed">
            <Icon name="bolt" className="text-[14px]" />
            <span>semgrep</span>
          </div>
        </div>
      </div>

      <div className="relative mt-space-xs h-2.5 w-full overflow-hidden rounded-full bg-surface-container-lowest">
        <div
          className={cn(
            "relative h-full rounded-full transition-[width] duration-700",
            status === "failed"
              ? "bg-error"
              : status === "completed"
                ? "bg-tertiary-container"
                : "bg-primary-container shadow-[0_0_16px_rgba(0,240,255,0.7)]",
          )}
          style={{ width: `${percent}%` }}
        >
          {status === "scanning" ? (
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent",
                styles.shimmer,
              )}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ScanSandbox({ scan }: { scan: ScanDetail | null }) {
  const status = scan?.status ?? "ingested";
  const findings = scan?.findings ?? [];
  const top = findings.slice(0, 3);
  const scanning = status === "scanning" || status === "ingested";
  const clear = status === "completed" && findings.length === 0;

  let badgeClass =
    "bg-surface-container/70 text-on-surface shadow-[0_0_24px_rgba(0,240,255,0.2)]";
  let iconName = "radar";
  let iconClass = "text-primary-container";
  let text = `Analysing ${scan ? scan.fileCount.toLocaleString() : "…"} files`;

  if (status === "failed") {
    badgeClass =
      "bg-error-container/40 text-on-error-container shadow-[0_0_24px_rgba(255,46,91,0.35)]";
    iconName = "error";
    iconClass = "text-error";
    text = "Scan failed";
  } else if (clear) {
    badgeClass =
      "bg-tertiary-container/20 text-tertiary-fixed shadow-[0_0_24px_rgba(0,249,130,0.2)]";
    iconName = "verified_user";
    iconClass = "text-tertiary-fixed";
    text = "No OWASP flaws identified";
  } else if (!scanning) {
    badgeClass =
      "bg-error-container/40 text-on-error-container shadow-[0_0_24px_rgba(255,46,91,0.35)]";
    iconName = "warning";
    iconClass = "text-error";
    text = `${findings.length} OWASP ${findings.length === 1 ? "flaw" : "flaws"} identified`;
  }

  return (
    <section className="relative flex min-h-[420px] w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-surface-container/60 p-space-lg shadow-2xl backdrop-blur-2xl lg:p-space-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(rgb(var(--color-primary-container)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className={cn(
          "z-20 mb-space-md flex items-center gap-space-xs rounded-full px-space-md py-space-2xs backdrop-blur-md",
          badgeClass,
        )}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75",
              scanning ? "animate-ping bg-primary-container" : "bg-current",
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-2.5 w-2.5 rounded-full",
              status === "failed"
                ? "bg-error"
                : clear
                  ? "bg-tertiary-container"
                  : scanning
                    ? "bg-primary-container"
                    : "bg-error",
            )}
          />
        </span>
        <Icon name={iconName} className={cn("text-[18px]", iconClass)} />
        <span className="font-label-code-md text-label-code-md font-semibold tracking-wider">
          {text}
        </span>
      </div>

      <div className="relative flex w-full max-w-[880px] flex-col items-center justify-center gap-space-md sm:flex-row">
        <RadarCore />

        <div className="grid w-full max-w-[420px] gap-space-xs">
          {top.map((finding) => (
            <FindingBadge key={finding.id} finding={finding} />
          ))}

          {top.length === 0 ? (
            <div className="rounded-xl border border-glass-line/10 bg-surface-container-lowest/80 p-space-sm text-center">
              <p className="font-label-code-md text-label-code-md font-semibold text-on-surface">
                {status === "failed"
                  ? "The scanner did not return a result"
                  : scanning
                    ? "Collecting findings…"
                    : "No findings to display"}
              </p>
              <p className="mt-1 font-label-code-sm text-label-code-sm text-on-surface-variant">
                {status === "failed"
                  ? "Open the dashboard for the failure reason."
                  : scanning
                    ? "Real Semgrep results will appear here."
                    : "Every rule in the active ruleset passed."}
              </p>
            </div>
          ) : null}

          {findings.length > top.length ? (
            <p className="text-center font-label-code-sm text-[11px] text-outline">
              +{(findings.length - top.length).toLocaleString()} more in the
              code review dashboard
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type TerminalEvent = {
  key: string;
  time: string;
  tag: string;
  tone: LogTone;
  text: ReactNode;
};

function buildEvents(scan: ScanDetail | null): TerminalEvent[] {
  if (!scan) {
    return [
      {
        key: "waiting",
        time: formatLogTime(null),
        tag: "INFO",
        tone: "info",
        text: "Waiting for scan metadata…",
      },
    ];
  }

  const events: TerminalEvent[] = [
    {
      key: "created",
      time: formatLogTime(scan.createdAt),
      tag: "INFO",
      tone: "info",
      text: `${scan.projectName} ingested — ${scan.fileCount.toLocaleString()} files (${formatSize(
        scan.totalBytes,
      )}) via ${scan.source === "github" ? "GitHub import" : "ZIP upload"}.`,
    },
  ];

  if (scan.startedAt) {
    events.push({
      key: "started",
      time: formatLogTime(scan.startedAt),
      tag: "INFO",
      tone: "info",
      text: "Scan claimed. Semgrep is running the AST + OWASP rules across the extracted project.",
    });
  }

  for (const finding of scan.findings.slice(0, 8)) {
    events.push({
      key: `finding-${finding.id}`,
      time: formatLogTime(scan.startedAt ?? scan.createdAt),
      tag: finding.severity,
      tone: finding.severity === "ERROR" ? "warn" : "audit",
      text: (
        <>
          {finding.cwe ? `${finding.cwe} ` : ""}
          {finding.message}{" "}
          <code className="rounded bg-error-container/40 px-1 py-0.5 text-on-error-container">
            {finding.filePath}:{finding.startLine}
          </code>
        </>
      ),
    });
  }

  scan.warnings.slice(0, 3).forEach((warning, index) => {
    events.push({
      key: `warning-${index}`,
      time: formatLogTime(scan.completedAt ?? scan.startedAt),
      tag: "WARN",
      tone: "warn",
      text: warning,
    });
  });

  if (scan.status === "completed" && scan.completedAt) {
    const seconds = scanElapsedSeconds(scan, Date.parse(scan.completedAt));
    events.push({
      key: "completed",
      time: formatLogTime(scan.completedAt),
      tag: "AUDIT",
      tone: "audit",
      text: `Scan completed in ${formatDuration(seconds)} — ${
        scan.findings.length
      } ${scan.findings.length === 1 ? "finding" : "findings"} across ${scan.fileCount.toLocaleString()} files.`,
    });
  }

  if (scan.status === "failed") {
    events.push({
      key: "failed",
      time: formatLogTime(scan.completedAt ?? scan.startedAt),
      tag: "WARN",
      tone: "warn",
      text: `Scan failed: ${scan.error ?? "unknown error"}.`,
    });
  }

  return events;
}

function LiveTerminal({ scan }: { scan: ScanDetail | null }) {
  const events = useMemo(() => buildEvents(scan), [scan]);
  const status = scan?.status ?? "ingested";
  const active = status === "scanning" || status === "ingested";

  return (
    <section className="relative flex w-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl">
      <div className="flex h-10 w-full items-center justify-between bg-surface-container-low/80 px-space-md backdrop-blur-md">
        <div className="flex items-center gap-space-xs">
          <span className="inline-block h-3 w-3 rounded-full bg-[#ff5f56]" />
          <span className="inline-block h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="inline-block h-3 w-3 rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex items-center gap-space-xs font-label-code-sm text-label-code-sm font-semibold tracking-wider text-on-surface-variant">
          <Icon name="terminal" className="text-[14px] text-primary-container" />
          <span className="hidden sm:inline">
            LIVE SCAN TELEMETRY — semgrep
          </span>
          <span className="sm:hidden">LIVE TELEMETRY</span>
        </div>
        <div className="flex items-center gap-space-2xs font-label-code-sm text-label-code-sm text-on-surface-variant">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "scanning"
                ? "animate-ping bg-primary-container"
                : status === "completed"
                  ? "bg-tertiary-container"
                  : status === "failed"
                    ? "bg-error"
                    : "bg-outline",
            )}
          />
          <span>
            {status === "scanning"
              ? "LIVE"
              : status === "completed"
                ? "COMPLETE"
                : status === "failed"
                  ? "FAILED"
                  : "QUEUED"}
          </span>
        </div>
      </div>

      <div className="flex max-h-64 flex-col gap-space-2xs overflow-y-auto p-space-md font-label-code-md text-label-code-md">
        {events.map((event) => (
          <LogLine
            key={event.key}
            time={event.time}
            tag={event.tag}
            tone={event.tone}
          >
            {event.text}
          </LogLine>
        ))}

        {active ? (
          <div className="flex items-center gap-space-xs pt-space-2xs text-primary-container">
            <span className="font-semibold text-primary">&gt;</span>
            <span className="text-on-surface-variant">
              {status === "ingested"
                ? "Claiming scan and starting the engine"
                : "Scanning files and cross-checking OWASP rules"}
            </span>
            <span
              className={cn(
                "inline-block h-4 w-2 bg-primary-container",
                styles.caret,
              )}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function EmptyState({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <section className="flex min-h-[420px] flex-col items-center justify-center gap-space-sm rounded-xl border border-glass-line/10 bg-surface-container/60 p-space-xl text-center">
      <Icon name="radar" className="text-[56px] text-outline" />
      <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
        {title}
      </h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        {description}
      </p>
      <Link
        href={href}
        className="mt-space-xs inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-space-md py-space-xs font-label-code-md text-label-code-md font-bold text-on-primary transition-colors hover:bg-primary-fixed-dim"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        {label}
      </Link>
    </section>
  );
}

export function SecurityAuditScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scanId = searchParams.get("scan");
  const identity = useAuthIdentity();
  const { scan, error, notFound } = useScan(scanId);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const status = scan?.status ?? "ingested";
  const terminal = status === "completed" || status === "failed";

  // The audit screen is a waypoint: once the engine finishes, move to the
  // full dashboard. The link in the scan bar also works immediately.
  useEffect(() => {
    if (!scan || !terminal) return;
    const timer = window.setTimeout(() => {
      router.replace(`/scan/${scan.scanId}`);
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [scan, terminal, router]);

  return (
    <div className="flex min-h-screen flex-col bg-surface-container-lowest">
      <WorkspaceHeader
        status={identity.status}
        provider={identity.provider}
        user={identity.user}
      />

      <main className="relative w-full flex-1 overflow-hidden pt-16">
        <h1 className="sr-only">Active Security Audit</h1>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-12 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-primary-container/10 blur-[130px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/4 top-48 h-[340px] w-[340px] rounded-full bg-secondary-container/15 blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-1/4 top-52 h-[380px] w-[380px] rounded-full bg-error-container/20 blur-[110px]"
        />

        <div className="page-container relative flex flex-col gap-space-md py-space-md lg:py-space-lg">
          <AuditBar scan={scan} scanId={scanId} now={now} />

          {!scanId ? (
            <EmptyState
              title="No scan selected"
              description="Start a new audit by uploading a project archive or importing a GitHub repository, then this screen will follow the real scan."
              href="/code-ingestion"
              label="Start a new scan"
            />
          ) : notFound ? (
            <EmptyState
              title="Scan not found"
              description={
                error ??
                "This scan does not exist, or it belongs to another account."
              }
              href="/code-ingestion"
              label="Start a new scan"
            />
          ) : (
            <>
              {error && !scan ? (
                <div
                  role="status"
                  className="rounded-lg border border-alert-amber/20 bg-alert-amber/10 px-space-sm py-2 text-center font-label-code-sm text-[11px] text-alert-amber"
                >
                  Could not load scan: {error} — retrying…
                </div>
              ) : null}

              {error && scan ? (
                <div
                  role="status"
                  className="rounded-lg border border-alert-amber/20 bg-alert-amber/10 px-space-sm py-2 text-center font-label-code-sm text-[11px] text-alert-amber"
                >
                  {error} — retrying…
                </div>
              ) : null}

              {status === "failed" ? (
                <div
                  role="alert"
                  className="flex items-center justify-center gap-2 rounded-lg border border-error/20 bg-error-container/20 px-space-sm py-2 text-center font-label-code-sm text-[11px] text-error"
                >
                  <Icon name="error" className="text-[14px]" />
                  <span>
                    Scan failed
                    {scan?.error ? `: ${scan.error}` : "."} Opening the
                    dashboard…
                  </span>
                </div>
              ) : null}

              <ProgressPanel scan={scan} now={now} />
              <ScanSandbox scan={scan} />
              <LiveTerminal scan={scan} />
            </>
          )}
        </div>
      </main>

      <WorkspaceFooter />
    </div>
  );
}
