"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ArrowUpRight, Globe } from "lucide-react";
import type { SiteSettings } from "@/lib/settings";

interface SocialLinkItem {
  id: number;
  platform: string;
  label: string;
  url: string;
}

function renderSocialIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes("linkedin")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    );
  }
  if (p.includes("twitter") || p.includes("x")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (p.includes("instagram")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }
  if (p.includes("github")) {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    );
  }
  return <Globe className="w-4 h-4" />;
}

export function Footer({ initialSettings }: { initialSettings?: SiteSettings }) {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<SiteSettings>(initialSettings || {});
  const [socials, setSocials] = useState<SocialLinkItem[]>([]);

  useEffect(() => {
    async function loadDynamic() {
      try {
        const [settRes, socRes] = await Promise.allSettled([
          fetch("/api/proxy/settings").then((r) => r.json()),
          fetch("/api/proxy/socials").then((r) => r.json()),
        ]);

        if (settRes.status === "fulfilled" && settRes.value?.success && settRes.value?.data) {
          setSettings(settRes.value.data);
        }
        if (socRes.status === "fulfilled" && Array.isArray(socRes.value?.data) && socRes.value.data.length > 0) {
          setSocials(socRes.value.data);
        }
      } catch {}
    }
    loadDynamic();
  }, []);

  // Footer text is editable directly from Admin Settings
  const copyrightText =
    settings.footer_text || `© ${currentYear} ${settings.site_name || "PayTrizz"}. All rights reserved.`;

  return (
    <footer className="bg-ink-900 text-white border-t border-neutral-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-14 border-b border-neutral-800">
          {/* Brand Info & Pitch */}
          <div className="lg:col-span-2 space-y-6">
            <BrandLogo
              variant="dark"
              logoDarkUrl={settings.logo_dark_url || settings.site_logo_dark || settings.logo_url || settings.site_logo_light}
              logoUrl={settings.logo_url || settings.site_logo_light}
              siteName={settings.site_name}
            />
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm">
              {settings.site_description ||
                "PayTrizz connects ambitious companies and product teams with vetted, world-class specialists in development, design, and growth."}
            </p>

            {/* Social Links (Dynamic from Admin Settings) */}
            <div className="flex items-center gap-3">
              {socials.length > 0 ? (
                socials.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-brand-500 hover:text-ink-900 text-neutral-300 flex items-center justify-center transition-all duration-200"
                    aria-label={s.label || s.platform}
                    title={s.label || s.platform}
                  >
                    {renderSocialIcon(s.platform)}
                  </a>
                ))
              ) : (
                <>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-brand-500 hover:text-ink-900 text-neutral-300 flex items-center justify-center transition-all duration-200"
                    aria-label="LinkedIn"
                  >
                    {renderSocialIcon("linkedin")}
                  </a>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-brand-500 hover:text-ink-900 text-neutral-300 flex items-center justify-center transition-all duration-200"
                    aria-label="Twitter / X"
                  >
                    {renderSocialIcon("twitter")}
                  </a>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-brand-500 hover:text-ink-900 text-neutral-300 flex items-center justify-center transition-all duration-200"
                    aria-label="Instagram"
                  >
                    {renderSocialIcon("instagram")}
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-brand-500 hover:text-ink-900 text-neutral-300 flex items-center justify-center transition-all duration-200"
                    aria-label="GitHub"
                  >
                    {renderSocialIcon("github")}
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Column 1: Services (Clean Hardcoded Links) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-500 font-sans">
              Services
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/services#web-development" className="hover:text-white transition-colors duration-150">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="/services#ui-ux-design" className="hover:text-white transition-colors duration-150">
                  UI/UX Design
                </Link>
              </li>
              <li>
                <Link href="/services#mobile-apps" className="hover:text-white transition-colors duration-150">
                  Mobile Apps
                </Link>
              </li>
              <li>
                <Link href="/services#video-and-motion" className="hover:text-white transition-colors duration-150">
                  Video & Motion
                </Link>
              </li>
              <li>
                <Link href="/services#digital-marketing" className="hover:text-white transition-colors duration-150">
                  Digital Marketing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Explore (Clean Hardcoded Links + /request-project) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-500 font-sans">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/talents" className="hover:text-white transition-colors duration-150">
                  Talents Directory
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors duration-150">
                  Projects & Case Studies
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors duration-150">
                  Blog & Insights
                </Link>
              </li>
              <li>
                <Link
                  href="/request-project"
                  className="text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1 transition-colors duration-150"
                >
                  <span>Request a Project Squad</span>
                  <ArrowUpRight className="w-3.5 h-3.5 inline ml-0.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company (Clean Hardcoded Links) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-500 font-sans">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/about" className="hover:text-white transition-colors duration-150">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors duration-150">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors duration-150">
                  Talent Portal
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors duration-150">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors duration-150">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Dynamic Copyright & Standards */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>{copyrightText}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-neutral-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-neutral-400 transition-colors">
              Terms of Service
            </Link>
            <span className="text-neutral-700 hidden sm:inline">•</span>
            <span className="text-neutral-400 hidden sm:inline">Built with modern performance & precision.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
