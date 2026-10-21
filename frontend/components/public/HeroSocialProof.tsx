"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export interface HeroSocialProofItem {
  id: number;
  name: string;
  avatar_initials?: string;
}

interface HeroSocialProofProps {
  initialTalents?: HeroSocialProofItem[];
  initialTotal?: number;
}

export function HeroSocialProof({ initialTalents = [], initialTotal = 3 }: HeroSocialProofProps) {
  const [talents, setTalents] = useState<HeroSocialProofItem[]>(initialTalents);
  const [total, setTotal] = useState<number>(initialTotal);

  useEffect(() => {
    fetch("/api/proxy/talents?per_page=6")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const raw = json.data.data || [];
          if (json.data.total !== undefined) {
            setTotal(json.data.total);
          }
          if (raw.length > 0) {
            setTalents(
              raw.map((t: any) => ({
                id: t.id,
                name: t.name,
                avatar_initials: t.name
                  ? t.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "PT",
              }))
            );
          }
        }
      })
      .catch(() => {});
  }, []);

  const previewAvatars = talents.slice(0, 3);
  const badgeClasses = [
    "bg-brand-500 text-ink-900",
    "bg-ink-900 text-brand-500",
    "bg-brand-400 text-ink-900",
  ];

  return (
    <div className="pt-6 sm:pt-8 border-t border-brand-200/70 flex flex-wrap items-center gap-4 text-sm text-ink-700">
      <div className="flex -space-x-2 items-center">
        {previewAvatars.map((item, idx) => (
          <div
            key={item.id}
            title={item.name}
            className={`h-9 w-9 rounded-full ring-2 ring-white font-extrabold text-xs flex items-center justify-center shadow-xs ${
              badgeClasses[idx % badgeClasses.length]
            }`}
          >
            {item.avatar_initials}
          </div>
        ))}
        <div className="h-9 w-9 rounded-full ring-2 ring-white bg-neutral-800 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
          +{total}
        </div>
      </div>
      <div className="flex items-center gap-1.5 font-bold text-ink-900 min-w-0">
        <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
        <span className="text-xs sm:text-sm leading-snug">{total}+ vetted talents ready for immediate squad onboarding</span>
      </div>
    </div>
  );
}
