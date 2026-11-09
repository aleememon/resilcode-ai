"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import styles from "./SecurityAuditScreen.module.css";

const START_NODES = 14_820;
const PEAK_NODES = 16_240;

type LogTone = "info" | "warn" | "llm" | "audit";

const TONE_TAG_CLASS: Record<LogTone, string> = {
  info: "text-primary-container",
  warn: "text-error",
  llm: "text-secondary",
  audit: "text-tertiary-fixed",
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

function NodeBadge({
  file,
  icon,
  label,
  variant,
}: {
  file: string;
  icon: string;
  label: string;
  variant: "vulnerable" | "clean";
}) {
  const vulnerable = variant === "vulnerable";

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-space-3xs rounded-xl border border-glass-line/10 bg-surface-container-lowest/90 p-space-xs backdrop-blur-xl transition-transform hover:scale-105",
        vulnerable
          ? "shadow-[0_4px_20px_rgba(255,46,91,0.25)]"
          : "shadow-[0_4px_16px_rgba(0,240,255,0.2)]",
      )}
    >
      <div className="flex items-center justify-between gap-space-xs">
        <span className="truncate font-label-code-md text-label-code-md font-medium text-primary">
          {file}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            vulnerable
              ? "bg-error shadow-[0_0_8px_#ff2e5b]"
              : "bg-primary-container shadow-[0_0_8px_#00f0ff]",
          )}
        />
      </div>
      <div
        className={cn(
          "flex items-center gap-space-3xs rounded px-space-2xs py-space-3xs font-label-code-sm text-label-code-sm",
          vulnerable
            ? "bg-error-container/30 text-error"
            : "bg-surface-container-high/80 text-tertiary-fixed",
        )}
      >
        <Icon name={icon} className="text-[14px]" />
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
}

function ScanningHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-glass-line/10 bg-surface-container-lowest/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between gap-space-sm px-margin-mobile sm:px-margin-tablet lg:px-margin-desktop">
        <div className="flex min-w-0 items-center gap-space-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-container-high shadow-[0_0_12px_rgba(0,240,255,0.15)]">
            <Icon
              name="shield"
              filled
              className="text-[18px] text-primary-container"
            />
          </span>
          <span className="truncate font-headline-sm text-headline-sm font-bold tracking-tight text-primary-container">
            ResilCode AI
          </span>
        </div>

        <div className="hidden items-center gap-space-xs rounded-full bg-surface-container/60 px-space-sm py-space-2xs md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-container opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-container" />
          </span>
          <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
            SCANNING
          </span>
          <span className="font-label-code-sm text-label-code-sm text-outline-variant">
            /
          </span>
          <span className="font-label-code-md text-label-code-md font-medium text-primary">
            my-vibe-app.zip
          </span>
        </div>

        <div className="flex items-center gap-space-xs sm:gap-space-md">
          <div className="hidden items-center gap-space-xs rounded-lg bg-surface-container-low px-space-sm py-space-2xs sm:flex">
            <Icon
              name="timer"
              className="text-[16px] text-primary-fixed-dim"
            />
            <span className="font-label-code-md text-label-code-md tracking-wider text-on-surface">
              00:04:32
            </span>
          </div>

          <button
            type="button"
            className="flex items-center gap-space-2xs rounded-lg bg-error-container px-space-xs py-space-2xs font-body-sm text-body-sm font-medium text-on-error-container transition-all hover:bg-error hover:text-on-error sm:px-space-sm"
          >
            <Icon name="close" className="text-[16px]" />
            <span className="hidden sm:inline">Abort Scan</span>
          </button>

          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary"
          >
            <Icon name="person" className="text-[18px] text-on-primary" />
          </span>
        </div>
      </div>
      <div className={styles.scanline} aria-hidden="true" />
    </header>
  );
}

function ProgressPanel({ nodes }: { nodes: number }) {
  return (
    <section className="glass-sheen relative w-full rounded-xl bg-surface-container/70 p-space-md shadow-xl backdrop-blur-xl">
      <div className="flex flex-col justify-between gap-space-xs md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-space-sm">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest">
            <Icon
              name="sync"
              className="animate-spin text-[18px] text-primary-container"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary">
                68% Completed
              </span>
              <span className="font-label-code-md text-label-code-md text-outline-variant">
                —
              </span>
              <span className="truncate font-headline-sm text-headline-sm font-semibold text-on-surface">
                Analyzing AST Trees
              </span>
            </div>
            <div className="flex items-center gap-space-xs font-label-code-sm text-label-code-sm text-on-surface-variant">
              <span className="font-semibold text-primary-container">
                {nodes.toLocaleString("en-US")}
              </span>
              <span>/ 21,800 AST Nodes Parsed</span>
              <span className="text-outline-variant">•</span>
              <span className="text-tertiary-fixed">Est. 4s remaining</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-space-xs self-start md:self-auto">
          <div className="flex items-center gap-space-2xs rounded bg-surface-container-lowest px-space-xs py-space-3xs font-label-code-sm text-label-code-sm text-on-surface-variant">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" />
            <span>MEM: 384 MB</span>
          </div>
          <div className="flex items-center gap-space-2xs rounded bg-surface-container-lowest px-space-xs py-space-3xs font-label-code-sm text-label-code-sm text-tertiary-fixed">
            <Icon name="bolt" className="text-[14px]" />
            <span>9.4k nodes/sec</span>
          </div>
        </div>
      </div>

      <div className="relative mt-space-xs h-2.5 w-full overflow-hidden rounded-full bg-surface-container-lowest">
        <div
          className="relative h-full rounded-full bg-primary-container shadow-[0_0_16px_rgba(0,240,255,0.7)]"
          style={{ width: "68%" }}
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent",
              styles.shimmer,
            )}
          />
        </div>
      </div>
    </section>
  );
}

function RadarCore() {
  return (
    <div className="relative flex h-44 w-44 shrink-0 items-center justify-center sm:absolute sm:left-1/2 sm:top-1/2 sm:h-56 sm:w-56 sm:-translate-x-1/2 sm:-translate-y-1/2">
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

function ScanSandbox() {
  return (
    <section className="relative flex min-h-[440px] w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-surface-container/60 p-space-lg shadow-2xl backdrop-blur-2xl lg:p-space-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(rgb(var(--color-primary-container)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="z-20 mb-space-md flex items-center gap-space-xs rounded-full bg-error-container/40 px-space-md py-space-2xs shadow-[0_0_24px_rgba(255,46,91,0.35)] backdrop-blur-md">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error" />
        </span>
        <Icon name="warning" className="text-[18px] text-error" />
        <span className="font-label-code-md text-label-code-md font-semibold tracking-wider text-on-error-container">
          2 OWASP Flaws Identified
        </span>
      </div>

      <div className="relative flex w-full max-w-[840px] flex-col items-center gap-space-md sm:block sm:h-[340px]">
        {/* Mobile: stacked node badges */}
        <div className="grid w-full grid-cols-2 gap-space-xs sm:hidden">
          <NodeBadge
            file="src/api/auth.ts"
            icon="crisis_alert"
            label="CWE-798 Hardcoded Key"
            variant="vulnerable"
          />
          <NodeBadge
            file="db/query.py"
            icon="shield_with_heart"
            label="CWE-89 SQL Injection"
            variant="vulnerable"
          />
        </div>

        {/* Connection vectors */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full sm:block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="audit-cyan-line" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7000ff" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient
              id="audit-crimson-left"
              x1="0%"
              x2="100%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ff3366" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient
              id="audit-crimson-right"
              x1="100%"
              x2="0%"
              y1="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ff3366" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <line
            className="animate-pulse"
            x1="24"
            y1="28"
            x2="50"
            y2="50"
            stroke="url(#audit-crimson-left)"
            strokeDasharray="4 4"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <line
            className="animate-pulse"
            x1="76"
            y1="28"
            x2="50"
            y2="50"
            stroke="url(#audit-crimson-right)"
            strokeDasharray="4 4"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="26"
            y1="80"
            x2="50"
            y2="50"
            stroke="url(#audit-cyan-line)"
            strokeDasharray="3 3"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Desktop: floating node badges */}
        <div className="absolute -top-2 left-2 z-10 hidden w-[240px] sm:block md:left-6">
          <NodeBadge
            file="src/api/auth.ts"
            icon="crisis_alert"
            label="CWE-798 Hardcoded Key"
            variant="vulnerable"
          />
        </div>
        <div className="absolute -top-2 right-2 z-10 hidden w-[240px] sm:block md:right-6">
          <NodeBadge
            file="db/query.py"
            icon="shield_with_heart"
            label="CWE-89 SQL Injection"
            variant="vulnerable"
          />
        </div>
        <div className="absolute bottom-2 left-2 z-10 hidden w-[230px] sm:block md:left-8">
          <NodeBadge
            file="middleware.js"
            icon="check_circle"
            label="AST Validated • Clean"
            variant="clean"
          />
        </div>

        <RadarCore />

        {/* Mobile: clean badge below the core */}
        <div className="w-full max-w-[280px] sm:hidden">
          <NodeBadge
            file="middleware.js"
            icon="check_circle"
            label="AST Validated • Clean"
            variant="clean"
          />
        </div>
      </div>
    </section>
  );
}

function LiveTerminal() {
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
            LIVE SCAN TELEMETRY — semgrep-ast-daemon:v4.2
          </span>
          <span className="sm:hidden">LIVE TELEMETRY</span>
        </div>
        <div className="flex items-center gap-space-2xs font-label-code-sm text-label-code-sm text-on-surface-variant">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-tertiary-fixed" />
          <span>ONLINE</span>
        </div>
      </div>

      <div className="flex max-h-56 flex-col gap-space-2xs overflow-y-auto p-space-md font-label-code-md text-label-code-md">
        <LogLine time="10:42:01.104" tag="INFO" tone="info">
          Tree-Sitter grammar loaded for .tsx, .py, .js (28 source files mapped)
        </LogLine>
        <LogLine time="10:42:01.320" tag="INFO" tone="info">
          Parsing TypeScript / Python AST files across abstract callgraphs...
        </LogLine>
        <LogLine time="10:42:02.045" tag="WARN" tone="warn">
          Hardcoded secret key found in client component:{" "}
          <code className="rounded bg-error-container/40 px-1 py-0.5 text-on-error-container">
            src/api/auth.ts:42 (CWE-798)
          </code>
        </LogLine>
        <LogLine time="10:42:02.812" tag="LLM" tone="llm">
          Evaluating authorization logic in user query &amp; sanitization
          pipeline...
        </LogLine>
        <LogLine time="10:42:03.119" tag="WARN" tone="warn">
          Unsanitized cursor concatenation detected:{" "}
          <code className="rounded bg-error-container/40 px-1 py-0.5 text-on-error-container">
            db/query.py:88 (CWE-89)
          </code>
        </LogLine>
        <LogLine time="10:42:03.950" tag="AUDIT" tone="audit">
          Cross-checking against OWASP Top 10 2025 ruleset &amp; CWE taxonomy...
        </LogLine>

        <div className="flex items-center gap-space-xs pt-space-2xs text-primary-container">
          <span className="font-semibold text-primary">&gt;</span>
          <span className="text-on-surface-variant">
            Scanning sub-branches: auth/session_validator.ts
          </span>
          <span
            className={cn(
              "inline-block h-4 w-2 bg-primary-container",
              styles.caret,
            )}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Standalone, purely presentational Active Security Audit screen.
 * Intentionally not linked to the ingestion or landing screens.
 */
export function SecurityAuditScreen() {
  const [nodes, setNodes] = useState(START_NODES);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setNodes((current) =>
        current >= PEAK_NODES
          ? current
          : Math.min(
              current + Math.floor(Math.random() * 24) + 8,
              PEAK_NODES,
            ),
      );
    }, 350);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-surface-container-lowest">
      <ScanningHeader />

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

        <div className="page-container relative flex flex-col gap-space-lg py-space-md lg:py-space-lg">
          <ProgressPanel nodes={nodes} />
          <ScanSandbox />
          <LiveTerminal />
        </div>
      </main>

      <footer className="w-full bg-surface-container-lowest/90 py-space-lg shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
        <div className="page-container flex flex-col gap-space-2xs font-label-code-sm text-label-code-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <div>
            ENGINE STATUS:{" "}
            <span className="font-semibold text-tertiary-fixed">
              SECURE ENCLAVE 04
            </span>
          </div>
          <div className="text-outline">
            RESILCODE REALTIME RUNTIME v3.4.1 • SOC2 COMPLIANT
          </div>
        </div>
      </footer>
    </div>
  );
}
