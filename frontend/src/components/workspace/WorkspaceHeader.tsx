import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Icon } from "@/components/ui/Icon";
import { displayName, providerLabel, type AuthProvider, type SessionUser } from "@/lib/auth";
import type { AuthIdentityStatus } from "@/hooks/use-auth-identity";
import { cn } from "@/lib/cn";

type WorkspaceHeaderProps = {
  status: AuthIdentityStatus;
  provider: AuthProvider | null;
  user: SessionUser | null;
  /** GitHub login pulled from the real token, when available. */
  viewerLogin?: string | null;
};

/**
 * Compact workspace header used by the ingestion and scan screens.
 */
export function WorkspaceHeader({ status, provider, user, viewerLogin }: WorkspaceHeaderProps) {
  const connected = status === "ready" && Boolean(provider);
  const label = connected && provider
    ? providerLabel(provider)
    : status === "unsupported"
      ? "No linked provider"
      : status === "anonymous"
        ? "Signed out"
        : "Verifying session";
  const name = viewerLogin ? `@${viewerLogin}` : displayName(user);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface-container-lowest/80 shadow-[0_1px_8px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-margin-mobile sm:px-margin-tablet lg:px-margin-desktop">
        <Link
          href="/"
          className="group flex items-center gap-space-sm"
          aria-label="ResilCode AI home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded bg-surface-container-high shadow-[0_0_12px_rgba(0,240,255,0.15)]">
            <Icon name="shield" filled className="text-[18px] text-primary-container" />
          </span>
          <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary transition-colors group-hover:text-primary-fixed-dim">
            ResilCode AI
          </span>
        </Link>

        <div className="flex items-center gap-space-xs sm:gap-space-md">
          <div className="hidden items-center gap-space-xs rounded-lg bg-surface-container/60 px-space-sm py-space-3xs backdrop-blur-md sm:flex">
            <span
              className={cn(
                "h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,249,130,0.8)]",
                connected ? "bg-tertiary-container" : "animate-pulse bg-outline",
              )}
            />
            <span className="font-label-code-sm text-label-code-sm text-on-surface-variant">
              {label}
            </span>
            <span className="font-label-code-sm text-label-code-sm text-outline">•</span>
            <span
              className="max-w-[14rem] truncate font-label-code-sm text-label-code-sm font-medium text-primary"
              title={user?.email ?? undefined}
            >
              {name}
            </span>
          </div>

          <ThemeToggle />

          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full border border-glass-line/20 object-cover shadow-[0_0_12px_rgba(0,240,255,0.3)]"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-[0_0_12px_rgba(0,240,255,0.3)]"
            >
              <Icon name="person" className="text-[18px] text-on-primary" />
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
