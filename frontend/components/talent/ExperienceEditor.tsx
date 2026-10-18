"use client";

import { Briefcase, Plus, Trash2 } from "lucide-react";

export interface ExperienceItem {
  id?: number;
  role_title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string;
}

interface ExperienceEditorProps {
  experiences: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
}

export function ExperienceEditor({ experiences, onChange }: ExperienceEditorProps) {
  const addExperience = () => {
    onChange([
      ...experiences,
      {
        role_title: "",
        company: "",
        location: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: null,
        is_current: true,
        description: "",
      },
    ]);
  };

  const removeExperience = (idx: number) => {
    onChange(experiences.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof ExperienceItem, value: any) => {
    const updated = [...experiences];
    (updated[idx] as any)[field] = value;
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-ink-100 pb-2.5">
        <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-brand-600" />
          <span>Work Experience ({experiences.length})</span>
        </h3>
        <button
          type="button"
          onClick={addExperience}
          className="text-xs font-bold text-ink-900 hover:text-brand-600 flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-500/20 hover:bg-brand-500/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Experience</span>
        </button>
      </div>

      <div className="space-y-4">
        {experiences.length === 0 ? (
          <p className="text-xs text-ink-400">No work experiences added yet.</p>
        ) : (
          experiences.map((exp, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-ink-50/50 border border-ink-200 space-y-3 relative"
            >
              <button
                type="button"
                onClick={() => removeExperience(idx)}
                className="absolute top-3 right-3 text-ink-400 hover:text-red-600 p-1 transition-colors"
                title="Delete experience"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                <div>
                  <label className="text-[11px] font-bold text-ink-600 uppercase">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Founder & Chief Architect"
                    value={exp.role_title}
                    onChange={(e) => updateItem(idx, "role_title", e.target.value)}
                    className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-600 uppercase">Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PayTrizz"
                    value={exp.company}
                    onChange={(e) => updateItem(idx, "company", e.target.value)}
                    className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-ink-600 uppercase">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Jakarta, ID / Remote"
                    value={exp.location}
                    onChange={(e) => updateItem(idx, "location", e.target.value)}
                    className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-600 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={exp.start_date}
                    onChange={(e) => updateItem(idx, "start_date", e.target.value)}
                    className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-ink-600 uppercase">End Date</label>
                    <label className="flex items-center gap-1 text-[11px] text-ink-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.is_current}
                        onChange={(e) => updateItem(idx, "is_current", e.target.checked)}
                        className="accent-brand-500"
                      />
                      Present
                    </label>
                  </div>
                  <input
                    type="date"
                    disabled={exp.is_current}
                    value={exp.end_date || ""}
                    onChange={(e) => updateItem(idx, "end_date", e.target.value || null)}
                    className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-600 uppercase">Description / Scope of Work</label>
                <textarea
                  rows={2}
                  placeholder="Architected end-to-end talent matching engine, SES webmail infrastructure..."
                  value={exp.description}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                  className="w-full p-2.5 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
