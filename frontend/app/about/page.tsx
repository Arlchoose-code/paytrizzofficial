import Link from "next/link";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ArrowRight, Award, Compass, ShieldCheck, Zap } from "lucide-react";

import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: "/about",
    pageKey: "about",
    title: "About Us",
    description: "Learn about the mission, values, and engineering leadership behind PayTrizz.",
  });
}

import { getPublicSettings } from "@/lib/settings";
import { getPublicPage, getHeroSection } from "@/lib/pages";

export default async function AboutPage() {
  const [pageData, publicSettings] = await Promise.all([
    getPublicPage("about"),
    getPublicSettings().catch(() => undefined),
  ]);

  const hero = getHeroSection(pageData, {
    eyebrow: "ABOUT US",
    headline_line1: "Empowering extraordinary talent.",
    headline_line2: "Delivering exceptional products.",
    description:
      "We started with a simple conviction: hiring elite engineering and creative specialists shouldn't be a labyrinth of unverified credentials or bloated platform markups.",
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1">
        {/* Dynamic About Hero from CMS */}
        <section className="px-4 sm:px-6 pt-12 pb-16 lg:pb-24">
          <div className="max-w-[1200px] mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-xs font-bold uppercase tracking-wider text-ink-900">
              <Compass className="w-3.5 h-3.5" />
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

        {/* Agency Values */}
        <section className="px-4 sm:px-6 py-16 bg-neutral-50 border-y border-neutral-200">
          <div className="max-w-[1200px] mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900">
                Core Agency Principles
              </h2>
              <p className="text-ink-500">
                How we operate, evaluate talent, and deliver results for our partners.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center text-ink-900">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ink-900">Vetted Craftsmanship</h3>
                <p className="text-ink-700 text-sm leading-relaxed">
                  Only the top 5% of specialists make it into our directory. Every developer, designer, and strategist passes rigorous portfolio checks and technical tests.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center text-ink-900">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ink-900">Velocity Without Debt</h3>
                <p className="text-ink-700 text-sm leading-relaxed">
                  Fast delivery should never mean sloppy architecture. We deliver production-grade codebases, robust automated tests, and scalable infrastructure from day one.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-neutral-200 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center text-ink-900">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-ink-900">Radical Transparency</h3>
                <p className="text-ink-700 text-sm leading-relaxed">
                  Direct communication between clients and specialists. No confusing middle layers or arbitrary hours. Milestones are agreed, tracked, and delivered smoothly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Agency Story Section */}
        <section className="px-4 sm:px-6 py-20">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900">
                Built by founders, for founders.
              </h2>
              <p className="text-ink-700 leading-relaxed text-base sm:text-lg">
                Having scaled digital products and navigated painful outsourcing headaches, the PayTrizz team set out to engineer the platform we always wished existed: high-velocity matchmaking, guaranteed quality, and clear accountability.
              </p>
              <p className="text-ink-700 leading-relaxed text-base sm:text-lg">
                Today, PayTrizz powers product sprints for tech companies, creative studios, and innovative brands across Southeast Asia and global markets.
              </p>

              <div className="pt-4">
                <Link
                  href="/talents"
                  className="inline-flex items-center gap-2 bg-brand-500 text-ink-900 font-bold px-7 py-3.5 rounded-full hover:bg-brand-600 transition-all shadow-md"
                >
                  <span>Meet Our Specialists</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-ink-900 text-white rounded-[32px] p-8 sm:p-12 space-y-6 shadow-xl">
              <h3 className="text-2xl font-bold text-white">Our Commitments</h3>
              <ul className="space-y-4 text-sm sm:text-base text-neutral-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500 text-ink-900 font-bold flex items-center justify-center shrink-0 text-xs">✓</span>
                  <span><strong>24–48h Match Turnaround:</strong> No weeks wasted waiting for interviews.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500 text-ink-900 font-bold flex items-center justify-center shrink-0 text-xs">✓</span>
                  <span><strong>Trial Period:</strong> Risk-free first week onboarding guarantee.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500 text-ink-900 font-bold flex items-center justify-center shrink-0 text-xs">✓</span>
                  <span><strong>Confidentiality First:</strong> Strict NDAs and secure IP ownership transfer.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer initialSettings={publicSettings} />
    </div>
  );
}
