const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Security Whitepaper", href: "#" },
  { label: "GitHub Repository", href: "#" },
];

export function SiteFooter() {
  return (
    <footer
      id="docs"
      className="snap-anchor mt-space-3xl w-full border-t border-glass-line/[0.08] bg-surface-container-lowest shadow-[0_-1px_8px_rgba(15,23,42,0.06)]"
    >
      <div className="mx-auto flex max-w-content flex-col gap-space-xl px-margin-mobile py-space-2xl sm:px-margin-tablet lg:px-margin-desktop">
        <div className="flex flex-col items-center justify-between gap-space-lg md:flex-row">
          <div className="flex items-center gap-space-xs rounded-full bg-surface-container-low px-space-sm py-space-2xs">
            <span className="h-2 w-2 rounded-full bg-tertiary-container shadow-[0_0_8px_rgba(0,249,130,0.8)]" />
            <span className="font-label-code-sm text-label-code-sm text-tertiary-fixed">
              All Security Engines Operational
            </span>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-space-lg">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-space-md text-center sm:flex-row sm:text-left">
          <p className="font-body-sm text-body-sm text-outline">
            © 2025 AegisCode AI, Inc. Autonomous Security for Modern Web Apps.
          </p>
          <div className="flex items-center gap-space-sm">
            <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
              SYNTHETIC AUDIT ENGINE v4.2.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
