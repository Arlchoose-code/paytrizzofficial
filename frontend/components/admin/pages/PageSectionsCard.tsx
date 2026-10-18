"use client";

import {
  Layers,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Sparkles,
  Code,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PageSectionVisualEditor,
  SectionFormState,
} from "./PageSectionVisualEditor";
import type { PageSectionItem } from "@/app/admin/pages/page";

interface PageSectionsCardProps {
  sections: PageSectionItem[];
  sectionsState: Record<number, SectionFormState>;
  expandedSections: Record<number, boolean>;
  setExpandedSections: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setSectionsState: React.Dispatch<React.SetStateAction<Record<number, SectionFormState>>>;
  savingSectionId: number | null;
  loadingDetail: boolean;
  handleMoveSection: (index: number, direction: "up" | "down") => void;
  handleToggleSectionVisibility: (sectionId: number, isVisible: boolean) => void;
  handleSectionFieldChange: (sectionId: number, field: string, value: any) => void;
  handleSectionJsonChange: (sectionId: number, newJsonText: string) => void;
  handleSaveSingleSection: (sec: PageSectionItem) => void;
}

export function PageSectionsCard({
  sections,
  sectionsState,
  expandedSections,
  setExpandedSections,
  setSectionsState,
  savingSectionId,
  loadingDetail,
  handleMoveSection,
  handleToggleSectionVisibility,
  handleSectionFieldChange,
  handleSectionJsonChange,
  handleSaveSingleSection,
}: PageSectionsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-6 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-ink-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
            <Layers className="w-4 h-4 text-ink-900" />
          </div>
          <div>
            <h3 className="text-sm font-black text-ink-900">
              Page Content &amp; Sections ({sections?.length || 0})
            </h3>
            <p className="text-[11px] text-ink-500">
              Edit section content directly inline without opening separate popup dialogs.
            </p>
          </div>
        </div>
      </div>

      {loadingDetail ? (
        <div className="p-8 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-ink-500 mx-auto mb-2" />
          <p className="text-xs text-ink-500 font-medium">Loading section details...</p>
        </div>
      ) : sections?.length === 0 ? (
        <div className="p-8 text-center bg-ink-50/50 rounded-2xl border border-ink-100">
          <p className="text-xs font-bold text-ink-700">No content sections found for this page</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sec, idx) => {
            const secState = sectionsState[sec.id] || {
              is_visible: sec.is_visible,
              content: sec.content,
              editorMode: "visual",
              rawJson: JSON.stringify(sec.content, null, 2),
              jsonError: null,
              isDirty: false,
            };
            const isExpanded = !!expandedSections[sec.id];
            const isSavingThis = savingSectionId === sec.id;

            return (
              <div
                key={sec.id}
                className={cn(
                  "rounded-2xl border transition-all overflow-hidden",
                  isExpanded
                    ? "border-ink-200 ring-1 ring-ink-200 bg-white shadow-xs"
                    : "border-ink-100 bg-white hover:border-ink-200"
                )}
              >
                {/* Section Header Accordion */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
                  <div
                    onClick={() =>
                      setExpandedSections((prev) => ({
                        ...prev,
                        [sec.id]: !prev[sec.id],
                      }))
                    }
                    className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                  >
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-ink-100 text-ink-800 uppercase tracking-wider font-mono">
                      #{sec.sort_order} {sec.type}
                    </span>
                    <span className="text-xs font-bold text-ink-900 truncate">{sec.key}</span>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                        secState.is_visible
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-ink-200 text-ink-700"
                      )}
                    >
                      {secState.is_visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                      {secState.is_visible ? "Visible" : "Hidden"}
                    </span>

                    {secState.isDirty && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        Unsaved
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end md:self-auto">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, "up")}
                      className="p-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMoveSection(idx, "down")}
                      className="p-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSections((prev) => ({
                          ...prev,
                          [sec.id]: !prev[sec.id],
                        }))
                      }
                      className="p-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100 cursor-pointer"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      <ChevronDown
                        className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")}
                      />
                    </button>
                  </div>
                </div>

                {/* Section Inline Editor Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-ink-100 bg-ink-50/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-ink-100">
                      {/* Visibility toggle inside editor */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={secState.is_visible}
                          onChange={(e) =>
                            handleToggleSectionVisibility(sec.id, e.target.checked)
                          }
                          className="w-4 h-4 rounded text-brand-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-ink-900">
                          Section Visible on Website
                        </span>
                      </label>

                      {/* Editor Mode Tabs */}
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-ink-200">
                        <button
                          type="button"
                          onClick={() =>
                            setSectionsState((prev) => ({
                              ...prev,
                              [sec.id]: { ...prev[sec.id], editorMode: "visual" },
                            }))
                          }
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-bold transition",
                            secState.editorMode === "visual"
                              ? "bg-brand-500 text-ink-900 shadow-xs"
                              : "text-ink-600 hover:text-ink-900"
                          )}
                        >
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          Visual Fields
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSectionsState((prev) => ({
                              ...prev,
                              [sec.id]: { ...prev[sec.id], editorMode: "json" },
                            }))
                          }
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-bold transition",
                            secState.editorMode === "json"
                              ? "bg-brand-500 text-ink-900 shadow-xs"
                              : "text-ink-600 hover:text-ink-900"
                          )}
                        >
                          <Code className="w-3 h-3 inline mr-1" />
                          Raw JSON
                        </button>
                      </div>
                    </div>

                    {/* Form Fields according to section type */}
                    {secState.editorMode === "visual" ? (
                      <PageSectionVisualEditor
                        sec={sec}
                        secState={secState}
                        handleSectionFieldChange={handleSectionFieldChange}
                      />
                    ) : (
                      <div className="space-y-1">
                        <textarea
                          rows={10}
                          value={secState.rawJson}
                          onChange={(e) => handleSectionJsonChange(sec.id, e.target.value)}
                          className="w-full p-3 font-mono text-xs rounded-xl border border-ink-200 bg-white text-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
                        />
                        {secState.jsonError && (
                          <p className="text-xs font-bold text-red-600">
                            JSON Error: {secState.jsonError}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-ink-400">
                        {secState.isDirty ? "Section has unsaved changes" : "Section synchronized"}
                      </span>

                      <button
                        type="button"
                        disabled={isSavingThis}
                        onClick={() => handleSaveSingleSection(sec)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-ink-900 text-white text-xs font-bold hover:bg-black transition cursor-pointer"
                      >
                        {isSavingThis ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-brand-400" />
                        )}
                        Quick Save Section
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
