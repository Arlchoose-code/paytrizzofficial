import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/lib/settings";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { Scale, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: "/terms",
    pageKey: "terms",
    title: "Terms of Service",
    description: "Review the Terms of Service governing client engagements, talent participation, and platform operations.",
  });
}

export default async function TermsPage() {
  const publicSettings = await getPublicSettings().catch(() => undefined);
  const siteName = publicSettings?.site_name || "PayTrizz";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1 py-14 sm:py-20">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="space-y-4 border-b border-neutral-200 pb-8 mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-xs font-bold uppercase tracking-wider text-ink-900">
              <Scale className="w-3.5 h-3.5" />
              <span>Terms & Conditions</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-900">
              Terms of Service
            </h1>
            <p className="text-neutral-500 text-sm">
              Last updated: October 2026 • Governs all engagements on {siteName}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-10 text-neutral-700 leading-relaxed text-base sm:text-lg">
            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-ink-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-500" />
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing, browsing, or utilizing the services provided by {siteName} (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;), whether as a client seeking engineering squad services or as a vetted specialist, you acknowledge and agree to be bound by these Terms of Service. If you disagree with any part of these terms, you must refrain from using the Platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-ink-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-500" />
                2. Squad Services & Project Delivery
              </h2>
              <p>
                {siteName} curates and manages high-performance digital squads and individual specialists for product engineering, design, and growth initiatives:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-600 text-base">
                <li><strong>Scope of Work:</strong> Each project squad is deployed according to agreed milestone deliverables, timelines, and technical architecture specifications.</li>
                <li><strong>Quality Guarantee:</strong> We ensure thorough vetting and peer code review standards across all delivered codebases and assets.</li>
                <li><strong>Intellectual Property:</strong> Upon full compensation payment according to agreement schedules, all copyright, source code, and design assets belong exclusively to the client.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-ink-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-brand-500" />
                3. Talent Obligations & Professional Standards
              </h2>
              <p>
                Specialists approved to represent {siteName} commit to maintaining the highest caliber of engineering craftsmanship, professional timeliness, and ethical communication:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-600 text-base">
                <li>All profile representations, experience claims, and code repositories must be truthful and verifiable.</li>
                <li>Strict confidentiality and non-solicitation covenants apply to all client project assignments.</li>
                <li>Work delivered must be original and free from unauthorized third-party copy-paste or unvetted unlicensed materials.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-ink-900">
                4. Billing, Invoices & Escrow
              </h2>
              <p>
                Engagements operate on clear milestone billing or recurring sprint retainers. Invoices are issued transparently with no hidden platform surcharges. Payment terms are net-due as specified in individual Master Services Agreements (MSAs).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-ink-900">
                5. Limitation of Liability & Termination
              </h2>
              <p>
                In no event shall {siteName} or its founders be held liable for indirect, incidental, or consequential damages resulting from project delays or third-party infrastructure interruptions beyond our direct control. Either party may terminate active engagements in accordance with the notice provisions set forth in their specific service contracts.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer initialSettings={publicSettings} />
    </div>
  );
}
