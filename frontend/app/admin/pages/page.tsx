"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  FolderOpen,
  RefreshCw,
  ExternalLink,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cleanTitleSuffix } from "@/lib/seo";
import { ImagePickerDialog, PickedMedia } from "@/components/shared/ImagePickerDialog";
import { PageSeoCard } from "@/components/admin/pages/PageSeoCard";
import { PageSectionsCard } from "@/components/admin/pages/PageSectionsCard";
import { PageListSidebar } from "@/components/admin/pages/PageListSidebar";
import type { SectionFormState } from "@/components/admin/pages/PageSectionVisualEditor";

interface PageSummary {
  id: number;
  key: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

export interface PageSectionItem {
  id: number;
  page_id: number;
  key: string;
  type: string;
  content: any;
  sort_order: number;
  is_visible: boolean;
}

interface PageDetail extends PageSummary {
  sections: PageSectionItem[];
}

export type { SectionFormState };

export default function AdminPagesCMS() {
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Page State
  const [selectedPage, setSelectedPage] = useState<PageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Global Settings for Title & Google Preview
  const [siteName, setSiteName] = useState("PayTrizz");
  const [separator, setSeparator] = useState("—");
  const [siteTagline, setSiteTagline] = useState("Talent Agency Platform");

  // Page & SEO Form State (Clean title, no brand suffix)
  const [pageTitle, setPageTitle] = useState("");
  const [pageIsActive, setPageIsActive] = useState(true);
  const [seoDescription, setSeoDescription] = useState("");
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [ogMediaId, setOgMediaId] = useState<number | null>(null);
  const [ogMedia, setOgMedia] = useState<{
    path_medium?: string;
    path_original?: string;
    title?: string;
  } | null>(null);
  const [ogPickerOpen, setOgPickerOpen] = useState(false);

  // Section Inline Form States: sectionId -> SectionFormState
  const [sectionsState, setSectionsState] = useState<Record<number, SectionFormState>>({});
  // Expanded sections accordion state: sectionId -> boolean
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  // Saving states
  const [savingAll, setSavingAll] = useState(false);
  const [savingSectionId, setSavingSectionId] = useState<number | null>(null);

  // Fetch all pages list
  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/admin/pages");
      const json = await res.json();
      if (res.ok && json.data) {
        setPages(json.data);
        return json.data as PageSummary[];
      } else {
        toast.error("Failed to load pages");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
    return [];
  }, []);

  // Fetch global platform settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/settings");
      const json = await res.json();
      if (res.ok && json.data) {
        if (json.data.site_name) setSiteName(json.data.site_name);
        if (json.data.title_separator !== undefined) setSeparator(json.data.title_separator);
        if (json.data.site_tagline) setSiteTagline(json.data.site_tagline);
      }
    } catch {}
  }, []);

  // Load selected page detail and SEO settings together
  const loadPageDetail = useCallback(
    async (pageId: number, pageKey?: string) => {
      setLoadingDetail(true);
      try {
        const [pageRes, seoRes] = await Promise.all([
          fetch(`/api/proxy/admin/pages/${pageId}`)
            .then((r) => r.json())
            .catch(() => null),
          pageKey
            ? fetch(`/api/proxy/admin/seo/${pageKey}`)
                .then((r) => r.json())
                .catch(() => null)
            : null,
        ]);

        if (pageRes?.data) {
          const pageData = pageRes.data as PageDetail;
          setSelectedPage(pageData);

          // Populate Page & SEO form with clean title
          const rawTitle = seoRes?.data?.title || pageData.title || "";
          setPageTitle(cleanTitleSuffix(rawTitle, siteName, separator));
          setPageIsActive(pageData.is_active);
          setSeoDescription(seoRes?.data?.description || "");
          setRobotsIndex(seoRes?.data?.robots_index ?? true);
          setOgMediaId(seoRes?.data?.og_media_id ?? null);
          setOgMedia(seoRes?.data?.og_media ?? null);

          // Initialize section form state
          const secMap: Record<number, SectionFormState> = {};
          const expandMap: Record<number, boolean> = {};

          pageData.sections?.forEach((sec, idx) => {
            const contentObj =
              typeof sec.content === "object" && sec.content !== null ? sec.content : {};
            secMap[sec.id] = {
              is_visible: sec.is_visible,
              content: contentObj,
              editorMode: "visual",
              rawJson: JSON.stringify(contentObj, null, 2),
              jsonError: null,
              isDirty: false,
            };
            // By default expand the first section
            expandMap[sec.id] = idx === 0;
          });

          setSectionsState(secMap);
          setExpandedSections(expandMap);
        } else {
          toast.error("Failed to load page details");
        }
      } catch {
        toast.error("Error loading page details");
      } finally {
        setLoadingDetail(false);
      }
    },
    [siteName, separator]
  );

  useEffect(() => {
    fetchSettings();
    fetchPages().then((loadedPages) => {
      if (loadedPages && loadedPages.length > 0 && !selectedPage) {
        loadPageDetail(loadedPages[0].id, loadedPages[0].key);
      }
    });
  }, [fetchSettings, fetchPages, loadPageDetail, selectedPage]);

  // Reorder sections
  const handleMoveSection = async (index: number, direction: "up" | "down") => {
    if (!selectedPage) return;
    const sections = [...selectedPage.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const temp = sections[index];
    sections[index] = sections[targetIndex];
    sections[targetIndex] = temp;

    const orderedIds = sections.map((s) => s.id);

    try {
      const res = await fetch(`/api/proxy/admin/pages/${selectedPage.id}/reorder-sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_ids: orderedIds }),
      });

      if (res.ok) {
        toast.success("Section order updated");
        loadPageDetail(selectedPage.id, selectedPage.key);
      }
    } catch {
      toast.error("Failed to reorder sections");
    }
  };

  // Update a single section's field in state
  const handleSectionFieldChange = (sectionId: number, field: string, value: any) => {
    setSectionsState((prev) => {
      const current = prev[sectionId];
      if (!current) return prev;
      const updatedContent = { ...current.content, [field]: value };
      return {
        ...prev,
        [sectionId]: {
          ...current,
          content: updatedContent,
          rawJson: JSON.stringify(updatedContent, null, 2),
          isDirty: true,
        },
      };
    });
  };

  // Update section raw JSON
  const handleSectionJsonChange = (sectionId: number, newJsonText: string) => {
    setSectionsState((prev) => {
      const current = prev[sectionId];
      if (!current) return prev;

      let parsed = current.content;
      let err: string | null = null;
      try {
        parsed = JSON.parse(newJsonText);
      } catch (e: any) {
        err = e.message;
      }

      return {
        ...prev,
        [sectionId]: {
          ...current,
          rawJson: newJsonText,
          content: err ? current.content : parsed,
          jsonError: err,
          isDirty: true,
        },
      };
    });
  };

  // Toggle section visibility
  const handleToggleSectionVisibility = (sectionId: number, isVisible: boolean) => {
    setSectionsState((prev) => {
      const current = prev[sectionId];
      if (!current) return prev;
      return {
        ...prev,
        [sectionId]: {
          ...current,
          is_visible: isVisible,
          isDirty: true,
        },
      };
    });
  };

  // Save single section directly
  const handleSaveSingleSection = async (sec: PageSectionItem) => {
    const state = sectionsState[sec.id];
    if (!state) return;
    if (state.jsonError) {
      toast.error("Please fix JSON errors before saving: " + state.jsonError);
      return;
    }

    setSavingSectionId(sec.id);
    try {
      const res = await fetch(`/api/proxy/admin/pages/sections/${sec.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: JSON.stringify(state.content),
          is_visible: state.is_visible,
          sort_order: sec.sort_order,
        }),
      });

      if (res.ok) {
        toast.success(`Section "${sec.key}" saved successfully`);
        setSectionsState((prev) => ({
          ...prev,
          [sec.id]: { ...prev[sec.id], isDirty: false },
        }));
      } else {
        const json = await res.json().catch(() => ({}));
        toast.error(json.message || `Failed to save section ${sec.key}`);
      }
    } catch {
      toast.error(`Error saving section ${sec.key}`);
    } finally {
      setSavingSectionId(null);
    }
  };

  // Master Unified Save: Saves Page Info, SEO Settings (with OG Media), and modified Sections in one click
  const handleSavePageAndContent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPage) return;

    // Check for any JSON errors in sections
    for (const [secId, secState] of Object.entries(sectionsState)) {
      if (secState.jsonError) {
        toast.error(`Section #${secId} has invalid JSON: ${secState.jsonError}`);
        return;
      }
    }

    setSavingAll(true);
    const cleanTitle = cleanTitleSuffix(pageTitle, siteName, separator);

    try {
      // 1. Update Page basic info
      const pagePromise = fetch(`/api/proxy/admin/pages/${selectedPage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          is_active: pageIsActive,
        }),
      });

      // 2. Update SEO settings
      const seoPromise = fetch(`/api/proxy/admin/seo/${selectedPage.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          description: seoDescription,
          og_media_id: ogMediaId,
          robots_index: robotsIndex,
        }),
      });

      // 3. Update sections
      const sectionPromises = selectedPage.sections.map((sec) => {
        const state = sectionsState[sec.id];
        if (!state) return Promise.resolve(null);
        return fetch(`/api/proxy/admin/pages/sections/${sec.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: JSON.stringify(state.content),
            is_visible: state.is_visible,
            sort_order: sec.sort_order,
          }),
        });
      });

      const [pageRes, seoRes, ...sectionResults] = await Promise.all([
        pagePromise,
        seoPromise,
        ...sectionPromises,
      ]);

      const failedSections = sectionResults.filter((r) => r && !r.ok);

      if (pageRes.ok && seoRes.ok && failedSections.length === 0) {
        toast.success(
          `Page & content sections saved for /${selectedPage.key === "home" ? "" : selectedPage.key}!`
        );
        fetchPages();
        loadPageDetail(selectedPage.id, selectedPage.key);
      } else {
        toast.error("Some settings could not be saved. Please check details.");
      }
    } catch {
      toast.error("Error saving page and content");
    } finally {
      setSavingAll(false);
    }
  };

  // Google Search Preview Calculation
  const isHome = selectedPage?.key === "home";
  const cleanTitle = cleanTitleSuffix(pageTitle, siteName, separator);
  const sepStr = separator ? ` ${separator} ` : " ";
  const effectiveTagline =
    cleanTitle &&
    cleanTitle.toLowerCase() !== "home" &&
    cleanTitle.toLowerCase() !== siteName.toLowerCase()
      ? cleanTitle
      : siteTagline;
  const previewTitle = isHome
    ? `${siteName}${sepStr}${effectiveTagline}`
    : `${cleanTitle || "Page"}${sepStr}${siteName}`;
  const routeDisplay = selectedPage?.key === "home" ? "" : selectedPage?.key || "";
  const previewUrl = `https://paytrizz.com/${routeDisplay}`;

  return (
    <DashboardLayout role="admin" title="Pages CMS & Content | PayTrizz">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Unified CMS
              </span>
              <span className="text-xs text-ink-500 font-medium">
                Page SEO &amp; Visual Section Editor
              </span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">
              Site Pages &amp; Content
            </h1>
            <p className="text-xs text-ink-500">
              Edit page identity, SEO parameters, OG share images, and section content in one unified view.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchSettings();
                fetchPages();
                if (selectedPage) loadPageDetail(selectedPage.id, selectedPage.key);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-ink-200 text-xs font-bold text-ink-900 hover:bg-ink-100 transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Sync
            </button>
          </div>
        </div>

        {/* Master-Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Website Pages List */}
          <PageListSidebar
            pages={pages}
            loading={loading}
            selectedPageId={selectedPage?.id}
            siteName={siteName}
            separator={separator}
            onSelectPage={(id, key) => loadPageDetail(id, key)}
          />

          {/* Right Column: Unified Editor (Page Info, SEO Settings & Section Content) */}
          <div className="lg:col-span-8">
            {selectedPage ? (
              <form onSubmit={handleSavePageAndContent} className="space-y-6">
                {/* Unified Action Header Bar */}
                <div className="bg-white rounded-2xl border border-ink-100 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-ink-500 font-bold">
                        Route: /{selectedPage.key === "home" ? "" : selectedPage.key}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase",
                          pageIsActive ? "bg-emerald-100 text-emerald-800" : "bg-ink-100 text-ink-600"
                        )}
                      >
                        {pageIsActive ? "Published" : "Draft"}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-ink-900">
                      {cleanTitle || selectedPage.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <a
                      href={selectedPage.key === "home" ? "/" : `/${selectedPage.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-800 text-xs font-bold transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Live
                    </a>

                    <button
                      type="submit"
                      disabled={savingAll || loadingDetail}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-500 text-ink-900 text-xs font-black hover:bg-brand-400 disabled:opacity-50 transition cursor-pointer shadow-xs"
                    >
                      {savingAll ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      Save Page &amp; Content
                    </button>
                  </div>
                </div>

                <PageSeoCard
                  isHome={isHome}
                  siteName={siteName}
                  separator={separator}
                  effectiveTagline={effectiveTagline}
                  pageTitle={pageTitle}
                  setPageTitle={setPageTitle}
                  seoDescription={seoDescription}
                  setSeoDescription={setSeoDescription}
                  ogMediaId={ogMediaId}
                  setOgMediaId={setOgMediaId}
                  ogMedia={ogMedia}
                  setOgMedia={setOgMedia}
                  setOgPickerOpen={setOgPickerOpen}
                  pageIsActive={pageIsActive}
                  setPageIsActive={setPageIsActive}
                  robotsIndex={robotsIndex}
                  setRobotsIndex={setRobotsIndex}
                  previewUrl={previewUrl}
                  previewTitle={previewTitle}
                />

                <PageSectionsCard
                  sections={selectedPage.sections}
                  sectionsState={sectionsState}
                  expandedSections={expandedSections}
                  setExpandedSections={setExpandedSections}
                  setSectionsState={setSectionsState}
                  savingSectionId={savingSectionId}
                  loadingDetail={loadingDetail}
                  handleMoveSection={handleMoveSection}
                  handleToggleSectionVisibility={handleToggleSectionVisibility}
                  handleSectionFieldChange={handleSectionFieldChange}
                  handleSectionJsonChange={handleSectionJsonChange}
                  handleSaveSingleSection={handleSaveSingleSection}
                />

                {/* Bottom Master Save Bar */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingAll || loadingDetail}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-500 text-ink-900 text-sm font-black hover:bg-brand-400 disabled:opacity-50 transition cursor-pointer shadow-md"
                  >
                    {savingAll ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Page &amp; All Sections
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-2xl border border-ink-100 p-12 text-center">
                <FolderOpen className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-ink-900 mb-1">Select a Page</h3>
                <p className="text-xs text-ink-500 max-w-sm mx-auto">
                  Click on any page in the left list to view and edit its basic info, SEO tags, OG image, and section content together in one unified view.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ImagePickerDialog
        open={ogPickerOpen}
        title="Select OpenGraph Share Image"
        module="site"
        onSelect={(media: PickedMedia) => {
          setOgMediaId(media.id);
          setOgMedia({
            path_medium: media.path_medium || undefined,
            path_original: media.path_original,
            title: media.original_name,
          });
          setOgPickerOpen(false);
          toast.success("OG Image selected — click Save Page & Content to persist");
        }}
        onClose={() => setOgPickerOpen(false)}
      />
    </DashboardLayout>
  );
}
