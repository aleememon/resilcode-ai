"use client";

import { cn } from "@/lib/cn";
import { GitHubIcon, GoogleIcon } from "./brand-icons";
import { Icon } from "./Icon";
import { authClient } from "@/lib/auth-client";

type AuthCtasProps = {
  className?: string;
  googleCaption?: string;
  githubCaption?: string;
};

/**
 * Dual authentication CTAs from the hero and final CTA sections.
 */
const signIn = (provider: "google" | "github") => {
  authClient.signIn.social({
    provider,
    callbackURL: "http://localhost:3000/code-ingestion",
    errorCallbackURL: "http://localhost:3000/?auth=cancelled"
  });
};

export function AuthCtas({
  className,
  googleCaption = "Upload local .zip archives",
  githubCaption = "Sync repositories & branches",
}: AuthCtasProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-2xl flex-col items-stretch justify-center gap-space-md sm:flex-row",
        className,
      )}
    >
      {/* Google CTA */}
      <div className="flex flex-1 flex-col items-center">
        <button
          type="button"
          onClick={() => signIn("google")}
          className="group cta-shadow flex h-14 w-full items-center justify-center gap-space-sm rounded-lg bg-surface-container-high px-space-lg text-on-surface transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-bright hover:shadow-cyan-glow active:translate-y-0"
        >
          <GoogleIcon className="h-5 w-5 shrink-0" />
          <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
            Continue with Google
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
          className="cta-ring group h-14 w-full rounded-lg bg-gradient-to-r from-secondary-container via-surface-container-high to-secondary-container p-px shadow-purple-glow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyan-glow-lg active:translate-y-0"
        >
          <span className="flex h-full w-full items-center justify-center gap-space-sm rounded-[calc(0.5rem-1px)] bg-surface-container-lowest px-space-lg transition-colors group-hover:bg-surface-container-low">
            <GitHubIcon className="h-5 w-5 shrink-0 text-on-surface" />
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary">
              Connect with GitHub
            </span>
          </span>
        </button>
        <span className="mt-space-2xs flex items-center gap-space-3xs font-label-code-sm text-label-code-sm text-outline">
          <Icon name="sync_alt" className="text-[13px] text-secondary" />
          {githubCaption}
        </span>
      </div>
    </div>
  );
}
