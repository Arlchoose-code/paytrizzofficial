import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  cover_media?: {
    path_large?: string;
    path_medium?: string;
    path_original?: string;
    alt_text?: string;
  } | null;
  reading_minutes?: number;
  published_at?: string | null;
  category?: {
    name: string;
    slug: string;
  } | null;
  author_talent?: {
    slug: string;
    name: string;
    headline: string;
    avatar_media?: {
      path_medium?: string;
      path_original?: string;
    } | null;
    avatar_url?: string | null;
  } | null;
  tags?: { id: number; name: string; slug: string }[];
}

export function BlogCard({
  slug,
  title,
  excerpt,
  cover_media,
  reading_minutes = 3,
  published_at,
  category,
  author_talent,
  tags = [],
}: BlogCardProps) {
  const authorName = author_talent ? author_talent.name : "PayTrizz Team";
  const authorInitial = author_talent ? author_talent.name.charAt(0) : "P";
  const coverUrl =
    cover_media?.path_medium || cover_media?.path_large || cover_media?.path_original;

  const formattedDate = published_at
    ? new Date(published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently published";

  return (
    <article className="group bg-white rounded-3xl p-6 border border-neutral-200/90 shadow-[0_8px_30px_rgba(29,32,35,0.04)] hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(29,32,35,0.09)] hover:border-brand-500/60 transition-all duration-200 flex flex-col justify-between">
      {/* Top Banner / Graphic Block */}
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

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-ink-800 border border-neutral-200/80 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>{reading_minutes} min read</span>
            </div>
          </div>

          {/* Decorative tag */}
          <div className="relative z-10">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/90 text-ink-700 text-[11px] font-bold uppercase tracking-wider border border-neutral-200/80 shadow-xs">
              Technical Editorial
            </span>
          </div>
        </div>

        {/* Title & Excerpt */}
        <div>
          <Link href={`/blog/${slug}`}>
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
              {tags.slice(0, 3).map((t) => (
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

      {/* Footer: Author info & Read link */}
      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {(() => {
            const authorAvatar =
              author_talent?.avatar_media?.path_medium ||
              author_talent?.avatar_media?.path_original ||
              author_talent?.avatar_url ||
              (author_talent?.slug === "syahrul"
                ? "/hero-talent-card-syahrul.png"
                : author_talent?.slug === "sarah-jenkins"
                ? "/hero-talent-card-sarah.png"
                : author_talent?.slug === "david-chen"
                ? "/hero-talent-card-david.png"
                : null);

            return authorAvatar ? (
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-brand-200 bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-500 text-ink-900 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-brand-600">
                {authorInitial}
              </div>
            );
          })()}
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink-900 truncate">
              {authorName}
            </p>
            <p className="text-[11px] text-neutral-500 truncate">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Yellow Read Button */}
        <Link
          href={`/blog/${slug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition shadow-sm hover:shadow-[0_4px_14px_rgba(252,207,0,0.35)] shrink-0"
        >
          <span>Read</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
