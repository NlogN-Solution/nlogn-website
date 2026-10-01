import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/config/session";

/**
 * Bounces anonymous traffic away from /admin before it reaches a page.
 *
 * Named `proxy` rather than `middleware`: Next 16 deprecated the middleware
 * file convention in favour of this one.
 *
 * This is a fast cookie-presence check, not authentication: the cookie's
 * validity is proven against the database in the admin layout, which is where
 * the real gate lives. Doing it here as well just avoids rendering a dashboard
 * shell for someone who was never going to see it.
 *
 * The matcher is scoped to /admin so public pages skip the proxy entirely and
 * stay statically prerendered.
 */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  if (!request.cookies.get(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
