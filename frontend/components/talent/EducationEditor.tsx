"use client";

import { GraduationCap, Plus, Trash2 } from "lucide-react";

export interface EducationItem {
  id?: number;
  degree: string;
  institution: string;
  field_of_study: string;
  start_year: number;
  end_year: number | null;
}

interface EducationEditorProps {
  educations: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}

export function EducationEditor({ educations, onChange }: EducationEditorProps) {
  const addEducation = () => {
    onChange([
      {
        degree: "",
        institution: "",
        field_of_study: "",
        start_year: new Date().getFullYear() - 4,
        end_year: new Date().getFullYear(),
      },
      ...educations,
    ]);
  };

  const removeEducation = (idx: number) => {
    onChange(educations.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof EducationItem, value: any) => {
    const updated = [...educations];
    (updated[idx] as any)[field] = value;
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-ink-100 pb-2.5">
        <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-brand-600" />
          <span>Education ({educations.length})</span>
        </h3>
        <button
          type="button"
          onClick={addEducation}
          className="text-xs font-bold text-ink-900 hover:text-brand-600 flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-500/20 hover:bg-brand-500/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Education</span>
        </button>
      </div>

      <div className="space-y-4">
        {educations.length === 0 ? (
          <p className="text-xs text-ink-400">No education entries added yet.</p>
        ) : (
          educations.map((edu, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-ink-50/50 border border-ink-200 space-y-3 relative"
            >
              <button
                type="button"
                onClick={() => removeEducation(idx)}
                className="absolute top-3 right-3 text-ink-400 hover:text-red-600 p-1 transition-colors"
                title="Delete education"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                <div>
                  <label className="text-[11px] font-bold text-ink-600 uppercase">Degree / Qualification *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bachelor of Science in Computer Science"
                    value={edu.degree}
                    onChange={(e) => updateItem(idx, "degree", e.target.value)}
                    className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-600 uppercase">Institution / University *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Universitas Indonesia"
                    value={edu.institution}
                    onChange={(e) => updateItem(idx, "institution", e.target.value)}
                    className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-ink-600 uppercase">Field of Study</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science / Software Engineering"
                    value={edu.field_of_study}
                    onChange={(e) => updateItem(idx, "field_of_study", e.target.value)}
                    className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-600 uppercase">Start Year</label>
                  <input
                    type="number"
                    min={1970}
                    max={2040}
                    placeholder="2010"
                    value={edu.start_year}
                    onChange={(e) => updateItem(idx, "start_year", Number(e.target.value))}
                    className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-600 uppercase">Graduation / End Year</label>
                  <input
                    type="number"
                    min={1970}
                    max={2040}
                    placeholder="2014"
                    value={edu.end_year || ""}
                    onChange={(e) => updateItem(idx, "end_year", e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
