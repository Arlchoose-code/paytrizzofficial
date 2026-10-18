import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings";

export interface SEOSettingData {
  id?: number;
  page_key?: string;
  title?: string;
  description?: string;
  og_media_id?: number | null;
  og_media?: {
    path_original?: string;
    path_large?: string;
    path_medium?: string;
  } | null;
  robots_index?: boolean;
}

export async function getPublicSEO(pageKey: string): Promise<SEOSettingData | null> {
  const isServer = typeof window === "undefined";
  const apiBase = isServer
    ? (process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/+$/, "")
    : "/api/proxy";

  try {
    const res = await fetch(`${apiBase}/seo/${pageKey}`, { cache: "no-store" }).catch(() => null);
    if (res && res.ok) {
      const json = await res.json();
      if (json && json.data) {
        return json.data as SEOSettingData;
      }
    }
  } catch {}
  return null;
}

export interface SeoOptions {
  path: string;
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  pageKey?: string;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strips brand suffixes like " — PayTrizz", " - Acme", " | SiteName"
 * so titles stored or displayed remain pure base titles (e.g. "About Us").
 */
export function cleanTitleSuffix(
  rawTitle: string,
  currentSiteName?: string,
  currentSeparator?: string
): string {
  if (!rawTitle) return "";
  let cleaned = rawTitle.trim();

  const sepPattern = currentSeparator && currentSeparator.trim()
    ? `[-—–|/•~:›»\\s*${escapeRegExp(currentSeparator.trim())}]`
    : `[-—–|/•~:›»]`;

  if (currentSiteName) {
    const siteRegex = new RegExp(`\\s*${sepPattern}+\\s*${escapeRegExp(currentSiteName)}\\s*$`, "i");
    cleaned = cleaned.replace(siteRegex, "").trim();
  }
  // Strip fallback "PayTrizz" if siteName differs or wasn't provided
  cleaned = cleaned.replace(new RegExp(`\\s*${sepPattern}+\\s*PayTrizz\\s*$`, "i"), "").trim();

  return cleaned;
}

export async function constructMetadata({
  path,
  title,
  description,
  image,
  type = "website",
  pageKey,
}: SeoOptions): Promise<Metadata> {
  const settings = await getPublicSettings().catch(() => ({} as Record<string, string>));
  const siteName = settings.site_name || "PayTrizz";
  const separator = settings.title_separator !== undefined ? settings.title_separator : "—";
  const sepStr = separator ? ` ${separator} ` : " ";
  const siteTagline = settings.site_tagline || "Talent Agency Platform";

  // Resolve pageKey if not explicitly provided
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  let key = pageKey;
  if (!key) {
    if (!cleanPath) {
      key = "home";
    } else if (cleanPath === "request-project" || cleanPath === "join") {
      key = "request-project";
    } else if (["about", "services", "projects", "blog", "talents", "contact"].includes(cleanPath)) {
      key = cleanPath;
    }
  }

  let cmsSeo: SEOSettingData | null = null;
  if (key) {
    cmsSeo = await getPublicSEO(key);
  }

  // Determine effective title
  const isHome = !cleanPath || key === "home" || path === "/";
  let fullTitle: string;

  if (isHome) {
    // For Home: SiteName — Tagline (or custom SEO title if specified)
    const rawTitle = cmsSeo?.title?.trim() || title?.trim() || "";
    const cleanTitle = cleanTitleSuffix(rawTitle, siteName, separator);
    const effectiveTagline =
      cleanTitle &&
      cleanTitle.toLowerCase() !== "home" &&
      cleanTitle.toLowerCase() !== siteName.toLowerCase()
        ? cleanTitle
        : siteTagline;
    fullTitle = `${siteName}${sepStr}${effectiveTagline}`;
  } else {
    // For Subpages: CleanTitle — SiteName
    const rawTitle = cmsSeo?.title?.trim() || title?.trim() || "";
    const cleanTitle = cleanTitleSuffix(rawTitle, siteName, separator);
    const effectiveBaseTitle = cleanTitle || title?.trim() || "Page";
    fullTitle = `${effectiveBaseTitle}${sepStr}${siteName}`;
  }

  const metaDescription =
    cmsSeo?.description?.trim() ||
    description?.trim() ||
    settings.site_description ||
    "Connect with vetted specialists in development, design, and digital growth.";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = `${baseUrl}${normalizedPath === "/" ? "" : normalizedPath}`;

  const defaultOgImage =
    settings.logo_url || settings.site_logo_light || "/logo-paytrizz.png";
  const cmsOgImage = cmsSeo?.og_media?.path_large || cmsSeo?.og_media?.path_original || "";
  const rawOgImage = cmsOgImage || image || defaultOgImage;
  const ogImage =
    rawOgImage.startsWith("http://") || rawOgImage.startsWith("https://")
      ? rawOgImage
      : `${baseUrl.replace(/\/+$/, "")}${rawOgImage.startsWith("/") ? "" : "/"}${rawOgImage}`;

  const robots =
    cmsSeo?.robots_index === false
      ? { index: false, follow: false }
      : { index: true, follow: true };

  const rawKeywords =
    settings.meta_keywords || "talent agency, vetted developers, tech squad, engineering leaders";
  const keywords = rawKeywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title: {
      absolute: fullTitle,
    },
    description: metaDescription,
    keywords,
    robots,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description: metaDescription,
      url: canonicalUrl,
      siteName,
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: metaDescription,
      images: [ogImage],
    },
  };
}
