import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";

const CARD_CLASS =
  "group flex flex-col justify-between rounded-xl border border-glass-line/[0.08] bg-surface-container-low p-space-lg shadow-md transition-all duration-300 hover:border-primary-container/30 hover:bg-surface-container hover:shadow-photon";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="snap-anchor page-container w-full py-space-3xl"
    >
      <SectionHeading
        eyebrow="Execution Pipeline"
        eyebrowClassName="text-secondary"
        title="From Vulnerable to Bulletproof in 3 Steps"
        description="A deterministic workflow engineered specifically for modern dev teams shipping AI code at maximum velocity."
        id="how-it-works-title"
      />

      <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
        {/* Step 1 */}
        <article className={`${CARD_CLASS} glass-sheen`}>
          <div>
            <div className="mb-space-md flex items-center justify-between">
              <span className="font-label-code-lg text-label-code-lg font-semibold text-primary-container">
                01 / INGEST CODE
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-primary transition-transform group-hover:scale-110">
                <Icon name="file_upload" className="text-[20px]" />
              </div>
            </div>
            <h3 className="mb-space-xs font-headline-md text-headline-md text-on-surface">
              Zip Archive or Git Sync
            </h3>
            <p className="mb-space-lg font-body-md text-body-md text-on-surface-variant">
              Upload local .zip archives securely or authenticate via GitHub to scan branches
              directly in your CI pipeline.
            </p>
          </div>

          <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-md">
            <div className="flex items-center justify-between rounded bg-surface-container p-space-sm text-left">
              <div className="flex items-center gap-space-xs">
                <Icon name="folder_zip" className="text-[18px] text-primary-container" />
                <span className="font-label-code-sm text-label-code-sm text-on-surface">
                  project-build.zip
                </span>
              </div>
              <span className="font-label-code-sm text-label-code-sm text-tertiary-fixed">
                4.2 MB
              </span>
            </div>
            <div className="flex items-center justify-between rounded bg-surface-container p-space-sm text-left">
              <div className="flex items-center gap-space-xs">
                <Icon name="account_tree" className="text-[18px] text-secondary" />
                <span className="font-label-code-sm text-label-code-sm text-on-surface">
                  main • 8f3c2a1
                </span>
              </div>
              <span className="font-label-code-sm text-label-code-sm text-primary-container">
                Connected
              </span>
            </div>
          </div>
        </article>

        {/* Step 2 */}
        <article className={`${CARD_CLASS} glass-sheen`}>
          <div>
            <div className="mb-space-md flex items-center justify-between">
              <span className="font-label-code-lg text-label-code-lg font-semibold text-primary-container">
                02 / DEEP AST SCAN
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-primary transition-transform group-hover:scale-110">
                <Icon name="account_tree" className="text-[20px]" />
              </div>
            </div>
            <h3 className="mb-space-xs font-headline-md text-headline-md text-on-surface">
              Semgrep &amp; Tree-Sitter Parsers
            </h3>
            <p className="mb-space-lg font-body-md text-body-md text-on-surface-variant">
              High-speed Abstract Syntax Tree evaluation flags OWASP Top 10 vulnerabilities in
              under 12 seconds with zero hallucination.
            </p>
          </div>

          <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-md">
            <div className="flex items-center justify-between font-label-code-sm text-label-code-sm">
              <span className="text-on-surface-variant">AST Node Graph Analysis</span>
              <span className="text-tertiary-fixed">14,820 Nodes</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full w-[88%] rounded-full bg-primary-container shadow-[0_0_8px_#00f0ff]" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-space-2xs pt-space-xs text-left">
              <span className="font-label-code-sm text-label-code-sm text-on-surface">
                Latency: <span className="text-primary">8.4s</span>
              </span>
              <span className="rounded bg-tertiary-container/15 px-space-2xs py-space-3xs font-label-code-sm text-label-code-sm font-semibold text-tertiary-fixed">
                ZERO FALSE POSITIVES
              </span>
            </div>
          </div>
        </article>

        {/* Step 3 */}
        <article className={`${CARD_CLASS} glass-sheen`}>
          <div>
            <div className="mb-space-md flex items-center justify-between">
              <span className="font-label-code-lg text-label-code-lg font-semibold text-primary-container">
                03 / 1-CLICK PATCH
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-primary transition-transform group-hover:scale-110">
                <Icon name="magic_button" className="text-[20px]" />
              </div>
            </div>
            <h3 className="mb-space-xs font-headline-md text-headline-md text-on-surface">
              Autonomous PR Generation
            </h3>
            <p className="mb-space-lg font-body-md text-body-md text-on-surface-variant">
              Side-by-side diff previews let you audit fixes before applying. Auto-generate pull
              requests and merge directly into staging.
            </p>
          </div>

          <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-lowest p-space-md">
            <div className="flex flex-wrap items-center justify-between gap-space-2xs font-label-code-sm text-label-code-sm">
              <span className="flex items-center gap-space-3xs font-medium text-primary">
                <Icon name="call_merge" className="text-[15px] text-tertiary-container" />
                PR #418 Ready
              </span>
              <span className="font-semibold text-tertiary-fixed">Verified Safe</span>
            </div>
            <div className="flex items-center justify-between gap-space-xs rounded bg-surface-container p-space-xs text-left font-label-code-sm text-label-code-sm">
              <span className="truncate text-on-surface-variant">
                feat(sec): patch injection &amp; leak
              </span>
              <span className="whitespace-nowrap font-bold text-tertiary-fixed-dim">
                +18 -6
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
