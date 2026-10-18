import Link from "next/link";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { FAQAccordion } from "@/components/public/FAQAccordion";
import { HeroTalentShowcase, TalentShowcaseItem } from "@/components/public/HeroTalentShowcase";
import { HeroSocialProof } from "@/components/public/HeroSocialProof";
import { StatsBand } from "@/components/public/StatsBand";
import {
  ArrowRight,
  Code2,
  Palette,
  Smartphone,
  Video,
  TrendingUp,
  FileText,
} from "lucide-react";
import { getPublicSettings } from "@/lib/settings";
import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: "/",
    pageKey: "home",
    title: "Talent Agency Platform",
    description: "Connect with vetted specialists in development, design, and digital growth.",
  });
}

// Default fallback services
const DEFAULT_SERVICES = [
  {
    id: 1,
    title: "Web & Core Backend",
    slug: "web-development",
    description: "High-concurrency microservices, sub-40ms settlement engines, and Next.js platforms built with Go & TypeScript.",
    icon: "code",
  },
  {
    id: 2,
    title: "UI/UX & Design Systems",
    slug: "ui-ux-design",
    description: "Multi-brand design token pipelines, enterprise SaaS design systems, and AA-accessible interfaces.",
    icon: "palette",
  },
  {
    id: 3,
    title: "Mobile Architecture",
    slug: "mobile-apps",
    description: "Cross-platform Flutter & native iOS/Android apps with low-level background threads and BLE telemetry streaming.",
    icon: "smartphone",
  },
  {
    id: 4,
    title: "Video & Motion",
    slug: "video-and-motion",
    description: "High-impact brand product videos, 3D interaction mockups, and commercial motion storytelling.",
    icon: "video",
  },
  {
    id: 5,
    title: "Growth & Digital Scale",
    slug: "digital-marketing",
    description: "Technical SEO pipelines, conversion rate optimization, and data-driven client acquisition architectures.",
    icon: "trending-up",
  },
  {
    id: 6,
    title: "Technical Content & Docs",
    slug: "content-and-copywriting",
    description: "Engineering-grade technical documentation, API guides, and authoritative thought leadership articles.",
    icon: "file-text",
  },
];

const DEFAULT_FAQS = [
  {
    id: 1,
    question: "How quickly can we onboard a talent or squad?",
    answer: "Most matches are made within 24 to 48 hours. Once you review and approve the specialist profile, sprint kickoff begins immediately with zero recruiting overhead.",
  },
  {
    id: 2,
    question: "Are your talents exclusively vetted?",
    answer: "Yes, every PayTrizz specialist undergoes multi-stage vetting: deep technical system design assessments, live code audits, and past client production track record verification.",
  },
  {
    id: 3,
    question: "Can I hire a full pod instead of individual freelancers?",
    answer: "Absolutely. We assemble full autonomous squads (e.g., 1 Systems Architect + 2 Full-Stack Developers + 1 Senior Product Designer) configured specifically for your sprint milestones.",
  },
  {
    id: 4,
    question: "How does contract and billing management work?",
    answer: "You work directly through PayTrizz with transparent milestone-based or monthly contracts. No surprise platform fees or hidden overhead.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "You reach out",
    description: "Share your roadmap, architectural needs, or specialist requirements through our quick inquiry form.",
  },
  {
    step: "02",
    title: "We match squads",
    description: "Our agency leadership curates a targeted shortlist of vetted senior specialists within 24–48 hours.",
  },
  {
    step: "03",
    title: "Sprint kickoff",
    description: "Meet your chosen talents, set up repositories and communication channels, and define Milestone 1.",
  },
  {
    step: "04",
    title: "We ship & scale",
    description: "Talents build with high velocity, providing transparent milestone demos and production-ready code.",
  },
  {
    step: "05",
    title: "You review & scale",
    description: "Continuous code audits, QA, and seamless handover guarantee long-term stability and platform reliability.",
  },
];

function getServiceIcon(icon: string) {
  switch (icon) {
    case "palette":
      return <Palette className="w-6 h-6 text-ink-900" />;
    case "smartphone":
      return <Smartphone className="w-6 h-6 text-ink-900" />;
    case "video":
      return <Video className="w-6 h-6 text-ink-900" />;
    case "trending-up":
      return <TrendingUp className="w-6 h-6 text-ink-900" />;
    case "file-text":
      return <FileText className="w-6 h-6 text-ink-900" />;
    case "code":
    default:
      return <Code2 className="w-6 h-6 text-ink-900" />;
  }
}

export default async function HomePage() {
  let services = DEFAULT_SERVICES;
  let faqs = DEFAULT_FAQS;
  let showcaseTalents: TalentShowcaseItem[] = [];
  let totalTalents = 3;
  let totalProjects = 3;
  let totalSpecialties = 6;
  let heroHeadlineLine1 = "Meet the";
  let heroHighlight = "talent.";
  let heroHeadlineLine2 = "Build what's next.";
  let heroDesc =
    "PayTrizz connects ambitious tech teams with pre-vetted specialists in engineering, architecture, design systems, and digital growth. One elite bench of hand-picked creators ready to ship from day one.";

  try {
    const [servicesRes, faqsRes, talentsRes, projectsRes, specialtiesRes, homePageRes] = await Promise.all([
      fetch("http://127.0.0.1:8080/api/services", { cache: "no-store" }).catch(() => null),
      fetch("http://127.0.0.1:8080/api/faqs", { cache: "no-store" }).catch(() => null),
      fetch("http://127.0.0.1:8080/api/talents?per_page=10", { cache: "no-store" }).catch(() => null),
      fetch("http://127.0.0.1:8080/api/projects?per_page=1", { cache: "no-store" }).catch(() => null),
      fetch("http://127.0.0.1:8080/api/specialties", { cache: "no-store" }).catch(() => null),
      fetch("http://127.0.0.1:8080/api/pages/home", { cache: "no-store" }).catch(() => null),
    ]);

    if (homePageRes && homePageRes.ok) {
      const homeJson = await homePageRes.json();
      const homeSections = homeJson.data?.sections || [];
      const hero = homeSections.find((s: any) => s.key === "hero" || s.type === "hero");
      if (hero && hero.content) {
        let c = hero.content;
        if (typeof c === "string") {
          try {
            c = JSON.parse(c);
          } catch {}
        }
        if (c.headline_line1) heroHeadlineLine1 = c.headline_line1;
        if (c.highlight_word) heroHighlight = c.highlight_word;
        if (c.headline_line2) heroHeadlineLine2 = c.headline_line2;
        if (c.description) heroDesc = c.description;
      }
    }

    if (servicesRes && servicesRes.ok) {
      const json = await servicesRes.json();
      if (json.data && json.data.length > 0) services = json.data;
    }
    if (faqsRes && faqsRes.ok) {
      const json = await faqsRes.json();
      if (json.data && json.data.length > 0) faqs = json.data;
    }
    if (talentsRes && talentsRes.ok) {
      const json = await talentsRes.json();
      if (json.data?.total !== undefined) {
        totalTalents = json.data.total;
      }
      const rawList = json.data?.data || [];
      if (rawList.length > 0) {
        showcaseTalents = rawList.map((t: any) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          headline: t.headline,
          avatar_initials: t.name
            ? t.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            : "PT",
          location: t.location,
          years_experience: t.years_experience,
          hourly_rate_usd: t.hourly_rate_usd,
          availability: t.availability === "available" ? "Available for Sprints" : "Available Soon",
          badges: t.badges?.map((b: any) => b.label) || [],
          skills: t.skills?.map((s: any) => s.skill_name) || [],
          highlight: t.bio,
        }));
      }
    }
    if (projectsRes && projectsRes.ok) {
      const json = await projectsRes.json();
      if (json.data?.total !== undefined) {
        totalProjects = json.data.total;
      }
    }
    if (specialtiesRes && specialtiesRes.ok) {
      const json = await specialtiesRes.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        totalSpecialties = json.data.length;
      }
    }
  } catch {}

  let publicSettings = undefined;
  try {
    publicSettings = await getPublicSettings();
  } catch {}

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1 space-y-20 sm:space-y-28 pb-24">
        {/* ===================================================================
            SECTION 1: HERO (2-Column Grid: Headline & Dynamic Rotating Talent Cards)
        =================================================================== */}
        <section className="relative pt-12 sm:pt-16 pb-20 sm:pb-28 bg-white border-b border-ink-100 overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
              {/* Left Column: Headline, Value Proposition, Action Buttons & Trust */}
              <div className="lg:col-span-7 space-y-7 sm:space-y-9">
                {/* Headline with PayTrizz Yellow Stabilo Highlight */}
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-ink-900">
                  {heroHeadlineLine1}{" "}
                  <span className="relative inline-block text-ink-900 bg-brand-500 px-4 py-1 rounded-2xl shadow-sm border border-brand-600">
                    {heroHighlight}
                  </span>
                  <br />
                  <span className="text-neutral-500">{heroHeadlineLine2}</span>
                </h1>

                {/* Lead Paragraph */}
                <p className="text-lg sm:text-xl text-ink-700 leading-relaxed max-w-2xl font-medium">
                  {heroDesc}
                </p>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Link
                    href="/talents"
                    className="inline-flex items-center justify-center gap-2 bg-brand-500 text-ink-900 font-extrabold px-8 py-4 rounded-full text-base hover:bg-brand-600 transition-all shadow-[0_6px_20px_rgba(252,207,0,0.35)] active:scale-[0.98]"
                  >
                    <span>Hire a Talent Specialist</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 bg-white text-ink-900 font-extrabold px-8 py-4 rounded-full text-base border-2 border-brand-300 hover:bg-brand-50 transition-colors shadow-xs"
                  >
                    <span>Get in Touch</span>
                  </Link>
                </div>

                {/* Social Proof / Trust Indicators (Dynamic from API Talents) */}
                <HeroSocialProof
                  initialTalents={showcaseTalents.map((t) => ({
                    id: t.id,
                    name: t.name,
                    avatar_initials: t.avatar_initials,
                  }))}
                  initialTotal={totalTalents}
                />
              </div>

              {/* Right Column: Dynamic Rotating Talent Showcase Card */}
              <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none pt-4 lg:pt-0 h-[455px]">
                <HeroTalentShowcase initialTalents={showcaseTalents} />
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 2: STATS BAND (Floating PayTrizz Yellow Solid Card - Dynamic API)
        =================================================================== */}
        <StatsBand
          initialTalentsCount={totalTalents}
          initialProjectsCount={totalProjects}
          initialSpecialtiesCount={totalSpecialties}
          clientSatisfaction="4.9/5"
        />

        {/* ===================================================================
            SECTION 3: CAPABILITIES & SERVICES
        =================================================================== */}
        <section className="px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                CAPABILITIES
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
                Full-spectrum <span className="bg-brand-500 px-3 py-0.5 rounded-xl text-ink-900 inline-block shadow-sm">disciplines.</span>
              </h2>
              <p className="text-sm sm:text-base text-neutral-600">
                Whether you need a dedicated senior architect or an assembled cross-functional pod, our squad covers every tier.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl p-8 border border-neutral-200/90 shadow-[0_8px_30px_rgba(29,32,35,0.04)] hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(252,207,0,0.12)] hover:border-brand-500/60 transition-all duration-200 group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-ink-900 group-hover:bg-brand-500 transition-colors">
                      {getServiceIcon(s.icon)}
                    </div>
                    <h3 className="text-xl font-bold text-ink-900 group-hover:text-brand-600 transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                  <div className="pt-6 border-t border-neutral-100 mt-6">
                    <Link
                      href={`/services#${s.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-900 group-hover:text-brand-600 transition"
                    >
                      <span>Explore capabilities</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 4: HOW IT WORKS (5 Steps Velocity Timeline)
        =================================================================== */}
        <section className="px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto bg-white rounded-[32px] sm:rounded-[40px] p-8 sm:p-14 border border-neutral-200/90 shadow-[0_8px_30px_rgba(29,32,35,0.04)] space-y-10">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                VELOCITY TIMELINE
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
                From inquiry to kickoff in <span className="bg-brand-500 px-3 py-0.5 rounded-xl text-ink-900 inline-block shadow-sm">48 hours.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {STEPS.map((step) => (
                <div key={step.step} className="space-y-3 relative">
                  <div className="w-10 h-10 rounded-full bg-brand-500 text-ink-900 font-black text-sm flex items-center justify-center shadow-xs border border-brand-600">
                    {step.step}
                  </div>
                  <h4 className="text-base font-bold text-ink-900">{step.title}</h4>
                  <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 5: FAQ ACCORDION
        =================================================================== */}
        <section className="px-4 sm:px-6">
          <div className="max-w-[900px] mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-brand-600">
                QUESTIONS ANSWERED
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-ink-900 tracking-tight">
                Frequently asked <span className="bg-brand-500 px-3 py-0.5 rounded-xl text-ink-900 inline-block shadow-sm">questions.</span>
              </h2>
            </div>

            <FAQAccordion items={faqs} />
          </div>
        </section>

        {/* ===================================================================
            SECTION 6: CTA BANNER (Radiant PayTrizz Yellow)
        =================================================================== */}
        <section className="px-4 sm:px-6">
          <div className="max-w-[1200px] mx-auto bg-brand-500 rounded-[32px] sm:rounded-[40px] p-8 sm:p-14 text-ink-900 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_16px_50px_rgba(252,207,0,0.30)] border border-brand-600/30">
            <div className="max-w-xl text-center md:text-left space-y-2">
              <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-ink-900">
                Ready to build with PayTrizz?
              </h3>
              <p className="text-base font-medium text-ink-800">
                Let&apos;s assemble the ideal squad for your next major milestone. Transparent contracts, vetted velocity.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Link
                href="/contact"
                className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-black bg-ink-900 text-white hover:bg-black transition-all shadow-md text-center"
              >
                Get in Touch →
              </Link>
              <Link
                href="/talents"
                className="w-full sm:w-auto px-8 py-4 rounded-full text-sm font-black bg-white text-ink-900 hover:bg-brand-50 transition-colors shadow-sm text-center"
              >
                Browse Talents
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer initialSettings={publicSettings} />
    </div>
  );
}
