import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/services/auth/session-cookie";
import { peekSessionRoleFromCookieValue } from "@/services/auth/session-token";

/** Canonical apex — follows NEXT_PUBLIC_APP_URL so cutover is safe before DNS flips. */
function resolveApexHost(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).hostname.replace(/^www\./, "");
    } catch {
      /* fall through */
    }
  }
  return "sooqnauae.com";
}

const LEGACY_HOSTS = new Set(["sooqna.site", "www.sooqna.site"]);

function readSessionRole(request: NextRequest): string | null {
  const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return peekSessionRoleFromCookieValue(raw);
}

function redirectToLogin(request: NextRequest, nextPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(nextPath)}`;
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const hostHeader = request.headers.get("host") ?? "";
  const host = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  const apexHost = resolveApexHost();
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isProduction = process.env.NODE_ENV === "production";
  const { pathname } = request.nextUrl;

  if (
    isProduction &&
    host !== apexHost &&
    (host.startsWith("www.") || LEGACY_HOSTS.has(host))
  ) {
    const url = request.nextUrl.clone();
    url.hostname = apexHost;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (isProduction && forwardedProto === "http") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // Admin requires an admin session immediately.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const role = readSessionRole(request);
    if (role !== "admin") {
      return redirectToLogin(request, `${pathname}${request.nextUrl.search}`);
    }
  }

  const response = NextResponse.next();

  if (isProduction) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|brand/).*)",
  ],
};
