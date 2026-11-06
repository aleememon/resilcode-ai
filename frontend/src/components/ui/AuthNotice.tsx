"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type Notice = {
  tone: "info" | "error";
  title: string;
  body: string;
};

const ERROR_COPY: Record<string, string> = {
  access_denied:
    "The provider reported that access was denied. Click the sign-in button again and approve the requested permissions.",
  state_mismatch:
    "The sign-in request expired or came back from a different browser tab. Close any extra sign-in tabs and try again.",
  please_restart_the_process:
    "The sign-in request expired. Close any extra sign-in tabs and try again.",
  invalid_code:
    "The provider rejected the authorization code. Try signing in again.",
  invalid_grant:
    "The provider rejected the authorization code. Try signing in again.",
  email_not_found:
    "The provider didn't share an email address, so no account could be created. Use a provider account with a verified email.",
  account_not_linked:
    "That email already belongs to an account created with a different sign-in method. Sign in the way you originally did, then link this provider from your account settings.",
  signup_disabled:
    "New sign-ups are disabled on this server. Try an account that already exists.",
  unable_to_create_user:
    "The server couldn't create your account. Check the backend logs and try again.",
  redirect_uri_mismatch:
    "The provider rejected the callback URL. Register the exact callback URL shown below in the provider's OAuth app settings, then try again.",
  invalid_callback_url:
    "The auth server rejected this site's origin. Add it to FRONTEND_URL in backend/.env and restart the backend.",
  internal_server_error:
    "The auth server hit an unexpected error. Check the backend terminal for details.",
};

function describeError(code: string | null): string {
  if (!code) {
    return "The sign-in flow didn't finish. Try again, and check the backend terminal if it keeps happening.";
  }

  const normalized = code.toLowerCase();
  return (
    ERROR_COPY[normalized] ??
    `Sign-in failed with “${code}”. Try again, and check the backend terminal if it keeps happening.`
  );
}

/**
 * Better Auth stores its session cookie on the API host. If the page runs on
 * `127.0.0.1` while the API is on `localhost` the cookie lands on a different
 * host, so the OAuth flow "succeeds" and then the app looks signed out again.
 */
function loopbackHostHint(): string | null {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  try {
    const api = new URL(apiUrl);
    const loops = new Set(["localhost", "127.0.0.1"]);
    const pageHost = window.location.hostname;

    if (loops.has(api.hostname) && loops.has(pageHost) && api.hostname !== pageHost) {
      const suggested = `http://${api.hostname}${window.location.port ? `:${window.location.port}` : ""}${window.location.pathname}`;
      return `You're on ${pageHost} but the auth server is on ${api.hostname}. Sessions are stored per host, so sign-in won't stick. Open ${suggested} instead.`;
    }
  } catch {
    /* Ignore a malformed NEXT_PUBLIC_API_URL. */
  }

  return null;
}

function resolveNotice(params: URLSearchParams): Notice | null {
  const auth = params.get("auth");
  const error = params.get("error");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
  const callbacks = `GitHub: ${apiUrl}/api/auth/callback/github · Google: ${apiUrl}/api/auth/callback/google`;

  if (auth === "required") {
    const hint = loopbackHostHint();

    return {
      tone: hint ? "error" : "info",
      title: hint ? "Session didn't stick" : "Sign in to open the workspace",
      body:
        hint ??
        "Use Google to upload a local project archive, or GitHub to import a repository and branch.",
    };
  }

  if (auth === "cancelled") {
    return {
      tone: "info",
      title: "Sign-in cancelled",
      body: `${describeError(error)} You can pick a provider again below.`,
    };
  }

  if (auth === "error" || error) {
    const isCallbackProblem =
      error === "redirect_uri_mismatch" || error === "invalid_callback_url";

    return {
      tone: "error",
      title: "Sign-in couldn't be completed",
      body: isCallbackProblem
        ? `${describeError(error)} Registered callbacks today: ${callbacks}.`
        : describeError(error),
    };
  }

  return null;
}

/**
 * Shows the reason Better Auth sent the user back to the landing page
 * (`?auth=required|error|cancelled` plus an optional `?error=<code>`), then
 * strips those params so the banner doesn't come back on refresh.
 */
export function AuthNotice() {
  const router = useRouter();
  const params = useSearchParams();
  const [notice, setNotice] = useState<Notice | null>(null);

  const search = params.toString();

  useEffect(() => {
    // After `router.replace` strips the params, keep the banner that was
    // already resolved instead of clearing it.
    if (!search) return;

    setNotice(resolveNotice(new URLSearchParams(search)));
    router.replace("/", { scroll: false });
    // Only re-run when the query string itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, router]);

  if (!notice) return null;

  const dismiss = () => setNotice(null);

  return (
    <div className="page-container pt-space-lg">
      <div
        role={notice.tone === "error" ? "alert" : "status"}
        className={cn(
          "mx-auto flex w-full max-w-3xl items-start gap-space-sm rounded-lg border p-space-sm shadow-sm backdrop-blur-md",
          notice.tone === "error"
            ? "border-error/40 bg-error-container/20"
            : "border-primary-container/30 bg-surface-container-low",
        )}
      >
        <Icon
          name={notice.tone === "error" ? "error" : "info"}
          className={cn(
            "mt-0.5 shrink-0 text-[20px]",
            notice.tone === "error" ? "text-error" : "text-primary",
          )}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-label-code-md text-label-code-md font-semibold",
              notice.tone === "error" ? "text-error" : "text-on-surface",
            )}
          >
            {notice.title}
          </p>
          <p className="mt-space-3xs font-body-sm text-body-sm text-on-surface-variant">
            {notice.body}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss sign-in notice"
          className="shrink-0 rounded p-space-3xs text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <Icon name="close" className="text-[18px]" />
        </button>
      </div>
    </div>
  );
}
