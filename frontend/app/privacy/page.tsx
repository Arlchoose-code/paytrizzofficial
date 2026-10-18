import { Metadata } from "next";
import { constructMetadata } from "@/lib/seo";
import { getPublicSettings } from "@/lib/settings";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    path: "/privacy",
    pageKey: "privacy",
    title: "Privacy Policy",
    description: "Read our Privacy Policy to understand how we collect, use, and protect your personal and project information.",
  });
}

export default async function PrivacyPage() {
  const publicSettings = await getPublicSettings().catch(() => undefined);
  const siteName = publicSettings?.site_name || "PayTrizz";

  const apiBase = (process.env.INTERNAL_BACKEND_URL || process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/+$/, "");
  const pageData = await fetch(`${apiBase}/pages/privacy`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => j?.data)
    .catch(() => null);

  const richtextSection = pageData?.sections?.find((s: any) => s.type === "richtext" || s.key === "content");
  const dynamicBodyHtml = richtextSection?.content?.body;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar initialSettings={publicSettings} />

      <main className="flex-1 py-14 sm:py-20">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="space-y-4 border-b border-neutral-200 pb-8 mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-xs font-bold uppercase tracking-wider text-ink-900">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Legal & Compliance</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-900">
              {pageData?.title || "Privacy Policy"}
            </h1>
            <p className="text-neutral-500 text-sm">
              Last updated: October 2026 • Effective immediately
            </p>
          </div>

          {/* Dynamic Content from CMS or Fallback */}
          {dynamicBodyHtml ? (
            <div
              className="prose prose-lg max-w-none text-neutral-700 leading-relaxed font-sans prose-headings:font-extrabold prose-headings:text-ink-900 prose-a:text-brand-600 prose-a:font-bold prose-strong:text-ink-900"
              dangerouslySetInnerHTML={{ __html: dynamicBodyHtml }}
            />
          ) : (
            <div className="space-y-10 text-neutral-700 leading-relaxed text-base sm:text-lg">
              <section className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-ink-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-brand-500" />
                  1. Information We Collect
                </h2>
                <p>
                  When you interact with {siteName}, we collect information you provide directly to us:
                </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-600 text-base">
                <li><strong>Contact & Proposal Details:</strong> Name, work email address, company name, phone number, and project scope submitted via our inquiry and proposal forms.</li>
                <li><strong>Talent Profiles & Portfolios:</strong> Resumes, CV documents, portfolio links, skill tags, and billing details provided during talent registration or profile updates.</li>
                <li><strong>Communication Logs:</strong> Messages exchanged with our team, support requests, and feedback submitted through our direct contact portals.</li>
                <li><strong>Technical Usage Data:</strong> Anonymized log information including browser type, operating system, IP address, and page interaction timestamps.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-ink-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-500" />
                2. How We Use Your Information
              </h2>
              <p>
                We use the information we gather strictly to deliver high-quality engineering and matchmaking services:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-neutral-600 text-base">
                <li>Vetting, evaluating, and matching talent specialists with suitable client projects.</li>
                <li>Responding promptly to project squad inquiries and scoping architecture milestones.</li>
                <li>Maintaining authentication security, preventing spam, and auditing session safety.</li>
                <li>Complying with regulatory obligations and legal dispute protections.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-ink-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" />
                3. Confidentiality & Non-Disclosure
              </h2>
              <p>
                We recognize that project specifications, architectural designs, and proprietary codebases represent invaluable intellectual property. All proprietary information shared with {siteName} is protected under mutual non-disclosure agreements (NDAs) and is never sold, traded, or shared with unauthorized third parties.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-ink-900">
                4. Data Security & Retention
              </h2>
              <p>
                We implement industry-standard encryption protocols (TLS/SSL in transit, hashed credentials at rest) and strict role-based access control across all database clusters. We retain personal and project information only for as long as necessary to fulfill contractual agreements or legal compliance.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-ink-900">
                5. Your Rights & Contact Information
              </h2>
              <p>
                You have the right to request access to, correction of, or permanent deletion of your personal data stored within our systems. To exercise these rights or raise inquiries regarding this policy, please reach out to us via our <a href="/contact" className="text-brand-500 font-semibold underline hover:text-brand-600">Contact Us</a> page.
              </p>
            </section>
          </div>
        )}
        </div>
      </main>

      <Footer initialSettings={publicSettings} />
    </div>
  );
}
