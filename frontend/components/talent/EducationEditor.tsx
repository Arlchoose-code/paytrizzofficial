"use client";

import React from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { ItemSkillsEditor, ItemMediaEditor, type ItemMediaAttachment } from "./ItemSkillsMediaEditor";

export interface EducationItem {
  id?: number;
  degree: string;
  institution: string;
  field_of_study: string;
  start_year: number;
  end_year: number | null;
  grade?: string;
  activities?: string;
  description?: string;
  skills?: string;
  media?: string;
}

interface EducationEditorProps {
  educations: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}

function parseJSON<T>(str: any, fallback: T): T {
  if (!str) return fallback;
  if (typeof str !== "string") return str as T;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function EducationEditor({ educations = [], onChange }: EducationEditorProps) {
  const addEducation = () => {
    onChange([
      {
        degree: "",
        institution: "",
        field_of_study: "",
        start_year: new Date().getFullYear() - 4,
        end_year: new Date().getFullYear(),
        grade: "",
        activities: "",
        description: "",
        skills: "[]",
        media: "[]",
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
          className="text-xs font-bold text-ink-900 hover:text-brand-600 flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-500/20 hover:bg-brand-500/30 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Education</span>
        </button>
      </div>

      <div className="space-y-4">
        {educations.length === 0 ? (
          <p className="text-xs text-ink-400">No education entries added yet.</p>
        ) : (
          educations.map((edu, idx) => {
            const parsedSkills: string[] = parseJSON(edu.skills, []);
            const parsedMedia: ItemMediaAttachment[] = parseJSON(edu.media, []);

            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-ink-50/50 border border-ink-200 space-y-4 relative"
              >
                <button
                  type="button"
                  onClick={() => removeEducation(idx)}
                  className="absolute top-4 right-4 text-ink-400 hover:text-danger p-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  title="Delete education"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase">
                      School / University *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Universitas Indonesia, Boston University"
                      value={edu.institution}
                      onChange={(e) => updateItem(idx, "institution", e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase">
                      Degree / Qualification *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bachelor of Science, Master of Computer Science"
                      value={edu.degree}
                      onChange={(e) => updateItem(idx, "degree", e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineering, Informatics"
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
                      placeholder="2016"
                      value={edu.start_year}
                      onChange={(e) => updateItem(idx, "start_year", Number(e.target.value))}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase">
                      End Year (or Expected)
                    </label>
                    <input
                      type="number"
                      min={1970}
                      max={2040}
                      placeholder="2020"
                      value={edu.end_year || ""}
                      onChange={(e) =>
                        updateItem(idx, "end_year", e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase">Grade (GPA / Honors)</label>
                    <input
                      type="text"
                      placeholder="e.g. 3.85 / 4.00, Magna Cum Laude"
                      value={edu.grade || ""}
                      onChange={(e) => updateItem(idx, "grade", e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-600 uppercase">Activities & Societies</label>
                    <input
                      type="text"
                      placeholder="e.g. Robotics Club, ACM ICPC Competitive Programming"
                      value={edu.activities || ""}
                      onChange={(e) => updateItem(idx, "activities", e.target.value)}
                      className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-600 uppercase">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Relevant coursework, academic research, final thesis or capstone project..."
                    value={edu.description || ""}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    className="w-full p-2.5 mt-1 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                  />
                </div>

                {/* Skills */}
                <ItemSkillsEditor
                  skills={parsedSkills}
                  onChange={(newSkills) => updateItem(idx, "skills", JSON.stringify(newSkills))}
                  label="Skills (academic & practical competencies developed)"
                />

                {/* Media */}
                <ItemMediaEditor
                  media={parsedMedia}
                  onChange={(newMedia) => updateItem(idx, "media", JSON.stringify(newMedia))}
                  label="Media (diploma, academic publications, transcripts or project proofs)"
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
