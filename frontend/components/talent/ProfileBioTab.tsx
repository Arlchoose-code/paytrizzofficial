"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileBioTabProps {
  bio: string;
  setBio: (v: string) => void;
  allSpecialties: any[];
  specialtyIDs: number[];
  toggleSpecialty: (id: number) => void;
  maxSpecialties?: number;
}

export function ProfileBioTab({
  bio,
  setBio,
  allSpecialties,
  specialtyIDs,
  toggleSpecialty,
  maxSpecialties = 3,
}: ProfileBioTabProps) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-6">
      <h3 className="text-sm font-bold text-ink-900 border-b border-ink-100 pb-3">
        Biography &amp; Specialties
      </h3>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
          Biography
        </label>
        <textarea
          rows={7}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Share your background, leadership experience, and the kinds of projects you love..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
        />
        <p className="text-[11px] text-ink-500 mt-1">{bio.length} characters</p>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-2">
          Specialties{" "}
          <span className="normal-case font-semibold text-ink-500">
            (max {maxSpecialties}; first pick = primary)
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {allSpecialties.map((s) => {
            const idx = specialtyIDs.indexOf(s.id);
            const selected = idx !== -1;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSpecialty(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer",
                  selected
                    ? "bg-brand-500 text-ink-900 shadow-xs"
                    : "bg-neutral-100 text-ink-600 hover:bg-neutral-200"
                )}
              >
                {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{s.name}</span>
                {selected && idx === 0 && (
                  <span className="px-1.5 py-px rounded-full bg-ink-900 text-white text-[9px] font-extrabold uppercase">
                    Primary
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
