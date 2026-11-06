/**
 * Browser origins allowed to talk to the auth server.
 *
 * `FRONTEND_URL` accepts a comma-separated list. In development the
 * localhost/127.0.0.1 twins are both allowed, because browsers treat them as
 * different origins (and `Invalid callbackURL` is a confusing failure).
 */
export function getTrustedOrigins(): string[] {
  const configured = (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origins = new Set(configured);

  if (process.env.NODE_ENV !== "production") {
    for (const origin of configured) {
      try {
        const url = new URL(origin);
        if (url.hostname === "localhost") {
          origins.add(origin.replace("//localhost", "//127.0.0.1"));
        } else if (url.hostname === "127.0.0.1") {
          origins.add(origin.replace("//127.0.0.1", "//localhost"));
        }
      } catch {
        /* Ignore malformed entries instead of crashing auth boot. */
      }
    }
  }

  return [...origins];
}
