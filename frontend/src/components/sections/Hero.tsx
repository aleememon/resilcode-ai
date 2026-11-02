import { AuthCtas } from "@/components/ui/AuthCtas";
import { CyberDiff } from "@/components/ui/CyberDiff";
import { Icon } from "@/components/ui/Icon";

const TRUST_BADGES = [
  { icon: "verified_user", tone: "text-tertiary-container", label: "SOC2 Type II in progress" },
  { icon: "lock_reset", tone: "text-primary-container", label: "Zero-Code Stored Guarantee" },
  { icon: "bolt", tone: "text-secondary", label: "Under 12s scan latency" },
];

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate w-full overflow-hidden bg-surface-container-lowest"
    >
      {/* Ambient photon fields */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[480px] w-[1000px] -translate-x-1/2 bg-gradient-to-b from-primary-container/15 via-secondary-container/20 to-transparent blur-[120px]" />
        <div className="absolute right-[-10%] top-80 h-[500px] w-[500px] bg-primary-container/10 blur-[140px]" />
        <div className="absolute left-[-10%] top-96 h-[460px] w-[460px] bg-secondary-container/15 blur-[140px]" />
      </div>

      <div className="page-container relative z-10 flex flex-col items-center pb-16 pt-8 text-center md:pb-24 md:pt-14">
        {/* Pulsing tagline badge */}
        <div className="mb-space-lg inline-flex flex-wrap items-center justify-center gap-space-xs rounded-full bg-surface-container-low px-space-md py-space-2xs shadow-[0_0_24px_rgba(0,240,255,0.18)]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-container opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary-container shadow-[0_0_8px_#00f0ff]" />
          </span>
          <span className="font-label-code-sm text-label-code-sm uppercase tracking-wide text-primary-fixed">
            Security for Vibe-Coded Web Apps
          </span>
          <span aria-hidden="true" className="font-label-code-sm text-label-code-sm text-on-surface-variant">
            •
          </span>
          <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
            v4.2 Synthetic Engine
          </span>
        </div>

        {/* Main headline */}
        <h1
          id="hero-title"
          className="mb-space-md max-w-5xl font-display-hero text-display-hero-mobile tracking-tight text-on-surface md:text-display-hero"
        >
          Automated Security &amp;{" "}
          <span className="text-gradient-cyan">1-Click Repair</span> for{" "}
          <span className="text-gradient-purple">AI-Generated Code</span>.
        </h1>

        {/* Subheadline */}
        <p className="mb-space-2xl max-w-3xl font-body-lg text-body-lg text-on-surface-variant">
          Scan React, Next.js, Express, and Python apps for OWASP vulnerabilities. Detect
          hardcoded secrets, injection vectors, and broken access controls—then patch them
          instantly with synthetic precision.
        </p>

        <AuthCtas className="mb-space-xl" />

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-space-lg gap-y-space-xs font-label-code-sm text-label-code-sm text-on-surface-variant">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.label} className="flex items-center gap-space-3xs">
              <Icon name={badge.icon} className={`text-[16px] ${badge.tone}`} />
              <span>{badge.label}</span>
            </div>
          ))}
        </div>

        <CyberDiff />
      </div>
    </section>
  );
}
