"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MapPin,
  ShieldCheck,
  Zap,
} from "lucide-react";

export interface TalentShowcaseItem {
  id: number;
  slug: string;
  name: string;
  headline?: string;
  avatar_url?: string;
  avatar_initials?: string;
  location?: string;
  years_experience?: number;
  hourly_rate_usd?: number;
  availability?: string;
  badges?: string[];
  skills?: string[];
  highlight?: string;
}

interface HeroTalentShowcaseProps {
  initialTalents?: TalentShowcaseItem[];
}

export function HeroTalentShowcase({ initialTalents = [] }: HeroTalentShowcaseProps) {
  const [talents, setTalents] = useState<TalentShowcaseItem[]>(initialTalents);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch real talent data live from API to ensure 100% dynamic data from DB
  useEffect(() => {
    async function loadRealTalents() {
      try {
        const res = await fetch("/api/proxy/talents?per_page=10");
        if (res.ok) {
          const json = await res.json();
          const list = json.data?.data || [];
          if (list.length > 0) {
            const mapped: TalentShowcaseItem[] = list.map((t: any) => ({
              id: t.id,
              slug: t.slug,
              name: t.name,
              headline: t.headline || "Senior Specialist",
              avatar_url: t.avatar_url || t.avatar_media?.path_medium || t.avatar_media?.path_original || "",
              avatar_initials: t.name
                ? t.name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "PT",
              location: t.location || "Remote",
              years_experience: t.years_experience || 5,
              hourly_rate_usd: t.hourly_rate_usd || 90,
              availability:
                t.availability === "available"
                  ? "Available for Sprints"
                  : "Next Sprint Window",
              badges: t.badges?.map((b: any) => b.label) || [],
              skills: t.skills?.map((s: any) => s.skill_name) || [],
              highlight: t.bio || "Senior vetted specialist ready for immediate squad delivery.",
            }));
            setTalents(mapped);
          }
        }
      } catch {
        // Fallback to initial talents if offline
      }
    }

    loadRealTalents();
  }, []);

  // Auto rotation timer
  useEffect(() => {
    if (isPaused || talents.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % talents.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, talents.length]);

  if (talents.length === 0) return null;

  const activeTalent = talents[currentIndex] || talents[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + talents.length) % talents.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % talents.length);
  };

  return (
    <div
      className="relative w-full max-w-full select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Stacking Cards (Physical Depth, mobile-safe rotation) */}
      <div className="absolute inset-0 bg-neutral-100 border-2 border-neutral-300 rounded-[28px] rotate-1 sm:rotate-2 scale-[0.98] translate-y-2 pointer-events-none" />
      <div className="absolute inset-0 bg-brand-50 border-2 border-brand-200 rounded-[28px] -rotate-0.5 sm:-rotate-1 scale-[0.99] translate-y-1 pointer-events-none" />

      {/* Main Foreground Card (Responsive height & robust flex wrapping) */}
      <div className="relative bg-white border-2 border-ink-900 rounded-[28px] p-4 sm:p-6 shadow-[0_12px_36px_rgba(29,32,35,0.08)] min-h-[455px] flex flex-col justify-between overflow-hidden">
        {/* Section 1: Live Availability Pill & Vetted Badge */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-100 min-h-8 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-[210px]">
              {activeTalent.availability || "Available for Sprints"}
            </span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500 text-ink-900 text-[11px] font-extrabold border border-brand-600 shadow-2xs flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Vetted Bench</span>
          </div>
        </div>

        {/* Section 2: Talent Identity & Avatar */}
        <div className="flex items-start gap-3 sm:gap-3.5 py-1 min-h-[60px] flex-shrink-0">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-brand-500 text-ink-900 font-black text-base sm:text-lg flex items-center justify-center border-2 border-ink-900 shadow-xs overflow-hidden">
              {activeTalent.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeTalent.avatar_url}
                  alt={activeTalent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{activeTalent.avatar_initials || activeTalent.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-ink-900 text-brand-500 flex items-center justify-center border-2 border-white shadow-xs">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <h3 className="text-base sm:text-lg font-black text-ink-900 tracking-tight truncate flex-1 min-w-0" title={activeTalent.name}>
                {activeTalent.name}
              </h3>
              {activeTalent.badges && activeTalent.badges[0] && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200 flex-shrink-0 whitespace-nowrap">
                  {activeTalent.badges[0]}
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-neutral-600 truncate mt-0.5">
              {activeTalent.headline}
            </p>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-neutral-500 mt-1 font-medium min-w-0">
              {activeTalent.location && (
                <span className="inline-flex items-center gap-1 min-w-0 truncate max-w-[90px] sm:max-w-[130px]">
                  <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                  <span className="truncate">{activeTalent.location}</span>
                </span>
              )}
              {activeTalent.years_experience && (
                <span className="flex-shrink-0">• {activeTalent.years_experience}+ yrs</span>
              )}
              {activeTalent.hourly_rate_usd && (
                <span className="font-extrabold text-ink-900 bg-brand-100 px-2 py-0.5 rounded text-[11px] border border-brand-200 flex-shrink-0">
                  ${activeTalent.hourly_rate_usd}/hr
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Highlight / Bio Box */}
        <div className="min-h-[68px] sm:min-h-[74px] flex items-center p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 overflow-hidden flex-shrink-0 my-1">
          <p className="text-xs text-ink-800 font-medium leading-relaxed line-clamp-3 break-words">
            &ldquo;{activeTalent.highlight}&rdquo;
          </p>
        </div>

        {/* Section 4: Tech Stack Chips */}
        <div className="min-h-[48px] sm:min-h-[52px] flex flex-col justify-center flex-shrink-0 my-0.5">
          <div className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
            Core Tech Stack & Strengths
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-[30px] overflow-hidden items-center">
            {(activeTalent.skills && activeTalent.skills.length > 0
              ? activeTalent.skills
              : ["Architecture", "Engineering", "Scale"]
            )
              .slice(0, 4)
              .map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 sm:px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white text-ink-900 border border-neutral-200 shadow-2xs whitespace-nowrap"
                >
                  {skill}
                </span>
              ))}
          </div>
        </div>

        {/* Section 5: Key Delivery Stats Row */}
        <div className="min-h-[50px] sm:min-h-[54px] grid grid-cols-3 gap-1 sm:gap-2 p-2 rounded-2xl bg-brand-50 border border-brand-200 text-center items-center flex-shrink-0 my-0.5">
          <div>
            <div className="text-sm sm:text-base font-black text-ink-900 leading-none">100%</div>
            <div className="text-[9px] font-bold text-neutral-600 uppercase mt-0.5">Success Rate</div>
          </div>
          <div className="border-x border-brand-200">
            <div className="text-sm sm:text-base font-black text-ink-900 leading-none">24-48h</div>
            <div className="text-[9px] font-bold text-neutral-600 uppercase mt-0.5">Match Speed</div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-black text-ink-900 leading-none">Audited</div>
            <div className="text-[9px] font-bold text-neutral-600 uppercase mt-0.5">Code Review</div>
          </div>
        </div>

        {/* Section 6: Card Footer (View Profile & Controls) */}
        <div className="pt-2 sm:pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2 min-h-[44px] flex-shrink-0">
          <Link
            href={`/talents/${activeTalent.slug}`}
            className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-ink-900 font-extrabold text-xs px-3.5 sm:px-4 py-2 rounded-full transition-all shadow-xs active:scale-[0.98] flex-shrink-0"
          >
            <span>View Full Profile</span>
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
          </Link>

          {/* Carousel Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1 mr-0.5 sm:mr-1">
              {talents.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Show talent ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx
                      ? "w-4 sm:w-5 bg-brand-500 border border-brand-600"
                      : "w-2 bg-neutral-200 hover:bg-neutral-300"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handlePrev}
              title="Previous talent"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition cursor-pointer border border-neutral-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              title="Next talent"
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition cursor-pointer border border-neutral-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Micro Badge at Bottom Right (mobile-safe inside alignment) */}
      <div className="absolute -bottom-2.5 right-1 sm:-right-2 bg-ink-900 text-brand-500 font-extrabold text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 rounded-full border-2 border-white shadow-md flex items-center gap-1.5 z-20 pointer-events-none">
        <Zap className="w-3 h-3 text-brand-400 fill-brand-400 flex-shrink-0" />
        <span>Live Vetted Talent Bench</span>
      </div>
    </div>
  );
}
