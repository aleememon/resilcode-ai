import { AuthCtas } from "@/components/ui/AuthCtas";
import { Icon } from "@/components/ui/Icon";

const REASSURANCE = [
  { icon: "credit_card_off", tone: "text-tertiary-container", label: "No credit card required" },
  { icon: "security", tone: "text-primary-container", label: "SOC2 Compliant Architecture" },
  { icon: "task_alt", tone: "text-secondary", label: "Cancel anytime" },
];

export function FinalCta() {
  return (
    <section
      id="get-started"
      aria-labelledby="final-cta-title"
      className="snap-anchor page-container w-full py-space-3xl"
    >
      <div className="relative flex flex-col items-center overflow-hidden rounded-xl border border-glass-line/[0.08] bg-surface-container-low p-space-xl text-center shadow-banner md:p-space-3xl">
        {/* Radiant background light sources */}
        <div
          aria-hidden="true"
          data-glow
          className="pointer-events-none absolute -top-32 left-1/2 h-[300px] w-[700px] -translate-x-1/2 bg-gradient-to-r from-primary-container/20 via-secondary-container/25 to-tertiary-container/15 blur-[90px]"
        />

        <div className="relative mb-space-md inline-flex items-center gap-space-2xs rounded-full bg-surface-container-high px-space-md py-space-2xs font-label-code-sm text-label-code-sm uppercase tracking-wider text-primary">
          <Icon name="bolt" className="text-[15px] text-tertiary-container" />
          Instant Synthetic Defense
        </div>

        <h2
          id="final-cta-title"
          className="relative mb-space-sm max-w-3xl font-headline-xl text-headline-xl-mobile tracking-tight text-on-surface md:text-headline-xl"
        >
          Secure Your Application Before Deployment.
        </h2>

        <p className="relative mb-space-2xl max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Audit your codebase in seconds. The free tier includes 5 repository scans per month
          with instant AI remediation and PR generation.
        </p>

        <AuthCtas
          className="relative mb-space-xl"
          googleCaption="Instant .zip upload"
          githubCaption="Automated PR patches"
        />

        <div className="relative flex flex-wrap items-center justify-center gap-space-md font-label-code-sm text-label-code-sm text-on-surface-variant">
          {REASSURANCE.map((item, index) => (
            <div key={item.label} className="flex items-center gap-space-md">
              {index > 0 ? (
                <span aria-hidden="true" className="text-outline">
                  •
                </span>
              ) : null}
              <span className="flex items-center gap-space-3xs">
                <Icon name={item.icon} className={`text-[16px] ${item.tone}`} />
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
