"use client";

import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { PageSectionItem } from "@/app/admin/pages/page";

export interface SectionFormState {
  is_visible: boolean;
  content: any;
  editorMode: "visual" | "json";
  rawJson: string;
  jsonError: string | null;
  isDirty: boolean;
}

interface PageSectionVisualEditorProps {
  sec: PageSectionItem;
  secState: SectionFormState;
  handleSectionFieldChange: (sectionId: number, field: string, value: any) => void;
}

export function PageSectionVisualEditor({
  sec,
  secState,
  handleSectionFieldChange,
}: PageSectionVisualEditorProps) {
  return (
    <div className="space-y-4 bg-white p-4 rounded-xl border border-ink-100">
      {/* 1. HERO SECTION */}
      {sec.type === "hero" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Eyebrow
              </label>
              <input
                type="text"
                value={secState.content?.eyebrow || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "eyebrow", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Highlight Word
              </label>
              <input
                type="text"
                value={secState.content?.highlight_word || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "highlight_word", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Headline Line 1
              </label>
              <input
                type="text"
                value={secState.content?.headline_line1 || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "headline_line1", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Headline Line 2
              </label>
              <input
                type="text"
                value={secState.content?.headline_line2 || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "headline_line2", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">
              Description Paragraph
            </label>
            <textarea
              rows={3}
              value={secState.content?.description || ""}
              onChange={(e) =>
                handleSectionFieldChange(sec.id, "description", e.target.value)
              }
              className="w-full p-3 rounded-xl border border-ink-200 text-xs text-ink-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Primary CTA Text
              </label>
              <input
                type="text"
                value={secState.content?.cta_primary_text || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "cta_primary_text", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Primary CTA Link
              </label>
              <input
                type="text"
                value={secState.content?.cta_primary_link || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "cta_primary_link", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Secondary CTA Text
              </label>
              <input
                type="text"
                value={secState.content?.cta_secondary_text || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "cta_secondary_text", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Secondary CTA Link
              </label>
              <input
                type="text"
                value={secState.content?.cta_secondary_link || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "cta_secondary_link", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">
              Stats Badge Text
            </label>
            <input
              type="text"
              value={secState.content?.stats_badge || ""}
              onChange={(e) =>
                handleSectionFieldChange(sec.id, "stats_badge", e.target.value)
              }
              placeholder="e.g. 50+ vetted specialists"
              className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
            />
          </div>
        </>
      )}

      {/* 2. STATS SECTION (Dynamic Item List) */}
      {sec.type === "stats" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-ink-100">
            <label className="text-xs font-bold text-ink-800">
              Stat Counter Items ({secState.content?.items?.length || 0})
            </label>
            <button
              type="button"
              onClick={() => {
                const items = Array.isArray(secState.content?.items)
                  ? [...secState.content.items]
                  : [];
                items.push({ number: "100+", label: "New Stat" });
                handleSectionFieldChange(sec.id, "items", items);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-900 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Stat
            </button>
          </div>

          {(secState.content?.items || []).map((item: any, itemIdx: number) => (
            <div
              key={itemIdx}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-ink-100 bg-ink-50/50"
            >
              <div className="w-1/3">
                <label className="block text-[10px] font-bold text-ink-500 mb-0.5">
                  Metric Number
                </label>
                <input
                  type="text"
                  value={item.number || ""}
                  onChange={(e) => {
                    const items = [...(secState.content?.items || [])];
                    items[itemIdx] = { ...items[itemIdx], number: e.target.value };
                    handleSectionFieldChange(sec.id, "items", items);
                  }}
                  placeholder="e.g. 50+"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-ink-200 text-xs font-bold bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-ink-500 mb-0.5">
                  Label / Description
                </label>
                <input
                  type="text"
                  value={item.label || ""}
                  onChange={(e) => {
                    const items = [...(secState.content?.items || [])];
                    items[itemIdx] = { ...items[itemIdx], label: e.target.value };
                    handleSectionFieldChange(sec.id, "items", items);
                  }}
                  placeholder="e.g. Talents"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-ink-200 text-xs bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const items = (secState.content?.items || []).filter(
                    (_: any, i: number) => i !== itemIdx
                  );
                  handleSectionFieldChange(sec.id, "items", items);
                }}
                className="p-2 text-ink-400 hover:text-red-600 rounded-lg cursor-pointer mt-3"
                title="Delete Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 3. STEPS / PROCESS SECTION */}
      {sec.type === "steps" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Eyebrow
              </label>
              <input
                type="text"
                value={secState.content?.eyebrow || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "eyebrow", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={secState.content?.title || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "title", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 pb-1 border-b border-ink-100">
            <label className="text-xs font-bold text-ink-800">
              Collaboration Steps ({secState.content?.steps?.length || 0})
            </label>
            <button
              type="button"
              onClick={() => {
                const steps = Array.isArray(secState.content?.steps)
                  ? [...secState.content.steps]
                  : [];
                steps.push({
                  step: steps.length + 1,
                  title: "New Step",
                  description: "Step details here.",
                });
                handleSectionFieldChange(sec.id, "steps", steps);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-900 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Step
            </button>
          </div>

          {(secState.content?.steps || []).map((stepItem: any, stepIdx: number) => (
            <div
              key={stepIdx}
              className="p-3 rounded-xl border border-ink-100 bg-ink-50/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-ink-500 uppercase">
                  Step #{stepItem.step || stepIdx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const steps = (secState.content?.steps || []).filter(
                      (_: any, i: number) => i !== stepIdx
                    );
                    handleSectionFieldChange(sec.id, "steps", steps);
                  }}
                  className="text-ink-400 hover:text-red-600 p-1 cursor-pointer"
                  title="Delete Step"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-1">
                  <input
                    type="number"
                    value={stepItem.step || stepIdx + 1}
                    onChange={(e) => {
                      const steps = [...(secState.content?.steps || [])];
                      steps[stepIdx] = {
                        ...steps[stepIdx],
                        step: Number(e.target.value),
                      };
                      handleSectionFieldChange(sec.id, "steps", steps);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-ink-200 text-xs font-bold bg-white"
                    placeholder="Step #"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={stepItem.title || ""}
                    onChange={(e) => {
                      const steps = [...(secState.content?.steps || [])];
                      steps[stepIdx] = {
                        ...steps[stepIdx],
                        title: e.target.value,
                      };
                      handleSectionFieldChange(sec.id, "steps", steps);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-ink-200 text-xs font-semibold bg-white"
                    placeholder="Step Title"
                  />
                </div>
              </div>
              <textarea
                rows={2}
                value={stepItem.description || ""}
                onChange={(e) => {
                  const steps = [...(secState.content?.steps || [])];
                  steps[stepIdx] = {
                    ...steps[stepIdx],
                    description: e.target.value,
                  };
                  handleSectionFieldChange(sec.id, "steps", steps);
                }}
                className="w-full p-2.5 rounded-lg border border-ink-200 text-xs bg-white"
                placeholder="Step Description"
              />
            </div>
          ))}
        </div>
      )}

      {/* 4. CTA SECTION */}
      {sec.type === "cta" && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={secState.content?.title || ""}
              onChange={(e) =>
                handleSectionFieldChange(sec.id, "title", e.target.value)
              }
              className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">
              Subtitle
            </label>
            <textarea
              rows={2}
              value={secState.content?.subtitle || ""}
              onChange={(e) =>
                handleSectionFieldChange(sec.id, "subtitle", e.target.value)
              }
              className="w-full p-2.5 rounded-xl border border-ink-200 text-xs text-ink-900"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Button Text
              </label>
              <input
                type="text"
                value={secState.content?.button_text || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "button_text", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Button Link
              </label>
              <input
                type="text"
                value={secState.content?.button_link || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "button_link", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. SERVICES GRID OR FAQ */}
      {(sec.type === "services_grid" || sec.type === "faq") && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Eyebrow
              </label>
              <input
                type="text"
                value={secState.content?.eyebrow || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "eyebrow", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={secState.content?.title || ""}
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, "title", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">
              Subtitle
            </label>
            <textarea
              rows={2}
              value={secState.content?.subtitle || ""}
              onChange={(e) =>
                handleSectionFieldChange(sec.id, "subtitle", e.target.value)
              }
              className="w-full p-2.5 rounded-xl border border-ink-200 text-xs text-ink-900"
            />
          </div>
        </div>
      )}

      {/* 6. GENERIC FALLBACK FOR ANY OTHER CUSTOM SECTION TYPE */}
      {sec.type !== "hero" &&
        sec.type !== "stats" &&
        sec.type !== "steps" &&
        sec.type !== "cta" &&
        sec.type !== "services_grid" &&
        sec.type !== "faq" &&
        Object.keys(secState.content || {}).map((key) => {
          const val = secState.content[key];
          if (typeof val === "object") {
            return (
              <div key={key}>
                <label className="block text-xs font-bold text-ink-700 mb-1 uppercase tracking-wider font-mono">
                  {key} (JSON)
                </label>
                <textarea
                  rows={4}
                  defaultValue={JSON.stringify(val, null, 2)}
                  onBlur={(e) => {
                    try {
                      handleSectionFieldChange(
                        sec.id,
                        key,
                        JSON.parse(e.target.value)
                      );
                    } catch (err: any) {
                      toast.error("Invalid JSON: " + err.message);
                    }
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
                onChange={(e) =>
                  handleSectionFieldChange(sec.id, key, e.target.value)
                }
                className="w-full px-3.5 py-2 rounded-xl border border-ink-200 text-xs text-ink-900"
              />
            </div>
          );
        })}
    </div>
  );
}
