import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ProjectCard } from "@/components/public/ProjectCard";
import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  Flame,
  Image as ImageIcon,
  Lightbulb,
  Trophy,
  Users,
} from "lucide-react";

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

import { constructMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const apiBase = (process.env.INTERNAL_BACKEND_URL || process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/+$/, "");
  try {
    const res = await fetch(`${apiBase}/projects/${slug}`, {
      cache: "no-store",
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      if (json.data) {
        const cleanTitle = json.data.is_case_study
          ? `${json.data.title} Case Study`
          : json.data.title;

        return constructMetadata({
          path: `/projects/${slug}`,
          title: cleanTitle,
          description: json.data.excerpt || json.data.title,
          image: json.data.cover_media?.path_large || json.data.cover_media?.path_original,
          type: "article",
        });
      }
    }
  } catch {}

  return constructMetadata({
    path: `/projects/${slug}`,
    title: "Project Showcase",
  });
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const apiBase = (process.env.INTERNAL_BACKEND_URL || process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/+$/, "");

  let project = null;
  const publicSettings = await getPublicSettings().catch(() => undefined);

  try {
    const res = await fetch(`${apiBase}/projects/${slug}`, {
      cache: "no-store",
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      project = json.data;
    }
  } catch {
    // Handled below
  }

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1 pb-24 space-y-12">
        {/* Back Link */}
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-ink-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Projects</span>
          </Link>
        </div>

        {/* ===================================================================
            PROJECT HERO CANVAS (Clean Solid PayTrizz Brand Theme)
        =================================================================== */}
        <section className="px-4 sm:px-6">
          <div className="max-w-[1100px] mx-auto bg-[#FAFAFA] text-ink-900 rounded-[32px] sm:rounded-[40px] p-8 sm:p-14 border border-ink-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10 max-w-3xl space-y-6">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {project.category && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white text-ink-900 border border-ink-200 shadow-xs">
                    {project.category.name}
                  </span>
                )}
                {project.is_case_study && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-brand-500 text-ink-900 border border-brand-600 shadow-sm">
                    Verified Case Study
                  </span>
                )}
                {project.client_name && (
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Client: {project.client_name}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-ink-900 tracking-tight leading-[1.12]">
                {project.title}
              </h1>

              {/* Excerpt */}
              <p className="text-base sm:text-lg text-ink-700 leading-relaxed font-medium">
                {project.excerpt}
              </p>

              {/* Project External Link Button */}
              {project.project_url && (
                <div className="pt-2">
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-brand-500 text-ink-900 hover:bg-brand-600 transition-colors shadow-sm"
                  >
                    <span>Visit Live Website</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cover Image Showcase with Image SEO */}
        {(project.cover_media?.path_large || project.cover_media?.path_original) && (
          <section className="px-4 sm:px-6">
            <div className="max-w-[1100px] mx-auto rounded-[32px] overflow-hidden border border-neutral-200/90 shadow-sm aspect-[16/9] sm:aspect-[21/9] relative bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.cover_media.path_large || project.cover_media.path_original}
                alt={project.cover_media.alt_text || `${project.title} Case Study Preview`}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </section>
        )}

        {/* Squad Involved Showcase */}
        {project.talents && project.talents.length > 0 && (
          <section className="px-4 sm:px-6">
            <div className="max-w-[1100px] mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-brand-600 mb-6">
                <Users className="w-4 h-4" />
                <span>Assembled Squad for this Project</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.talents.map((item: any, idx: number) => {
                  const avatarUrl =
                    item.talent?.avatar_media?.path_medium ||
                    item.talent?.avatar_media?.path_original ||
                    (item.talent?.slug === "syahrul"
                      ? "/hero-talent-card-syahrul.png"
                      : item.talent?.slug === "sarah-jenkins"
                      ? "/hero-talent-card-sarah.png"
                      : item.talent?.slug === "david-chen"
                      ? "/hero-talent-card-david.png"
                      : null);

                  return (
                    <Link
                      key={idx}
                      href={item.talent ? `/talents/${item.talent.slug}` : "/talents"}
                      className="flex items-center gap-3.5 p-4 rounded-2xl bg-brand-50/50 hover:bg-brand-100/70 border border-brand-200/60 transition-all group"
                    >
                      {avatarUrl ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-brand-300 shadow-xs bg-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={avatarUrl}
                            alt={item.talent?.name || "Specialist"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-brand-500 text-ink-900 font-extrabold text-sm flex items-center justify-center shrink-0 border border-brand-600 shadow-xs">
                          {item.talent?.name ? item.talent.name.charAt(0) : "S"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink-900 group-hover:text-brand-600 transition-colors truncate">
                          {item.talent?.name || "Specialist"}
                        </p>
                        <p className="text-xs text-neutral-500 font-medium truncate">
                          {item.role_label || item.talent?.headline || "Squad Contributor"}
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-ink-900 transition-colors shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Case Study Breakdown (Challenge / Strategy / Result) */}
        {project.is_case_study && (
          <section className="px-4 sm:px-6">
            <div className="max-w-[1100px] mx-auto space-y-6">
              <div className="text-center sm:text-left">
                <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                  ENGINEERING BREAKDOWN
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight mt-1">
                  How our squad solved it.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* The Challenge */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-xs space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-danger border border-red-200 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-ink-900">The Challenge</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                    {project.challenge || "Legacy bottlenecks and scalability limitations under peak market loads."}
                  </p>
                </div>

                {/* The Strategy */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-xs space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 text-ink-900 border border-brand-200 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-ink-900" />
                  </div>
                  <h3 className="text-lg font-bold text-ink-900">The Solution</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                    {project.solution || "Custom event-driven distributed architecture and resilient microservices design."}
                  </p>
                </div>

                {/* The Result */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-xs space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-ink-900">The Result</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                    {project.result || "Sub-40ms settlements, 99.999% availability, and verified production performance."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Rich Content Body */}
        <section className="px-4 sm:px-6">
          <div className="max-w-[1100px] mx-auto bg-white rounded-3xl p-8 sm:p-14 border border-neutral-200/90 shadow-xs">
            <div
              className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed [&>p]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-ink-900 [&>h2]:mt-8 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-ink-900 [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul>li]:mb-1.5"
              dangerouslySetInnerHTML={{ __html: project.content }}
            />

            {/* Tags Cloud */}
            {project.tags && project.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-neutral-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 mr-2">Tech Stack:</span>
                {project.tags.map((t: any) => (
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
        </section>

        {/* Project Gallery & System Showcase */}
        {project.images && project.images.length > 0 && (
          <section className="px-4 sm:px-6">
            <div className="max-w-[1100px] mx-auto space-y-6">
              <div className="text-center sm:text-left">
                <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                  SYSTEM SHOWCASE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight mt-1 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6 text-brand-600" />
                  <span>Project Gallery & Interface Showcase</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {project.images.map((img: any) => (
                  <div
                    key={img.id}
                    className="bg-white rounded-3xl overflow-hidden border border-neutral-200/90 shadow-xs flex flex-col"
                  >
                    <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.media?.path_large || img.media?.path_original}
                        alt={img.caption || project.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {img.caption && (
                      <div className="p-4 bg-white border-t border-neutral-100">
                        <p className="text-xs font-semibold text-neutral-600">{img.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Related Projects / Case Studies */}
        {project.related_projects && project.related_projects.length > 0 && (
          <section className="px-4 sm:px-6">
            <div className="max-w-[1100px] mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                    SIMILAR MILESTONES
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight mt-1">
                    Related Projects & Case Studies
                  </h2>
                </div>
                <Link
                  href="/projects"
                  className="text-xs font-bold text-neutral-500 hover:text-ink-900 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Explore All Projects</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {project.related_projects.map((rel: any) => (
                  <ProjectCard
                    key={rel.id}
                    slug={rel.slug}
                    title={rel.title}
                    excerpt={rel.excerpt}
                    client_name={rel.client_name}
                    cover_media={rel.cover_media}
                    category={rel.category}
                    is_case_study={rel.is_case_study}
                    talents={rel.talents}
                    tags={rel.tags}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Banner: PayTrizz Yellow Solid */}
        <section className="px-4 sm:px-6">
          <div className="max-w-[1100px] mx-auto bg-brand-500 rounded-3xl p-8 sm:p-12 text-ink-900 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_12px_40px_rgba(252,207,0,0.35)] border border-brand-600/30">
            <div className="max-w-xl text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2 text-ink-900">
                Need similar technical execution for your product?
              </h3>
              <p className="text-sm sm:text-base font-semibold text-ink-800">
                Assemble vetted specialists with zero recruiting friction. Start shipping within days.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/contact"
                className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-black bg-ink-900 text-white hover:bg-black transition-colors shadow-sm"
              >
                Hire this Squad →
              </Link>
              <Link
                href="/projects"
                className="px-6 py-3.5 rounded-full text-xs sm:text-sm font-black bg-white text-ink-900 hover:bg-brand-50 transition-colors shadow-xs"
              >
                Explore More Works
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer initialSettings={publicSettings} />
    </div>
  );
}
