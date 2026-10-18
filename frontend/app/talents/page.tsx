import Link from "next/link";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getPublicSettings } from "@/lib/settings";
import { getPublicPage, getHeroSection } from "@/lib/pages";
import { TalentCard } from "@/components/public/TalentCard";
import { Search, Users } from "lucide-react";

import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: "/talents",
    pageKey: "talents",
    title: "Browse Specialists",
    description: "Browse vetted engineering, design, and growth specialists available for project sprints or full-time engagements.",
  });
}

interface SearchParamsProps {
  searchParams?: Promise<{
    search?: string;
    specialty?: string;
    page?: string;
  }>;
}

export default async function TalentsPage({ searchParams }: SearchParamsProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const search = resolvedParams.search || "";
  const specialty = resolvedParams.specialty || "all";
  const page = parseInt(resolvedParams.page || "1", 10);

  const apiBase = (process.env.API_URL || "http://localhost:8080/api").replace(/\/+$/, "");

  let talents = [];
  let lastPage = 1;

  try {
    const url = new URL(`${apiBase}/talents`);
    if (search) url.searchParams.set("search", search);
    if (specialty && specialty !== "all") url.searchParams.set("specialty", specialty);
    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", "12");

    const res = await fetch(url.toString(), {
      cache: "no-store",
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      if (json.data) {
        talents = json.data.data || [];
        lastPage = json.data.last_page || 1;
      }
    }
  } catch {
    // Handled gracefully
  }

  let specialties = [
    { key: "all", label: "All Specialists" },
    { key: "web-development", label: "Web Development" },
    { key: "ui-ux-design", label: "UI/UX Design" },
    { key: "mobile-apps", label: "Mobile Apps" },
    { key: "video-and-motion", label: "Video & Motion" },
    { key: "digital-marketing", label: "Digital Marketing" },
    { key: "content-and-copywriting", label: "Copywriting" },
  ];

  try {
    const spRes = await fetch(`${apiBase}/specialties`, {
      cache: "no-store",
    }).catch(() => null);

    if (spRes && spRes.ok) {
      const spJson = await spRes.json();
      if (Array.isArray(spJson?.data) && spJson.data.length > 0) {
        specialties = [
          { key: "all", label: "All Specialists" },
          ...spJson.data.map((s: any) => ({
            key: s.key,
            label: s.name,
          })),
        ];
      }
    }
  } catch {}

  const [pageData, publicSettings] = await Promise.all([
    getPublicPage("talents"),
    getPublicSettings().catch(() => undefined),
  ]);

  const hero = getHeroSection(pageData, {
    eyebrow: "VETTED SQUAD",
    headline_line1: "Find the right",
    headline_line2: "specialist.",
    description: "Every specialist is thoroughly evaluated on past execution, code standards, and clear sprint communication.",
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1 px-4 sm:px-6 pt-10 pb-20 lg:pb-28">
        <div className="max-w-[1200px] mx-auto space-y-12">
          {/* Header & Title */}
          <div className="text-center max-w-3xl mx-auto space-y-5">
            {hero.eyebrow && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-xs font-bold uppercase tracking-wider text-ink-900">
                <span>{hero.eyebrow}</span>
              </div>
            )}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink-900 leading-[1.1]">
              {hero.headline_line1}{" "}
              <span className="bg-brand-500 text-ink-900 px-3 py-0.5 rounded-xl inline-block">
                {hero.headline_line2}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-ink-700 leading-relaxed max-w-xl mx-auto">
              {hero.description}
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-6">
            {/* Search Input */}
            <form method="GET" action="/talents" className="max-w-2xl mx-auto relative">
              <input
                type="hidden"
                name="specialty"
                value={specialty}
              />
              <div className="relative">
                <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search by name, role, tech stack (e.g. Golang, Figma, Flutter)..."
                  className="w-full h-14 pl-12 pr-28 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-ink-900 text-ink-900 text-sm shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-ink-900 text-white font-semibold px-5 py-2.5 rounded-full text-xs hover:bg-ink-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Specialty Filter Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {specialties.map((sp) => {
                const isSelected = specialty === sp.key;
                return (
                  <Link
                    key={sp.key}
                    href={`/talents?specialty=${sp.key}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-brand-500 text-ink-900 shadow-sm font-bold"
                        : "bg-neutral-100 text-ink-700 hover:bg-neutral-200"
                    }`}
                  >
                    {sp.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Talents Grid */}
          {talents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {talents.map((t: any) => (
                <TalentCard
                  key={t.id}
                  slug={t.slug}
                  name={t.name}
                  headline={t.headline}
                  avatarUrl={t.avatar_media ? t.avatar_media.path_medium || t.avatar_media.path_original : null}
                  location={t.location}
                  availability={t.availability}
                  isFeatured={t.is_featured}
                  badges={t.badges || []}
                  specialties={t.specialties || []}
                  skills={t.skills || []}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-neutral-200 space-y-4">
              <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-ink-900">No Specialists Found</h3>
              <p className="text-ink-500 text-sm max-w-sm mx-auto">
                No talents matched your current search and filter criteria. Try resetting the filters.
              </p>
              <div className="pt-2">
                <Link
                  href="/talents"
                  className="inline-block bg-brand-500 text-ink-900 font-bold px-6 py-2.5 rounded-full text-xs hover:bg-brand-600"
                >
                  Clear All Filters
                </Link>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {lastPage > 1 && (
            <div className="pt-8 flex items-center justify-center gap-2">
              {Array.from({ length: lastPage }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/talents?page=${p}&specialty=${specialty}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    p === page
                      ? "bg-brand-500 text-ink-900 shadow-sm"
                      : "bg-neutral-100 text-ink-700 hover:bg-neutral-200"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer initialSettings={publicSettings} />
    </div>
  );
}
