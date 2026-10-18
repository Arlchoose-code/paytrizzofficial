"use client";

import { Search, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsGeneralTabProps {
  settings: Record<string, string>;
  handleChange: (key: string, value: string) => void;
  setPickerFor: (key: "logo_url" | "logo_dark_url" | "favicon_url") => void;
}

export function SettingsGeneralTab({
  settings,
  handleChange,
  setPickerFor,
}: SettingsGeneralTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-6">
      <div className="border-b border-ink-100 pb-3">
        <h3 className="text-sm font-bold text-ink-900">
          General Identity, SEO &amp; Branding
        </h3>
        <p className="text-xs text-ink-500">
          Manage platform name, tagline, homepage search snippet, logos, and coordinates in one unified view.
        </p>
      </div>

      {/* Brand & Search Identity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
            Platform / Site Name
          </label>
          <input
            type="text"
            value={settings.site_name || "PayTrizz"}
            onChange={(e) => handleChange("site_name", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
            Brand Tagline
          </label>
          <input
            type="text"
            value={settings.site_tagline || "Vetted Elite Tech Squads"}
            onChange={(e) => handleChange("site_tagline", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
            Title Separator
          </label>
          <input
            type="text"
            value={settings.title_separator ?? ""}
            onChange={(e) => handleChange("title_separator", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
            placeholder="— or | (can be deleted or customized)"
          />
          <p className="text-[11px] text-ink-500 mt-1">Separates page title from site name</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
            Homepage Meta Description
          </label>
          <textarea
            rows={3}
            value={
              settings.site_description ||
              "Talent Agency Platform connecting you with vetted specialists in development, design, and digital growth."
            }
            onChange={(e) => handleChange("site_description", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <p className="text-[11px] text-ink-500 mt-1">Default meta snippet for search engines &amp; social previews</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              Default Meta Keywords
            </label>
            <input
              type="text"
              value={settings.meta_keywords || "talent agency, vetted developers, tech squad, PayTrizz"}
              onChange={(e) => handleChange("meta_keywords", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Comma separated keywords"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              Footer Copyright Text
            </label>
            <input
              type="text"
              value={settings.footer_text || "© 2026 PayTrizz. All rights reserved."}
              onChange={(e) => handleChange("footer_text", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Live Google Search Result Preview */}
      <div className="rounded-2xl border border-ink-200 bg-ink-50/40 p-4 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500 uppercase tracking-wider mb-1">
          <Search className="w-3.5 h-3.5 text-brand-500" />
          Live Google Search Snippet Preview
        </div>
        <div className="text-[11px] text-emerald-700 font-mono">https://paytrizz.com</div>
        <div className="text-base font-semibold text-blue-700 hover:underline cursor-pointer">
          {settings.site_name || "PayTrizz"}
          {settings.title_separator ? ` ${settings.title_separator} ` : " "}
          {settings.site_tagline || "Vetted Elite Tech Squads"}
        </div>
        <div className="text-xs text-ink-600 max-w-2xl line-clamp-2">
          {settings.site_description ||
            "Talent Agency Platform connecting you with vetted specialists in development, design, and digital growth."}
        </div>
        <p className="text-[11px] text-ink-400 pt-1">
          💡 This is your primary homepage search appearance. Subpages (e.g. /projects, /services, /request-project) inherit your site name and separator with their own page titles, configurable in Site Pages CMS.
        </p>
      </div>

      {/* Logos & Favicon */}
      <div className="pt-2 border-t border-ink-100">
        <h4 className="text-xs font-bold text-ink-900 mb-3 uppercase tracking-wider">
          Logos &amp; Favicon Assets
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              { key: "logo_url", label: "Light Logo", dark: false },
              { key: "logo_dark_url", label: "Dark Logo", dark: true },
              { key: "favicon_url", label: "Favicon", dark: false },
            ] as const
          ).map((asset) => (
            <div key={asset.key}>
              <label className="block text-xs font-semibold text-ink-700 mb-1.5">{asset.label}</label>
              <div
                className={cn(
                  "h-20 rounded-xl border border-ink-200 flex items-center justify-center mb-2.5 overflow-hidden",
                  asset.dark ? "bg-neutral-900" : "bg-neutral-100"
                )}
              >
                {settings[asset.key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings[asset.key]} alt={asset.label} className="h-8 object-contain" />
                ) : (
                  <span className={cn("text-[11px] font-semibold", asset.dark ? "text-white/40" : "text-ink-400")}>
                    No image selected
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPickerFor(asset.key)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-white border border-ink-200 hover:border-brand-500 text-ink-800 transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {settings[asset.key] ? "Replace" : "Choose Image"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="pt-2 border-t border-ink-100">
        <h4 className="text-xs font-bold text-ink-900 mb-3 uppercase tracking-wider">
          Contact Coordinates
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Support Email
            </label>
            <input
              type="email"
              value={settings.contact_email || "hello@paytrizz.com"}
              onChange={(e) => handleChange("contact_email", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Contact Phone
            </label>
            <input
              type="text"
              value={settings.contact_phone || "+62 812-3456-7890"}
              onChange={(e) => handleChange("contact_phone", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Response ETA Text
            </label>
            <input
              type="text"
              value={settings.contact_reply_eta_text || "1–2 business days"}
              onChange={(e) => handleChange("contact_reply_eta_text", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">
            Office / Headquarters Address
          </label>
          <input
            type="text"
            value={settings.contact_address || "Jakarta Selatan, DKI Jakarta, Indonesia"}
            onChange={(e) => handleChange("contact_address", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
}
