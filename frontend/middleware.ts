import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Detect subdomain webmail.* (e.g. webmail.paytrizz.com, webmail.localhost:3000)
  if (host.toLowerCase().startsWith("webmail.")) {
    if (pathname === "/" || pathname === "" || pathname === "/webmail") {
      const url = request.nextUrl.clone();
      url.pathname = "/webmail";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
