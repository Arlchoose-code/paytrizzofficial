import Link from "next/link";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { BlogCard } from "@/components/public/BlogCard";
import { Search } from "lucide-react";
import { getPublicSettings } from "@/lib/settings";
import { getPublicPage, getHeroSection } from "@/lib/pages";

import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: "/blog",
    pageKey: "blog",
    title: "Agency Insights",
    description: "Architectural deep dives, design system methodologies, and talent squad best practices from PayTrizz engineers and creators.",
  });
}

interface SearchParamsProps {
  searchParams?: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function BlogDirectoryPage({ searchParams }: SearchParamsProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const search = resolvedParams.search || "";
  const category = resolvedParams.category || "all";
  const page = parseInt(resolvedParams.page || "1", 10);

  const apiBase = (process.env.API_URL || "http://localhost:8080/api").replace(/\/+$/, "");

  const url = new URL(`${apiBase}/posts`);
  if (search) url.searchParams.set("search", search);
  if (category && category !== "all") url.searchParams.set("category", category);
  url.searchParams.set("page", page.toString());
  url.searchParams.set("per_page", "9");

  const [res, catRes, pageData, publicSettings] = await Promise.all([
    fetch(url.toString(), { cache: "no-store" }).catch(() => null),
    fetch(`${apiBase}/post-categories`, { cache: "no-store" }).catch(() => null),
    getPublicPage("blog"),
    getPublicSettings().catch(() => undefined),
  ]);

  let posts = [];
  let lastPage = 1;
  if (res && res.ok) {
    try {
      const json = await res.json();
      if (json.data) {
        posts = json.data.data || [];
        lastPage = json.data.last_page || 1;
      }
    } catch {}
  }

  let categories = [
    { key: "all", label: "All Topics" },
    { key: "engineering", label: "Engineering" },
    { key: "product-design", label: "Product Design" },
    { key: "agency-insights", label: "Agency Insights" },
    { key: "talent-culture", label: "Talent Culture" },
  ];

  if (catRes && catRes.ok) {
    try {
      const catJson = await catRes.json();
      if (Array.isArray(catJson?.data) && catJson.data.length > 0) {
        categories = [
          { key: "all", label: "All Topics" },
          ...catJson.data.map((c: any) => ({
            key: c.slug,
            label: c.name,
          })),
        ];
      }
    } catch {}
  }

  const hero = getHeroSection(pageData, {
    eyebrow: "PERSPECTIVES & INSIGHTS",
    headline_line1: "Insights from the",
    headline_line2: "front lines.",
    description: "Technical breakdowns, design token systems, and agency leadership principles written by the practitioners who build daily.",
  });

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1 pb-24">
        {/* Header Hero */}
        <section className="pt-12 sm:pt-20 pb-10 px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto text-center">
            {hero.eyebrow && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-xs font-bold uppercase tracking-wider text-ink-900 mb-4">
                <span>{hero.eyebrow}</span>
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-ink-900 tracking-tight leading-[1.1] mb-6">
              {hero.headline_line1}{" "}
              <span className="bg-brand-500 px-3 py-0.5 rounded-xl text-ink-900 inline-block shadow-sm">
                {hero.headline_line2}
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-600 leading-relaxed mb-10">
              {hero.description}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <form method="GET" action="/blog" className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search articles by title or keyword..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200/90 rounded-full text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-[0_4px_20px_rgba(29,32,35,0.04)]"
                  />
                  {category !== "all" && <input type="hidden" name="category" value={category} />}
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full text-sm font-bold bg-ink-900 text-white hover:bg-black transition-colors shadow-sm cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
              {categories.map((cat) => {
                const isActive = category === cat.key;
                const url = new URL("http://dummy/blog");
                if (cat.key !== "all") url.searchParams.set("category", cat.key);
                if (search) url.searchParams.set("search", search);

                return (
                  <Link
                    key={cat.key}
                    href={url.search ? `/blog${url.search}` : "/blog"}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? "bg-brand-500 text-ink-900 shadow-sm border border-brand-600"
                        : "bg-white text-neutral-600 hover:text-ink-900 hover:bg-brand-50 border border-neutral-200/80"
                    }`}
                  >
                    {cat.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {posts.map((post: any) => (
                  <BlogCard
                    key={post.id}
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    cover_media={post.cover_media}
                    reading_minutes={post.reading_minutes}
                    published_at={post.published_at}
                    category={post.category}
                    author_talent={post.author_talent}
                    tags={post.tags}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-ink-900 flex items-center justify-center mx-auto mb-4 font-bold">
                  !
                </div>
                <h3 className="text-lg font-bold text-ink-900 mb-2">No articles found</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  Try adjusting your search criteria or explore other categories.
                </p>
                <Link
                  href="/blog"
                  className="inline-flex px-5 py-2.5 rounded-full text-xs font-bold bg-ink-900 text-white hover:bg-ink-800 transition-colors"
                >
                  Clear Filters
                </Link>
              </div>
            )}

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => {
                  const isCurrent = p === page;
                  const url = new URL("http://dummy/blog");
                  if (category !== "all") url.searchParams.set("category", category);
                  if (search) url.searchParams.set("search", search);
                  url.searchParams.set("page", p.toString());

                  return (
                    <Link
                      key={p}
                      href={`/blog${url.search}`}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-brand-400 text-ink-900 shadow-xs"
                          : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                      }`}
                    >
                      {p}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer initialSettings={publicSettings} />
    </div>
  );
}
