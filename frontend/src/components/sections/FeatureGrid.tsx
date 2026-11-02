import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";

const CARD_CLASS =
  "group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-surface-container-low p-space-xl shadow-lg transition-all duration-300 hover:border-primary-container/30 hover:bg-surface-container hover:shadow-photon glass-sheen";

export function FeatureGrid() {
  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="snap-anchor page-container w-full py-space-2xl"
    >
      <SectionHeading
        eyebrow="System Capabilities"
        title="Architected for Speed. Calibrated for Safety."
        description="Every tool your team needs to prevent catastrophic security leaks before code ever reaches production servers."
        id="features-title"
      />

      <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
        {/* Feature 1 — 1-Click AI Fixes */}
        <article className={CARD_CLASS}>
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-container/10 blur-3xl transition-all group-hover:bg-primary-container/20"
          />
          <div>
            <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high text-primary-container shadow-[0_0_16px_rgba(0,240,255,0.2)]">
              <Icon name="auto_fix_high" className="text-[26px]" />
            </div>
            <h3 className="mb-space-xs font-headline-lg text-headline-lg text-on-surface">
              1-Click AI Fixes
            </h3>
            <p className="mb-space-lg font-body-md text-body-md leading-relaxed text-on-surface-variant">
              Eliminate tedious manual remediation. AegisCode synthesizes drop-in code
              replacements tailored to your framework&apos;s exact idioms and conventions,
              preserving original formatting.
            </p>
          </div>

          <div className="flex flex-col gap-1 rounded-lg bg-surface-container-lowest p-space-md text-left font-label-code-md text-label-code-md">
            <div className="mb-space-2xs flex flex-wrap items-center justify-between gap-space-2xs border-b border-white/[0.06] pb-space-xs">
              <span className="font-label-code-sm text-outline">Diff Engine Preview</span>
              <span className="flex items-center gap-1 font-label-code-sm text-tertiary-fixed">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary-container" />
                Auto-Approved
              </span>
            </div>
            <div className="text-error opacity-75 line-through">
              {`- app.use(cors({ origin: '*' }))`}
            </div>
            <div className="font-medium text-tertiary">
              {`+ app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }))`}
            </div>
          </div>
        </article>

        {/* Feature 2 — AST + LLM Dual Engine */}
        <article className={CARD_CLASS}>
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-secondary-container/15 blur-3xl transition-all group-hover:bg-secondary-container/25"
          />
          <div>
            <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high text-secondary shadow-[0_0_16px_rgba(112,0,255,0.3)]">
              <Icon name="memory" className="text-[26px]" />
            </div>
            <h3 className="mb-space-xs font-headline-lg text-headline-lg text-on-surface">
              AST + LLM Dual Engine
            </h3>
            <p className="mb-space-lg font-body-md text-body-md leading-relaxed text-on-surface-variant">
              Fast deterministic static analysis (Semgrep, Tree-Sitter) pinpoints code syntax
              flaws, while reasoning LLMs verify real-world exploitability to achieve 99.4%
              precision.
            </p>
          </div>

          <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-md">
            <div className="flex flex-wrap items-center justify-between gap-space-2xs font-label-code-sm text-label-code-sm">
              <span className="text-on-surface-variant">Deterministic Accuracy</span>
              <span className="font-bold text-primary-fixed-dim">99.4% Verified</span>
            </div>
            <svg
              aria-hidden="true"
              className="h-12 w-full text-primary-container"
              fill="none"
              viewBox="0 0 300 60"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 45 L40 40 L80 48 L120 30 L160 25 L200 15 L240 18 L280 8 L300 5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
              <path
                d="M0 45 L40 40 L80 48 L120 30 L160 25 L200 15 L240 18 L280 8 L300 5 V60 H0 Z"
                fill="currentColor"
                fillOpacity="0.08"
              />
            </svg>
          </div>
        </article>

        {/* Feature 3 — Plain-English Explanations */}
        <article className={CARD_CLASS}>
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-container/10 blur-3xl transition-all group-hover:bg-primary-container/20"
          />
          <div>
            <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high text-primary-fixed shadow-[0_0_16px_rgba(0,240,255,0.2)]">
              <Icon name="chat" className="text-[26px]" />
            </div>
            <h3 className="mb-space-xs font-headline-lg text-headline-lg text-on-surface">
              Plain-English Explanations
            </h3>
            <p className="mb-space-lg font-body-md text-body-md leading-relaxed text-on-surface-variant">
              No obtuse CVE jargon or cryptic alerts. Each issue arrives with a plain-English
              explanation of how an attacker abuses it and why the patch guarantees security.
            </p>
          </div>

          <div className="flex items-start gap-space-sm rounded-lg bg-surface-container-lowest p-space-md text-left">
            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-high">
              <Icon name="psychology" className="text-[14px] text-primary-container" />
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              <span className="font-semibold text-primary">Why this was flagged:</span> The user
              parameter{" "}
              <code className="rounded bg-surface-container px-1 py-0.5 font-label-code-sm text-on-surface">
                params.role
              </code>{" "}
              bypasses authorization middleware, allowing privilege escalation to{" "}
              <code className="rounded bg-surface-container px-1 py-0.5 font-label-code-sm text-error">
                isAdmin
              </code>
              .
            </div>
          </div>
        </article>

        {/* Feature 4 — Audit History & Health Score */}
        <article className={CARD_CLASS}>
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-tertiary-container/10 blur-3xl transition-all group-hover:bg-tertiary-container/20"
          />
          <div>
            <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high text-tertiary-fixed shadow-[0_0_16px_rgba(0,249,130,0.25)]">
              <Icon name="shield_with_heart" className="text-[26px]" />
            </div>
            <h3 className="mb-space-xs font-headline-lg text-headline-lg text-on-surface">
              Audit History &amp; Health Score
            </h3>
            <p className="mb-space-lg font-body-md text-body-md leading-relaxed text-on-surface-variant">
              Track your security posture over time. Monitor your 0–100 codebase Health Score,
              view vulnerability burndown trends, and export instant compliance PDFs.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-space-sm rounded-lg bg-surface-container-lowest p-space-md">
            <div className="flex items-center gap-space-md">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <svg
                  aria-hidden="true"
                  className="h-14 w-14 -rotate-90"
                  viewBox="0 0 36 36"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    className="text-surface-container"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="94 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                    className="text-tertiary-container"
                  />
                </svg>
                <span className="absolute font-headline-sm text-headline-sm text-on-surface">
                  94
                </span>
              </div>
              <div className="text-left">
                <p className="font-headline-sm text-headline-sm text-tertiary-fixed">
                  Grade A+ Health
                </p>
                <p className="font-label-code-sm text-label-code-sm text-outline">
                  0 Critical • 1 Low Flag
                </p>
              </div>
            </div>
            <span className="rounded bg-tertiary-container/15 px-space-xs py-space-3xs font-label-code-sm text-label-code-sm text-tertiary-fixed">
              +12% vs last PR
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}
