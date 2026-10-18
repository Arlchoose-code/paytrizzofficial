import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_URL || "http://localhost:8080/api";

function patchCookieDomain(cookieStr: string, req: NextRequest): string {
  const hostHeader = req.headers.get("host") || "";
  const host = hostHeader.split(":")[0].toLowerCase();

  // Strip any existing backend Domain and SameSite attributes
  const clean = cookieStr.replace(/;\s*Domain=[^;]+/gi, "").replace(/;\s*SameSite=[^;]+/gi, "");

  if (host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1") {
    return `${clean}; Domain=.localhost; SameSite=Lax`;
  }

  const parts = host.split(".");
  if (parts.length >= 2) {
    const rootDomain = parts.slice(-2).join(".");
    return `${clean}; Domain=.${rootDomain}; SameSite=Lax`;
  }

  return `${clean}; SameSite=Lax`;
}


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  const targetUrl = `${BACKEND_URL}/auth/${endpoint}`;

  const body = await req.json().catch(() => ({}));
  const cookieHeader = req.headers.get("cookie") || "";

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
        "X-CSRF-Token": req.headers.get("X-CSRF-Token") || req.cookies.get("csrf_token")?.value || "",
        "User-Agent": req.headers.get("User-Agent") || "",
        "X-Forwarded-For": req.headers.get("X-Forwarded-For") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });

    // Forward Set-Cookie headers from Go backend with cross-subdomain domain
    const setCookies = res.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      setCookies.forEach((cookieStr) => {
        response.headers.append("Set-Cookie", patchCookieDomain(cookieStr, req));
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, message: `Failed to connect to backend: ${message}` },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  const targetUrl = `${BACKEND_URL}/auth/${endpoint}`;
  const cookieHeader = req.headers.get("cookie") || "";

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        Authorization: req.headers.get("Authorization") || "",
        "User-Agent": req.headers.get("User-Agent") || "",
      },
    });

    const data = await res.json();
    const response = NextResponse.json(data, { status: res.status });

    const setCookies = res.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      setCookies.forEach((cookieStr) => {
        response.headers.append("Set-Cookie", patchCookieDomain(cookieStr, req));
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { success: false, message: `Failed to connect to backend: ${message}` },
      { status: 502 }
    );
  }
}
