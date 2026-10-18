import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_URL || "http://localhost:8080/api";

function mergeCookies(oldCookieHeader: string, setCookieHeaders: string[]): string {
  const cookieMap = new Map<string, string>();
  oldCookieHeader.split(";").forEach((pair) => {
    const trimmed = pair.trim();
    if (!trimmed) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      cookieMap.set(trimmed.slice(0, eqIdx).trim(), trimmed.slice(eqIdx + 1).trim());
    }
  });

  setCookieHeaders.forEach((setCookieStr) => {
    const mainPart = setCookieStr.split(";")[0].trim();
    const eqIdx = mainPart.indexOf("=");
    if (eqIdx !== -1) {
      cookieMap.set(mainPart.slice(0, eqIdx).trim(), mainPart.slice(eqIdx + 1).trim());
    }
  });

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function patchProxyCookie(cookieStr: string, req: NextRequest): string {
  const host = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  // Strip any existing backend Domain and SameSite attributes
  const clean = cookieStr.replace(/;\s*Domain=[^;]+/gi, "").replace(/;\s*SameSite=[^;]+/gi, "");

  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return clean;
  }
  // On production, scope to root domain
  const parts = host.split(".");
  if (parts.length >= 2) {
    const rootDomain = parts.slice(-2).join(".");
    return `${clean}; Domain=.${rootDomain}; SameSite=Lax`;
  }
  return clean;
}


async function forwardRequest(req: NextRequest, pathParts: string[]) {
  const endpoint = pathParts.join("/");
  const url = new URL(req.url);
  const targetUrl = `${BACKEND_URL}/${endpoint}${url.search}`;
  const cookieHeader = req.headers.get("cookie") || "";

  const csrfToken = req.headers.get("X-CSRF-Token") || req.cookies.get("csrf_token")?.value || "";

  const headers: Record<string, string> = {
    Cookie: cookieHeader,
    Authorization: req.headers.get("Authorization") || "",
    "X-CSRF-Token": csrfToken,
    "User-Agent": req.headers.get("User-Agent") || "",
    "X-Forwarded-For": req.headers.get("X-Forwarded-For") || "",
  };

  const contentType = req.headers.get("Content-Type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const options: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      if (
        contentType &&
        (contentType.includes("multipart/form-data") ||
          contentType.includes("application/octet-stream") ||
          contentType.includes("image/") ||
          contentType.includes("application/pdf"))
      ) {
        const arrayBuf = await req.arrayBuffer();
        options.body = Buffer.from(arrayBuf);
        (options as Record<string, unknown>).duplex = "half";
      } else {
        const text = await req.text();
        if (text) {
          options.body = text;
        }
      }
    } catch {}
  }

  try {
    const res = await fetch(targetUrl, options);

    if (res.headers.get("content-type")?.includes("text/event-stream")) {
      return new Response(res.body, {
        status: res.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }
    // If unauthorized and we have a refresh_token cookie, attempt transparent token refresh & retry
    if (res.status === 401 && !targetUrl.includes("/auth/") && cookieHeader.includes("refresh_token=")) {
      try {
        const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader,
            "User-Agent": req.headers.get("User-Agent") || "",
          },
        });

        if (refreshRes.ok) {
          const refreshSetCookies = refreshRes.headers.getSetCookie();
          const mergedCookieHeader = mergeCookies(cookieHeader, refreshSetCookies);

          const retryHeaders = { ...headers, Cookie: mergedCookieHeader };
          const retryRes = await fetch(targetUrl, { ...options, headers: retryHeaders });
          const retryData = await retryRes.json().catch(() => null);
          const retryResponse = NextResponse.json(retryData, { status: retryRes.status });

          // Forward new auth cookies
          refreshSetCookies.forEach((cookieStr) => {
            retryResponse.headers.append("Set-Cookie", patchProxyCookie(cookieStr, req));
          });
          const retrySetCookies = retryRes.headers.getSetCookie();
          if (retrySetCookies && retrySetCookies.length > 0) {
            retrySetCookies.forEach((cookieStr) => {
              retryResponse.headers.append("Set-Cookie", patchProxyCookie(cookieStr, req));
            });
          }
          return retryResponse;
        }
      } catch {}
    }

    const respContentType = res.headers.get("content-type") || "";
    const contentDisposition = res.headers.get("content-disposition");
    if (
      contentDisposition ||
      respContentType.includes("application/octet-stream") ||
      respContentType.includes("application/pdf") ||
      respContentType.includes("image/") ||
      respContentType.includes("application/zip")
    ) {
      const arrayBuf = await res.arrayBuffer();
      const headers = new Headers();
      if (respContentType) headers.set("Content-Type", respContentType);
      if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
      const contentLength = res.headers.get("content-length");
      if (contentLength) headers.set("Content-Length", contentLength);
      return new Response(arrayBuf, {
        status: res.status,
        headers,
      });
    }

    const data = await res.json().catch(() => null);

    const response = NextResponse.json(data, { status: res.status });
    const setCookies = res.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      setCookies.forEach((cookieStr) => {
        response.headers.append("Set-Cookie", patchProxyCookie(cookieStr, req));
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forwardRequest(req, path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forwardRequest(req, path);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forwardRequest(req, path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forwardRequest(req, path);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return forwardRequest(req, path);
}
