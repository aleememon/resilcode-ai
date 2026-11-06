"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  pickLoginProvider,
  type AuthProvider,
  type LinkedAccount,
  type SessionUser,
} from "@/lib/auth";

export type AuthIdentityStatus = "loading" | "anonymous" | "ready" | "unsupported";

export type AuthIdentity = {
  status: AuthIdentityStatus;
  provider: AuthProvider | null;
  user: SessionUser | null;
  accounts: LinkedAccount[];
  error: string | null;
};

const LOADING: AuthIdentity = {
  status: "loading",
  provider: null,
  user: null,
  accounts: [],
  error: null,
};

/**
 * Reads the Better Auth session, then the linked OAuth accounts from the
 * database, to decide which ingestion panel the user is allowed to see.
 */
export function useAuthIdentity(): AuthIdentity {
  const { data: session, isPending, error: sessionError } = authClient.useSession();
  const user = (session?.user ?? null) as SessionUser | null;
  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setAccounts(null);
      setAccountsError(null);
      return;
    }

    let cancelled = false;
    setAccounts(null);

    (async () => {
      const { data, error } = await authClient.listAccounts();

      if (cancelled) return;

      if (error) {
        setAccountsError(error.message ?? "Unable to read linked accounts");
        setAccounts([]);
        return;
      }

      setAccounts((data ?? []) as LinkedAccount[]);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (isPending || (user && accounts === null)) {
    return LOADING;
  }

  if (!user) {
    return {
      status: "anonymous",
      provider: null,
      user: null,
      accounts: [],
      error: sessionError?.message ?? null,
    };
  }

  const provider = pickLoginProvider(accounts);

  return {
    status: provider ? "ready" : "unsupported",
    provider,
    user,
    accounts: accounts ?? [],
    error: accountsError,
  };
}
