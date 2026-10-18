"use client";

import { Globe, Search, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageSeoCardProps {
  isHome: boolean;
  siteName: string;
  separator: string;
  effectiveTagline: string;
  pageTitle: string;
  setPageTitle: (val: string) => void;
  seoDescription: string;
  setSeoDescription: (val: string) => void;
  ogMediaId: number | null;
  setOgMediaId: (val: number | null) => void;
  ogMedia: {
    path_medium?: string;
    path_original?: string;
    title?: string;
  } | null;
  setOgMedia: (val: any) => void;
  setOgPickerOpen: (open: boolean) => void;
  pageIsActive: boolean;
  setPageIsActive: (val: boolean) => void;
  robotsIndex: boolean;
  setRobotsIndex: (val: boolean) => void;
  previewUrl: string;
  previewTitle: string;
}

export function PageSeoCard({
  isHome,
  siteName,
  separator,
  effectiveTagline,
  pageTitle,
  setPageTitle,
  seoDescription,
  setSeoDescription,
  ogMediaId,
  setOgMediaId,
  ogMedia,
  setOgMedia,
  setOgPickerOpen,
  pageIsActive,
  setPageIsActive,
  robotsIndex,
  setRobotsIndex,
  previewUrl,
  previewTitle,
}: PageSeoCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-ink-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
            <Globe className="w-4 h-4 text-ink-900" />
          </div>
          <div>
            <h3 className="text-sm font-black text-ink-900">
              Page Identity &amp; SEO Configuration
            </h3>
            <p className="text-[11px] text-ink-500">
              Configure clean base title, search snippet, OG image, and crawler settings.
            </p>
          </div>
        </div>
      </div>

      {isHome && (
        <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200 text-xs text-ink-800 font-medium">
          💡 <strong>Home Page SEO:</strong> Formats dynamically as{" "}
          <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px] font-bold">
            {siteName} {separator} {effectiveTagline}
          </code>
          . Separator ({separator}) and brand name ({siteName}) are automatically inherited from Global Settings.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-ink-800 mb-1">
            Page &amp; Meta Title (Clean Base Title)
          </label>
          <input
            type="text"
            required
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            placeholder="e.g. About Us, Services, Projects & Works"
            className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 font-semibold focus:outline-none focus:ring-1 focus:ring-ink-900"
          />
          <p className="text-[11px] text-ink-500 mt-1">
            Do not include &ldquo;{separator} {siteName}&rdquo;. The title separator ({separator}) and site brand name ({siteName}) are dynamically appended by the layout.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-ink-800">
              Meta Description
            </label>
            <span
              className={cn(
                "text-[11px] font-mono",
                seoDescription.length > 160 ? "text-amber-600 font-bold" : "text-ink-400"
              )}
            >
              {seoDescription.length} / 160 characters
            </span>
          </div>
          <textarea
            rows={3}
            required
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="High-converting overview snippet displayed in search results and social links..."
            className="w-full p-3 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
          />
        </div>

        {/* OpenGraph Social Image Picker */}
        <div className="p-4 rounded-xl border border-ink-100 bg-ink-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-ink-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                OpenGraph Share Image (og:image)
              </label>
              <p className="text-[11px] text-ink-500">
                Custom preview image shown when this page is shared on Twitter, LinkedIn, Slack, etc.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {ogMediaId && (
                <button
                  type="button"
                  onClick={() => {
                    setOgMediaId(null);
                    setOgMedia(null);
                  }}
                  className="px-2.5 py-1 text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={() => setOgPickerOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-ink-900 text-white text-xs font-bold hover:bg-black transition cursor-pointer"
              >
                {ogMediaId ? "Change Image" : "Select Image"}
              </button>
            </div>
          </div>

          {ogMedia ? (
            <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-ink-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogMedia.path_medium || ogMedia.path_original}
                alt="OG Preview"
                className="w-16 h-10 object-cover rounded border border-ink-100"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ink-900 truncate">
                  {ogMedia.title || "Custom OpenGraph Image"}
                </p>
                <p className="text-[10px] text-ink-500 font-mono truncate">
                  {ogMedia.path_original || ogMedia.path_medium}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-500 italic">
              No custom OG image selected. Public site will use the global brand logo as fallback.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-ink-100 hover:bg-ink-50/50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={pageIsActive}
              onChange={(e) => setPageIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-0 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-ink-900 block">Page is Published</span>
              <span className="text-[10px] text-ink-500">Visible to public visitors</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-ink-100 hover:bg-ink-50/50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={robotsIndex}
              onChange={(e) => setRobotsIndex(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-0 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-ink-900 block">Robots Indexing</span>
              <span className="text-[10px] text-ink-500">Allow Google &amp; search engines to index</span>
            </div>
          </label>
        </div>

        {/* Live Search Engine Result Preview Card */}
        <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500 uppercase tracking-wider mb-1">
            <Search className="w-3.5 h-3.5 text-brand-500" />
            Live Google Search Result Preview
          </div>
          <div className="text-[11px] text-emerald-700 font-mono truncate">{previewUrl}</div>
          <div className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate">
            {previewTitle}
          </div>
          <div className="text-xs text-ink-600 line-clamp-2">
            {seoDescription ||
              "No description provided yet. Google will attempt to generate a snippet based on page content."}
          </div>
        </div>
      </div>
    </div>
  );
}
