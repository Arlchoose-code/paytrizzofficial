import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getPublicSettings } from "@/lib/settings";
import { TalentInquiryForm } from "@/components/public/TalentInquiryForm";
import { ProjectCard } from "@/components/public/ProjectCard";
import { BlogCard } from "@/components/public/BlogCard";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Download,
  FolderGit2,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { TalentExperienceSection } from "@/components/public/TalentExperienceSection";
import { TalentDetailSidebar } from "@/components/public/TalentDetailSidebar";
import { getBadgeColorStyle } from "@/lib/utils";
import {
  TalentDetailContactButton,
  TalentDetailAnchorPills,
} from "@/components/public/TalentDetailAnchorPills";

function renderPlatformIcon(platform: string) {
  const p = (platform || "").toLowerCase();
  switch (p) {
    case "github":
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case "twitter":
    case "x":
      return (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "blogger":
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M20.219 0H3.781C1.696 0 0 1.697 0 3.781v16.438C0 22.303 1.697 24 3.781 24h16.438C22.304 24 24 22.303 24 20.219V3.781C24 1.697 22.303 0 20.219 0zm-3.037 8.358c-.066.002-.132.008-.2.016v.002h-4.301a2.385 2.385 0 0 0-2.385 2.386v.297a2.385 2.385 0 0 0-2.096 2.366v2.196a2.386 2.386 0 0 0 2.386 2.386h4.596a2.386 2.386 0 0 0 2.386-2.386v-1.897a2.387 2.387 0 0 0-1.002-1.954 2.385 2.385 0 0 0 .616-1.624v-.002a2.386 2.386 0 0 0-2.386-2.386z" />
        </svg>
      );
    case "medium":
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "threads":
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.186 24C5.503 24 0 18.675 0 12.184 0 5.69 5.503.367 12.186.367c6.643 0 11.968 5.163 11.968 11.75 0 .61-.05 1.218-.15 1.808a.916.916 0 0 1-.9.76.917.917 0 0 1-.916-.763c.092-.533.138-1.076.138-1.624 0-5.59-4.509-9.924-10.14-9.924-5.632 0-10.14 4.334-10.14 9.924 0 5.592 4.508 9.926 10.14 9.926 3.498 0 6.64-1.748 8.406-4.675a.917.917 0 1 1 1.562.962C19.98 21.848 16.326 24 12.186 24z" />
        </svg>
      );
    default:
      return <ExternalLink className="w-4 h-4" />;
  }
}

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
          title: json.data.name,
          description: json.data.headline
            ? `${json.data.headline}. ${json.data.bio || ""}`.trim()
            : json.data.bio || "Vetted specialist on PayTrizz",
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
                    {[...talent.badges]
                      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                      .map((b: any) => {
                        const badgeStyle = getBadgeColorStyle(b.color);
                        return (
                          <div
                            key={b.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm border"
                            style={badgeStyle}
                          >
                            <DynamicIcon name={b.icon} className="w-4 h-4" />
                            <span>{b.label}</span>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Name & Headline */}
                <div className="space-y-2 min-w-0">
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-900 break-words">
                    {talent.name}
                  </h1>
                  <p className="text-lg sm:text-xl font-medium text-ink-700 leading-snug break-words">
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
                  <TalentDetailContactButton
                    talentName={talent.name}
                    contactEnabled={talent.contact_enabled !== false}
                  />

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
                          className="w-10 h-10 rounded-full bg-white border border-neutral-300 text-ink-700 hover:text-ink-900 hover:bg-neutral-100 flex items-center justify-center transition-colors shadow-2xs"
                          title={link.label || link.platform}
                        >
                          {renderPlatformIcon(link.platform)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Navigation Anchor Pills */}
                <TalentDetailAnchorPills
                  contactEnabled={talent.contact_enabled !== false}
                  projectsCount={talent.projects?.length || 0}
                  articlesCount={talent.posts?.length || 0}
                  hasSkills={Boolean(talent.skills && talent.skills.length > 0)}
                  hasExperiences={Boolean(talent.experiences && talent.experiences.length > 0)}
                  hasCertificates={Boolean(talent.certificates && talent.certificates.length > 0)}
                />
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
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2.5">
                    {talent.skills.map((sk: any, idx: number) => (
                      <div
                        key={idx}
                        className="px-3.5 py-2.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-ink-900 text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 transition-colors shadow-2xs"
                      >
                        <span className="truncate">{sk.skill_name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-ink-600 font-medium border border-neutral-200 shrink-0 self-start sm:self-auto">
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
                certificates={talent.certificates}
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
