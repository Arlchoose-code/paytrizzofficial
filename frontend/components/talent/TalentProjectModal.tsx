"use client";

import { X, Upload } from "lucide-react";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { cn } from "@/lib/utils";

export interface ProjectItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  client_name?: string | null;
  project_url?: string | null;
  cover_media_id?: number | null;
  cover_media?: { path_medium?: string; path_original?: string } | null;
  category_id?: number | null;
  category?: { id: number; name: string } | null;
  tags?: { id: number; name: string }[];
  is_case_study?: boolean;
  challenge?: string | null;
  solution?: string | null;
  result?: string | null;
  status: string;
  created_at: string;
}

interface TalentProjectModalProps {
  open: boolean;
  onClose: () => void;
  editingProject: ProjectItem | null;
  title: string;
  setTitle: (v: string) => void;
  clientName: string;
  setClientName: (v: string) => void;
  projectUrl: string;
  setProjectUrl: (v: string) => void;
  excerpt: string;
  setExcerpt: (v: string) => void;
  categoryId: number | "";
  setCategoryId: (v: number | "") => void;
  categories: { id: number; name: string }[];
  status: string;
  setStatus: (v: string) => void;
  isCaseStudy: boolean;
  setIsCaseStudy: (v: boolean) => void;
  challenge: string;
  setChallenge: (v: string) => void;
  solution: string;
  setSolution: (v: string) => void;
  result: string;
  setResult: (v: string) => void;
  coverPreviewUrl: string;
  onOpenPicker: () => void;
  onRemoveCover?: () => void;
  availableTags: { id: number; name: string }[];
  selectedTagIds: number[];
  toggleTag: (tagId: number) => void;
  content: string;
  setContent: (v: string) => void;
  submitting: boolean;
  handleSave: (e: React.FormEvent) => void;
}

export function TalentProjectModal({
  open,
  onClose,
  editingProject,
  title,
  setTitle,
  clientName,
  setClientName,
  projectUrl,
  setProjectUrl,
  excerpt,
  setExcerpt,
  categoryId,
  setCategoryId,
  categories,
  status,
  setStatus,
  isCaseStudy,
  setIsCaseStudy,
  challenge,
  setChallenge,
  solution,
  setSolution,
  result,
  setResult,
  coverPreviewUrl,
  onOpenPicker,
  onRemoveCover,
  availableTags,
  selectedTagIds,
  toggleTag,
  content,
  setContent,
  submitting,
  handleSave,
}: TalentProjectModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-ink-100 flex flex-col">
        <div className="p-6 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-base font-extrabold text-ink-900">
            {editingProject ? "Edit Project" : "Add New Project"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 flex-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next-Gen FinTech Trading Core"
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Client Name (Optional)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Apex Global Bank"
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Project Live URL (Optional)
              </label>
              <input
                type="url"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://client-domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              Short Excerpt / Summary
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief 1-2 sentence overview for cards and meta description..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Publishing Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={editingProject?.status === "published"}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
              >
                {editingProject?.status === "published" && (
                  <option value="published">Published (live)</option>
                )}
                <option value="pending">Submit for review (admin approves)</option>
                <option value="draft">Save as draft (private)</option>
              </select>
              {editingProject?.status === "published" && (
                <p className="text-[11px] text-ink-500 mt-1">
                  Published projects can&apos;t be edited directly — saving creates a revision for admin
                  approval while the live version stays untouched.
                </p>
              )}
            </div>
          </div>

          {/* Case Study Toggle */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-ink-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-ink-900">Format as In-Depth Case Study</p>
                <p className="text-[11px] text-ink-500">
                  Adds Challenge, Solution, and Measurable Result blocks
                </p>
              </div>
              <input
                type="checkbox"
                checked={isCaseStudy}
                onChange={(e) => setIsCaseStudy(e.target.checked)}
                className="w-4 h-4 accent-brand-500 cursor-pointer"
              />
            </div>

            {isCaseStudy && (
              <div className="pt-3 border-t border-ink-100 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">
                    The Challenge
                  </label>
                  <textarea
                    rows={2}
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    placeholder="What bottleneck or constraint did the client face?"
                    className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">
                    The Solution
                  </label>
                  <textarea
                    rows={2}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="What technical strategy and architecture did you deploy?"
                    className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">
                    The Result / Metrics
                  </label>
                  <textarea
                    rows={2}
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    placeholder="What measurable outcomes were achieved (e.g. 99.99% uptime, 4x latency decrease)?"
                    className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              Cover Image
            </label>
            <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-ink-100">
              {coverPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverPreviewUrl}
                  alt="Cover"
                  className="w-16 h-12 rounded-lg object-cover border border-neutral-200"
                />
              ) : (
                <div className="w-16 h-12 rounded-lg bg-ink-100 border border-ink-200 flex items-center justify-center text-ink-400 text-[10px]">
                  No Cover
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenPicker}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-ink-200 hover:border-brand-500 text-ink-800 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{coverPreviewUrl ? "Change Cover Image" : "Choose Cover Image"}</span>
                </button>
                {coverPreviewUrl && onRemoveCover && (
                  <button
                    type="button"
                    onClick={onRemoveCover}
                    className="px-2 py-1 text-xs text-danger hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tags Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((t) => {
                const sel = selectedTagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold transition",
                      sel
                        ? "bg-brand-500 text-ink-900"
                        : "bg-neutral-100 text-ink-600 hover:bg-neutral-200"
                    )}
                  >
                    #{t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TipTap Rich Text Editor */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              Project Overview (TipTap Rich Editor)
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write detailed case overview, architecture diagrams, and outcomes..."
            />
          </div>

          <div className="pt-4 border-t border-ink-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-ink-700 hover:bg-neutral-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 transition shadow-sm disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingProject ? "Save Changes" : "Publish Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
