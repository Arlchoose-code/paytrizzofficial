/**
 * Subdomain routing helper for PayTrizz Webmail and Workspace.
 * Ensures seamless transitions between main portal and webmail subdomain.
 */

export function getWebmailSubdomainUrl(): string {
  if (typeof window === "undefined") {
    return "/webmail";
  }

  // If explicitly configured via environment variable
  if (process.env.NEXT_PUBLIC_WEBMAIL_URL) {
    return process.env.NEXT_PUBLIC_WEBMAIL_URL;
  }

  const host = window.location.host;
  const protocol = window.location.protocol;
  const cleanHost = host.split(":")[0];
  const port = window.location.port ? `:${window.location.port}` : "";

  // Local development: webmail.localhost:3000
  if (cleanHost === "localhost" || cleanHost.endsWith(".localhost") || cleanHost === "127.0.0.1") {
    return `${protocol}//webmail.localhost${port}/`;
  }

  // Production / staging: webmail.<root-domain>
  const parts = cleanHost.split(".");
  if (parts.length >= 2) {
    const rootDomain = parts.slice(-2).join(".");
    return `${protocol}//webmail.${rootDomain}${port}/`;
  }

  return "/webmail";
}

export function getMainAppUrl(path = ""): string {
  if (typeof window === "undefined") {
    return path;
  }

  const origin = window.location.origin;
  // If on webmail.* subdomain, strip it to point back to root/main portal
  const mainOrigin = origin
    .replace(/^http:\/\/webmail\./, "http://")
    .replace(/^https:\/\/webmail\./, "https://");

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${mainOrigin}${cleanPath}`;
}

export async function navigateToWebmail() {
  if (typeof window === "undefined") return;

  try {
    const res = await fetch("/api/proxy/auth/sso/ticket", { method: "POST" });
    const json = await res.json();
    const targetSubdomain = getWebmailSubdomainUrl();
    if (json?.data?.ticket) {
      const sep = targetSubdomain.includes("?") ? "&" : "?";
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `${targetSubdomain}${sep}ticket=${encodeURIComponent(json.data.ticket)}`;
      return;
    }
  } catch {}

  window.location.href = getWebmailSubdomainUrl();
}
