import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { BlogCard } from "@/components/public/BlogCard";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Clock,
} from "lucide-react";

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

import { constructMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const apiBase = (process.env.INTERNAL_BACKEND_URL || process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/+$/, "");
  try {
    const res = await fetch(`${apiBase}/posts/${slug}`, {
      cache: "no-store",
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      if (json.data) {
        return constructMetadata({
          path: `/blog/${slug}`,
          title: json.data.title,
          description: json.data.excerpt || json.data.title,
          image: json.data.cover_media?.path_large || json.data.cover_media?.path_original,
          type: "article",
        });
      }
    }
  } catch {}

  return constructMetadata({
    path: `/blog/${slug}`,
    title: "Article",
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const apiBase = (process.env.INTERNAL_BACKEND_URL || process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/+$/, "");

  let post = null;
  const publicSettings = await getPublicSettings().catch(() => undefined);

  try {
    const res = await fetch(`${apiBase}/posts/${slug}`, {
      cache: "no-store",
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      post = json.data;
    }
  } catch {
    // Handled below
  }

  if (!post) {
    notFound();
  }

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently published";

  const authorTalent = post.author_talent;
  const authorName = authorTalent ? authorTalent.name : "PayTrizz Team";
  const authorInitial = authorTalent ? authorTalent.name.charAt(0) : "P";

  return (
    <div className="min-h-screen bg-neutral-50/40 flex flex-col font-sans">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1 pb-24">
        {/* Back Link */}
        <div className="max-w-[840px] mx-auto px-4 sm:px-6 pt-8 pb-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-ink-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Articles</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="px-4 sm:px-6 pb-10">
          <div className="max-w-[840px] mx-auto">
            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-neutral-500 mb-6">
              {post.category && (
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-brand-100 text-ink-900 border border-brand-200">
                  {post.category.name}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>{formattedDate}</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>{post.reading_minutes} min read</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-ink-900 tracking-tight leading-[1.15] mb-6">
              {post.title}
            </h1>

            {/* Excerpt Lead */}
            <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed font-normal">
              {post.excerpt}
            </p>
          </div>
        </header>

        {/* Cover Image Banner with Image SEO */}
        {(post.cover_media?.path_large || post.cover_media?.path_original) && (
          <section className="px-4 sm:px-6 pb-10">
            <div className="max-w-[840px] mx-auto rounded-[32px] overflow-hidden border border-neutral-200/90 shadow-sm aspect-[16/9] relative bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.cover_media.path_large || post.cover_media.path_original}
                alt={post.cover_media.alt_text || `${post.title} Cover Banner`}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </section>
        )}

        {/* Author Byline Box */}
        <section className="px-4 sm:px-6 pb-12">
          <div className="max-w-[840px] mx-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {(() => {
                  const authorAvatar =
                    authorTalent?.avatar_media?.path_medium ||
                    authorTalent?.avatar_media?.path_original ||
                    (authorTalent?.slug === "syahrul"
                      ? "/hero-talent-card-syahrul.png"
                      : authorTalent?.slug === "sarah-jenkins"
                      ? "/hero-talent-card-sarah.png"
                      : authorTalent?.slug === "david-chen"
                      ? "/hero-talent-card-david.png"
                      : null);

                  return authorAvatar ? (
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 ring-4 ring-brand-100 bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={authorAvatar}
                        alt={authorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-brand-200 text-ink-900 font-extrabold text-lg flex items-center justify-center shrink-0 ring-4 ring-brand-100">
                      {authorInitial}
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Written by
                    </span>
                    {authorTalent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                        Vetted Specialist
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-ink-900 mt-0.5">
                    {authorName}
                  </h3>
                  {authorTalent && (
                    <p className="text-xs text-neutral-500 font-medium">
                      {authorTalent.headline}
                    </p>
                  )}
                </div>
              </div>

              {authorTalent && (
                <Link
                  href={`/talents/${authorTalent.slug}`}
                  className="inline-flex items-center gap-1 px-5 py-2.5 rounded-full text-xs font-bold bg-neutral-100 text-ink-900 hover:bg-brand-400 transition-colors shrink-0"
                >
                  <span>View Full Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Article Body Content */}
        <article className="px-4 sm:px-6 pb-16">
          <div className="max-w-[840px] mx-auto bg-white rounded-3xl p-8 sm:p-14 border border-neutral-200/80 shadow-xs">
            <div
              className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed text-base sm:text-lg [&>p]:mb-6 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-ink-900 [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-ink-900 [&>h3]:mt-8 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul>li]:mb-2 [&>code]:bg-neutral-100 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-ink-900 [&>code]:text-sm"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags Cloud */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 mr-2">Tags:</span>
                {post.tags.map((t: any) => (
                  <span
                    key={t.id}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-ink-800"
                  >
                    #{t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Related Articles Section */}
        {post.related_posts && post.related_posts.length > 0 && (
          <section className="px-4 sm:px-6 pb-16">
            <div className="max-w-[840px] mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                    CONTINUE READING
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight mt-1">
                    Related Articles & Technical Insights
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="text-xs font-bold text-neutral-500 hover:text-ink-900 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Explore All Articles</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {post.related_posts.map((rel: any) => (
                  <BlogCard
                    key={rel.id}
                    slug={rel.slug}
                    title={rel.title}
                    excerpt={rel.excerpt}
                    cover_media={rel.cover_media}
                    reading_minutes={rel.reading_minutes}
                    published_at={rel.published_at}
                    category={rel.category}
                    author_talent={rel.author_talent}
                    tags={rel.tags}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA: PayTrizz Yellow Banner */}
        <section className="px-4 sm:px-6">
          <div className="max-w-[840px] mx-auto bg-brand-500 text-ink-900 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_12px_40px_rgba(252,207,0,0.35)] border border-brand-600/30">
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-ink-900">
                Looking to build your next engineering milestone?
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-ink-800">
                Directly engage pre-vetted specialists or assemble an autonomous product squad.
              </p>
            </div>
            <Link
              href="/talents"
              className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-black bg-ink-900 text-white hover:bg-black transition-colors shadow-sm shrink-0"
            >
              Browse Talents →
            </Link>
          </div>
        </section>
      </main>

      <Footer initialSettings={publicSettings} />
    </div>
  );
}
