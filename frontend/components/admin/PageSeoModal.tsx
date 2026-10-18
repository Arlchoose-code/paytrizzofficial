"use client";

import { useState, useEffect } from "react";
import { X, Save, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cleanTitleSuffix } from "@/lib/seo";

interface PageSeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: number;
  pageKey: string;
  defaultTitle: string;
  defaultIsActive: boolean;
  onSuccess: () => void;
}

export function PageSeoModal({
  isOpen,
  onClose,
  pageId,
  pageKey,
  defaultTitle,
  defaultIsActive,
  onSuccess,
}: PageSeoModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [isActive, setIsActive] = useState(defaultIsActive);
  const [description, setDescription] = useState("");
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [siteName, setSiteName] = useState("PayTrizz");
  const [separator, setSeparator] = useState("—");
  const [siteTagline, setSiteTagline] = useState("Talent Agency Platform");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [prevOpen, setPrevOpen] = useState(isOpen);
  const [prevKey, setPrevKey] = useState(pageKey);

  if (isOpen !== prevOpen || pageKey !== prevKey) {
    setPrevOpen(isOpen);
    setPrevKey(pageKey);
    if (isOpen && pageKey) {
      setLoading(true);
      setTitle(cleanTitleSuffix(defaultTitle, siteName));
      setIsActive(defaultIsActive);
    }
  }

  useEffect(() => {
    if (!isOpen || !pageKey) return;
    let ignore = false;

    Promise.all([
      fetch(`/api/proxy/admin/seo/${pageKey}`).then((r) => r.json()).catch(() => null),
      fetch("/api/proxy/settings").then((r) => r.json()).catch(() => null),
    ])
      .then(([seoJson, settingsJson]) => {
        if (ignore) return;
        let currentSiteName = siteName;
        if (settingsJson?.data) {
          if (settingsJson.data.site_name) {
            currentSiteName = settingsJson.data.site_name;
            setSiteName(currentSiteName);
          }
          if (settingsJson.data.title_separator !== undefined) {
            setSeparator(settingsJson.data.title_separator);
          }
          if (settingsJson.data.site_tagline) {
            setSiteTagline(settingsJson.data.site_tagline);
          }
        }

        if (seoJson?.data) {
          setTitle(cleanTitleSuffix(seoJson.data.title || defaultTitle, currentSiteName, settingsJson?.data?.title_separator));
          setDescription(seoJson.data.description || "");
          setRobotsIndex(seoJson.data.robots_index ?? true);
        } else {
          setTitle(cleanTitleSuffix(defaultTitle, currentSiteName, settingsJson?.data?.title_separator));
          setDescription("");
          setRobotsIndex(true);
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, pageKey, defaultTitle, defaultIsActive, siteName]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const cleanTitle = cleanTitleSuffix(title, siteName);
    try {
      // 1. Update Page basic info
      const pageRes = await fetch(`/api/proxy/admin/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          is_active: isActive,
        }),
      });

      // 2. Update SEO settings
      const seoRes = await fetch(`/api/proxy/admin/seo/${pageKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          description,
          robots_index: robotsIndex,
        }),
      });

      if (pageRes.ok && seoRes.ok) {
        toast.success(`Page & SEO settings updated for /${pageKey === "home" ? "" : pageKey}`);
        onSuccess();
        onClose();
      } else {
        const pageErr = !pageRes.ok ? await pageRes.json().catch(() => ({})) : null;
        const seoErr = !seoRes.ok ? await seoRes.json().catch(() => ({})) : null;
        toast.error(pageErr?.message || seoErr?.message || "Failed to update page settings");
      }
    } catch {
      toast.error("Error saving page settings");
    } finally {
      setSaving(false);
    }
  };

  const isHome = pageKey === "home";
  const cleanTitle = cleanTitleSuffix(title, siteName);
  const sepStr = separator ? ` ${separator} ` : " ";
  const previewTitle = isHome
    ? `${siteName}${sepStr}${cleanTitle || siteTagline}`
    : `${cleanTitle || "Page"}${sepStr}${siteName}`;
  const routeDisplay = pageKey === "home" ? "" : pageKey;
  const previewUrl = `https://paytrizz.com/${routeDisplay}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-ink-100 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-ink-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-ink-900">
                Unified CMS &amp; SEO
              </span>
              <span className="text-xs font-mono text-ink-500 font-bold">/{routeDisplay}</span>
            </div>
            <h3 className="text-base font-black text-ink-900 mt-1">Page &amp; SEO Settings</h3>
          </div>
          <button onClick={onClose} className="p-1 text-ink-400 hover:text-ink-900 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-ink-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-ink-400" />
            Loading page &amp; SEO settings...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {pageKey === "home" && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                💡 <strong>Home Page:</strong> Updating title and description here sets the primary homepage search snippet. This automatically syncs with Global Platform Settings.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">Page &amp; Meta Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Request a Project Squad"
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 font-semibold focus:outline-none focus:ring-1 focus:ring-ink-900"
              />
              <p className="text-[11px] text-ink-500 mt-1">Used for browser tab, social sharing, and search engine results.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-ink-700">Meta Description</label>
                <span className={cn("text-[11px] font-mono", description.length > 160 ? "text-amber-600 font-bold" : "text-ink-400")}>
                  {description.length} / 160 chars
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Concise overview snippet for search results..."
                className="w-full p-3 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-ink-100 hover:bg-ink-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-500 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-ink-900 block">Page is Published</span>
                  <span className="text-[10px] text-ink-500">Live for visitors</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-ink-100 hover:bg-ink-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={robotsIndex}
                  onChange={(e) => setRobotsIndex(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-500 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-ink-900 block">Robots Indexing</span>
                  <span className="text-[10px] text-ink-500">Allow search engine index</span>
                </div>
              </label>
            </div>

            {/* Live Search Preview Card */}
            <div className="rounded-2xl border border-ink-200 bg-ink-50/40 p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500 uppercase tracking-wider mb-1">
                <Search className="w-3.5 h-3.5 text-brand-500" />
                Live Search Engine Result Preview
              </div>
              <div className="text-[11px] text-emerald-700 font-mono truncate">{previewUrl}</div>
              <div className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                {previewTitle}
              </div>
              <div className="text-xs text-ink-600 line-clamp-2">
                {description || "No description provided yet. Google will attempt to generate a snippet based on page content."}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-ink-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-500 text-ink-900 text-xs font-black hover:bg-brand-400 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Page &amp; SEO
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
