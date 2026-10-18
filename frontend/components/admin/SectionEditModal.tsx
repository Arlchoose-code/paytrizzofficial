"use client";

import { useState } from "react";
import { X, Code, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface PageSectionItem {
  id: number;
  page_id: number;
  key: string;
  type: string;
  content: any;
  sort_order: number;
  is_visible: boolean;
}

interface SectionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: PageSectionItem | null;
  onSuccess: () => void;
}

export function SectionEditModal({
  isOpen,
  onClose,
  section,
  onSuccess,
}: SectionEditModalProps) {
  const [editorTab, setEditorTab] = useState<"friendly" | "json">("friendly");
  const [sectionIsVisible, setSectionIsVisible] = useState(true);
  const [sectionJsonText, setSectionJsonText] = useState("");
  const [friendlyData, setFriendlyData] = useState<Record<string, any>>({});
  const [savingSection, setSavingSection] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [prevSection, setPrevSection] = useState(section);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (section !== prevSection || isOpen !== prevIsOpen) {
    setPrevSection(section);
    setPrevIsOpen(isOpen);
    if (isOpen && section) {
      setSectionIsVisible(section.is_visible);
      setEditorTab("friendly");
      setJsonError(null);

      const contentObj = typeof section.content === "object" && section.content !== null ? section.content : {};
      setFriendlyData(JSON.parse(JSON.stringify(contentObj)));
      setSectionJsonText(JSON.stringify(contentObj, null, 2));
    }
  }

  if (!isOpen || !section) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalJsonString = "";
    if (editorTab === "friendly") {
      finalJsonString = JSON.stringify(friendlyData);
    } else {
      try {
        JSON.parse(sectionJsonText);
        finalJsonString = sectionJsonText;
      } catch (err: any) {
        setJsonError("Invalid JSON syntax: " + err.message);
        return;
      }
    }

    setSavingSection(true);
    try {
      const res = await fetch(`/api/proxy/admin/pages/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: finalJsonString,
          is_visible: sectionIsVisible,
          sort_order: section.sort_order,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success("Section updated successfully");
        onClose();
        onSuccess();
      } else {
        toast.error(json.message || "Failed to save section");
      }
    } catch {
      toast.error("Failed to save section");
    } finally {
      setSavingSection(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-ink-100 space-y-4 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-ink-100 flex-shrink-0">
          <div>
            <h3 className="text-base font-black text-ink-900">
              Edit Section: <span className="font-mono text-brand-600">{section.key}</span>
            </h3>
            <p className="text-[11px] text-ink-500">
              Type: <span className="font-semibold text-ink-800 uppercase">{section.type}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-ink-400 hover:text-ink-900 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switch */}
        <div className="flex items-center gap-2 border-b border-ink-100 pb-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setEditorTab("friendly");
              try {
                setFriendlyData(JSON.parse(sectionJsonText));
              } catch {}
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              editorTab === "friendly"
                ? "bg-brand-500 text-ink-900"
                : "text-ink-600 hover:bg-ink-100"
            )}
          >
            Friendly Visual Form
          </button>
          <button
            type="button"
            onClick={() => {
              setEditorTab("json");
              setSectionJsonText(JSON.stringify(friendlyData, null, 2));
            }}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
              editorTab === "json"
                ? "bg-brand-500 text-ink-900"
                : "text-ink-600 hover:bg-ink-100"
            )}
          >
            <Code className="w-3.5 h-3.5" />
            Raw JSON
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="secVisible"
              checked={sectionIsVisible}
              onChange={(e) => setSectionIsVisible(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="secVisible" className="text-xs font-bold text-ink-900 cursor-pointer">
              Section is Visible to Public Visitors
            </label>
          </div>

          {editorTab === "friendly" ? (
            <div className="space-y-3.5">
              {section.type === "hero" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink-700 mb-1">Eyebrow</label>
                      <input
                        type="text"
                        value={friendlyData.eyebrow || ""}
                        onChange={(e) => setFriendlyData({ ...friendlyData, eyebrow: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-700 mb-1">Highlight Word</label>
                      <input
                        type="text"
                        value={friendlyData.highlight_word || ""}
                        onChange={(e) => setFriendlyData({ ...friendlyData, highlight_word: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink-700 mb-1">Headline Line 1</label>
                      <input
                        type="text"
                        value={friendlyData.headline_line1 || ""}
                        onChange={(e) => setFriendlyData({ ...friendlyData, headline_line1: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-700 mb-1">Headline Line 2</label>
                      <input
                        type="text"
                        value={friendlyData.headline_line2 || ""}
                        onChange={(e) => setFriendlyData({ ...friendlyData, headline_line2: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-700 mb-1">Description Paragraph</label>
                    <textarea
                      rows={3}
                      value={friendlyData.description || ""}
                      onChange={(e) => setFriendlyData({ ...friendlyData, description: e.target.value })}
                      className="w-full p-3 rounded-xl border border-ink-200 text-xs text-ink-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink-700 mb-1">Primary CTA Text</label>
                      <input
                        type="text"
                        value={friendlyData.cta_primary_text || ""}
                        onChange={(e) => setFriendlyData({ ...friendlyData, cta_primary_text: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink-700 mb-1">Primary CTA Link</label>
                      <input
                        type="text"
                        value={friendlyData.cta_primary_link || ""}
                        onChange={(e) => setFriendlyData({ ...friendlyData, cta_primary_link: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
                      />
                    </div>
                  </div>
                </>
              ) : (
                Object.keys(friendlyData).map((key) => {
                  const val = friendlyData[key];
                  if (typeof val === "object") {
                    return (
                      <div key={key}>
                        <label className="block text-xs font-bold text-ink-700 mb-1 uppercase tracking-wider font-mono">
                          {key} (JSON / List)
                        </label>
                        <textarea
                          rows={4}
                          value={JSON.stringify(val, null, 2)}
                          onChange={(e) => {
                            try {
                              setFriendlyData({ ...friendlyData, [key]: JSON.parse(e.target.value) });
                            } catch {}
                          }}
                          className="w-full p-2.5 font-mono text-xs rounded-xl border border-ink-200 bg-ink-50 text-ink-900"
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={key}>
                      <label className="block text-xs font-bold text-ink-700 mb-1 capitalize">
                        {key.replace(/_/g, " ")}
                      </label>
                      <input
                        type="text"
                        value={String(val || "")}
                        onChange={(e) => setFriendlyData({ ...friendlyData, [key]: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
                      />
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-ink-700">JSON Content</label>
                <span className="text-[10px] text-ink-500 font-mono">Format: Raw JSON Object</span>
              </div>
              <textarea
                rows={12}
                value={sectionJsonText}
                onChange={(e) => {
                  setSectionJsonText(e.target.value);
                  setJsonError(null);
                }}
                className="w-full p-3 font-mono text-xs rounded-xl border border-ink-200 bg-ink-50 text-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
              />
              {jsonError && (
                <p className="text-xs font-bold text-danger mt-1">{jsonError}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-ink-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingSection}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-500 text-ink-900 text-xs font-bold hover:bg-brand-400 disabled:opacity-50 cursor-pointer"
            >
              {savingSection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
