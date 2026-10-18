import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface TalentInProject {
  talent_id: number;
  role_label: string;
  talent?: {
    slug: string;
    name: string;
    headline: string;
    avatar_media?: {
      path_medium?: string;
      path_original?: string;
    } | null;
    avatar_url?: string | null;
  };
}

interface ProjectCardProps {
  slug: string;
  title: string;
  excerpt: string;
  client_name?: string | null;
  cover_media?: {
    path_large?: string;
    path_medium?: string;
    path_original?: string;
    alt_text?: string;
  } | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  is_case_study?: boolean;
  talents?: TalentInProject[];
  tags?: { id: number; name: string; slug: string }[];
}

export function ProjectCard({
  slug,
  title,
  excerpt,
  client_name,
  cover_media,
  category,
  is_case_study,
  talents = [],
  tags = [],
}: ProjectCardProps) {
  const coverUrl =
    cover_media?.path_medium || cover_media?.path_large || cover_media?.path_original;

  return (
    <article className="group bg-white rounded-3xl p-6 border border-neutral-200/90 shadow-[0_8px_30px_rgba(29,32,35,0.04)] hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(29,32,35,0.09)] hover:border-brand-500/60 transition-all duration-200 flex flex-col justify-between">
      {/* Top Graphic Showcase Canvas */}
      <div>
        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-brand-50 border border-brand-200/80 p-5 flex flex-col justify-between mb-5 group-hover:border-brand-500/50 transition-colors">
          {coverUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={coverUrl}
              alt={cover_media?.alt_text || title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 z-0"
            />
          )}
          {coverUrl && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30 z-0" />
          )}

          {/* Badges Bar */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            {category ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-ink-900 border border-neutral-200/80 shadow-sm">
                {category.name}
              </span>
            ) : (
              <div />
            )}

            {is_case_study && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-500 text-ink-900 shadow-sm border border-brand-600">
                Case Study
              </span>
            )}
          </div>

          {/* Client Tag */}
          <div className="relative z-10">
            {client_name && (
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/90 text-ink-700 text-[11px] font-bold uppercase tracking-wider border border-neutral-200/80 shadow-xs">
                Client · {client_name}
              </span>
            )}
          </div>
        </div>

        {/* Title & Excerpt */}
        <div>
          <Link href={`/projects/${slug}`}>
            <h3 className="text-xl font-bold text-ink-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug mb-2">
              {title}
            </h3>
          </Link>

          <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed mb-4">
            {excerpt}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {tags.slice(0, 4).map((t) => (
                <span
                  key={t.id}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700 hover:bg-brand-100 transition"
                >
                  #{t.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Assembled Squad & Explore Action */}
      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
        {/* Squad Avatars */}
        <div className="flex items-center gap-2">
          {talents.length > 0 ? (
            <div className="flex items-center -space-x-2">
              {talents.slice(0, 3).map((item, idx) => {
                const avatar =
                  item.talent?.avatar_media?.path_medium ||
                  item.talent?.avatar_media?.path_original ||
                  item.talent?.avatar_url ||
                  (item.talent?.slug === "syahrul"
                    ? "/hero-talent-card-syahrul.png"
                    : item.talent?.slug === "sarah-jenkins"
                    ? "/hero-talent-card-sarah.png"
                    : item.talent?.slug === "david-chen"
                    ? "/hero-talent-card-david.png"
                    : null);

                return avatar ? (
                  <div
                    key={idx}
                    title={`${item.talent?.name || "Specialist"} (${item.role_label || "Squad"})`}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-xs bg-neutral-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar}
                      alt={item.talent?.name || "Specialist"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    key={idx}
                    title={`${item.talent?.name || "Specialist"} (${item.role_label || "Squad"})`}
                    className="w-8 h-8 rounded-full bg-brand-100 text-ink-900 font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs"
                  >
                    {item.talent?.name ? item.talent.name.charAt(0) : "S"}
                  </div>
                );
              })}
            </div>
          ) : (
            <span className="text-xs text-neutral-400 font-medium">Core Squad</span>
          )}
          {talents.length > 0 && (
            <span className="text-xs text-neutral-500 font-semibold hidden sm:inline">
              {talents.length} squad {talents.length > 1 ? "members" : "specialist"}
            </span>
          )}
        </div>

        {/* Yellow Pill Explore CTA Button */}
        <Link
          href={`/projects/${slug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition shadow-sm hover:shadow-[0_4px_14px_rgba(252,207,0,0.35)]"
        >
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
