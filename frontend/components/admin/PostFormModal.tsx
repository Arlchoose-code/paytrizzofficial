"use client";

import { useEffect, useState } from "react";
import { X, Tag, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { ImagePickerDialog } from "@/components/shared/ImagePickerDialog";
import { cn } from "@/lib/utils";

export interface PostItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  reading_minutes: number;
  cover_media_id?: number | null;
  cover_media?: {
    id?: number;
    path_original?: string;
    path_large?: string;
    path_medium?: string;
    path_thumb?: string;
  } | null;
  category_id?: number | null;
  category?: { id: number; name: string } | null;
  author_talent_id?: number | null;
  author_talent?: { id: number; name: string; headline?: string; slug?: string } | null;
  tags?: { id: number; name: string }[];
  status: string;
  published_at?: string | null;
}

interface PostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  post?: PostItem | null;
  categories: { id: number; name: string }[];
  talents: { id: number; name: string }[];
  onSuccess: () => void;
}

export function PostFormModal({
  isOpen,
  onClose,
  post,
  categories,
  talents,
  onSuccess,
}: PostFormModalProps) {
  const isEditing = !!post;
  const [submitting, setSubmitting] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formAuthorTalentId, setFormAuthorTalentId] = useState<string>("");
  const [formReadingMinutes, setFormReadingMinutes] = useState<number>(3);
  const [formStatus, setFormStatus] = useState("published");
  const [coverMediaId, setCoverMediaId] = useState<number | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>("");
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  // Available tags & selected tags
  const [availableTags, setAvailableTags] = useState<{ id: number; name: string }[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/proxy/tags")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setAvailableTags(res.data);
      })
      .catch(() => {});
  }, []);

  const [prevPost, setPrevPost] = useState(post);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (post !== prevPost || isOpen !== prevIsOpen) {
    setPrevPost(post);
    setPrevIsOpen(isOpen);
    if (post) {
      setFormTitle(post.title);
      setFormExcerpt(post.excerpt);
      setFormContent(post.content || "");
      setFormCategoryId(post.category_id ? String(post.category_id) : "");
      setFormAuthorTalentId(post.author_talent_id ? String(post.author_talent_id) : "");
      setFormReadingMinutes(post.reading_minutes || 3);
      setFormStatus(post.status || "published");
      setCoverMediaId(post.cover_media_id || post.cover_media?.id || null);
      setCoverPreviewUrl(
        post.cover_media?.path_medium ||
        post.cover_media?.path_original ||
        post.cover_media?.path_large ||
        ""
      );
      setSelectedTagIds(post.tags?.map((t) => t.id) || []);
    } else {
      setFormTitle("");
      setFormExcerpt("");
      setFormContent("");
      setFormCategoryId("");
      setFormAuthorTalentId("");
      setFormReadingMinutes(3);
      setFormStatus("published");
      setCoverMediaId(null);
      setCoverPreviewUrl("");
      setSelectedTagIds([]);
    }
  }

  if (!isOpen) return null;

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formExcerpt || !formContent) {
      toast.error("Please fill required fields (Title, Excerpt, Content)");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formTitle,
        excerpt: formExcerpt,
        content: formContent,
        cover_media_id: coverMediaId,
        category_id: formCategoryId ? Number(formCategoryId) : null,
        author_talent_id: formAuthorTalentId ? Number(formAuthorTalentId) : null,
        reading_minutes: formReadingMinutes,
        status: formStatus,
        tag_ids: selectedTagIds,
      };

      const endpoint = isEditing
        ? `/api/proxy/admin/posts/${post.id}`
        : "/api/proxy/admin/posts";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          isEditing ? "Article updated successfully!" : "Article created successfully!"
        );
        onClose();
        onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <h2 className="text-xl font-extrabold text-ink-900">
            {isEditing ? `Edit Article #${post.id}` : "Write New Article"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Article Title *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Scaling Go Microservices to 100k Concurrent WebSockets"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold bg-white text-ink-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Category
              </label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold bg-white text-ink-900 focus:outline-none focus:border-brand-500"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Author (Talent Specialist)
              </label>
              <select
                value={formAuthorTalentId}
                onChange={(e) => setFormAuthorTalentId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold bg-white text-ink-900 focus:outline-none focus:border-brand-500"
              >
                <option value="">PayTrizz Team (Agency Editorial)</option>
                {talents.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">
              Short Excerpt (Summary) *
            </label>
            <textarea
              required
              rows={2}
              value={formExcerpt}
              onChange={(e) => setFormExcerpt(e.target.value)}
              placeholder="Brief summary displayed on article cards..."
              className="w-full p-3 rounded-xl border border-neutral-200 text-xs bg-white text-ink-900 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Article Tags Selection */}
          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-500" />
              Article Tags &amp; Topics
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl border border-neutral-200 bg-neutral-50/50">
              {availableTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer",
                      isSelected
                        ? "bg-brand-500 text-ink-900 shadow-xs ring-1 ring-brand-600"
                        : "bg-white text-ink-700 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100"
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-ink-900" />}
                    <span>{tag.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cover Image Picker Card */}
          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-brand-500" />
              Cover Image (Article Card Thumbnail &amp; OpenGraph Image)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50">
              <div className="w-32 h-20 rounded-xl border border-neutral-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                {coverPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreviewUrl} alt="Cover preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[11px] text-neutral-400 font-medium">No cover image</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImagePickerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white border border-neutral-200 hover:border-brand-500 text-ink-800 transition cursor-pointer shadow-xs"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{coverPreviewUrl ? "Change Image" : "Upload / Select Image"}</span>
                </button>
                {coverPreviewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverMediaId(null);
                      setCoverPreviewUrl("");
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TipTap Rich Text Editor for Content */}
          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1">
              Article Content (TipTap Rich Editor) *
            </label>
            <RichTextEditor
              content={formContent}
              onChange={setFormContent}
              placeholder="Write the comprehensive article content..."
              minHeight="240px"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Estimated Reading Time (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={formReadingMinutes}
                onChange={(e) => setFormReadingMinutes(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold bg-white text-ink-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Publication Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold bg-white text-ink-900 focus:outline-none focus:border-brand-500"
              >
                <option value="published">Published (Live)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 text-xs font-extrabold shadow-sm hover:shadow transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving..." : isEditing ? "Save Changes" : "Publish Article"}
            </button>
          </div>
        </form>
      </div>

      <ImagePickerDialog
        open={imagePickerOpen}
        title="Select Article Cover Image"
        module="blog"
        onSelect={(media) => {
          setCoverMediaId(media.id);
          setCoverPreviewUrl(media.path_medium || media.path_original);
          setImagePickerOpen(false);
        }}
        onClose={() => setImagePickerOpen(false)}
      />
    </div>
  );
}
