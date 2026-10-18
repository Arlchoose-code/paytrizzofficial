import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getPublicSettings } from "@/lib/settings";
import { TalentInquiryForm } from "@/components/public/TalentInquiryForm";
import { ProjectCard } from "@/components/public/ProjectCard";
import { BlogCard } from "@/components/public/BlogCard";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Crown,
  Download,
  FolderGit2,
  MapPin,
  Shield,
  Star,
  Cpu,
} from "lucide-react";
import { TalentExperienceSection } from "@/components/public/TalentExperienceSection";
import { TalentDetailSidebar } from "@/components/public/TalentDetailSidebar";

interface TalentDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

import { constructMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: TalentDetailPageProps) {
  const { slug } = await params;
  const targetSlug = slug === "founder" ? "syahrul" : slug;
  const apiBase = (process.env.INTERNAL_BACKEND_URL || process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/+$/, "");
  try {
    const res = await fetch(`${apiBase}/talents/${targetSlug}`, {
      cache: "no-store",
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      if (json.data) {
        const fallbackOg =
          targetSlug === "syahrul"
            ? "/hero-talent-card-syahrul.png"
            : targetSlug === "sarah-jenkins"
            ? "/hero-talent-card-sarah.png"
            : targetSlug === "david-chen"
            ? "/hero-talent-card-david.png"
            : undefined;

        return constructMetadata({
          path: `/talents/${slug}`,
          title: `${json.data.name} — ${json.data.headline}`,
          description: json.data.bio || json.data.headline,
          image: json.data.avatar_media?.path_large || json.data.avatar_media?.path_original || fallbackOg,
          type: "website",
        });
      }
    }
  } catch {}

  return constructMetadata({
    path: `/talents/${slug}`,
    title: "Talent Profile",
  });
}

function renderBadgeIcon(iconName: string) {
  switch (iconName) {
    case "crown":
      return <Crown className="w-4 h-4 fill-current" />;
    case "star":
      return <Star className="w-4 h-4 fill-current" />;
    case "cpu":
      return <Cpu className="w-4 h-4" />;
    case "shield":
    default:
      return <Shield className="w-4 h-4" />;
  }
}

export default async function TalentDetailPage({ params }: TalentDetailPageProps) {
  const { slug } = await params;
  const targetSlug = slug === "founder" ? "syahrul" : slug;
  const apiBase = (process.env.INTERNAL_BACKEND_URL || process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/+$/, "");

  let talent = null;
  try {
    const res = await fetch(`${apiBase}/talents/${targetSlug}`, {
      cache: "no-store",
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      talent = json.data;
    }
  } catch {}

  if (!talent) {
    notFound();
  }

  const fallbackAvatar =
    targetSlug === "syahrul"
      ? "/hero-talent-card-syahrul.png"
      : targetSlug === "sarah-jenkins"
      ? "/hero-talent-card-sarah.png"
      : targetSlug === "david-chen"
      ? "/hero-talent-card-david.png"
      : null;

  const displayAvatar =
    talent.avatar_media?.path_medium ||
    talent.avatar_media?.path_original ||
    talent.avatar_url ||
    fallbackAvatar;

  const availabilityText =
    talent.availability === "available"
      ? "Available for hire"
      : talent.availability === "limited"
      ? "Limited availability"
      : "Unavailable";

  const availabilityDotClass =
    talent.availability === "available"
      ? "bg-emerald-500"
      : talent.availability === "limited"
      ? "bg-brand-500"
      : "bg-neutral-400";

  const publicSettings = await getPublicSettings().catch(() => undefined);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1">
        {/* ===================================================================
            HERO BANNER (Latar brand-50 per UI Reference)
        =================================================================== */}
        <section className="px-4 sm:px-6 pt-6 pb-12">
          <div className="max-w-[1200px] mx-auto bg-brand-50 rounded-[32px] sm:rounded-[40px] p-8 sm:p-12 border border-brand-100 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Avatar 4:5 Box */}
              <div className="lg:col-span-4 aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-200 shadow-md flex items-center justify-center relative">
                {displayAvatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={displayAvatar}
                    alt={talent.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl sm:text-5xl font-black text-ink-900 font-sans">
                    {talent.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                )}
              </div>

              {/* Talent Details */}
              <div className="lg:col-span-8 space-y-6">
                {/* Badges Chips */}
                {talent.badges && talent.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {talent.badges.map((b: any) => (
                      <div
                        key={b.id}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          b.key === "ceo-founder"
                            ? "bg-brand-500 text-ink-900 border border-brand-600"
                            : "bg-ink-900 text-white"
                        }`}
                      >
                        {renderBadgeIcon(b.icon)}
                        <span>{b.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Name & Headline */}
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-900">
                    {talent.name}
                  </h1>
                  <p className="text-lg sm:text-xl font-medium text-ink-700 leading-snug">
                    {talent.headline}
                  </p>
                </div>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-ink-700 font-medium">
                  {talent.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-brand-600" />
                      <span>{talent.location}</span>
                    </div>
                  )}
                  {talent.years_experience > 0 && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4 text-brand-600" />
                      <span>{talent.years_experience} years experience</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${availabilityDotClass}`} />
                    <span>{availabilityText}</span>
                  </div>
                </div>

                {/* Specialties Chips */}
                {talent.specialties && talent.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {talent.specialties.map((sp: any) => (
                      <span
                        key={sp.id}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-white text-ink-900 border border-brand-500/40 shadow-sm"
                      >
                        {sp.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action CTA Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {talent.contact_enabled !== false && (
                    <a
                      href="#contact"
                      className="inline-flex items-center gap-2 bg-brand-500 text-ink-900 font-bold px-7 py-3 rounded-full text-sm hover:bg-brand-600 transition-all shadow-[0_4px_14px_rgba(252,207,0,0.35)]"
                    >
                      <span>Contact {talent.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  )}

                  {talent.cv_is_public && talent.cv_media && (
                    <a
                      href={talent.cv_media.path_file || talent.cv_media.path_original}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-white text-ink-900 border border-neutral-300 font-semibold px-6 py-3 rounded-full text-sm hover:bg-neutral-100 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download CV</span>
                    </a>
                  )}

                  {/* Social links */}
                  {talent.links && talent.links.length > 0 && (
                    <div className="flex items-center gap-2 pl-2">
                      {talent.links.map((link: any) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-10 h-10 rounded-full bg-white border border-neutral-300 text-ink-700 hover:text-ink-900 hover:bg-neutral-100 flex items-center justify-center text-xs font-bold uppercase transition-colors"
                          title={link.label}
                        >
                          {link.platform.slice(0, 2)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Navigation Anchor Pills */}
                <div className="pt-4 flex flex-wrap items-center gap-2 border-t border-brand-200/60">
                  <a
                    href="#about"
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-ink-800 hover:bg-neutral-100 transition-colors shadow-xs"
                  >
                    Overview
                  </a>
                  <a
                    href="#projects"
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-500 text-ink-900 border border-brand-600 hover:bg-brand-600 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <FolderGit2 className="w-3.5 h-3.5" />
                    <span>Projects ({talent.projects?.length || 0})</span>
                  </a>
                  <a
                    href="#articles"
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-500 text-ink-900 border border-brand-600 hover:bg-brand-600 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Articles ({talent.posts?.length || 0})</span>
                  </a>
                  {talent.skills && talent.skills.length > 0 && (
                    <a
                      href="#skills"
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-ink-800 hover:bg-neutral-100 transition-colors shadow-xs"
                    >
                      Tech Stack
                    </a>
                  )}
                  {talent.experiences && talent.experiences.length > 0 && (
                    <a
                      href="#experience"
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-ink-800 hover:bg-neutral-100 transition-colors shadow-xs"
                    >
                      Experience
                    </a>
                  )}
                  {talent.contact_enabled !== false && (
                    <a
                      href="#contact"
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-ink-800 hover:bg-neutral-100 transition-colors shadow-xs"
                    >
                      Contact
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            MAIN BODY: 2 COLUMNS (Left: Bio, Projects, Articles, Skills, Experience, Education; Right: Sticky CTA)
        =================================================================== */}
        <section className="px-4 sm:px-6 py-12 lg:py-16">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-16">
              {/* 1. Bio / About */}
              {talent.bio && (
                <div id="about" className="space-y-4">
                  <h2 className="text-2xl font-bold text-ink-900">About {talent.name}</h2>
                  <div className="prose prose-neutral max-w-none text-ink-700 leading-relaxed text-base whitespace-pre-line">
                    {talent.bio}
                  </div>
                </div>
              )}

              {/* 2. Featured Projects & Portfolio Section */}
              <div id="projects" className="space-y-6 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                      PORTFOLIO & CASE STUDIES
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight mt-1 flex items-center gap-2.5">
                      <FolderGit2 className="w-6 h-6 text-brand-600" />
                      <span>Featured Projects & Works</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-ink-900 border border-brand-300">
                        {talent.projects?.length || 0}
                      </span>
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

                {talent.projects && talent.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {talent.projects.map((p: any) => (
                      <ProjectCard
                        key={p.id}
                        slug={p.slug}
                        title={p.title}
                        excerpt={p.excerpt}
                        client_name={p.client_name}
                        cover_media={p.cover_media}
                        category={p.category}
                        is_case_study={p.is_case_study}
                        talents={p.talents}
                        tags={p.tags}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200 text-center space-y-2">
                    <FolderGit2 className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="text-sm font-semibold text-ink-900">No public case studies or projects published yet</p>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto">
                      Engagements for this specialist are currently in progress or protected by client non-disclosure agreements (NDAs).
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Articles & Insights Section */}
              <div id="articles" className="space-y-6 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                      EDITORIAL & ARCHITECTURE NOTES
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-ink-900 tracking-tight mt-1 flex items-center gap-2.5">
                      <BookOpen className="w-6 h-6 text-brand-600" />
                      <span>Articles & Insights</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-ink-900 border border-brand-300">
                        {talent.posts?.length || 0}
                      </span>
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

                {talent.posts && talent.posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {talent.posts.map((post: any) => (
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
                  <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200 text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="text-sm font-semibold text-ink-900">No published articles yet</p>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto">
                      Technical essays, system architectures, and engineering blueprints by this specialist will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Skills Cloud */}
              {talent.skills && talent.skills.length > 0 && (
                <div id="skills" className="space-y-4">
                  <h2 className="text-2xl font-bold text-ink-900">Skills & Tech Stack</h2>
                  <div className="flex flex-wrap gap-2.5">
                    {talent.skills.map((sk: any, idx: number) => (
                      <div
                        key={idx}
                        className="px-4 py-2 rounded-2xl bg-neutral-100 border border-neutral-200 text-ink-900 text-sm font-semibold flex items-center gap-2"
                      >
                        <span>{sk.skill_name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white text-ink-500 font-medium">
                          {sk.years} yrs · {sk.proficiency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <TalentExperienceSection
                experiences={talent.experiences}
                educations={talent.educations}
              />

              {/* 7. Direct Contact Form */}
              {talent.contact_enabled !== false ? (
                <TalentInquiryForm talentId={talent.id} talentName={talent.name} />
              ) : (
                <div id="contact" className="bg-neutral-50 rounded-3xl p-8 border border-neutral-200 text-center">
                  <p className="text-sm font-bold text-ink-900">Direct Inquiries Paused</p>
                  <p className="text-xs text-ink-500 mt-1">This specialist is currently not accepting direct messages. Please contact PayTrizz general support.</p>
                </div>
              )}
            </div>

            {/* Right Sticky Sidebar */}
            <TalentDetailSidebar talent={talent} />
          </div>
        </section>
      </main>

      <Footer initialSettings={publicSettings} />
    </div>
  );
}
