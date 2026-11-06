import { authClient } from "@/lib/auth-client";

const GITHUB_API = "https://api.github.com";

export type GitHubViewer = {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  htmlUrl: string | null;
};

export type GitHubRepo = {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  defaultBranch: string;
  updatedAt: string;
  htmlUrl: string;
};

export type GitHubBranch = {
  name: string;
};

export type GitHubCommit = {
  sha: string;
  message: string;
  date: string | null;
  author: string | null;
};

type GitHubUserPayload = {
  login: string;
  name: string | null;
  avatar_url: string | null;
  html_url: string | null;
};

type GitHubRepoPayload = {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  default_branch: string;
  updated_at: string;
  html_url: string;
  owner: { login: string };
};

type GitHubBranchPayload = { name: string };

type GitHubCommitPayload = {
  sha: string;
  commit: {
    message: string;
    author: { name?: string; date?: string } | null;
  };
};

export class GitHubApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubFetch<T>(
  path: string,
  token: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: authHeaders(token),
    signal,
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = response.statusText;

    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) detail = body.message;
    } catch {
      /* GitHub returned a non-JSON error body. */
    }

    throw new GitHubApiError(response.status, detail);
  }

  return (await response.json()) as T;
}

function repoPath(fullName: string): string {
  const [owner, name] = fullName.split("/");
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

/**
 * Ask Better Auth (backend, :5000) for the decrypted GitHub OAuth token that is
 * stored on the signed-in user's account row.
 */
export async function fetchGitHubAccessToken(
  accountId: string,
): Promise<string> {
  const { data, error } = await authClient.getAccessToken({ accountId });

  if (error || !data?.accessToken) {
    throw new GitHubApiError(
      401,
      error?.message ??
        "GitHub access token is missing. Reconnect GitHub to continue.",
    );
  }

  return data.accessToken;
}

export async function fetchGitHubViewer(
  token: string,
  signal?: AbortSignal,
): Promise<GitHubViewer> {
  const payload = await githubFetch<GitHubUserPayload>("/user", token, signal);

  return {
    login: payload.login,
    name: payload.name,
    avatarUrl: payload.avatar_url,
    htmlUrl: payload.html_url,
  };
}

export async function fetchGitHubRepos(
  token: string,
  signal?: AbortSignal,
): Promise<GitHubRepo[]> {
  const payload = await githubFetch<GitHubRepoPayload[]>(
    "/user/repos?per_page=100&sort=updated&direction=desc&affiliation=owner,collaborator,organization_member",
    token,
    signal,
  );

  return payload.map((repo) => ({
    id: repo.id,
    fullName: repo.full_name,
    owner: repo.owner?.login ?? repo.full_name.split("/")[0],
    name: repo.name,
    isPrivate: repo.private,
    defaultBranch: repo.default_branch,
    updatedAt: repo.updated_at,
    htmlUrl: repo.html_url,
  }));
}

export async function fetchGitHubBranches(
  token: string,
  repoFullName: string,
  signal?: AbortSignal,
): Promise<GitHubBranch[]> {
  const all: GitHubBranch[] = [];
  for (let page = 1; page <= 5; page++) {
    const payload = await githubFetch<GitHubBranchPayload[]>(
      `${repoPath(repoFullName)}/branches?per_page=100&page=${page}`,
      token,
      signal,
    );
    all.push(...payload.map((b) => ({ name: b.name })));
    if (payload.length < 100) break;
  }
  return all;
}

export async function fetchLatestCommit(
  token: string,
  repoFullName: string,
  branch: string,
  signal?: AbortSignal,
): Promise<GitHubCommit | null> {
  const payload = await githubFetch<GitHubCommitPayload>(
    `${repoPath(repoFullName)}/commits/${encodeURIComponent(branch)}`,
    token,
    signal,
  );

  if (!payload?.sha) return null;

  return {
    sha: payload.sha,
    message: payload.commit.message.split("\n")[0],
    date: payload.commit.author?.date ?? null,
    author: payload.commit.author?.name ?? null,
  };
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "just now";

  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "just now";

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60_000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.round(months / 12)}y ago`;
}

export function describeGitHubError(error: unknown): string {
  if (error instanceof GitHubApiError) {
    if (error.status === 401) {
      return "Your GitHub token is no longer valid. Sign out and connect GitHub again.";
    }
    if (error.status === 403) {
      return "GitHub denied repository access. Reconnect GitHub and approve the repository scope.";
    }
    return `GitHub API error (${error.status}): ${error.message}`;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "Request cancelled.";
  }

  if (error instanceof Error) return error.message;

  return "Unable to reach GitHub.";
}
