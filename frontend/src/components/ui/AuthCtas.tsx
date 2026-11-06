"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { GitHubIcon, GoogleIcon } from "./brand-icons";
import { Icon } from "./Icon";
import { authClient } from "@/lib/auth-client";

type AuthProviderName = "google" | "github";

type AuthCtasProps = {
  className?: string;
  googleCaption?: string;
  githubCaption?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const PROVIDER_LABEL: Record<AuthProviderName, string> = {
  google: "Google",
  github: "GitHub",
};

/**
 * Turn a Better Auth failure into something a human can act on.
 *
 * The most common local setup failure is an origin mismatch: the browser is on
 * `127.0.0.1` while `FRONTEND_URL` says `localhost` (or the port differs), and
 * Better Auth answers with `403 INVALID_CALLBACK_URL`.
 */
function describeSignInError(provider: AuthProviderName, error: unknown): string {
  const label = PROVIDER_LABEL[provider];
  const callback = `${API_URL}/api/auth/callback/${provider}`;

  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return `Couldn't reach the auth server at ${API_URL}. Make sure the backend is running, and that this page's origin (${window.location.origin}) is listed in FRONTEND_URL in backend/.env — an origin/CORS mismatch also shows up as a network failure.`;
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : typeof error === "string"
        ? error
        : "";

  if (code === "INVALID_CALLBACK_URL" || /invalid callbackurl/i.test(message)) {
    return `The auth server rejected this page's origin (${window.location.origin}). Add it to FRONTEND_URL in backend/.env, then restart the backend. Both apps must use the same host (localhost or 127.0.0.1).`;
  }

  if (/provider.*not (found|configured|supported)/i.test(message)) {
    return `${label} sign-in isn't configured on the auth server. Check the ${label.toUpperCase()}_CLIENT_ID and ${label.toUpperCase()}_CLIENT_SECRET values in backend/.env.`;
  }

  if (code === "TOO_MANY_REQUESTS") {
    return "Too many sign-in attempts. Wait a minute and try again.";
  }

  if (message) {
    return `${label} sign-in failed: ${message} (callback: ${callback}).`;
  }

  return `${label} sign-in failed before the redirect started. Check that ${callback} is registered as a redirect URL in your ${label} OAuth app.`;
}

/**
 * Dual authentication CTAs from the hero and final CTA sections.
 *
 * Better Auth records the chosen provider on the user's `account` row, so the
 * ingestion screen reads it back from the session instead of local storage.
 */
export function AuthCtas({
  className,
  googleCaption = "Upload local .zip archives",
  githubCaption = "Sync repositories & branches",
}: AuthCtasProps) {
  const [pending, setPending] = useState<AuthProviderName | null>(null);
  const [failure, setFailure] = useState<{ provider: AuthProviderName; message: string } | null>(
    null,
  );

  // If the browser restores this page from the back/forward cache after a
  // cancelled OAuth redirect, don't leave the buttons stuck in "Opening…".
  useEffect(() => {
    const reset = () => setPending(null);
    window.addEventListener("pageshow", reset);
    window.addEventListener("focus", reset);
    return () => {
      window.removeEventListener("pageshow", reset);
      window.removeEventListener("focus", reset);
    };
  }, []);

  const signIn = async (provider: AuthProviderName) => {
    setFailure(null);
    setPending(provider);

    try {
      // `signIn.social` navigates the browser on success; any resolved response
      // with an error (403 invalid origin, missing provider, etc.) lands here.
      const result = await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}/code-ingestion`,
        errorCallbackURL: `${window.location.origin}/?auth=cancelled`,
        fetchOptions: { throw: false },
      });

      if (result?.error) {
        setFailure({ provider, message: describeSignInError(provider, result.error) });
        setPending(null);
        return;
      }

      if (!result?.data?.url && !result?.data?.redirect) {
        setFailure({ provider, message: describeSignInError(provider, null) });
        setPending(null);
      }
      // Otherwise the redirect to the provider is already in flight; leave the
      // buttons busy so a double click can't start a second OAuth flow.
    } catch (error) {
      setFailure({ provider, message: describeSignInError(provider, error) });
      setPending(null);
    }
  };

  const busy = pending !== null;
  const busyLabel = pending ? `Opening ${PROVIDER_LABEL[pending]}…` : null;

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col items-stretch gap-space-sm",
        className,
      )}
    >
      <div className="flex w-full flex-col items-stretch justify-center gap-space-md sm:flex-row">
        {/* Google CTA */}
        <div className="flex flex-1 flex-col items-center">
          <button
            type="button"
            onClick={() => signIn("google")}
            disabled={busy}
            aria-busy={pending === "google"}
            className="group cta-shadow flex h-14 w-full items-center justify-center gap-space-sm rounded-lg bg-surface-container-high px-space-lg text-on-surface transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-bright hover:shadow-cyan-glow active:translate-y-0 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {pending === "google" ? (
              <Icon name="sync" className="h-5 w-5 shrink-0 animate-spin text-primary" />
            ) : (
              <GoogleIcon className="h-5 w-5 shrink-0" />
            )}
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
              {pending === "google" ? busyLabel : "Continue with Google"}
            </span>
          </button>
          <span className="mt-space-2xs flex items-center gap-space-3xs font-label-code-sm text-label-code-sm text-outline">
            <Icon
              name="upload_file"
              className="text-[13px] text-primary-fixed-dim"
            />
            {googleCaption}
          </span>
        </div>

        {/* GitHub CTA */}
        <div className="flex flex-1 flex-col items-center">
          <button
            type="button"
            onClick={() => signIn("github")}
            disabled={busy}
            aria-busy={pending === "github"}
            className="cta-ring group h-14 w-full rounded-lg bg-gradient-to-r from-secondary-container via-surface-container-high to-secondary-container p-px shadow-purple-glow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyan-glow-lg active:translate-y-0 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
          >
            <span className="flex h-full w-full items-center justify-center gap-space-sm rounded-[calc(0.5rem-1px)] bg-surface-container-lowest px-space-lg transition-colors group-hover:bg-surface-container-low">
              {pending === "github" ? (
                <Icon name="sync" className="h-5 w-5 shrink-0 animate-spin text-secondary" />
              ) : (
                <GitHubIcon className="h-5 w-5 shrink-0 text-on-surface" />
              )}
              <span className="font-headline-sm text-headline-sm tracking-tight text-primary">
                {pending === "github" ? busyLabel : "Connect with GitHub"}
              </span>
            </span>
          </button>
          <span className="mt-space-2xs flex items-center gap-space-3xs font-label-code-sm text-label-code-sm text-outline">
            <Icon name="sync_alt" className="text-[13px] text-secondary" />
            {githubCaption}
          </span>
        </div>
      </div>

      {failure ? (
        <div
          role="alert"
          className="flex items-start gap-space-xs rounded-lg border border-error/40 bg-error-container/20 p-space-sm text-left"
        >
          <Icon name="error" className="mt-0.5 shrink-0 text-[18px] text-error" />
          <div className="min-w-0 flex-1">
            <p className="font-label-code-md text-label-code-md font-semibold text-error">
              Couldn&apos;t start {PROVIDER_LABEL[failure.provider]} sign-in
            </p>
            <p className="mt-space-3xs font-label-code-sm text-label-code-sm text-on-surface-variant">
              {failure.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFailure(null)}
            aria-label="Dismiss sign-in error"
            className="shrink-0 rounded p-space-3xs text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
