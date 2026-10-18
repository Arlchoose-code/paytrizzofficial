"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Mail,
  Shield,
  Save,
  Globe,
  Share2,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImagePickerDialog, PickedMedia } from "@/components/shared/ImagePickerDialog";
import { SettingsGeneralTab } from "@/components/admin/settings/SettingsGeneralTab";
import { SettingsMailTab } from "@/components/admin/settings/SettingsMailTab";

interface SiteSetting {
  id: number;
  group: string;
  key: string;
  value: string;
  type: string;
  is_public: boolean;
}

type TabType = "general" | "social" | "mail" | "security" | "robots";

const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: "PayTrizz",
  site_tagline: "Vetted Elite Tech Squads",
  site_description: "Talent Agency Platform connecting you with vetted specialists in development, design, and digital growth.",
  footer_text: "© 2026 PayTrizz. All rights reserved.",
  title_separator: "—",
  title_format: "{title} — {site_name}",
  meta_keywords: "talent agency, vetted developers, tech squad, PayTrizz",
  contact_email: "hello@paytrizz.com",
  contact_phone: "+62 812-3456-7890",
  contact_reply_eta_text: "1–2 business days",
  contact_address: "Jakarta Selatan, DKI Jakarta, Indonesia",
  mail_from_address: "noreply@paytrizz.com",
  mail_reply_to_address: "hello@paytrizz.com",
  aws_ses_region: "ap-southeast-1",
  aws_s3_bucket: "paytrizz-ses-inbound",
  turnstile_enabled: "false",
  feature_turnstile: "false",
  feature_email_verification: "false",
  notify_admin_on_talent_contact: "true",
  maintenance_mode: "false",
  robots_allow_ai_crawler: "true",
  robots_index_talents: "true",
  robots_index_projects: "true",
  robots_index_blog: "true",
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerFor, setPickerFor] = useState<"logo_url" | "logo_dark_url" | "favicon_url" | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [res, socRes] = await Promise.all([
        fetch("/api/proxy/admin/settings"),
        fetch("/api/proxy/socials").catch(() => null),
      ]);
      const json = await res.json();
      if (res.ok && json.data) {
        const map: Record<string, string> = {};
        json.data.forEach((s: SiteSetting) => {
          let val = s.value;
          if (val && typeof val === "string" && val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
            val = val.slice(1, -1);
          }
          map[s.key] = val;
        });
        if (socRes && socRes.ok) {
          const socJson = await socRes.json();
          if (Array.isArray(socJson.data)) {
            socJson.data.forEach((s: any) => {
              if (s.platform && s.url) {
                map[`social_${s.platform.toLowerCase()}`] = s.url;
              }
            });
          }
        }
        if (!map.logo_url && map.site_logo_light) map.logo_url = map.site_logo_light;
        if (!map.logo_dark_url && map.site_logo_dark) map.logo_dark_url = map.site_logo_dark;
        if (!map.favicon_url && map.site_favicon) map.favicon_url = map.site_favicon;
        setSettings((prev) => ({ ...prev, ...map }));
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payloadSettings = { ...settings };
      if (payloadSettings.logo_url !== undefined) payloadSettings.site_logo_light = payloadSettings.logo_url;
      if (payloadSettings.logo_dark_url !== undefined) payloadSettings.site_logo_dark = payloadSettings.logo_dark_url;
      if (payloadSettings.favicon_url !== undefined) payloadSettings.site_favicon = payloadSettings.favicon_url;

      const res = await fetch("/api/proxy/admin/settings/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payloadSettings }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update settings");

      toast.success("Settings saved successfully", {
        description: "Global settings updated and ISR cache invalidated.",
      });
    } catch (err: any) {
      toast.error(err.message || "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "general", label: "General & SEO", icon: Globe },
    { id: "social", label: "Social Links", icon: Share2 },
    { id: "mail", label: "Webmail & SES", icon: Mail },
    { id: "security", label: "Security & Toggles", icon: Shield },
    { id: "robots", label: "Robots & Crawlers", icon: Bot },
  ];

  return (
    <DashboardLayout role="admin" title="Platform Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                System Config
              </span>
              <span className="text-[11px] font-semibold text-ink-500">Global Settings</span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">Platform Settings</h1>
            <p className="text-xs text-ink-500">
              Manage website branding, logos, SEO meta, footer, transactional mail, and feature toggles.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-ink-100 pb-3 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0",
                  active
                    ? "bg-brand-500 text-ink-900 shadow-sm"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. General & SEO */}
          {activeTab === "general" && (
            <SettingsGeneralTab
              settings={settings}
              handleChange={handleChange}
              setPickerFor={setPickerFor}
            />
          )}

          {/* 3. Social Links */}
          {activeTab === "social" && (
            <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-ink-900 border-b border-ink-100 pb-3">
                Social Media Channels
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/paytrizz"
                    value={settings.social_github || ""}
                    onChange={(e) => handleChange("social_github", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/company/paytrizz"
                    value={settings.social_linkedin || ""}
                    onChange={(e) => handleChange("social_linkedin", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    Twitter / X URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://x.com/paytrizz"
                    value={settings.social_twitter || ""}
                    onChange={(e) => handleChange("social_twitter", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/paytrizz"
                    value={settings.social_instagram || ""}
                    onChange={(e) => handleChange("social_instagram", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Webmail & SES */}
          {activeTab === "mail" && (
            <SettingsMailTab settings={settings} handleChange={handleChange} />
          )}

          {/* 5. Security & Toggles */}
          {activeTab === "security" && (
            <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-ink-900 border-b border-ink-100 pb-3">
                Security & Anti-Bot Protections
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-ink-100 bg-[#FAFAFA]">
                  <div>
                    <p className="text-xs font-bold text-ink-900">Cloudflare Turnstile Protection</p>
                    <p className="text-[11px] text-ink-500">Enforce smart CAPTCHA challenge on contact forms</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.turnstile_enabled === "true" || settings.feature_turnstile === "true"}
                    onChange={(e) => {
                      const v = e.target.checked ? "true" : "false";
                      handleChange("turnstile_enabled", v);
                      handleChange("feature_turnstile", v);
                    }}
                    className="w-4 h-4 accent-brand-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-ink-100 bg-[#FAFAFA]">
                  <div>
                    <p className="text-xs font-bold text-ink-900">Visitor Email Verification</p>
                    <p className="text-[11px] text-ink-500">Require visitor email confirmation before routing message</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.feature_email_verification === "true"}
                    onChange={(e) => handleChange("feature_email_verification", e.target.checked ? "true" : "false")}
                    className="w-4 h-4 accent-brand-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-ink-100 bg-[#FAFAFA]">
                  <div>
                    <p className="text-xs font-bold text-ink-900">Notify Admin on Talent Contact</p>
                    <p className="text-[11px] text-ink-500">Send carbon copy notification to admin when a talent receives an inquiry</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notify_admin_on_talent_contact !== "false"}
                    onChange={(e) => handleChange("notify_admin_on_talent_contact", e.target.checked ? "true" : "false")}
                    className="w-4 h-4 accent-brand-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-ink-100 bg-[#FAFAFA]">
                  <div>
                    <p className="text-xs font-bold text-ink-900">Platform Maintenance Mode</p>
                    <p className="text-[11px] text-ink-500">Temporarily show maintenance banner on public routes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode === "true"}
                    onChange={(e) => handleChange("maintenance_mode", e.target.checked ? "true" : "false")}
                    className="w-4 h-4 accent-brand-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. Robots & Crawlers */}
          {activeTab === "robots" && (
            <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-ink-900 border-b border-ink-100 pb-3">
                Robots.txt & Crawler Policy
              </h3>
              <p className="text-xs text-ink-500 -mt-2">
                Toggle-based policy — no raw text editing. /admin, /talent and /login are always disallowed.
              </p>

              <div className="space-y-4">
                {[
                  { key: "robots_allow_ai_crawler", title: "Allow AI crawlers", desc: "Let AI training crawlers (GPTBot, ClaudeBot, CCBot, etc.) index the site", defaultOn: true },
                  { key: "robots_index_talents", title: "Index talent directory", desc: "Allow search engines to index /talents and profile pages", defaultOn: true },
                  { key: "robots_index_projects", title: "Index projects", desc: "Allow search engines to index /projects and case studies", defaultOn: true },
                  { key: "robots_index_blog", title: "Index blog", desc: "Allow search engines to index /blog and articles", defaultOn: true },
                ].map((t) => (
                  <div
                    key={t.key}
                    className="flex items-center justify-between p-4 rounded-xl border border-ink-100 bg-[#FAFAFA]"
                  >
                    <div>
                      <p className="text-xs font-bold text-ink-900">{t.title}</p>
                      <p className="text-[11px] text-ink-500">{t.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={
                        settings[t.key] !== undefined && settings[t.key] !== ""
                          ? settings[t.key] === "true"
                          : t.defaultOn
                      }
                      onChange={(e) => handleChange(t.key, e.target.checked ? "true" : "false")}
                      className="w-4 h-4 accent-brand-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-ink-100">
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  View current robots.txt &rarr;
                </a>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-ink-100 shadow-sm">
            <p className="text-xs text-ink-500">Unsaved changes will be lost if you navigate away.</p>
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>

      <ImagePickerDialog
        open={pickerFor !== null}
        title={pickerFor === "favicon_url" ? "Choose Favicon" : "Choose Logo"}
        module="site"
        onSelect={(media: PickedMedia) => {
          const url = media.path_medium || media.path_original;
          if (pickerFor) handleChange(pickerFor, url);
          toast.success("Image selected — remember to save settings");
        }}
        onClose={() => setPickerFor(null)}
      />
    </DashboardLayout>
  );
}
