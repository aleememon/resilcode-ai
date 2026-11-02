import { Icon } from "@/components/ui/Icon";

const COVERAGE = [
  { emoji: "🔑", label: "Hardcoded Secrets (API Keys, JWTs)" },
  { emoji: "💉", label: "SQL & NoSQL Injection" },
  { emoji: "⚡", label: "Cross-Site Scripting (XSS)" },
  { emoji: "🚪", label: "Broken Access Control (BOLA/IDOR)" },
  { emoji: "🌐", label: "Insecure CORS & CSP Headers" },
  { emoji: "📦", label: "Vulnerable Dependencies (CVEs)" },
  { emoji: "🛡️", label: "Server-Side Request Forgery (SSRF)" },
];

export function CoverageRibbon() {
  return (
    <section
      id="owasp-scope"
      aria-labelledby="coverage-title"
      className="snap-anchor w-full border-y border-white/[0.06] bg-surface-container-low py-space-xl"
    >
      <div className="page-container flex flex-col items-center">
        <div className="mb-space-sm flex flex-wrap items-center justify-center gap-space-xs text-center">
          <Icon name="verified" className="text-[18px] text-primary-container" />
          <h2
            id="coverage-title"
            className="font-label-code-md text-label-code-md uppercase tracking-wider text-on-surface-variant"
          >
            Continuous Security Coverage &amp; AST Ruleset Engine
          </h2>
        </div>

        {/* Vulnerability badge matrix */}
        <div className="flex max-w-6xl flex-wrap justify-center gap-space-xs">
          {COVERAGE.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-space-3xs rounded-full bg-surface-container-high px-space-sm py-space-2xs font-label-code-sm text-label-code-sm text-primary shadow-sm transition-colors hover:bg-surface-bright"
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <p className="mt-space-sm max-w-3xl text-center font-body-sm text-body-sm text-outline">
          Synced in real-time with latest 2024-2025 OWASP Application Security standards and
          Common Weakness Enumerations (CWE).
        </p>
      </div>
    </section>
  );
}
