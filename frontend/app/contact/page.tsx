"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { toast } from "sonner";
import { Mail, MessageSquare, Phone, Send, MapPin } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    service: "Web Development",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({
    contact_email: "hello@paytrizz.com",
    contact_reply_eta_text: "1–2 business days",
    contact_phone: "+62 812-3456-7890",
    contact_address: "Jakarta Selatan, DKI Jakarta, Indonesia",
  });

  const [hero, setHero] = useState({
    headline_line1: "Let's build your next",
    headline_line2: "breakthrough.",
    description: "Tell us about your roadmap, timeline, and the specialists you need. We match you with vetted talents in 24–48 hours.",
  });

  useEffect(() => {
    fetch("/api/proxy/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setSettings((prev) => ({ ...prev, ...json.data }));
        }
      })
      .catch(() => {});

    fetch("/api/proxy/pages/contact", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.sections) {
          const heroSec = json.data.sections.find(
            (s: any) => s.key === "hero" || s.type === "hero"
          );
          if (heroSec?.content) {
            let content = heroSec.content;
            if (typeof content === "string") {
              try { content = JSON.parse(content); } catch {}
            }
            setHero((prev) => ({
              headline_line1: content.headline_line1 || prev.headline_line1,
              headline_line2: content.headline_line2 || prev.headline_line2,
              description: content.description || prev.description,
            }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const subject = formData.company
        ? `${formData.service} Inquiry from ${formData.company}`
        : `${formData.service} Inquiry from ${formData.name}`;

      const res = await fetch("/api/proxy/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "general",
          name: formData.name,
          email: formData.email,
          subject: subject,
          message: formData.company 
            ? `Company: ${formData.company}\nService: ${formData.service}\n\n${formData.message}`
            : `Service: ${formData.service}\n\n${formData.message}`,
          source_url: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to submit inquiry");
      }

      const ticketCode = json.data?.ticket_code || `PTZ-${new Date().getFullYear()}-000000`;
      setSubmittedTicket(ticketCode);
      toast.success("Inquiry sent successfully!", {
        description: `Your reference ticket is ${ticketCode}. Our talent team will reply within 24 hours.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit inquiry. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 py-12 lg:py-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Heading & Contact Info */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink-900 leading-tight">
                  {hero.headline_line1}{" "}
                  <span className="bg-brand-500 text-ink-900 px-3 py-0.5 rounded-xl inline-block">
                    {hero.headline_line2}
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-ink-700 leading-relaxed">
                  {hero.description}
                </p>
              </div>

              <div className="space-y-6 pt-4 border-t border-neutral-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-ink-900 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                      Email
                    </h4>
                    <p className="text-sm font-semibold text-ink-900">
                      {settings.contact_email || "hello@paytrizz.com"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-ink-900 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                      Response ETA
                    </h4>
                    <p className="text-sm font-semibold text-ink-900">
                      {settings.contact_reply_eta_text || "1–2 business days"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-ink-900 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                      Phone / WhatsApp
                    </h4>
                    <p className="text-sm font-semibold text-ink-900">
                      {settings.contact_phone || "+62 812-3456-7890"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-ink-900 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500">
                      Headquarters
                    </h4>
                    <p className="text-sm font-semibold text-ink-900">
                      {settings.contact_address || "Jakarta Selatan, DKI Jakarta, Indonesia"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200 shadow-[0_8px_30px_rgba(29,32,35,0.06)]">
              {submittedTicket ? (
                <div className="text-center py-12 space-y-5">
                  <div className="w-16 h-16 rounded-full bg-brand-500 text-ink-900 font-extrabold text-2xl mx-auto flex items-center justify-center">
                    ✓
                  </div>
                  <h3 className="text-2xl font-bold text-ink-900">Inquiry Received!</h3>
                  <p className="text-ink-700 max-w-md mx-auto text-sm leading-relaxed">
                    Thank you for reaching out. We have registered your request under ticket:
                  </p>
                  <div className="inline-block bg-neutral-100 font-mono text-base font-bold text-ink-900 px-5 py-2.5 rounded-full border border-neutral-300">
                    {submittedTicket}
                  </div>
                  <p className="text-xs text-ink-500 pt-2">
                    A confirmation will be delivered to your inbox with direct scheduling links.
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                      Send another inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-ink-700">
                        Full Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full h-12 px-4 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-ink-900 text-ink-900 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-ink-700">
                        Work Email *
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@company.com"
                        className="w-full h-12 px-4 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-ink-900 text-ink-900 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-ink-700">
                        Company Name
                      </label>
                      <input
                        id="company"
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Acme Inc."
                        className="w-full h-12 px-4 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-ink-900 text-ink-900 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="service" className="text-xs font-bold uppercase tracking-wider text-ink-700">
                        Specialty / Service
                      </label>
                      <select
                        id="service"
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-ink-900 text-ink-900 text-sm bg-white"
                      >
                        <option value="Web Development">Web Development</option>
                        <option value="UI/UX Design">UI/UX Design</option>
                        <option value="Mobile Apps">Mobile Apps</option>
                        <option value="Video & Motion">Video & Motion</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Content & Copywriting">Content & Copywriting</option>
                        <option value="Dedicated Pod/Squad">Dedicated Squad / Pod</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-ink-700">
                      Project Details & Requirements *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us what you're building, target launch dates, or key tech stack preferences..."
                      className="w-full p-4 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-ink-900 text-ink-900 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 inline-flex items-center justify-center gap-2 bg-brand-500 text-ink-900 font-bold rounded-full hover:bg-brand-600 transition-all shadow-[0_4px_14px_rgba(252,207,0,0.35)] disabled:opacity-70 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Sending inquiry...</span>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
