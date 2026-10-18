"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { toast } from "sonner";
import {
  Rocket,
  Upload,
  CheckCircle2,
  FileText,
  X,
  Sparkles,
  ShieldCheck,
  Clock,
  Check,
} from "lucide-react";

const BUDGET_OPTIONS = [
  "< $5,000",
  "$5,000 – $15,000",
  "$15,000 – $50,000",
  "$50,000 – $100,000",
  "> $100,000",
  "To Be Scoped",
];

const TIMELINE_OPTIONS = [
  "Immediate (within 1–2 weeks)",
  "1 month sprint",
  "2–3 months roadmap",
  "Ongoing dedicated squad",
  "Flexible",
];

export default function RequestProjectPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ code: string } | null>(null);

  // Project Request Form State
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    title: "",
    budgetRange: BUDGET_OPTIONS[1],
    timeline: TIMELINE_OPTIONS[0],
    message: "",
  });

  const [uploadedFile, setUploadedFile] = useState<{ id: number; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const res = await fetch("/api/proxy/applications/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setUploadedFile({ id: json.data.id, name: file.name });
        toast.success("Document attached successfully");
      } else {
        toast.error(json.message || "Failed to upload file");
      }
    } catch {
      toast.error("Network error while uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName || !form.email || !form.title || !form.message) {
      toast.error("Please fill in all required fields (Name, Email, Project Title, Description)");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        type: "project",
        full_name: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        company_name: form.companyName || undefined,
        title: form.title,
        budget_range: form.budgetRange,
        timeline: form.timeline,
        message: form.message,
        media_ids: uploadedFile?.id ? [uploadedFile.id] : undefined,
      };

      const res = await fetch("/api/proxy/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSubmittedTicket({
          code: json.data.ticket_code || "PTZ-" + new Date().getFullYear() + "-PROJECT",
        });
        toast.success("Project request submitted successfully!");
      } else {
        toast.error(json.message || "Failed to submit project request");
      }
    } catch {
      toast.error("Error connecting to server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* Header Title & Intro */}
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-ink-900 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>START A PROJECT</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-ink-900 tracking-tight leading-tight">
              Request a Dedicated <br />
              <span className="bg-brand-500 px-3 py-0.5 rounded-2xl text-ink-900 inline-block">
                Project Squad.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-ink-700 leading-relaxed">
              Tell us about your project requirements, scope, budget, and timeline. We&apos;ll match you with a vetted team of elite specialists within 48 hours.
            </p>
          </div>

          {/* Form Card or Success Panel */}
          <div className="max-w-3xl mx-auto">
            {submittedTicket ? (
              <div className="bg-white border border-neutral-200 rounded-[32px] p-8 sm:p-12 shadow-sm text-center space-y-6">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 border border-green-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-900">
                    Project Request Received!
                  </h2>
                  <p className="text-sm text-ink-700 max-w-md mx-auto">
                    We&apos;ve logged your request into our intake pipeline. A confirmation email has been dispatched to{" "}
                    <span className="font-bold text-ink-900">{form.email}</span>.
                  </p>
                </div>

                <div className="bg-neutral-50 rounded-2xl p-4 sm:p-6 max-w-sm mx-auto border border-neutral-200 space-y-1">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-ink-500">
                    Your Ticket Reference
                  </span>
                  <div className="text-2xl font-black text-ink-900 font-mono tracking-wide">
                    {submittedTicket.code}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => {
                      setSubmittedTicket(null);
                      setForm({
                        fullName: "",
                        email: "",
                        phone: "",
                        companyName: "",
                        title: "",
                        budgetRange: BUDGET_OPTIONS[1],
                        timeline: TIMELINE_OPTIONS[0],
                        message: "",
                      });
                      setUploadedFile(null);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-bold bg-neutral-100 hover:bg-neutral-200 text-ink-900 transition"
                  >
                    Submit Another Request
                  </button>
                  <Link
                    href="/"
                    className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-bold bg-brand-500 hover:bg-brand-600 text-ink-900 transition shadow-sm"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-[32px] p-6 sm:p-10 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Two Column Identity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="e.g. Alex Morgan"
                        className="w-full h-12 px-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-ink-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                        Work Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="alex@acme.inc"
                        className="w-full h-12 px-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-ink-900"
                      />
                    </div>
                  </div>

                  {/* Company & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        placeholder="e.g. Acme Corporation"
                        className="w-full h-12 px-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-ink-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+62 812 3456 7890"
                        className="w-full h-12 px-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-ink-900"
                      />
                    </div>
                  </div>

                  {/* Project Title */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                      Project Title or Brief Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Real-Time Fintech Analytics Mobile App & Backend Engine"
                      className="w-full h-12 px-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-ink-900"
                    />
                  </div>

                  {/* Budget & Timeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                        Target Budget Range
                      </label>
                      <select
                        value={form.budgetRange}
                        onChange={(e) => setForm({ ...form, budgetRange: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-ink-900 bg-white"
                      >
                        {BUDGET_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                        Target Timeline
                      </label>
                      <select
                        value={form.timeline}
                        onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-ink-900 bg-white"
                      >
                        {TIMELINE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                      Project Description & Scope <span className="text-danger">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your project goals, required tech stack, expected deliverables, and any specific squad competencies needed..."
                      className="w-full p-4 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-ink-900"
                    />
                  </div>

                  {/* Brief / PRD Attachment */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink-900 uppercase tracking-wider">
                      Brief / PRD Attachment (Optional, PDF or Doc up to 10MB)
                    </label>
                    {uploadedFile ? (
                      <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                          <span className="text-xs font-semibold text-ink-900 truncate">
                            {uploadedFile.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedFile(null)}
                          className="p-1 hover:bg-neutral-200 rounded text-neutral-500 hover:text-ink-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-neutral-200 hover:border-brand-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-neutral-50/50 hover:bg-brand-50/20">
                        <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                        <span className="text-xs font-semibold text-ink-700">
                          {uploading ? "Uploading attachment..." : "Click or drag to attach project brief / PRD"}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          disabled={uploading}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Submit Button & Guarantees */}
                  <div className="pt-4 space-y-4">
                    <button
                      type="submit"
                      disabled={submitting || uploading}
                      className="w-full h-13 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-extrabold text-sm transition-all shadow-[0_4px_14px_rgba(252,207,0,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <span>Submitting Request...</span>
                      ) : (
                        <>
                          <Rocket className="w-4 h-4" />
                          <span>Request a Dedicated Project Squad</span>
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-ink-500">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span>Strict NDA Guarantee</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-ink-500">
                        <Clock className="w-4 h-4 text-brand-600" />
                        <span>48-Hour Matching SLA</span>
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-ink-500">
                        <Check className="w-4 h-4 text-ink-900" />
                        <span>No Upfront Retainer</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
