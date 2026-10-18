"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Edit2,
  Send,
  RefreshCw,
  X,
  Code,
  FileText,
  Sparkles,
  Save,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailTemplateItem {
  id: number;
  key: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables?: string[] | null;
  description?: string | null;
  is_active: boolean;
  updated_at: string;
}

export default function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateItem | null>(null);
  const [formSubject, setFormSubject] = useState("");
  const [formBodyHtml, setFormBodyHtml] = useState("");
  const [formBodyText, setFormBodyText] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [activeTab, setActiveTab] = useState<"html" | "text" | "preview">("html");
  const [saving, setSaving] = useState(false);

  // Test Send Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testTemplate, setTestTemplate] = useState<EmailTemplateItem | null>(null);
  const [testEmail, setTestEmail] = useState("admin@paytrizz.com");
  const [sendingTest, setSendingTest] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/admin/email-templates");
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.data || []);
      }
    } catch {
      toast.error("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openEditModal = (tmpl: EmailTemplateItem) => {
    setEditingTemplate(tmpl);
    setFormSubject(tmpl.subject);
    setFormBodyHtml(tmpl.body_html);
    setFormBodyText(tmpl.body_text);
    setFormIsActive(tmpl.is_active);
    setActiveTab("html");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/admin/email-templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: formSubject,
          body_html: formBodyHtml,
          body_text: formBodyText,
          is_active: formIsActive,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success("Email template saved successfully");
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingTemplate.id ? json.data : t))
        );
        setEditingTemplate(null);
      } else {
        toast.error(json.message || "Failed to update template");
      }
    } catch {
      toast.error("Network error while saving template");
    } finally {
      setSaving(false);
    }
  };

  const openTestModal = (tmpl: EmailTemplateItem) => {
    setTestTemplate(tmpl);
    setTestModalOpen(true);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTemplate) return;

    setSendingTest(true);
    try {
      const res = await fetch(`/api/proxy/admin/email-templates/${testTemplate.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_email: testEmail }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(`Test email dispatched to ${testEmail}!`, {
          description: "Check the outbox monitor to track dispatch delivery status.",
        });
        setTestModalOpen(false);
      } else {
        toast.error(json.message || "Failed to dispatch test email");
      }
    } catch {
      toast.error("Network error while sending test email");
    } finally {
      setSendingTest(false);
    }
  };

  const insertVariable = (varName: string) => {
    const token = `{{${varName}}}`;
    if (activeTab === "html") {
      setFormBodyHtml((prev) => prev + token);
    } else {
      setFormBodyText((prev) => prev + token);
    }
    toast.info(`Inserted token ${token}`);
  };

  return (
    <DashboardLayout role="admin" title="Email Templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">
              Transactional Email Templates
            </h1>
            <p className="text-sm text-ink-700">
              Customize dynamic notifications dispatched by the PayTrizz automated worker queue.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchTemplates}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-xl text-sm font-semibold text-ink-900 hover:bg-neutral-50 shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Templates Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-xs font-bold uppercase tracking-wider text-ink-500 border-b border-neutral-200">
                  <th className="py-3.5 px-4">Template Name & Key</th>
                  <th className="py-3.5 px-4">Default Subject</th>
                  <th className="py-3.5 px-4">Available Variables</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-ink-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                      Loading templates...
                    </td>
                  </tr>
                ) : (
                  templates.map((tmpl) => (
                    <tr key={tmpl.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-ink-900">{tmpl.name}</div>
                        <div className="font-mono text-xs text-ink-400">{tmpl.key}</div>
                        {tmpl.description && (
                          <div className="text-xs text-ink-500 pt-0.5">{tmpl.description}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 max-w-sm">
                        <div className="font-medium text-ink-800 truncate">{tmpl.subject}</div>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {tmpl.variables && tmpl.variables.length > 0 ? (
                            tmpl.variables.map((v, i) => (
                              <span
                                key={i}
                                className="font-mono text-[11px] bg-neutral-100 text-ink-600 px-1.5 py-0.5 rounded border border-neutral-200"
                              >
                                {`{{${v}}}`}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-ink-400">Standard context</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {tmpl.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(tmpl)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-ink-900 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openTestModal(tmpl)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-ink-900 border border-brand-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Send className="w-3.5 h-3.5 text-brand-600" />
                            <span>Test</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Template Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-ink-500 uppercase tracking-wider">
                    {editingTemplate.key}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-ink-900">
                    Edit {editingTemplate.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Variable Chips Palette */}
              {editingTemplate.variables && editingTemplate.variables.length > 0 && (
                <div className="bg-brand-50/60 rounded-2xl p-4 border border-brand-200/80 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-ink-900">
                    <Tag className="w-3.5 h-3.5 text-brand-600" />
                    <span>Dynamic Tokens (click to insert):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingTemplate.variables.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="font-mono text-xs font-bold px-2.5 py-1 bg-white hover:bg-brand-100 text-ink-900 rounded-lg border border-brand-200 transition-colors shadow-2xs"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm text-ink-900 focus:ring-2 focus:ring-ink-900 outline-none"
                  />
                </div>

                {/* Tab Switcher: HTML vs Plain Text vs HTML Preview */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <div className="inline-flex p-1 rounded-xl bg-neutral-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab("html")}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        activeTab === "html"
                          ? "bg-white text-ink-900 shadow-2xs"
                          : "text-ink-600 hover:text-ink-900"
                      )}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>HTML Body</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("text")}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        activeTab === "text"
                          ? "bg-white text-ink-900 shadow-2xs"
                          : "text-ink-600 hover:text-ink-900"
                      )}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Plain Text Body</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("preview")}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        activeTab === "preview"
                          ? "bg-white text-ink-900 shadow-2xs"
                          : "text-ink-600 hover:text-ink-900"
                      )}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                      <span>Live Preview</span>
                    </button>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink-700">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded border-neutral-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span>Active Template</span>
                  </label>
                </div>

                {/* Tab Contents */}
                {activeTab === "html" && (
                  <div className="space-y-1">
                    <textarea
                      rows={14}
                      value={formBodyHtml}
                      onChange={(e) => setFormBodyHtml(e.target.value)}
                      className="w-full p-4 font-mono text-xs rounded-2xl border border-neutral-300 bg-neutral-900 text-neutral-100 focus:ring-2 focus:ring-brand-500 outline-none leading-relaxed"
                    />
                  </div>
                )}

                {activeTab === "text" && (
                  <div className="space-y-1">
                    <textarea
                      rows={14}
                      value={formBodyText}
                      onChange={(e) => setFormBodyText(e.target.value)}
                      className="w-full p-4 font-mono text-xs rounded-2xl border border-neutral-300 bg-neutral-50 text-ink-900 focus:ring-2 focus:ring-ink-900 outline-none leading-relaxed"
                    />
                  </div>
                )}

                {activeTab === "preview" && (
                  <div className="border border-neutral-200 rounded-2xl p-6 bg-neutral-100 min-h-[300px]">
                    <div className="bg-white rounded-xl p-6 shadow-sm max-w-xl mx-auto space-y-4">
                      <div className="border-b border-neutral-100 pb-2 text-xs font-mono text-ink-500">
                        Subject: <strong className="text-ink-900">{formSubject}</strong>
                      </div>
                      <div
                        className="text-sm prose prose-neutral max-w-none"
                        dangerouslySetInnerHTML={{ __html: formBodyHtml }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate(null)}
                    className="px-5 py-2.5 rounded-full border border-neutral-300 text-xs font-bold text-ink-700 hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-500 text-ink-900 font-bold text-xs hover:bg-brand-600 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? "Saving..." : "Save Template"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Test Email Modal */}
        {testModalOpen && testTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-ink-900">Send Test Email</h3>
                  <p className="text-xs text-ink-500">{testTemplate.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="p-1 rounded-lg text-ink-400 hover:text-ink-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendTest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="admin@paytrizz.com"
                    className="w-full h-11 px-4 rounded-xl border border-neutral-300 text-sm text-ink-900 focus:ring-2 focus:ring-ink-900 outline-none"
                  />
                  <p className="text-[11px] text-ink-500">
                    A test outbox queue record will be generated with placeholder tokens and dispatched to this address.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTestModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-semibold text-ink-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand-500 text-ink-900 font-bold text-xs hover:bg-brand-600 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingTest ? "Dispatching..." : "Send Test Now"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
