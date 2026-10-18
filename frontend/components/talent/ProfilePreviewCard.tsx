"use client";

import { MapPin, Briefcase, Clock, ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProfilePreviewData {
  name: string;
  headline: string;
  location: string;
  yearsExperience: number;
  availability: string;
  avatarUrl: string;
  specialties: string[];
  badges: { id: number; label: string; color: string }[];
  isPublished: boolean;
  isFeatured: boolean;
}

const AVAILABILITY_STYLE: Record<string, { dot: string; label: string }> = {
  available: { dot: "bg-emerald-500", label: "Available" },
  limited: { dot: "bg-brand-500", label: "Limited" },
  unavailable: { dot: "bg-ink-400", label: "Unavailable" },
};

/**
 * Live preview of the public talent card shown while editing the profile (UI_REFERENCE 6.5).
 */
export function ProfilePreviewCard({ data }: { data: ProfilePreviewData }) {
  const availability = AVAILABILITY_STYLE[data.availability] || AVAILABILITY_STYLE.available;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">Live Preview</h3>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
            data.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-ink-100 text-ink-600"
          )}
        >
          {data.isPublished ? "Published" : "Hidden"}
        </span>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-ink-100 shadow-sm overflow-hidden">
        <div className="aspect-[4/5] bg-ink-100 relative">
          {data.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatarUrl} alt={data.name || "Talent"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-300">
              <span className="text-5xl font-extrabold">{data.name?.[0]?.toUpperCase() || "?"}</span>
            </div>
          )}

          {/* Badges overlay */}
          {data.badges.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
              {data.badges.slice(0, 3).map((b) => (
                <span
                  key={b.id}
                  className="px-2.5 py-1 rounded-full text-[10px] font-extrabold text-ink-900 backdrop-blur-sm border border-white/40"
                  style={{ backgroundColor: b.color }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {data.isFeatured && (
            <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-ink-900 text-brand-500 text-[10px] font-extrabold uppercase">
              Featured
            </span>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div>
            <h4 className="font-extrabold text-ink-900 truncate">{data.name || "Your Name"}</h4>
            <p className="text-xs text-ink-500 line-clamp-2 mt-0.5">
              {data.headline || "Your professional headline appears here"}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {data.specialties.length > 0 ? (
              data.specialties.slice(0, 3).map((s, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded-full bg-brand-100 text-ink-900 text-[10px] font-bold">
                  {s}
                </span>
              ))
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-ink-100 text-ink-400 text-[10px] font-bold">
                Specialty
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-ink-500 pt-1 border-t border-ink-100">
            {data.location && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" /> {data.location}
              </span>
            )}
            {data.yearsExperience > 0 && (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> {data.yearsExperience} yrs
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 ml-auto whitespace-nowrap">
              <span className={cn("w-2 h-2 rounded-full", availability.dot)} />
              {availability.label}
            </span>
          </div>
        </div>
      </div>

      {/* Locked info */}
      <div className="bg-ink-50 rounded-2xl border border-ink-100 p-4 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink-500">Managed by Admin</p>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-500">Login email</span>
            <span className="inline-flex items-center gap-1 font-bold text-ink-900 truncate">
              <Lock className="w-3 h-3 flex-shrink-0" /> Contact admin to change
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-500">Badges</span>
            <span className="inline-flex items-center gap-1 font-bold text-ink-900">
              <ShieldCheck className="w-3 h-3" /> Assigned by admin
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-500">Directory status</span>
            <span className="inline-flex items-center gap-1 font-bold text-ink-900">
              <Clock className="w-3 h-3" /> {data.isPublished ? "Visible publicly" : "Hidden by admin"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
