"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/lib/settings";

export interface NavItem {
  label: string;
  href: string;
}

// Clean, hardcoded navigation per user request (Services, Talents, Projects, Blog, About)
const NAV_ITEMS: NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "Talents", href: "/talents" },
  { label: "Projects", href: "/projects" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

interface NavbarProps {
  initialSettings?: SiteSettings;
}

export function Navbar({ initialSettings }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | undefined>(initialSettings);

  useEffect(() => {
    // Fetch dynamic public branding settings (logo, site name)
    fetch("/api/proxy/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setSettings(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const logoUrl = settings?.logo_url || settings?.site_logo_light;
  const siteName = settings?.site_name || "PayTrizz";

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto">
        <nav
          className="relative bg-white/85 backdrop-blur-md border border-neutral-200/80 shadow-[0_8px_30px_rgba(29,32,35,0.06)] rounded-full py-2.5 px-4 sm:px-6 flex items-center justify-between transition-all"
          aria-label="Global"
        >
          {/* Left: Brand Logo */}
          <div className="flex items-center">
            <BrandLogo variant="icon-text" logoUrl={logoUrl} siteName={siteName} />
          </div>

          {/* Center: Inner Pill Navigation Links (Hardcoded) */}
          <div className="hidden md:flex items-center bg-ink-100 rounded-full p-1 border border-neutral-200/50">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-white text-ink-900 shadow-sm font-semibold"
                      : "text-ink-700 hover:text-ink-900 hover:bg-white/60"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Portal Login & Get in Touch CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 bg-brand-500 text-ink-900 font-bold px-5 py-2 rounded-full text-sm hover:bg-brand-600 transition-all shadow-[0_4px_14px_rgba(252,207,0,0.35)] active:scale-[0.98]"
            >
              <span>Get in Touch</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-ink-700 hover:text-ink-900 hover:bg-ink-100 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-md border border-neutral-200 shadow-xl rounded-3xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-base font-medium transition-colors",
                    pathname === item.href
                      ? "bg-brand-50 text-ink-900 font-bold"
                      : "text-ink-700 hover:bg-ink-100"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full border border-ink-300 text-sm font-semibold text-ink-900 hover:bg-ink-100 transition-colors"
              >
                Sign In to Portal
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-500 text-ink-900 font-bold py-2.5 rounded-full text-sm hover:bg-brand-600 transition-all shadow-[0_4px_14px_rgba(252,207,0,0.35)]"
              >
                <span>Get in Touch</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
