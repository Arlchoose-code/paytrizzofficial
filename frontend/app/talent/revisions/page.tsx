"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Plus,
  RefreshCw,
  Send,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TalentRevisionItem {
  id: number;
  entity_type: "project" | "post";
  entity_id: number;
  submitted_by: number;
  payload: Record<string, any>;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: number | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export default function TalentRevisionsPage() {
  const [revisions, setRevisions] = useState<TalentRevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [entityType, setEntityType] = useState<"post" | "project">("post");
  const [entityId, setEntityId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  const fetchRevisions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/talent/revisions");
      if (res.ok) {
        const json = await res.json();
        setRevisions(json.data || []);
      }
    } catch {
      toast.error("Failed to load revisions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(entityId, 10);
    if (!idNum || idNum <= 0) {
      toast.error("Please enter a valid entity ID");
      return;
    }
    if (!title || !content) {
      toast.error("Please enter title and content");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        title,
        excerpt,
        content,
      };

      const res = await fetch("/api/proxy/talent/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: idNum,
          payload,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Revision submitted for editorial review!");
        setModalOpen(false);
        setEntityId("");
        setTitle("");
        setExcerpt("");
        setContent("");
        fetchRevisions();
      } else {
        toast.error(json.message || "Failed to submit revision");
      }
    } catch {
      toast.error("Failed to connect to backend");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="talent" title="My Revisions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
              My Content Revisions
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Track editorial reviews and proposed modifications to your articles and case studies.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRevisions}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 text-sm font-semibold transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              Submit Revision
            </button>
          </div>
        </div>

        {/* List of Revisions */}
        <div className="bg-white rounded-3xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-ink-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              Loading your submitted revisions...
            </div>
          ) : revisions.length === 0 ? (
            <div className="p-16 text-center text-ink-400">
              <FileCheck className="w-10 h-10 mx-auto mb-3 text-ink-300" />
              <p className="font-semibold text-ink-700">No content revisions yet</p>
              <p className="text-xs text-ink-400 mt-1">
                You can submit updates to your articles and projects whenever needed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {revisions.map((rev) => (
                <div key={rev.id} className="p-6 hover:bg-ink-50/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider",
                          rev.entity_type === "project"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        )}
                      >
                        {rev.entity_type} #{rev.entity_id}
                      </span>
                      <span className="text-xs font-mono text-ink-400">Rev #{rev.id}</span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold",
                          rev.status === "approved" && "bg-green-50 text-green-700 border border-green-200",
                          rev.status === "rejected" && "bg-red-50 text-red-700 border border-red-200",
                          rev.status === "pending" && "bg-brand-50 text-ink-900 border border-brand-200"
                        )}
                      >
                        {rev.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                        {rev.status === "rejected" && <XCircle className="w-3 h-3" />}
                        {rev.status === "pending" && <Clock className="w-3 h-3" />}
                        {rev.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-ink-900 text-base">
                      {rev.payload?.title || `Updated ${rev.entity_type}`}
                    </h3>
                    {rev.payload?.excerpt && (
                      <p className="text-xs text-ink-600 line-clamp-2 max-w-2xl">
                        {rev.payload.excerpt}
                      </p>
                    )}

                    {rev.review_note && (
                      <div className="mt-2 p-3 bg-ink-50 rounded-xl border border-ink-200 text-xs">
                        <span className="font-bold text-ink-700 block text-[10px] uppercase tracking-wider">
                          Admin Review Feedback:
                        </span>
                        <p className="text-ink-800 mt-0.5 italic">&ldquo;{rev.review_note}&rdquo;</p>
                      </div>
                    )}
                  </div>

                  <div className="text-right text-xs text-ink-400">
                    <div>Submitted {new Date(rev.created_at).toLocaleDateString()}</div>
                    {rev.reviewed_at && (
                      <div className="text-[11px] text-ink-500 mt-1">
                        Reviewed {new Date(rev.reviewed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Revision Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-ink-100 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-ink-100 flex items-center justify-between bg-ink-50/50">
              <h2 className="text-xl font-extrabold text-ink-900">
                Submit Content Revision
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 mb-1">
                    Content Type
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-ink-200 text-xs font-semibold bg-white text-ink-900"
                  >
                    <option value="post">Blog Post</option>
                    <option value="project">Project Case Study</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-700 mb-1">
                    Entity ID to Update
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-4 py-2.5 rounded-xl border border-ink-200 text-xs font-semibold bg-white text-ink-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Updated Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="New title version..."
                  className="w-full px-4 py-2.5 rounded-xl border border-ink-200 text-xs font-semibold bg-white text-ink-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Updated Excerpt / Summary
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief summary..."
                  className="w-full px-4 py-2.5 rounded-xl border border-ink-200 text-xs bg-white text-ink-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Full Content Body (HTML / Markdown)
                </label>
                <textarea
                  rows={6}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="<p>Full article or project details...</p>"
                  className="w-full px-4 py-2.5 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 font-mono"
                />
              </div>

              <div className="p-3 bg-brand-50 rounded-xl border border-brand-200 text-xs text-brand-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                <span>
                  Submitted revisions are held in the editorial queue until reviewed by an administrator. Live content remains unchanged until approved.
                </span>
              </div>

              <div className="pt-4 border-t border-ink-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-ink-200 bg-white hover:bg-ink-100 text-ink-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Submitting..." : "Submit to Editor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
