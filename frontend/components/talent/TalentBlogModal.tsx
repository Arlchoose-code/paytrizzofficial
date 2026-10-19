"use client";

import React, { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { ImagePickerDialog, PickedMedia } from "@/components/shared/ImagePickerDialog";
import { TagInputSelector, TagOption } from "@/components/shared/TagInputSelector";

export interface TalentPostItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "published" | "draft" | "pending";
  reading_time_minutes: number;
  category_id?: number | null;
  category?: { id: number; name: string; slug: string } | null;
  cover_media_id?: number | null;
  cover_media?: {
    id: number;
    path_original: string;
    path_medium?: string;
    path_thumb?: string;
  } | null;
  tags?: TagOption[];
  created_at?: string;
  updated_at?: string;
}

interface TalentBlogModalProps {
  open: boolean;
  onClose: () => void;
  editingPost: TalentPostItem | null;
  categories: { id: number; name: string }[];
  availableTags: TagOption[];
  onSaveSuccess: () => void;
  onTagCreated: (tag: TagOption) => void;
}

export function TalentBlogModal({
  open,
  onClose,
  editingPost,
  categories,
  availableTags,
  onSaveSuccess,
  onTagCreated,
}: TalentBlogModalProps) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("pending");
  const [coverMediaId, setCoverMediaId] = useState<number | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setCategoryId(editingPost.category_id || "");
      setExcerpt(editingPost.excerpt || "");
      setContent(editingPost.content || "");
      setStatus(editingPost.status || "pending");
      setCoverMediaId(editingPost.cover_media_id || null);
      setCoverPreviewUrl(
        editingPost.cover_media?.path_medium ||
        editingPost.cover_media?.path_original ||
        ""
      );
      setSelectedTagIds(editingPost.tags?.map((t) => t.id) || []);
    } else {
      setTitle("");
      setCategoryId(categories[0]?.id || "");
      setExcerpt("");
      setContent("");
      setStatus("pending");
      setCoverMediaId(null);
      setCoverPreviewUrl("");
      setSelectedTagIds([]);
    }
  }, [editingPost, open, categories]);

  if (!open) return null;

  const handleCoverSelect = (picked: PickedMedia) => {
    setCoverMediaId(picked.id);
    setCoverPreviewUrl(picked.path_medium || picked.path_original || "");
    setPickerOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an article title");
      return;
    }
    if (!content.trim()) {
      toast.error("Article content cannot be empty");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: title.trim(),
      category_id: categoryId ? Number(categoryId) : null,
      excerpt: excerpt.trim(),
      content,
      status,
      cover_media_id: coverMediaId,
      tag_ids: selectedTagIds,
    };

    try {
      const url = editingPost
        ? `/api/proxy/talent/posts/${editingPost.id}`
        : "/api/proxy/talent/posts";
      const method = editingPost ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          status === "pending"
            ? "Article submitted for review"
            : "Article saved as draft"
        );
        onSaveSuccess();
        onClose();
      } else {
        toast.error(json.message || "Failed to save article");
      }
    } catch {
      toast.error("Network error while saving article");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-ink-100 flex flex-col">
          <div className="p-6 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-base font-extrabold text-ink-900">
              {editingPost ? "Edit Article" : "Write New Article"}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5 flex-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Article Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scaling Event-Driven Microservices on Kubernetes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

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
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="pending">Submit for review (Admin approves)</option>
                  <option value="draft">Save as draft (Private)</option>
                </select>
              </div>
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
                    onClick={() => setPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-ink-200 hover:border-brand-500 text-ink-800 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{coverPreviewUrl ? "Change Cover Image" : "Choose Cover Image"}</span>
                  </button>
                  {coverPreviewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverMediaId(null);
                        setCoverPreviewUrl("");
                      }}
                      className="px-2 py-1 text-xs text-danger hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Excerpt / Brief Summary
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Short 1-2 sentence teaser shown in blog listings..."
                className="w-full px-3.5 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Custom Tag Selector */}
            <TagInputSelector
              availableTags={availableTags}
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
              onTagCreated={onTagCreated}
              apiEndpoint="/api/proxy/talent/tags"
            />

            {/* Content Editor */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Article Content (TipTap Rich Editor) *
              </label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your article content with headers, quotes, lists..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-xs font-bold text-ink-600 hover:bg-ink-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingPost ? "Update Article" : "Submit Article"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ImagePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose Article Cover Image"
        module="post"
        libraryModule="post"
        onSelect={handleCoverSelect}
      />
    </>
  );
}
