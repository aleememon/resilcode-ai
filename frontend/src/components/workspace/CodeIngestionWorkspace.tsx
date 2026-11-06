"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { findAccount } from "@/lib/auth";
import { GitHubRepoPanel } from "./GitHubRepoPanel";
import { LocalUploadPanel } from "./LocalUploadPanel";
import { WorkspaceFooter } from "./WorkspaceFooter";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { cn } from "@/lib/cn";

function PanelSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="relative flex min-h-[480px] animate-pulse flex-col justify-between rounded-xl bg-surface-container/60 p-space-lg shadow-xl"
    >
      <div>
        <div className="mb-space-lg flex items-center gap-space-sm">
          <div className="h-10 w-10 rounded-lg bg-surface-container-high" />
          <div className="flex flex-col gap-space-3xs">
            <div className="h-4 w-48 rounded bg-surface-container-high" />
            <div className="h-3 w-32 rounded bg-surface-container-high/60" />
          </div>
        </div>
        <div className="h-40 rounded-lg bg-surface-container-lowest/70" />
      </div>
      <div className="h-12 rounded-lg bg-surface-container-high" />
    </div>
  );
}

function SessionGate({
  title,
  description,
  email,
}: {
  title: string;
  description: string;
  email?: string | null;
}) {
  return (
    <section className="relative flex flex-col items-center rounded-xl bg-surface-container/80 p-space-xl text-center shadow-xl backdrop-blur-xl">
      <div className="mb-space-sm flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low text-primary-container">
        <Icon name="link_off" className="text-[26px]" />
      </div>
      <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
        {title}
      </h2>
      <p className="mt-space-2xs max-w-sm font-body-md text-body-md text-on-surface-variant">
        {description}
      </p>
      {email ? (
        <p className="mt-space-xs font-label-code-sm text-label-code-sm text-outline">
          {email}
        </p>
      ) : null}
      <Link
        href="/"
        className="mt-space-lg flex items-center gap-space-xs rounded-lg bg-surface-container-high px-space-md py-space-xs font-label-code-md text-label-code-md font-medium text-primary transition-colors hover:bg-surface-container-highest"
      >
        <Icon name="arrow_back" className="text-[16px]" />
        <span>Back to sign in</span>
      </Link>
    </section>
  );
}

type Tab = "github" | "upload";

function IngestionTabs({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (tab: Tab) => void;
}) {
  const tabs = [
    { id: "github", label: "Import GitHub Repository", icon: "hub" },
    { id: "upload", label: "Upload Local Project", icon: "folder_zip" },
  ] as const;

  return (
    <div
      role="tablist"
      className="mb-space-md grid grid-cols-2 gap-space-3xs rounded-lg bg-surface-container/80 p-space-3xs"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center justify-center gap-space-xs rounded-md px-space-sm py-space-xs font-label-code-md text-label-code-md transition-colors",
            value === tab.id
              ? "bg-surface-container-high font-semibold text-primary"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          <Icon name={tab.icon} className="text-[18px]" />
          <span className="truncate">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export function CodeIngestionWorkspace() {
  const router = useRouter();
  const identity = useAuthIdentity();
  const [gitHubLogin, setGitHubLogin] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("github");

  const handleViewerLoaded = useCallback((login: string | null) => {
    setGitHubLogin(login);
  }, []);

  useEffect(() => {
    if (identity.status === "anonymous") {
      router.replace("/?auth=required");
    }
  }, [identity.status, router]);

  const githubAccount = findAccount(identity.accounts, "github");
  const provider = identity.provider;

  return (
    <div className="flex min-h-screen flex-col bg-surface-container-lowest">
      <WorkspaceHeader
        status={identity.status}
        provider={provider}
        user={identity.user}
        viewerLogin={provider === "github" ? gitHubLogin : null}
      />

      <main className="relative w-full flex-1 overflow-hidden pt-16">
        <div
          aria-hidden="true"
          data-glow
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-container/10 blur-[120px]"
        />
        <div
          aria-hidden="true"
          data-glow
          className="pointer-events-none absolute right-0 top-1/4 h-80 w-80 rounded-full bg-secondary-container/10 blur-[140px]"
        />

        <div className="relative mx-auto w-full max-w-content px-margin-mobile py-space-xl sm:px-margin-tablet lg:px-margin-desktop lg:py-space-2xl">
          <div className="mb-space-2xl flex flex-col gap-space-xs">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-xs font-label-code-sm text-label-code-sm text-on-surface-variant">
                <span className="cursor-pointer text-outline transition-colors hover:text-on-surface">
                  Workspace
                </span>
                <span className="text-outline">/</span>
                <span className="font-semibold text-primary">New Scan</span>
              </div>

              <div className="flex items-center gap-space-xs rounded-full bg-surface-container/80 px-space-sm py-space-3xs shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary-container opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-tertiary-container shadow-[0_0_6px_rgba(0,249,130,0.8)]" />
                </span>
                <span className="font-label-code-sm text-label-code-sm text-on-surface">
                  Ready to ingest
                </span>
              </div>
            </div>

            <div className="mt-space-xs">
              <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
                Select Source Code for Security Audit
              </h1>
              <p className="mt-space-2xs max-w-2xl font-body-md text-body-md text-on-surface-variant">
                Upload a standalone project archive or connect your cloud
                repository to initiate AST vulnerability scanning.
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl">
            {identity.status === "loading" ? <PanelSkeleton /> : null}

            {identity.status === "anonymous" ? (
              <SessionGate
                title="Session required"
                description="Redirecting you to sign in. Choose Google to upload local code or GitHub to import a repository."
              />
            ) : null}

            {identity.status === "unsupported" ? (
              <SessionGate
                title="No supported login method"
                description="This session isn't linked to Google or GitHub, so there is no ingestion channel to open. Sign in with one of those providers to continue."
                email={identity.user?.email}
              />
            ) : null}

            {identity.status === "ready" && provider === "google" ? (
              <>
                <LocalUploadPanel />
                <p className="mt-space-sm text-center font-label-code-sm text-label-code-sm text-outline">
                  Want to import repositories or open Pull Requests? Sign in
                  with GitHub.
                </p>
              </>
            ) : null}

            {identity.status === "ready" && provider === "github" ? (
              <>
                <IngestionTabs value={tab} onChange={setTab} />
                {/* Both stay mounted so switching tabs doesn't reload your repositories. */}
                <div className={tab === "github" ? "" : "hidden"}>
                  <GitHubRepoPanel
                    accountId={githubAccount?.id ?? null}
                    onViewerLoaded={handleViewerLoaded}
                  />
                </div>
                <div className={tab === "upload" ? "" : "hidden"}>
                  <LocalUploadPanel />
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-space-2xl flex flex-col items-center justify-between gap-space-sm pt-space-md font-label-code-sm text-label-code-sm text-on-surface-variant sm:flex-row">
            <div className="flex items-center gap-space-xs text-center sm:text-left">
              <Icon
                name="verified_user"
                className="shrink-0 text-[16px] text-tertiary-container"
              />
              <span>
                Files are processed in an isolated temporary directory and
                deleted after the scan.
              </span>
            </div>
          </div>
        </div>
      </main>

      <WorkspaceFooter />
    </div>
  );
}
