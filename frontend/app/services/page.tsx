import Link from "next/link";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import {
  ArrowRight,
  Code2,
  Palette,
  Smartphone,
  Video,
  TrendingUp,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { getPublicSettings } from "@/lib/settings";
import { getPublicPage, getHeroSection } from "@/lib/pages";

import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: "/services",
    pageKey: "services",
    title: "Services & Capabilities",
    description: "Explore our specialized services: full-stack web engineering, UI/UX product design, mobile apps, video production, and digital growth.",
  });
}

const DETAILED_SERVICES = [
  {
    id: 1,
    slug: "web-development",
    title: "Web Development",
    icon: <Code2 className="w-8 h-8 text-ink-900" />,
    tagline: "High-performance web apps built for massive scale.",
    description:
      "From greenfield web platforms to complex enterprise migrations, our engineering specialists ship resilient architectures using Golang, Next.js, TypeScript, PostgreSQL, and cloud-native microservices.",
    deliverables: [
      "End-to-end full stack architecture",
      "API design and database performance tuning",
      "High-converting landing pages & SSR/ISR systems",
      "Automated CI/CD pipelines & test suites",
    ],
  },
  {
    id: 2,
    slug: "ui-ux-design",
    title: "UI/UX Product Design",
    icon: <Palette className="w-8 h-8 text-ink-900" />,
    tagline: "Intuitive, cohesive design systems that convert.",
    description:
      "We craft human-centric interfaces that eliminate cognitive friction. Everything from rapid Figma wireframes to production design tokens and full interactive prototypes.",
    deliverables: [
      "Design systems & component token libraries",
      "User research, persona mapping & journey flows",
      "Responsive web and mobile application UX",
      "Interactive high-fidelity prototypes in Figma",
    ],
  },
  {
    id: 3,
    slug: "mobile-apps",
    title: "Mobile App Engineering",
    icon: <Smartphone className="w-8 h-8 text-ink-900" />,
    tagline: "Smooth iOS & Android experiences with zero latency.",
    description:
      "Cross-platform and native mobile solutions engineered for silky 60fps performance, offline resilience, and seamless API synchronization.",
    deliverables: [
      "Cross-platform React Native & Flutter builds",
      "Native iOS (Swift) & Android (Kotlin) features",
      "App Store & Google Play submission and compliance",
      "Real-time notifications and biometric authentication",
    ],
  },
  {
    id: 4,
    slug: "video-and-motion",
    title: "Video & Motion Production",
    icon: <Video className="w-8 h-8 text-ink-900" />,
    tagline: "Cinematic brand storytelling and dynamic motion graphics.",
    description:
      "Elevate your product positioning with high-octane 2D/3D motion design, commercial reels, product demos, and social video creative.",
    deliverables: [
      "Product teaser & launch campaign trailers",
      "2D/3D motion graphics & UI micro-interactions",
      "Live-action commercial post-production & color grading",
      "Short-form social media motion packages",
    ],
  },
  {
    id: 5,
    slug: "digital-marketing",
    title: "Growth & Performance Marketing",
    icon: <TrendingUp className="w-8 h-8 text-ink-900" />,
    tagline: "Data-driven acquisition, conversion, and retention.",
    description:
      "Our digital growth strategists combine rigorous experimentation, paid acquisition optimization, and technical SEO to scale your user base profitably.",
    deliverables: [
      "Full-funnel paid media management (Meta, Google, LinkedIn)",
      "Technical SEO & programmatic search strategies",
      "Conversion Rate Optimization (CRO) A/B testing",
      "Lifecycle email & push retention sequences",
    ],
  },
  {
    id: 6,
    slug: "content-and-copywriting",
    title: "Content & Copywriting",
    icon: <FileText className="w-8 h-8 text-ink-900" />,
    tagline: "High-impact narrative and messaging that sells.",
    description:
      "Sharpen your value proposition with compelling copywriting that turns visitors into loyal advocates, from website copy to technical documentation.",
    deliverables: [
      "Homepage & landing page conversion copy",
      "Product messaging guides & tone of voice manuals",
      "Technical whitepapers & in-depth case studies",
      "SEO-optimized thought leadership articles",
    ],
  },
];

function getServiceIcon(iconName?: string) {
  switch (iconName?.toLowerCase()) {
    case "code2":
    case "code":
      return <Code2 className="w-8 h-8 text-ink-900" />;
    case "palette":
    case "design":
      return <Palette className="w-8 h-8 text-ink-900" />;
    case "smartphone":
    case "mobile":
      return <Smartphone className="w-8 h-8 text-ink-900" />;
    case "video":
    case "motion":
      return <Video className="w-8 h-8 text-ink-900" />;
    case "trendingup":
    case "marketing":
    case "growth":
      return <TrendingUp className="w-8 h-8 text-ink-900" />;
    case "filetext":
    case "content":
    case "copywriting":
      return <FileText className="w-8 h-8 text-ink-900" />;
    default:
      return <Code2 className="w-8 h-8 text-ink-900" />;
  }
}

export default async function ServicesPage() {
  const apiBase = (process.env.API_URL || "http://localhost:8080/api").replace(/\/+$/, "");
  let displayServices = DETAILED_SERVICES;

  const [pageData, publicSettings, res] = await Promise.all([
    getPublicPage("services"),
    getPublicSettings().catch(() => undefined),
    fetch(`${apiBase}/services`, { cache: "no-store" }).catch(() => null),
  ]);

  const hero = getHeroSection(pageData, {
    eyebrow: "OUR SERVICES",
    headline_line1: "Engineered for speed.",
    headline_line2: "Designed for scale.",
    description: "Cross-functional disciplines built to handle complete product life-cycles.",
  });

  if (res && res.ok) {
    try {
      const json = await res.json();
      if (Array.isArray(json?.data) && json.data.length > 0) {
        displayServices = json.data.map((ds: any, idx: number) => {
          const matched = DETAILED_SERVICES.find(
            (def) => def.slug === ds.slug || def.title.toLowerCase() === ds.title.toLowerCase()
          );
          return {
            id: ds.id || idx + 1,
            slug: ds.slug || `service-${idx + 1}`,
            title: ds.title,
            icon: ds.icon ? getServiceIcon(ds.icon) : matched?.icon || <Code2 className="w-8 h-8 text-ink-900" />,
            tagline:
              matched?.tagline ||
              ds.description?.slice(0, 80) ||
              "Specialized engineering squad delivery.",
            description: ds.description || matched?.description || "",
            deliverables: matched?.deliverables || [
              "End-to-end dedicated squad architecture",
              "Production milestone sprint deliverables",
              "Automated testing and QA compliance",
              "Direct Slack / Discord sprint updates",
            ],
          };
        });
      }
    } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1">
        {/* Services Hero */}
        <section className="px-4 sm:px-6 pt-12 pb-16 lg:pb-24">
          <div className="max-w-[1200px] mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-xs font-bold uppercase tracking-wider text-ink-900">
              <span>{hero.eyebrow}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink-900 max-w-4xl mx-auto leading-tight">
              {hero.headline_line1}{" "}
              <span className="bg-brand-500 text-ink-900 px-3 py-0.5 rounded-xl inline-block">
                {hero.headline_line2}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-ink-700 max-w-2xl mx-auto leading-relaxed">
              {hero.description}
            </p>
          </div>
        </section>

        {/* Detailed Services Grid */}
        <section className="px-4 sm:px-6 pb-20 lg:pb-28">
          <div className="max-w-[1200px] mx-auto space-y-12">
            {displayServices.map((s, idx) => (
              <div
                key={s.id}
                id={s.slug}
                className={`bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200/90 shadow-[0_8px_30px_rgba(29,32,35,0.04)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start ${
                  idx % 2 === 1 ? "bg-neutral-50/50" : ""
                }`}
              >
                <div className="lg:col-span-6 space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center">
                    {s.icon}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-900">
                    {s.title}
                  </h2>
                  <p className="text-brand-600 font-semibold text-base">
                    {s.tagline}
                  </p>
                  <p className="text-ink-700 leading-relaxed text-sm sm:text-base">
                    {s.description}
                  </p>

                  <div className="pt-2">
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 bg-brand-500 text-ink-900 font-bold px-6 py-3 rounded-full hover:bg-brand-600 transition-all text-sm shadow-sm"
                    >
                      <span>Inquire About This Service</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    Key Deliverables
                  </h3>
                  <ul className="space-y-3">
                    {s.deliverables.map((item, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-3 text-sm text-ink-900 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer initialSettings={publicSettings} />
    </div>
  );
}
