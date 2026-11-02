"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type RunState = "idle" | "running" | "done";
type LineTone = "default" | "danger" | "safe";

function CodeLine({
  n,
  tone = "default",
  children,
}: {
  n: string;
  tone?: LineTone;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex rounded py-0.5",
        tone === "danger" && "bg-error/10 text-error hover:bg-error/20",
        tone === "safe" &&
          "bg-tertiary-container/10 text-tertiary hover:bg-tertiary-container/20",
        tone === "default" && "text-outline hover:text-on-surface",
      )}
    >
      <span
        className={cn(
          "w-8 shrink-0 select-none pr-4 text-right",
          tone === "danger"
            ? "text-error opacity-60"
            : tone === "safe"
              ? "text-tertiary-container opacity-60"
              : "opacity-40",
        )}
      >
        {n}
      </span>
      <span className="min-w-0 whitespace-pre">{children}</span>
    </div>
  );
}

function DiagnosticsNote({
  tone,
  icon,
  title,
  body,
}: {
  tone: "danger" | "safe";
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mt-space-md flex items-start gap-space-sm rounded bg-surface-container p-space-sm text-left">
      <Icon
        name={icon}
        className={cn(
          "mt-0.5 flex-shrink-0 text-[20px]",
          tone === "danger" ? "text-error" : "text-tertiary-container",
        )}
      />
      <div>
        <p
          className={cn(
            "mb-0.5 font-headline-sm text-headline-sm",
            tone === "danger" ? "text-error" : "text-tertiary-fixed",
          )}
        >
          {title}
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{body}</p>
      </div>
    </div>
  );
}

export function CyberDiff() {
  const [verifyState, setVerifyState] = useState<RunState>("idle");
  const [patchState, setPatchState] = useState<RunState>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
    };
  }, []);

  const schedule = (callback: () => void, delay: number) => {
    timers.current.push(setTimeout(callback, delay));
  };

  const runVerification = () => {
    if (verifyState !== "idle") return;
    setVerifyState("running");
    schedule(() => setVerifyState("done"), 1200);
    schedule(() => setVerifyState("idle"), 4700);
  };

  const applyPatch = () => {
    if (patchState !== "idle") return;
    setPatchState("running");
    schedule(() => setPatchState("done"), 1500);
    schedule(() => setPatchState("idle"), 5000);
  };

  return (
    <div className="mt-space-2xl w-full overflow-hidden rounded-xl bg-surface-container-low shadow-window">
      {/* Window top header bar */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container px-space-md py-space-sm">
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-error-container" />
            <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
            <span className="h-3 w-3 rounded-full bg-tertiary-container" />
          </div>
          <div className="flex items-center gap-space-xs rounded bg-surface-container-lowest px-space-sm py-space-3xs font-label-code-md text-label-code-md text-on-surface">
            <Icon name="code" className="text-[15px] text-primary-fixed-dim" />
            <span>src/api/auth/scanner.ts</span>
            <span className="font-label-code-sm text-outline">::</span>
            <span className="font-label-code-sm font-semibold text-error">
              CWE-89 &amp; CWE-798
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-space-xs">
          <span className="rounded bg-secondary-container/30 px-space-xs py-space-3xs font-label-code-sm text-label-code-sm text-secondary">
            SYNTHETIC AST v4.2
          </span>
          <span className="rounded bg-error/15 px-space-xs py-space-3xs font-label-code-sm text-label-code-sm text-error">
            HIGH SEVERITY
          </span>
        </div>
      </div>

      {/* Split diff view */}
      <div className="relative grid grid-cols-1 bg-surface-container-lowest lg:grid-cols-2">
        {/* Left: vulnerable code */}
        <div className="flex flex-col justify-between bg-surface-container-lowest/90 p-space-md md:p-space-lg">
          <div>
            <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-xs border-b border-white/[0.06] pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="h-2 w-2 animate-pulse rounded-full bg-error" />
                <span className="font-headline-sm text-headline-sm text-error">
                  Vulnerable AST Source
                </span>
              </div>
              <span className="rounded bg-error-container/40 px-space-xs py-space-3xs font-label-code-sm text-label-code-sm uppercase tracking-wider text-error">
                [CRITICAL: CWE-89 &amp; CWE-798]
              </span>
            </div>

            <div className="space-y-1 overflow-x-auto text-left font-label-code-md text-label-code-md">
              <CodeLine n="38">
                <span className="text-on-surface-variant">
                  {"// Hardcoded credentials vulnerability"}
                </span>
              </CodeLine>
              <CodeLine n="39" tone="danger">
                <span className="font-semibold text-secondary">const</span> OPENAI_KEY ={" "}
                <span className="text-[#fca5a5]">{`"sk-live-93a84f09d812ebaa01"`}</span>;
              </CodeLine>
              <CodeLine n="40" />
              <CodeLine n="41">
                <span className="text-on-surface-variant">
                  {"// Unsanitized user inputs in SQL raw string"}
                </span>
              </CodeLine>
              <CodeLine n="42" tone="danger">
                <span className="text-primary-fixed">await</span> db.query(
                <span className="text-[#fca5a5]">{`"SELECT * FROM users WHERE id = '"`}</span>
                {" + req.query.id + "}
                <span className="text-[#fca5a5]">{`"'"`}</span>);
              </CodeLine>
              <CodeLine n="43">
                return res.json({"{"} status:{" "}
                <span className="font-semibold text-secondary">{`"authenticated"`}</span>
                {" "}
                {"}"});
              </CodeLine>
            </div>
          </div>

          <DiagnosticsNote
            tone="danger"
            icon="report"
            title="Direct Raw String Concatenation Detected"
            body="Attacker can execute arbitrary SQL queries to dump password tables and compromise underlying database nodes."
          />
        </div>

        {/* Center animated repair vector */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface-container-high shadow-[0_0_20px_#00f0ff] lg:flex">
          <Icon
            name="auto_fix_high"
            className="animate-pulse text-[24px] text-primary-container"
          />
        </div>

        {/* Right: remediated code */}
        <div className="flex flex-col justify-between bg-surface-container-low/80 p-space-md md:p-space-lg lg:border-l lg:border-white/[0.06]">
          <div>
            <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-xs border-b border-white/[0.06] pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary-container" />
                <span className="font-headline-sm text-headline-sm text-tertiary-fixed">
                  Remediated AST Model
                </span>
              </div>
              <span className="rounded bg-tertiary-container/20 px-space-xs py-space-3xs font-label-code-sm text-label-code-sm uppercase tracking-wider text-tertiary-fixed">
                [PATCH APPLIED: 1-Click Resolved]
              </span>
            </div>

            <div className="space-y-1 overflow-x-auto text-left font-label-code-md text-label-code-md">
              <CodeLine n="38">
                <span className="text-tertiary-fixed">
                  {"// Environment isolation via verified vault"}
                </span>
              </CodeLine>
              <CodeLine n="39" tone="safe">
                <span className="font-semibold text-secondary">const</span> apiKey =
                process.env.OPENAI_API_KEY;
              </CodeLine>
              <CodeLine n="40" />
              <CodeLine n="41">
                <span className="text-tertiary-fixed">
                  {"// Strongly parameterized prepared statement"}
                </span>
              </CodeLine>
              <CodeLine n="42" tone="safe">
                <span className="text-primary-fixed">await</span> db.query(
                <span className="font-semibold text-tertiary">
                  {`"SELECT * FROM users WHERE id = $1"`}
                </span>
                , [req.query.id]);
              </CodeLine>
              <CodeLine n="43">
                return res.json({"{"} status:{" "}
                <span className="font-semibold text-secondary">{`"authenticated"`}</span>
                {" "}
                {"}"});
              </CodeLine>
            </div>
          </div>

          <DiagnosticsNote
            tone="safe"
            icon="check_circle"
            title="Semantic Integrity Guard Passed"
            body="Validated against PostgreSQL dialect AST. Zero SQL injection surface remains. Secrets swapped with standard process env."
          />
        </div>
      </div>

      {/* Action overlay bar */}
      <div className="flex flex-col items-center justify-between gap-space-sm bg-surface-container-high px-space-md py-space-sm sm:flex-row">
        <div className="flex items-center gap-space-xs">
          <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary-container" />
          <span className="font-label-code-md text-label-code-md font-medium text-primary">
            1-Click Patch Ready: Automatic branch{" "}
            <code className="text-primary-container">aegis/patch-cwe89-cwe798</code> created
          </span>
        </div>
        <div className="flex w-full items-center gap-space-xs sm:w-auto">
          <button
            type="button"
            onClick={runVerification}
            aria-live="polite"
            className="flex flex-1 items-center justify-center gap-space-3xs rounded bg-surface-container px-space-sm py-space-xs font-label-code-md text-label-code-md text-on-surface transition-colors hover:bg-surface-bright sm:flex-initial"
          >
            <Icon
              name={
                verifyState === "running"
                  ? "refresh"
                  : verifyState === "done"
                    ? "check"
                    : "play_circle"
              }
              className={cn(
                "text-[16px]",
                verifyState === "running" && "animate-spin",
                verifyState === "done" && "text-tertiary-container",
              )}
            />
            {verifyState === "running"
              ? "Verifying AST..."
              : verifyState === "done"
                ? "0 Exploit Paths Found"
                : "Run Verification AST Test"}
          </button>
          <button
            type="button"
            onClick={applyPatch}
            aria-live="polite"
            className="flex flex-1 items-center justify-center gap-space-3xs rounded bg-gradient-to-r from-primary-container to-tertiary-container px-space-md py-space-xs font-headline-sm text-headline-sm text-on-primary shadow-[0_0_16px_rgba(0,240,255,0.4)] transition-all hover:opacity-95 sm:flex-initial"
          >
            <Icon
              name={
                patchState === "running"
                  ? "sync"
                  : patchState === "done"
                    ? "check_circle"
                    : "merge"
              }
              className={cn("text-[16px]", patchState === "running" && "animate-pulse")}
            />
            {patchState === "running"
              ? "Dispatching PR..."
              : patchState === "done"
                ? "Pull Request #419 Merged!"
                : "Apply Remediation to Pull Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
