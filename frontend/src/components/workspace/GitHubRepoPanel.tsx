"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import {
  describeGitHubError,
  fetchGitHubAccessToken,
  fetchGitHubBranches,
  fetchGitHubRepos,
  fetchGitHubViewer,
  fetchLatestCommit,
  formatRelativeTime,
  type GitHubBranch,
  type GitHubCommit,
  type GitHubRepo,
} from "@/lib/github";
import { BranchPicker } from "./BranchPicker";
import { importRepo, type ScanResult } from "@/lib/scans";

type GitHubRepoPanelProps = {
  /** `id` of the user's GitHub row in Better Auth's `account` table. */
  accountId: string | null;
  /** Receives the authenticated GitHub login so the header can show it. */
  onViewerLoaded?: (login: string | null) => void;
};

type Status = "loading" | "ready" | "error";

export function GitHubRepoPanel({
  accountId,
  onViewerLoaded,
}: GitHubRepoPanelProps) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [query, setQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [branch, setBranch] = useState<string | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);

  const [commit, setCommit] = useState<GitHubCommit | null>(null);
  const [importStatus, setImportStatus] = useState<
    "idle" | "importing" | "done"
  >("idle");
  const [importResult, setImportResult] = useState<ScanResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const resetImport = () => {
    setImportStatus("idle");
    setImportResult(null);
    setImportError(null);
  };

  // 1. Token -> viewer + repository list.
  useEffect(() => {
    if (!accountId) return;

    const controller = new AbortController();
    let active = true;

    setStatus("loading");
    setErrorMessage(null);
    setImportStatus("idle");
    setImportResult(null);
    setImportError(null);

    (async () => {
      try {
        const accessToken = await fetchGitHubAccessToken(accountId);
        if (!active) return;
        setToken(accessToken);

        const [viewer, repositoryList] = await Promise.all([
          fetchGitHubViewer(accessToken, controller.signal),
          fetchGitHubRepos(accessToken, controller.signal),
        ]);
        if (!active) return;

        onViewerLoaded?.(viewer.login);
        setRepos(repositoryList);
        setSelectedRepo(repositoryList[0]?.fullName ?? null);
        setStatus("ready");
      } catch (error) {
        if (!active) return;
        setStatus("error");
        setErrorMessage(describeGitHubError(error));
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [accountId, refreshKey, onViewerLoaded]);

  // 2. Branches for the selected repository.
  useEffect(() => {
    if (!token || !selectedRepo) return;

    const controller = new AbortController();
    let active = true;
    const repo = repos.find((item) => item.fullName === selectedRepo);

    setBranchesLoading(true);
    setBranches([]);
    setBranch(repo?.defaultBranch ?? null);
    setBranchError(null);
    setCommit(null);
    setImportStatus("idle");
    setImportResult(null);
    setImportError(null);

    (async () => {
      try {
        const list = await fetchGitHubBranches(
          token,
          selectedRepo,
          controller.signal,
        );
        if (!active) return;

        setBranches(list);
        setBranch((current) => {
          if (current && list.some((item) => item.name === current))
            return current;
          if (
            repo?.defaultBranch &&
            list.some((item) => item.name === repo.defaultBranch)
          ) {
            return repo.defaultBranch;
          }
          return list[0]?.name ?? null;
        });
      } catch (error) {
        if (!active) return;
        setBranchError(describeGitHubError(error));
      } finally {
        if (active) setBranchesLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, selectedRepo, repos]);

  // 3. Latest commit on the selected branch.
  useEffect(() => {
    if (!token || !selectedRepo || !branch) {
      setCommit(null);
      return;
    }

    const controller = new AbortController();
    let active = true;

    (async () => {
      try {
        const latest = await fetchLatestCommit(
          token,
          selectedRepo,
          branch,
          controller.signal,
        );
        if (active) setCommit(latest);
      } catch {
        if (active) setCommit(null);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, selectedRepo, branch]);

  const activeRepo = useMemo(
    () => repos.find((repo) => repo.fullName === selectedRepo) ?? null,
    [repos, selectedRepo],
  );

  const filteredRepos = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return repos;
    return repos.filter(
      (repo) =>
        repo.fullName.toLowerCase().includes(needle) ||
        repo.owner.toLowerCase().includes(needle),
    );
  }, [repos, query]);

  const canScan =
    status === "ready" &&
    Boolean(selectedRepo) &&
    Boolean(branch) &&
    importStatus === "idle";

  const startImport = async () => {
    if (!selectedRepo || !branch || importStatus !== "idle") return;
    setImportError(null);
    setImportStatus("importing");
    try {
      const data = await importRepo(selectedRepo, branch);
      setImportResult(data);
      setImportStatus("done");
    } catch (error) {
      setImportStatus("idle");
      setImportError(
        error instanceof Error
          ? error.message
          : "Import failed. Please try again.",
      );
    }
  };

  return (
    <section
      aria-labelledby="github-import-title"
      className="group relative flex flex-col justify-between rounded-xl bg-surface-container/80 p-space-lg shadow-xl backdrop-blur-xl"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-full bg-gradient-to-r from-transparent via-secondary-container to-transparent opacity-80 transition-opacity group-hover:opacity-100"
      />

      <div>
        <div className="mb-space-lg flex flex-wrap items-start justify-between gap-space-sm">
          <div className="flex min-w-0 items-center gap-space-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-secondary-fixed shadow-[0_0_12px_rgba(112,0,255,0.2)]">
              <Icon name="hub" className="text-[22px]" />
            </div>
            <div className="min-w-0">
              <h2
                id="github-import-title"
                className="font-headline-sm text-headline-sm font-semibold text-on-surface"
              >
                Import GitHub Repository
              </h2>
              <p className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                Automated remote branch synchronization
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-lg bg-surface-container-highest px-space-xs py-space-3xs font-label-code-sm text-label-code-sm font-medium text-secondary-fixed">
            Continuous Sync
          </span>
        </div>

        <div className="space-y-space-md">
          <div>
            <div className="mb-space-2xs flex items-center justify-between gap-space-sm">
              <label
                htmlFor="repo-search"
                className="font-label-code-sm text-label-code-sm font-semibold tracking-wider text-outline"
              >
                SELECT REPOSITORY
              </label>
              <button
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                disabled={status === "loading"}
                className="flex items-center gap-space-3xs font-label-code-sm text-label-code-sm text-secondary-fixed transition-opacity hover:underline disabled:opacity-60"
              >
                <Icon
                  name="sync"
                  className={cn(
                    "text-[14px]",
                    status === "loading" && "animate-spin",
                  )}
                />
                {status === "loading" ? "Refreshing..." : "Refresh repos"}
              </button>
            </div>

            <div className="flex flex-col gap-space-2xs rounded-lg bg-surface-container-lowest/80 p-space-xs">
              <div className="relative">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-space-xs top-1/2 -translate-y-1/2 text-[18px] text-outline"
                />
                <input
                  id="repo-search"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search repositories..."
                  disabled={status !== "ready"}
                  className="w-full rounded bg-surface-container-low py-space-2xs pl-8 pr-space-xs font-label-code-md text-label-code-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary-container disabled:opacity-60"
                />
              </div>

              <div className="mt-space-3xs flex max-h-56 flex-col gap-space-3xs overflow-y-auto">
                {status === "loading" ? (
                  <div
                    className="flex flex-col gap-space-3xs"
                    aria-hidden="true"
                  >
                    {[0, 1, 2].map((row) => (
                      <div
                        key={row}
                        className="h-9 animate-pulse rounded bg-surface-container-high/60"
                      />
                    ))}
                  </div>
                ) : null}

                {status === "error" ? (
                  <div
                    role="alert"
                    className="flex flex-col items-start gap-space-2xs rounded-lg bg-error-container/20 p-space-sm text-on-surface"
                  >
                    <div className="flex items-center gap-space-xs font-label-code-md text-label-code-md font-semibold text-error">
                      <Icon name="error" className="text-[18px]" />
                      <span>Repository access failed</span>
                    </div>
                    <p className="font-label-code-sm text-label-code-sm text-on-surface-variant">
                      {errorMessage}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRefreshKey((key) => key + 1)}
                      className="mt-space-3xs rounded bg-surface-container-high px-space-sm py-space-3xs font-label-code-sm text-label-code-sm text-primary transition-colors hover:bg-surface-container-highest"
                    >
                      Try again
                    </button>
                  </div>
                ) : null}

                {status === "ready" && filteredRepos.length === 0 ? (
                  <p className="p-space-xs text-center font-label-code-sm text-label-code-sm text-outline">
                    {repos.length === 0
                      ? "No repositories available for this GitHub account."
                      : `No repositories match “${query}”`}
                  </p>
                ) : null}

                {status === "ready"
                  ? filteredRepos.map((repo) => {
                      const selected = repo.fullName === selectedRepo;

                      return (
                        <button
                          key={repo.id}
                          type="button"
                          onClick={() => {
                            setSelectedRepo(repo.fullName);
                            resetImport();
                          }}
                          aria-pressed={selected}
                          className={cn(
                            "flex items-center justify-between gap-space-xs rounded p-space-xs text-left transition-colors",
                            selected
                              ? "bg-secondary-container/20 text-on-surface shadow-sm"
                              : "text-on-surface-variant hover:bg-surface-container-high",
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-space-xs">
                            <Icon
                              name={repo.isPrivate ? "lock" : "public"}
                              className={cn(
                                "text-[18px]",
                                selected
                                  ? "text-secondary-fixed"
                                  : "text-outline",
                              )}
                            />
                            <span
                              className={cn(
                                "truncate font-label-code-md text-label-code-md",
                                selected && "font-semibold",
                              )}
                            >
                              {repo.fullName}
                            </span>
                          </span>
                          <span className="shrink-0 font-label-code-sm text-label-code-sm text-on-surface-variant">
                            Updated {formatRelativeTime(repo.updatedAt)}
                          </span>
                        </button>
                      );
                    })
                  : null}
              </div>
            </div>
          </div>

          <div>
            <span
              id="branch-label"
              className="mb-space-2xs block font-label-code-sm text-label-code-sm font-semibold tracking-wider text-outline"
            >
              TARGET BRANCH
            </span>

            {branchesLoading ? (
              <div className="grid grid-cols-3 gap-space-xs" aria-hidden="true">
                {[0, 1, 2].map((cell) => (
                  <div
                    key={cell}
                    className="h-9 animate-pulse rounded-lg bg-surface-container-lowest/60"
                  />
                ))}
              </div>
            ) : null}

            {!branchesLoading && branchError ? (
              <p className="font-label-code-sm text-label-code-sm text-error">
                {branchError}
              </p>
            ) : null}

            {!branchesLoading && !branchError ? (
              <BranchPicker
                branches={branches}
                value={branch}
                defaultBranch={activeRepo?.defaultBranch}
                onChange={(name) => {
                  setBranch(name);
                  resetImport();
                }}
              />
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-space-sm rounded-lg bg-surface-container-lowest/60 p-space-sm text-on-surface-variant">
            <div className="flex min-w-0 items-center gap-space-xs">
              <Icon
                name="commit"
                className="shrink-0 text-[18px] text-secondary-fixed"
              />
              <div className="min-w-0 truncate font-label-code-sm text-label-code-sm">
                {commit ? (
                  <>
                    <span className="font-semibold text-secondary-fixed">
                      {commit.sha.slice(0, 7)}
                    </span>
                    <span className="ml-space-3xs text-on-surface-variant">
                      {commit.message}
                    </span>
                  </>
                ) : (
                  <span className="text-outline">
                    {selectedRepo && branch
                      ? "Loading latest commit…"
                      : "No branch selected"}
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 font-label-code-sm text-label-code-sm text-outline">
              {commit?.date
                ? `Committed ${formatRelativeTime(commit.date)}`
                : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-space-xl">
        <button
          type="button"
          disabled={!canScan}
          aria-busy={importStatus === "importing"}
          onClick={startImport}
          className="flex w-full items-center justify-center gap-space-xs rounded-lg bg-gradient-to-r from-secondary-container to-on-secondary-fixed-variant px-space-lg py-space-sm font-headline-sm text-headline-sm font-bold text-white shadow-[0_0_20px_rgba(112,0,255,0.3)] transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon
            name={
              importStatus === "done"
                ? "check_circle"
                : importStatus === "importing"
                  ? "sync"
                  : "auto_fix_high"
            }
            className={cn(
              "text-[20px]",
              importStatus === "importing" && "animate-spin",
            )}
          />
          <span>
            {importStatus === "importing"
              ? "Importing…"
              : importStatus === "done"
                ? "Import Complete"
                : "Import & Scan Branch"}
          </span>
        </button>

        {importError ? (
          <div
            role="alert"
            className="mt-space-xs flex items-center gap-space-xs rounded-lg bg-error-container/20 p-space-sm font-label-code-sm text-label-code-sm text-error"
          >
            <Icon name="error" className="text-[18px]" />
            <span>{importError}</span>
          </div>
        ) : null}

        {importStatus === "done" && importResult ? (
          <p className="mt-space-2xs text-center font-label-code-sm text-label-code-sm text-tertiary-container">
            {importResult.fileCount.toLocaleString()}{" "}
            {importResult.fileCount === 1 ? "file" : "files"} ingested ·{" "}
            {importResult.skipped.toLocaleString()} skipped
          </p>
        ) : null}
      </div>
    </section>
  );
}
