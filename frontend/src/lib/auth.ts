export type AuthProvider = "google" | "github";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * Shape returned by Better Auth's `GET /list-accounts` endpoint.
 * One row per linked OAuth provider for the signed-in user.
 */
export type LinkedAccount = {
  id: string;
  providerId: string;
  accountId?: string;
  userId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  scopes?: string[];
};

const PROVIDER_LABEL: Record<AuthProvider, string> = {
  google: "Signed in with Google",
  github: "Signed in with GitHub",
};

export function normalizeProvider(value: unknown): AuthProvider | null {
  return value === "google" || value === "github" ? value : null;
}

export function providerLabel(provider: AuthProvider): string {
  return PROVIDER_LABEL[provider];
}

function accountTime(account: LinkedAccount): number {
  const raw = account.updatedAt ?? account.createdAt;
  const time = raw ? new Date(raw).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : 0;
}

/**
 * Resolve which provider the current session was created with.
 *
 * Better Auth refreshes the matching `account` row on every social sign-in
 * (`account.updateAccountOnSignIn`), so the most recently updated supported
 * account is the provider the user just logged in with. Users who linked both
 * Google and GitHub therefore get the panel for the one they actually used.
 */
export function pickLoginProvider(
  accounts: readonly LinkedAccount[] | null | undefined,
): AuthProvider | null {
  if (!accounts?.length) return null;

  const supported = accounts.filter((account) => normalizeProvider(account.providerId));
  if (!supported.length) return null;

  const [mostRecent] = [...supported].sort((a, b) => accountTime(b) - accountTime(a));
  return normalizeProvider(mostRecent.providerId);
}

export function findAccount(
  accounts: readonly LinkedAccount[],
  provider: AuthProvider,
): LinkedAccount | null {
  return accounts.find((account) => account.providerId === provider) ?? null;
}

export function displayName(user: SessionUser | null): string {
  if (!user) return "Account";
  if (user.name?.trim()) return user.name.trim();
  if (user.email) return user.email.split("@")[0];
  return "Account";
}
