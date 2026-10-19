import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn, getBadgeColorStyle } from "@/lib/utils";
import { DynamicIcon } from "@/components/shared/DynamicIcon";

export interface TalentBadgeData {
  id: number;
  key: string;
  label: string;
  color: string;
  icon: string;
  sort_order?: number;
}

export interface TalentCardProps {
  slug: string;
  name: string;
  headline: string;
  avatarUrl?: string | null;
  location?: string;
  availability: "available" | "limited" | "unavailable" | string;
  isFeatured?: boolean;
  badges?: TalentBadgeData[];
  specialties?: Array<{ id: number; key: string; name: string }>;
  skills?: Array<{ skill_id: number; skill_name: string }>;
}

export function TalentCard({
  slug,
  name,
  headline,
  avatarUrl,
  availability,
  badges = [],
  specialties = [],
  skills = [],
}: TalentCardProps) {
  const sortedBadges = [...badges].sort(
    (a, b) => ((a as any).sort_order ?? 0) - ((b as any).sort_order ?? 0)
  );
  const topBadge = sortedBadges.length > 0 ? sortedBadges[0] : null;

  const availabilityColor =
    availability === "available"
      ? "bg-emerald-500"
      : availability === "limited"
      ? "bg-brand-500"
      : "bg-neutral-400";

  const availabilityText =
    availability === "available"
      ? "Available for hire"
      : availability === "limited"
      ? "Limited availability"
      : "Unavailable";

  return (
    <div className="group bg-white rounded-3xl p-5 border border-neutral-200/90 shadow-[0_8px_30px_rgba(29,32,35,0.04)] hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(29,32,35,0.09)] hover:border-brand-500/60 transition-all duration-200 flex flex-col justify-between">
      {/* Top: Photo & Badge */}
      <div className="space-y-4">
        <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-neutral-100 flex items-center justify-center">
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-brand-50 flex items-center justify-center text-ink-900 font-extrabold text-3xl select-none">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
          )}

          {/* Badge chip pinned top-left */}
          {topBadge && (
            <div
              className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border"
              style={getBadgeColorStyle(topBadge.color)}
            >
              <DynamicIcon name={topBadge.icon} className="w-3.5 h-3.5" />
              <span>{topBadge.label}</span>
            </div>
          )}
        </div>

        {/* Talent Info */}
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-ink-900 group-hover:text-brand-600 transition-colors">
            {name}
          </h3>
          <p className="text-xs sm:text-sm text-ink-700 line-clamp-2 leading-relaxed">
            {headline}
          </p>
        </div>

        {/* Specialist and Skills Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {specialties.slice(0, 2).map((sp) => (
            <span
              key={sp.id}
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-ink-900 border border-brand-500/20"
            >
              {sp.name}
            </span>
          ))}
          {skills.slice(0, 2).map((sk) => (
            <span
              key={sk.skill_id}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-ink-700 border border-neutral-200"
            >
              {sk.skill_name}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom: Availability & View Profile Action */}
      <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
          <span className={cn("w-2 h-2 rounded-full", availabilityColor)} />
          <span>{availabilityText}</span>
        </div>

        <Link
          href={`/talents/${slug}`}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-ink-900 group-hover:text-brand-600 transition-colors"
        >
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
