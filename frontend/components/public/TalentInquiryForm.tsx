"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Send, RefreshCw } from "lucide-react";

interface TalentInquiryFormProps {
  talentId: number;
  talentName: string;
}

export function TalentInquiryForm({ talentId, talentName }: TalentInquiryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/proxy/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "talent",
          talent_id: talentId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          subject: formData.subject || `Inquiry for ${talentName}`,
          message: formData.message,
          source_url: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to deliver inquiry");
      }

      const ticketCode = json.data?.ticket_code || `PTZ-${new Date().getFullYear()}-000000`;
      setSubmittedTicket(ticketCode);
      toast.success("Direct inquiry routed successfully!", {
        description: `Reference code: ${ticketCode}. Both ${talentName} and PayTrizz management have been notified.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to deliver message. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div id="contact" className="scroll-mt-28 sm:scroll-mt-32 bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200 shadow-md space-y-6">
      <div className="space-y-1.5">
        <h3 className="text-2xl font-bold text-ink-900">
          Send a Message to {talentName}
        </h3>
        <p className="text-sm text-ink-700">
          Inquire directly about project availability, technical consulting, or full squad integration.
        </p>
      </div>

      {submittedTicket ? (
        <div className="text-center py-10 space-y-4 bg-brand-50/50 rounded-2xl border border-brand-200/80 p-6">
          <div className="w-14 h-14 rounded-full bg-brand-500 text-ink-900 font-extrabold text-xl mx-auto flex items-center justify-center shadow-sm">
            ✓
          </div>
          <h4 className="text-xl font-bold text-ink-900">Inquiry Routed to {talentName}!</h4>
          <p className="text-ink-700 max-w-md mx-auto text-sm leading-relaxed">
            Your inquiry is secured in our tracking queue under reference code:
          </p>
          <div className="inline-block bg-white font-mono text-base font-bold text-ink-900 px-5 py-2 rounded-full border border-neutral-300 shadow-sm">
            {submittedTicket}
          </div>
          <p className="text-xs text-ink-500 pt-1">
            A confirmation receipt has been dispatched to your email with direct thread information.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900 hover:text-brand-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Send another message</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full h-11 px-4 mt-1 rounded-xl border border-neutral-300 text-sm text-ink-900 focus:ring-2 focus:ring-ink-900 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
                Your Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                className="w-full h-11 px-4 mt-1 rounded-xl border border-neutral-300 text-sm text-ink-900 focus:ring-2 focus:ring-ink-900 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+62 812-xxxx-xxxx"
                className="w-full h-11 px-4 mt-1 rounded-xl border border-neutral-300 text-sm text-ink-900 focus:ring-2 focus:ring-ink-900 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
                Subject *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Mobile App Redesign or Technical Consulting"
                className="w-full h-11 px-4 mt-1 rounded-xl border border-neutral-300 text-sm text-ink-900 focus:ring-2 focus:ring-ink-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
              Message / Project Scope *
            </label>
            <textarea
              rows={4}
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder={`Describe what you'd like to build with ${talentName}...`}
              className="w-full p-4 mt-1 rounded-xl border border-neutral-300 text-sm text-ink-900 focus:ring-2 focus:ring-ink-900 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 inline-flex items-center justify-center gap-2 bg-brand-500 text-ink-900 font-bold rounded-full hover:bg-brand-600 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Routing message...</span>
            ) : (
              <>
                <span>Send Message</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-xs text-ink-500 pt-1">
            <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
            <span>Your message is routed directly to {talentName} with an instant tracking ticket code.</span>
          </div>
        </form>
      )}
    </div>
  );
}
