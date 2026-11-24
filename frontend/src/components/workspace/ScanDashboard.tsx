"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { useScan } from "@/hooks/use-scan";
import { cn } from "@/lib/cn";
import { formatSize } from "@/lib/format";
import {
  formatDuration,
  scanElapsedSeconds,
  scanProgress,
} from "@/lib/scan-progress";
import type {
  Finding,
  FindingSeverity,
  ScanDetail,
  ScanStatus,
} from "@/lib/scans";
import { FileTree } from "./FileTree";
import { WorkspaceFooter } from "./WorkspaceFooter";
import { WorkspaceHeader } from "./WorkspaceHeader";
import styles from "./ScanDashboard.module.css";

const SEVERITY_ORDER: FindingSeverity[] = ["ERROR", "WARNING", "INFO"];

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  ERROR: 0,
  WARNING: 1,
  INFO: 2,
};

const SEVERITY_STYLE: Record<
  FindingSeverity,
  { badge: string; dot: string; text: string }
> = {
  ERROR: {
    badge: "border-error/40 bg-error-container/40 text-error",
    dot: "bg-error",
    text: "text-error",
  },
  WARNING: {
    badge: "border-alert-amber/40 bg-alert-amber/15 text-alert-amber",
    dot: "bg-alert-amber",
    text: "text-alert-amber",
  },
  INFO: {
    badge: "border-primary-container/40 bg-primary-container/10 text-primary",
    dot: "bg-primary-container",
    text: "text-primary",
  },
};

const STATUS_META: Record<
  ScanStatus,
  { label: string; dot: string; text: string }
> = {
  ingested: { label: "Queued", dot: "bg-outline", text: "text-outline" },
  scanning: {
    label: "Scanning",
    dot: "bg-primary-container",
    text: "text-primary",
  },
  completed: {
    label: "Complete",
    dot: "bg-tertiary-container",
    text: "text-tertiary-fixed",
  },
  failed: { label: "Failed", dot: "bg-error", text: "text-error" },
};

function StatusPill({ status }: { status: ScanStatus }) {
  const meta = STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-glass-line/15 bg-surface-container/70 px-2.5 py-1 font-label-code-sm text-[10px] font-semibold uppercase tracking-wider",
        meta.text,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          meta.dot,
          status === "scanning" && styles.liveDot,
        )}
      />
      {meta.label}
    </span>
  );
}

function sourceLabel(scan: ScanDetail | null) {
  if (!scan) return "Preparing scan";
  if (scan.source === "github") {
    const repo = scan.repoFullName ?? "GitHub import";
    return scan.branch ? `${repo} · ${scan.branch}` : repo;
  }
  if (scan.source === "zip") return "Local ZIP upload";
  return scan.source;
}

function splitPath(path: string) {
  const index = path.lastIndexOf("/");
  return index === -1
    ? { dir: "", name: path }
    : { dir: path.slice(0, index + 1), name: path.slice(index + 1) };
}

function DashboardBar({
  scan,
  progress,
  elapsed,
}: {
  scan: ScanDetail | null;
  progress: number;
  elapsed: number;
}) {
  const status = scan?.status ?? "ingested";
  const meta = STATUS_META[status];
  const findings = scan?.findings.length ?? 0;
  const failed = status === "failed";

  return (
    <div className="border-b border-glass-line/10 bg-surface-container-low/60 backdrop-blur-xl">
      <div className="page-container py-space-xs">
        <div className="flex flex-wrap items-center justify-between gap-space-xs">
          <div className="flex min-w-0 items-center gap-space-xs">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary-container shadow-[0_0_12px_rgba(0,240,255,0.15)]">
              <Icon
                name={scan?.source === "github" ? "hub" : "folder_zip"}
                className="text-[20px]"
              />
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate font-headline-sm text-headline-sm font-bold text-primary">
                  {scan?.projectName ?? "Loading scan…"}
                </h1>
                <StatusPill status={status} />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 font-label-code-sm text-[11px] text-on-surface-variant">
                <span className="truncate">{sourceLabel(scan)}</span>
                {scan ? (
                  <>
                    <span className="text-outline-variant">•</span>
                    <span>{scan.fileCount.toLocaleString()} files</span>
                    <span className="text-outline-variant">•</span>
                    <span>{formatSize(scan.totalBytes)}</span>
                  </>
                ) : null}
                <span className="text-outline-variant">•</span>
                <span className={meta.text}>
                  {status === "scanning"
                    ? `${formatDuration(elapsed)} elapsed`
                    : status === "completed"
                      ? `finished in ${formatDuration(elapsed)}`
                      : status === "failed"
                        ? "scan failed"
                        : "waiting to start"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-label-code-sm text-[11px] font-semibold",
                findings === 0
                  ? "border-tertiary-container/30 bg-tertiary-container/10 text-tertiary-fixed"
                  : "border-error/30 bg-error-container/20 text-error",
              )}
            >
              <Icon
                name={findings === 0 ? "verified_user" : "bug_report"}
                className="text-[14px]"
              />
              {findings} {findings === 1 ? "finding" : "findings"}
            </span>
            <Link
              href="/code-ingestion"
              className="inline-flex items-center gap-1 rounded-lg border border-glass-line/15 bg-surface-container/70 px-2.5 py-1 font-label-code-sm text-[11px] font-semibold text-on-surface-variant transition-colors hover:border-primary-container/40 hover:text-primary"
            >
              <Icon name="arrow_back" className="text-[14px]" />
              <span className="hidden sm:inline">Back to workspace</span>
            </Link>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-space-xs">
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-700",
                failed
                  ? "bg-error"
                  : status === "completed"
                    ? "bg-tertiary-container"
                    : "bg-primary-container",
                status === "scanning" && styles.shimmer,
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="w-9 text-right font-label-code-sm text-[11px] font-semibold text-on-surface-variant">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}

function FindingsEmpty({
  status,
  hasFindings,
  onClear,
}: {
  status: ScanStatus;
  hasFindings: boolean;
  onClear: () => void;
}) {
  if (status === "scanning" || status === "ingested") {
    return (
      <div className="flex flex-col items-center gap-2 px-space-sm py-space-lg text-center">
        <Icon
          name="radar"
          className="animate-spin text-[32px] text-primary-container"
        />
        <p className="font-label-code-md text-label-code-md font-semibold text-on-surface">
          Semgrep is analysing the project
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Findings will appear here as soon as the scan completes.
        </p>
      </div>
    );
  }

  if (!hasFindings) {
    return (
      <div className="flex flex-col items-center gap-2 px-space-sm py-space-lg text-center">
        <Icon
          name="verified_user"
          className="text-[32px] text-tertiary-fixed"
        />
        <p className="font-label-code-md text-label-code-md font-semibold text-on-surface">
          No findings detected
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          The project passed every rule in the active Semgrep ruleset.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 px-space-sm py-space-lg text-center">
      <Icon name="filter_alt_off" className="text-[32px] text-outline" />
      <p className="font-label-code-md text-label-code-md font-semibold text-on-surface">
        No findings match these filters
      </p>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg border border-glass-line/15 bg-surface-container px-space-sm py-1 font-label-code-sm text-[11px] font-semibold text-primary transition-colors hover:border-primary-container/40"
      >
        Clear filters
      </button>
    </div>
  );
}

function Snippet({ finding }: { finding: Finding }) {
  const lines = finding.snippet.split("\n");

  return (
    <>
      {lines.map((line, index) => {
        const lineNumber = finding.snippetStartLine + index;
        const highlighted =
          lineNumber >= finding.startLine &&
          lineNumber <= finding.endLine;

        return (
          <div
            key={`${lineNumber}-${index}`}
            className={cn("flex", highlighted && "bg-error-container/25")}
          >
            <span
              className={cn(
                "w-12 shrink-0 select-none pr-3 text-right",
                highlighted ? "text-error" : "text-outline",
              )}
            >
              {lineNumber}
            </span>
            <span
              className={cn(
                "whitespace-pre pr-4",
                highlighted ? "text-on-surface" : "text-on-surface-variant",
              )}
            >
              {line || " "}
            </span>
          </div>
        );
      })}
    </>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-surface-container-lowest/60 px-2 py-1.5">
      <dt className="font-label-code-sm text-[10px] uppercase tracking-wider text-outline">
        {label}
      </dt>
      <dd
        className="truncate font-label-code-sm text-[11px] font-semibold text-on-surface"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

export function ScanDashboard({ scanId }: { scanId: string }) {
  const identity = useAuthIdentity();
  const { scan, error, notFound } = useScan(scanId);

  const [now, setNow] = useState(() => Date.now());
  const [severity, setSeverity] = useState<FindingSeverity | "ALL">("ALL");
  const [category, setCategory] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Progress and the elapsed timer only need a tick while the scan runs.
  useEffect(() => {
    if (scan?.status !== "scanning") return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [scan?.status]);

  const findings = useMemo(() => {
    return [...(scan?.findings ?? [])].sort((a, b) => {
      const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (bySeverity !== 0) return bySeverity;
      const byFile = a.filePath.localeCompare(b.filePath);
      if (byFile !== 0) return byFile;
      return a.startLine - b.startLine;
    });
  }, [scan?.findings]);

  const severityCounts = useMemo(() => {
    const counts: Record<FindingSeverity, number> = {
      ERROR: 0,
      WARNING: 0,
      INFO: 0,
    };
    for (const finding of findings) counts[finding.severity] += 1;
    return counts;
  }, [findings]);

  const categories = useMemo(() => {
    const unique = new Set(
      findings.map((finding) => finding.category).filter(Boolean),
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [findings]);

  const filtered = useMemo(
    () =>
      findings.filter(
        (finding) =>
          (severity === "ALL" || finding.severity === severity) &&
          (category === "ALL" || finding.category === category),
      ),
    [findings, severity, category],
  );

  // Keep a valid selection when filters change or results arrive.
  useEffect(() => {
    setSelectedId((current) => {
      if (filtered.length === 0) return null;
      if (current && filtered.some((finding) => finding.id === current)) {
        return current;
      }
      return filtered[0].id;
    });
  }, [filtered]);

  const selected = useMemo(
    () => filtered.find((finding) => finding.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  const { entries: findingFiles, counts: findingCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const finding of findings) {
      counts[finding.filePath] = (counts[finding.filePath] ?? 0) + 1;
    }
    const entries = Object.keys(counts)
      .sort((a, b) => a.localeCompare(b))
      .map((path) => ({ path, size: 0 }));
    return { entries, counts };
  }, [findings]);

  useEffect(() => {
    setCopied(false);
  }, [selected?.id]);

  const copyCode = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected.snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const openFile = (path: string) => {
    setSeverity("ALL");
    setCategory("ALL");
    const first = findings.find((finding) => finding.filePath === path);
    if (first) setSelectedId(first.id);
  };

  const progress = scanProgress(scan, now);
  const elapsed = scanElapsedSeconds(scan, now);
  const status = scan?.status ?? "ingested";

  return (
    <div className="flex min-h-screen flex-col bg-surface-container-lowest lg:h-screen lg:overflow-hidden">
      <WorkspaceHeader
        status={identity.status}
        provider={identity.provider}
        user={identity.user}
      />

      <main className="flex flex-1 flex-col pt-16 lg:min-h-0">
        {notFound ? (
          <div className="page-container flex flex-1 items-center justify-center py-space-xl">
            <div className="max-w-md rounded-xl border border-glass-line/10 bg-surface-container/70 p-space-lg text-center shadow-xl">
              <Icon
                name="search_off"
                className="text-[48px] text-outline"
              />
              <h1 className="mt-space-xs font-headline-md text-headline-md font-bold text-on-surface">
                Scan not found
              </h1>
              <p className="mt-space-2xs font-body-sm text-body-sm text-on-surface-variant">
                {error ??
                  "This scan does not exist, or it belongs to another account."}
              </p>
              <Link
                href="/code-ingestion"
                className="mt-space-md inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-space-md py-space-xs font-label-code-md text-label-code-md font-bold text-on-primary transition-colors hover:bg-primary-fixed-dim"
              >
                <Icon name="add" className="text-[16px]" />
                Start a new scan
              </Link>
            </div>
          </div>
        ) : (
          <>
            <DashboardBar scan={scan} progress={progress} elapsed={elapsed} />

            {error && scan ? (
              <div
                role="status"
                className="border-b border-alert-amber/20 bg-alert-amber/10 px-space-sm py-1.5 text-center font-label-code-sm text-[11px] text-alert-amber"
              >
                {error} — retrying…
              </div>
            ) : null}

            {scan?.status === "failed" ? (
              <div
                role="alert"
                className="flex items-center justify-center gap-2 border-b border-error/20 bg-error-container/20 px-space-sm py-2 text-center font-label-code-sm text-[11px] text-error"
              >
                <Icon name="error" className="text-[14px]" />
                <span>
                  Scan failed
                  {scan.error ? `: ${scan.error}` : "."}
                </span>
              </div>
            ) : null}

            <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
              <aside className="flex w-full shrink-0 flex-col gap-space-sm border-b border-glass-line/10 bg-surface-container-low/40 p-space-sm lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r">
                <div>
                  <p className="font-label-code-sm text-[10px] font-semibold uppercase tracking-wider text-outline">
                    Project
                  </p>
                  <p
                    className="truncate font-label-code-md text-label-code-md font-semibold text-on-surface"
                    title={scan?.projectName}
                  >
                    {scan?.projectName ?? "…"}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-1.5 font-label-code-sm text-[11px]">
                    <MetaItem
                      label="Source"
                      value={
                        scan
                          ? scan.source === "github"
                            ? "GitHub"
                            : "ZIP upload"
                          : "—"
                      }
                    />
                    <MetaItem
                      label="Files"
                      value={scan ? scan.fileCount.toLocaleString() : "—"}
                    />
                    <MetaItem
                      label="Analysed"
                      value={
                        scan?.scannedFiles != null
                          ? scan.scannedFiles.toLocaleString()
                          : "—"
                      }
                    />
                    <MetaItem
                      label="Size"
                      value={scan ? formatSize(scan.totalBytes) : "—"}
                    />
                    <MetaItem
                      label="Findings"
                      value={String(findings.length)}
                    />
                    <MetaItem
                      label="Warnings"
                      value={scan ? String(scan.warnings.length) : "—"}
                    />
                  </dl>
                </div>

                <div className="min-h-0">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-label-code-sm text-[10px] font-semibold uppercase tracking-wider text-outline">
                      Files with findings
                    </p>
                    <span className="font-label-code-sm text-[11px] text-on-surface-variant">
                      {findingFiles.length}
                    </span>
                  </div>
                  {findingFiles.length > 0 ? (
                    <FileTree
                      files={findingFiles}
                      findingCounts={findingCounts}
                      selectedPath={selected?.filePath ?? null}
                      onFileSelect={openFile}
                      showSize={false}
                      ariaLabel="Files with findings"
                    />
                  ) : (
                    <p className="rounded-lg bg-surface-container-lowest/70 p-space-sm text-center font-label-code-sm text-[11px] text-outline">
                      {status === "completed"
                        ? "No files with findings."
                        : "Waiting for results…"}
                    </p>
                  )}
                </div>
              </aside>

              <section className="flex min-h-0 w-full flex-col border-b border-glass-line/10 bg-surface-container-lowest/40 lg:w-[370px] lg:shrink-0 lg:border-b-0 lg:border-r xl:w-[410px]">
                <div className="border-b border-glass-line/10 p-space-sm">
                  <div className="flex items-center justify-between gap-space-xs">
                    <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Detected flaws
                    </h2>
                    <span className="rounded-full border border-error/30 bg-error-container/20 px-2 py-0.5 font-label-code-sm text-[10px] font-bold text-error">
                      {filtered.length}/{findings.length}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {(["ALL", ...SEVERITY_ORDER] as const).map((option) => {
                      const count =
                        option === "ALL"
                          ? findings.length
                          : severityCounts[option];
                      const active = severity === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSeverity(option)}
                          aria-pressed={active}
                          className={cn(
                            "rounded-full border px-2 py-0.5 font-label-code-sm text-[10px] font-semibold uppercase tracking-wide transition-colors",
                            active
                              ? option === "ALL"
                                ? "border-primary-container/40 bg-primary-container/15 text-primary"
                                : SEVERITY_STYLE[option].badge
                              : "border-glass-line/10 bg-surface-container/50 text-on-surface-variant hover:border-glass-line/25 hover:text-on-surface",
                            count === 0 && "opacity-50",
                          )}
                        >
                          {option === "ALL" ? "All" : option}
                          <span className="ml-1 text-[10px] opacity-80">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2">
                    <label htmlFor="category-filter" className="sr-only">
                      Filter findings by category
                    </label>
                    <select
                      id="category-filter"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="w-full rounded-lg border border-glass-line/10 bg-surface-container-low px-2 py-1.5 font-label-code-sm text-[11px] text-on-surface focus:border-primary-container/50 focus:outline-none"
                    >
                      <option value="ALL">
                        All categories ({findings.length})
                      </option>
                      {categories.map((name) => (
                        <option key={name} value={name}>
                          {name} (
                          {
                            findings.filter(
                              (finding) => finding.category === name,
                            ).length
                          }
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-space-xs">
                  {filtered.length === 0 ? (
                    <FindingsEmpty
                      status={status}
                      hasFindings={findings.length > 0}
                      onClear={() => {
                        setSeverity("ALL");
                        setCategory("ALL");
                      }}
                    />
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {filtered.map((finding) => {
                        const active = finding.id === selected?.id;
                        return (
                          <li key={finding.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedId(finding.id)}
                              aria-pressed={active}
                              className={cn(
                                "w-full rounded-xl border p-3 text-left transition-all",
                                active
                                  ? "border-primary-container/50 bg-surface-container/80 shadow-[0_0_18px_rgba(0,240,255,0.08)]"
                                  : "border-glass-line/10 bg-surface-container/40 hover:border-glass-line/25 hover:bg-surface-container/60",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <span
                                    className={cn(
                                      "rounded border px-1.5 py-0.5 font-label-code-sm text-[10px] font-bold uppercase tracking-wider",
                                      SEVERITY_STYLE[finding.severity].badge,
                                    )}
                                  >
                                    {finding.severity}
                                  </span>
                                  {finding.cwe ? (
                                    <span className="font-label-code-sm text-[11px] text-on-surface-variant">
                                      {finding.cwe}
                                    </span>
                                  ) : null}
                                </div>
                                <span className="max-w-[45%] truncate rounded bg-surface-container-lowest/80 px-1.5 py-0.5 font-label-code-sm text-[10px] text-outline">
                                  {finding.category}
                                </span>
                              </div>

                              <p className="mt-2 line-clamp-2 font-body-sm text-body-sm font-semibold text-on-surface">
                                {finding.message}
                              </p>

                              <div className="mt-2 flex items-center gap-1.5 font-label-code-sm text-[11px] text-on-surface-variant">
                                <Icon
                                  name="description"
                                  className="shrink-0 text-[14px] text-outline"
                                />
                                <span
                                  className="truncate"
                                  title={`${finding.filePath}:${finding.startLine}`}
                                >
                                  {finding.filePath}:{finding.startLine}
                                </span>
                              </div>

                              <div className="mt-2 flex items-center justify-between gap-2 border-t border-glass-line/5 pt-2 font-label-code-sm text-[10px] text-outline">
                                <span className="truncate">
                                  {finding.ruleId}
                                </span>
                                <span
                                  className={cn(
                                    "flex shrink-0 items-center gap-0.5",
                                    active && "text-primary",
                                  )}
                                >
                                  {active ? "Active" : "Inspect"}
                                  <Icon
                                    name="chevron_right"
                                    className="text-[12px]"
                                  />
                                </span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-glass-line/10 bg-surface-container/40 px-3 py-2 font-label-code-sm text-[10px] text-on-surface-variant">
                  <span>
                    {status === "scanning"
                      ? "Semgrep analysis running"
                      : status === "completed"
                        ? "Semgrep results"
                        : status === "failed"
                          ? "Scan did not finish"
                          : "Waiting for engine"}
                  </span>
                  <span className="font-mono">
                    {scan ? `${scan.fileCount.toLocaleString()} files` : "—"}
                  </span>
                </div>
              </section>

              <section className="min-w-0 flex-1 bg-surface-container-lowest/30 lg:overflow-y-auto">
                {selected ? (
                  <div className="flex min-h-full flex-col">
                    <div className="sticky top-0 z-10 border-b border-glass-line/10 bg-surface-container-low/80 px-space-sm py-2.5 backdrop-blur-xl">
                      <div className="flex flex-wrap items-center justify-between gap-space-xs">
                        <div className="flex min-w-0 items-center gap-space-xs">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-error">
                            <Icon
                              name="bug_report"
                              className="text-[18px]"
                            />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 font-label-code-sm text-[11px]">
                              <span
                                className="truncate text-outline"
                                title={splitPath(selected.filePath).dir}
                              >
                                {splitPath(selected.filePath).dir}
                              </span>
                              <span className="font-semibold text-primary">
                                {splitPath(selected.filePath).name}
                              </span>
                            </div>
                            <p className="font-label-code-sm text-[10px] text-outline">
                              Lines {selected.startLine}–
                              {selected.endLine} · {selected.ruleId}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-space-2xs">
                          <button
                            type="button"
                            onClick={copyCode}
                            className="inline-flex items-center gap-1 rounded-lg border border-glass-line/15 bg-surface-container/70 px-2.5 py-1 font-label-code-sm text-[11px] font-semibold text-on-surface-variant transition-colors hover:border-primary-container/40 hover:text-primary"
                          >
                            <Icon
                              name={copied ? "check" : "content_copy"}
                              className="text-[14px]"
                            />
                            {copied ? "Copied" : "Copy code"}
                          </button>
                          <Link
                            href="/code-ingestion"
                            className="inline-flex items-center gap-1 rounded-lg bg-primary-container px-2.5 py-1 font-label-code-sm text-[11px] font-bold text-on-primary transition-colors hover:bg-primary-fixed-dim"
                          >
                            New scan
                            <Icon name="arrow_forward" className="text-[14px]" />
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-space-sm p-space-md">
                      <article className="rounded-xl border border-glass-line/10 bg-surface-container/60 p-space-md">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "rounded border px-2 py-0.5 font-label-code-sm text-[10px] font-bold uppercase tracking-wider",
                              SEVERITY_STYLE[selected.severity].badge,
                            )}
                          >
                            {selected.severity}
                          </span>
                          {selected.cwe ? (
                            <span className="rounded border border-glass-line/15 bg-surface-container-low px-2 py-0.5 font-label-code-sm text-[10px] text-on-surface-variant">
                              {selected.cwe}
                            </span>
                          ) : null}
                          {selected.owasp ? (
                            <span className="rounded border border-glass-line/15 bg-surface-container-low px-2 py-0.5 font-label-code-sm text-[10px] text-on-surface-variant">
                              {selected.owasp}
                            </span>
                          ) : null}
                          <span className="rounded border border-glass-line/15 bg-surface-container-low px-2 py-0.5 font-label-code-sm text-[10px] text-outline">
                            {selected.category}
                          </span>
                        </div>

                        <h2 className="mt-3 font-headline-sm text-headline-sm font-semibold leading-snug text-on-surface">
                          {selected.message}
                        </h2>

                        <dl className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                          <MetaItem label="Rule" value={selected.ruleId} />
                          <MetaItem label="CWE" value={selected.cwe ?? "—"} />
                          <MetaItem
                            label="OWASP"
                            value={selected.owasp ?? "—"}
                          />
                          <MetaItem
                            label="Confidence"
                            value={selected.confidence ?? "—"}
                          />
                        </dl>
                      </article>

                      <article className="overflow-hidden rounded-xl border border-glass-line/10 bg-surface-container-lowest/90">
                        <div className="flex items-center justify-between border-b border-glass-line/10 bg-surface-container/60 px-3 py-2">
                          <div className="flex items-center gap-2 font-label-code-sm text-[11px]">
                            <span className="h-2 w-2 rounded-full bg-error" />
                            <span className="font-semibold text-error">
                              Vulnerable code
                            </span>
                          </div>
                          <span className="font-label-code-sm text-[10px] text-outline">
                            excerpt from line {selected.snippetStartLine}
                          </span>
                        </div>

                        <div className="max-h-[50vh] overflow-auto">
                          <div className="min-w-max py-2 font-label-code-sm text-[12px] leading-6">
                            {selected.snippet ? (
                              <Snippet finding={selected} />
                            ) : (
                              <p className="px-space-sm font-body-sm text-body-sm text-outline">
                                No code excerpt available for this finding.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-error/20 bg-error-container/10 px-3 py-2 font-label-code-sm text-[11px] text-error">
                          <span className="flex items-center gap-1.5">
                            <Icon name="warning" className="text-[14px]" />
                            {selected.cwe ?? selected.category}
                          </span>
                          <span className="max-w-full truncate text-error/80">
                            {selected.filePath}:{selected.startLine}
                          </span>
                        </div>
                      </article>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 p-space-xl text-center">
                    <Icon
                      name={
                        status === "scanning" || status === "ingested"
                          ? "radar"
                          : "fact_check"
                      }
                      className={cn(
                        "text-[48px]",
                        status === "scanning" || status === "ingested"
                          ? "animate-spin text-primary-container"
                          : "text-outline",
                      )}
                    />
                    <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      {status === "scanning" || status === "ingested"
                        ? "Scanning in progress"
                        : "Select a finding"}
                    </h2>
                    <p className="max-w-sm font-body-sm text-body-sm text-on-surface-variant">
                      {status === "scanning" || status === "ingested"
                        ? "The dashboard updates every two seconds. Findings and code excerpts will appear here automatically."
                        : "Choose a finding from the list to inspect its code excerpt and security metadata."}
                    </p>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      <WorkspaceFooter />
    </div>
  );
}
