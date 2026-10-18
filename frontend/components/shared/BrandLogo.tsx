"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "icon-text" | "full" | "dark";
  className?: string;
  href?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  siteName?: string;
}

export function BrandLogo({
  variant = "icon-text",
  className,
  href = "/",
  logoUrl: propLogoUrl,
  logoDarkUrl: propLogoDarkUrl,
  siteName: propSiteName,
}: BrandLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [fetchedSettings, setFetchedSettings] = useState<{
    logo_url?: string;
    site_logo_light?: string;
    logo_dark_url?: string;
    site_logo_dark?: string;
    site_name?: string;
  } | null>(null);

  useEffect(() => {
    // If logo props are missing, fetch settings automatically so all pages show custom branding
    if (!propLogoUrl && !propLogoDarkUrl) {
      fetch("/api/proxy/settings")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data) {
            setFetchedSettings(json.data);
          }
        })
        .catch(() => {});
    }
  }, [propLogoUrl, propLogoDarkUrl]);

  const siteName = propSiteName || fetchedSettings?.site_name || "PayTrizz";

  const resolvedLightLogo =
    propLogoUrl || fetchedSettings?.logo_url || fetchedSettings?.site_logo_light;
  const resolvedDarkLogo =
    propLogoDarkUrl ||
    fetchedSettings?.logo_dark_url ||
    fetchedSettings?.site_logo_dark ||
    resolvedLightLogo;

  const activeLogo = variant === "dark" ? resolvedDarkLogo : resolvedLightLogo;
  const showCustomImage = Boolean(activeLogo && !imageFailed);

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {showCustomImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={activeLogo}
          alt={siteName}
          onError={() => setImageFailed(true)}
          className="h-8 sm:h-9 w-auto max-w-[120px] object-contain flex-shrink-0"
        />
      ) : (
        <div className="relative w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center font-extrabold text-ink-900 shadow-sm overflow-hidden flex-shrink-0">
          <span className="text-xl tracking-tighter font-black font-sans">
            {(siteName || "P")[0].toUpperCase()}
          </span>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-ink-900 rotate-45 transform origin-center" />
        </div>
      )}

      {variant !== "full" && (
        <span
          className={cn(
            "text-2xl font-extrabold tracking-tight font-sans whitespace-nowrap",
            variant === "dark" ? "text-white" : "text-ink-900"
          )}
        >
          {siteName && siteName !== "PayTrizz" ? (
            siteName
          ) : (
            <>
              Pay<span className="text-brand-500">Trizz</span>
            </>
          )}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
