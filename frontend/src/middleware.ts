import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(req: NextRequest) {
  if (!getSessionCookie(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/code-ingestion/:path*", "/security-audit/:path*", "/scan/:path*"],
};
