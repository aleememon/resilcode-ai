"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "OWASP Scope", href: "#owasp-scope" },
  { label: "Docs", href: "#docs" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-surface-container-lowest/80 shadow-[0_1px_8px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-content items-center justify-between px-margin-mobile sm:px-margin-tablet lg:px-margin-desktop">
        {/* Brand */}
        <Link
          href="#top"
          className="group flex items-center gap-space-sm"
          aria-label="ResilCode AI home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low shadow-[0_0_16px_rgba(0,240,255,0.25)]">
            <Icon name="shield" filled className="text-[22px] text-primary-container" />
          </span>
          <span className="flex items-center gap-space-xs">
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface transition-colors group-hover:text-primary">
              ResilCode AI
            </span>
            <span className="rounded-full bg-secondary-container/20 px-space-2xs py-space-3xs font-label-code-sm text-label-code-sm uppercase tracking-wider text-secondary">
              AI Security
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-space-lg md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-body-md text-body-md text-on-surface-variant transition-colors hover:text-on-surface"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-space-sm md:gap-space-md">
          <a
            href="#get-started"
            className="hidden items-center justify-center rounded-lg px-space-md py-space-xs font-headline-sm text-label-code-lg text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface sm:inline-flex"
          >
            Sign In
          </a>

          <a
            href="#get-started"
            className="group relative rounded-lg bg-gradient-to-r from-secondary-container via-primary-container to-secondary-container p-px shadow-purple-glow-lg transition-all hover:shadow-cyan-glow-lg"
          >
            <span className="flex items-center justify-center rounded-[calc(0.25rem-1px)] bg-surface-container-lowest px-space-md py-space-xs font-label-code-lg text-primary transition-colors group-hover:bg-surface-container-low">
              Get Started
            </span>
          </a>

          <span
            aria-hidden="true"
            className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary sm:flex"
          >
            <Icon name="person" className="text-[18px] text-on-primary" />
          </span>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary-container/40 hover:text-primary md:hidden"
          >
            <Icon name={open ? "close" : "menu"} className="text-[20px]" />
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-t border-white/[0.06] bg-surface-container-lowest/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 md:hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav
          aria-label="Mobile"
          className="mx-auto flex max-w-content flex-col gap-space-2xs px-margin-mobile py-space-md sm:px-margin-tablet"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-space-sm py-space-xs font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#get-started"
            onClick={() => setOpen(false)}
            className="mt-space-2xs rounded-lg px-space-sm py-space-xs font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface sm:hidden"
          >
            Sign In
          </a>
        </nav>
      </div>
    </header>
  );
}
