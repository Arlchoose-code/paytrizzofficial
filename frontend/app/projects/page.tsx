import Link from "next/link";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getPublicSettings } from "@/lib/settings";
import { getPublicPage, getHeroSection } from "@/lib/pages";
import { ProjectCard } from "@/components/public/ProjectCard";
import { Search, CheckCircle2 } from "lucide-react";

import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: "/projects",
    pageKey: "projects",
    title: "Projects & Case Studies",
    description: "Explore enterprise web architectures, mobile companion apps, and multi-brand design systems shipped by PayTrizz squads.",
  });
}

interface SearchParamsProps {
  searchParams?: Promise<{
    search?: string;
    category?: string;
    case_study?: string;
    page?: string;
  }>;
}

export default async function ProjectsDirectoryPage({ searchParams }: SearchParamsProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const search = resolvedParams.search || "";
  const category = resolvedParams.category || "all";
  const caseStudy = resolvedParams.case_study || "";
  const page = parseInt(resolvedParams.page || "1", 10);

  const apiBase = (process.env.API_URL || "http://localhost:8080/api").replace(/\/+$/, "");

  let projects = [];
  let lastPage = 1;

  try {
    const url = new URL(`${apiBase}/projects`);
    if (search) url.searchParams.set("search", search);
    if (category && category !== "all") url.searchParams.set("category", category);
    if (caseStudy === "true") url.searchParams.set("case_study", "true");
    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", "9");

    const res = await fetch(url.toString(), {
      cache: "no-store",
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      if (json.data) {
        projects = json.data.data || [];
        lastPage = json.data.last_page || 1;
      }
    }
  } catch {
    // Handled gracefully
  }

  let categories = [
    { key: "all", label: "All Works" },
    { key: "web-saas", label: "Web & SaaS" },
    { key: "mobile-apps", label: "Mobile Apps" },
    { key: "design-systems", label: "Design Systems" },
    { key: "cloud-infrastructure", label: "Cloud & Infra" },
    { key: "brand-motion", label: "Brand & Motion" },
  ];

  try {
    const catRes = await fetch(`${apiBase}/project-categories`, {
      cache: "no-store",
    }).catch(() => null);

    if (catRes && catRes.ok) {
      const catJson = await catRes.json();
      if (Array.isArray(catJson?.data) && catJson.data.length > 0) {
        categories = [
          { key: "all", label: "All Works" },
          ...catJson.data.map((c: any) => ({
            key: c.slug,
            label: c.name,
          })),
        ];
      }
    }
  } catch {}

  const [pageData, publicSettings] = await Promise.all([
    getPublicPage("projects"),
    getPublicSettings().catch(() => undefined),
  ]);

  const hero = getHeroSection(pageData, {
    eyebrow: "PORTFOLIO & CASE STUDIES",
    headline_line1: "Proven impact.",
    headline_line2: "Real systems.",
    description: "From high-concurrency microservices processing 25k TPS to cross-platform medical apps and multi-brand design tokens — explore the products built by our talent squads.",
  });

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1 pb-24">
        {/* Hero Directory Header */}
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

            {/* Search & Case Study Filter Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <form method="GET" action="/projects" className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    name="search"
                    defaultValue={search}
                    placeholder="Search by title, technology, or client..."
                    className="w-full pl-11 pr-4 py-3 bg-white border border-neutral-200/90 rounded-full text-sm text-ink-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-[0_4px_20px_rgba(29,32,35,0.04)]"
                  />
                  {category !== "all" && <input type="hidden" name="category" value={category} />}
                  {caseStudy === "true" && <input type="hidden" name="case_study" value="true" />}
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full text-sm font-bold bg-ink-900 text-white hover:bg-black transition-colors shadow-sm cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Filter Pills (Category + Case Study toggle) */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
              {categories.map((cat) => {
                const isActive = category === cat.key;
                const url = new URL("http://dummy/projects");
                if (cat.key !== "all") url.searchParams.set("category", cat.key);
                if (search) url.searchParams.set("search", search);
                if (caseStudy === "true") url.searchParams.set("case_study", "true");

                return (
                  <Link
                    key={cat.key}
                    href={url.search ? `/projects${url.search}` : "/projects"}
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

              {/* Case Study Only Toggle */}
              <Link
                href={caseStudy === "true" ? `/projects?category=${category}&search=${search}` : `/projects?category=${category}&search=${search}&case_study=true`}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  caseStudy === "true"
                    ? "bg-brand-500 text-ink-900 border border-brand-600 shadow-sm"
                    : "bg-brand-50 text-ink-800 border border-brand-200 hover:bg-brand-100"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Case Studies Only</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto">
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {projects.map((project: any) => (
                  <ProjectCard
                    key={project.id}
                    slug={project.slug}
                    title={project.title}
                    excerpt={project.excerpt}
                    client_name={project.client_name}
                    cover_media={project.cover_media}
                    category={project.category}
                    is_case_study={project.is_case_study}
                    talents={project.talents}
                    tags={project.tags}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-ink-900 flex items-center justify-center mx-auto mb-4 font-bold">
                  !
                </div>
                <h3 className="text-lg font-bold text-ink-900 mb-2">No projects found</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  Try adjusting your search criteria or explore other categories.
                </p>
                <Link
                  href="/projects"
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
                  const url = new URL("http://dummy/projects");
                  if (category !== "all") url.searchParams.set("category", category);
                  if (search) url.searchParams.set("search", search);
                  if (caseStudy === "true") url.searchParams.set("case_study", "true");
                  url.searchParams.set("page", p.toString());

                  return (
                    <Link
                      key={p}
                      href={`/projects${url.search}`}
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
