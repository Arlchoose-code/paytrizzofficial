"use client";

import { useState } from "react";
import { Plus, Trash2, Briefcase, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SkillItem {
  skill_id: number;
  skill_name: string;
  proficiency: string;
  years: number;
}

export interface CatalogSkill {
  id: number;
  name: string;
  category: string;
}

interface ProfileSkillsTabProps {
  skills: SkillItem[];
  catalog: CatalogSkill[];
  onChange: (skills: SkillItem[]) => void;
}

const PROFICIENCY_OPTIONS = ["expert", "advanced", "intermediate"];

/**
 * Skills manager — talents pick from the admin-managed catalog or type a new
 * skill which the backend auto-adds to the catalog (PRD 4.3).
 */
export function ProfileSkillsTab({ skills, catalog, onChange }: ProfileSkillsTabProps) {
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [proficiency, setProficiency] = useState("expert");
  const [years, setYears] = useState(3);

  const selectedIds = new Set(skills.map((s) => s.skill_id));

  const addFromCatalog = (skill: CatalogSkill) => {
    if (selectedIds.has(skill.id)) {
      onChange(skills.filter((s) => s.skill_id !== skill.id));
      return;
    }
    onChange([
      ...skills,
      { skill_id: skill.id, skill_name: skill.name, proficiency: "advanced", years: 3 },
    ]);
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) {
      toast.error("Type a skill name first");
      return;
    }
    if (skills.some((s) => s.skill_name.toLowerCase() === name.toLowerCase())) {
      toast.error("Skill already added");
      return;
    }
    // skill_id 0 = new skill; the backend resolves or creates it in the catalog
    onChange([...skills, { skill_id: 0, skill_name: name, proficiency, years: Number(years) || 1 }]);
    setCustomName("");
    toast.success(`"${name}" added — it will be saved to the catalog`);
  };

  const updateSkill = (idx: number, patch: Partial<SkillItem>) => {
    onChange(skills.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const filteredCatalog = catalog.filter((c) =>
    search.trim() ? c.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-ink-900" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-ink-900">Skills & Stack</h3>
          <p className="text-xs text-ink-500">
            Pick from the catalog or type a new skill — new ones are added to the company catalog automatically.
          </p>
        </div>
      </div>

      {/* Selected skills with level */}
      <div className="space-y-2.5">
        {skills.length === 0 && (
          <p className="text-xs text-ink-400 text-center py-4 bg-ink-50/50 rounded-2xl border border-dashed border-ink-200">
            No skills yet. Add at least 3 to strengthen your profile.
          </p>
        )}
        {skills.map((s, idx) => (
          <div
            key={`${s.skill_id}-${s.skill_name}-${idx}`}
            className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-ink-50/60 border border-ink-100"
          >
            <span className="text-xs font-bold text-ink-900 min-w-28">{s.skill_name}</span>
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={s.proficiency}
                onChange={(e) => updateSkill(idx, { proficiency: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg border border-ink-200 text-[11px] font-semibold bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
              >
                {PROFICIENCY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={s.years}
                  onChange={(e) => updateSkill(idx, { years: Number(e.target.value) })}
                  className="w-14 px-2 py-1.5 rounded-lg border border-ink-200 text-[11px] text-center font-semibold bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                />
                <span className="text-[10px] text-ink-500 font-semibold">yrs</span>
              </div>
              <button
                type="button"
                onClick={() => onChange(skills.filter((_, i) => i !== idx))}
                className="p-1.5 rounded-lg text-ink-400 hover:text-danger hover:bg-red-50 transition cursor-pointer"
                title="Remove skill"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add from catalog */}
      <div className="space-y-3 pt-2 border-t border-ink-100">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-600">Skill Catalog</p>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog..."
            className="w-full h-10 pl-10 pr-4 text-xs bg-ink-50 border border-ink-100 rounded-xl text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
          />
        </div>
        <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
          {filteredCatalog.map((c) => {
            const selected = selectedIds.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => addFromCatalog(c)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer",
                  selected ? "bg-brand-500 text-ink-900" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                )}
              >
                {selected ? `✓ ${c.name}` : c.name}
              </button>
            );
          })}
          {filteredCatalog.length === 0 && (
            <span className="text-[11px] text-ink-400 px-1">No catalog match — add it as a custom skill below.</span>
          )}
        </div>
      </div>

      {/* Custom skill */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-[#FAFAFA] border border-ink-100">
        <input
          type="text"
          placeholder="Custom skill (e.g. Rust)"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          className="sm:col-span-2 px-3 py-2 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
        />
        <select
          value={proficiency}
          onChange={(e) => setProficiency(e.target.value)}
          className="px-3 py-2 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
        >
          {PROFICIENCY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={40}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
            placeholder="Yrs"
          />
        </div>
        <button
          type="button"
          onClick={addCustom}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Skill
        </button>
      </div>
    </div>
  );
}
