"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  X,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

interface PostItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_media_id?: number | null;
  cover_media?: { path_medium?: string; path_original?: string } | null;
  category_id?: number | null;
  category?: { id: number; name: string } | null;
  tags?: { id: number; name: string }[];
  status: string;
  published_at?: string | null;
  created_at: string;
}

export default function TalentBlogPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [availableTags, setAvailableTags] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [status, setStatus] = useState("pending");
  const [coverMediaId, setCoverMediaId] = useState<number | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, tRes] = await Promise.all([
        fetch("/api/proxy/talent/posts").then((r) => r.json()).catch(() => null),
        fetch("/api/proxy/post-categories").then((r) => r.json()).catch(() => null),
        fetch("/api/proxy/tags").then((r) => r.json()).catch(() => null),
      ]);

      if (pRes?.data) setPosts(pRes.data);
      if (cRes?.data) setCategories(cRes.data);
      if (tRes?.data) setAvailableTags(tRes.data);
    } catch {
      toast.error("Failed to load blog articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openCreateModal = () => {
    setEditingPost(null);
    setTitle("");
    setExcerpt("");
    setContent("");
    setCategoryId(categories[0]?.id || "");
    setSelectedTagIds([]);
    setStatus("pending");
    setCoverMediaId(null);
    setCoverPreviewUrl("");
    setModalOpen(true);
  };

  const openEditModal = (p: PostItem) => {
    setEditingPost(p);
    setTitle(p.title);
    setExcerpt(p.excerpt);
    setContent(p.content);
    setCategoryId(p.category_id || "");
    setSelectedTagIds(p.tags?.map((t) => t.id) || []);
    setStatus(p.status);
    setCoverMediaId(p.cover_media_id || null);
    setCoverPreviewUrl(p.cover_media?.path_medium || p.cover_media?.path_original || "");
    setModalOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("module", "posts");
    fd.append("alt_text", `${title || "Article"} cover`);

    try {
      const res = await fetch("/api/proxy/talent/media", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to upload image");

      setCoverMediaId(json.data.id);
      setCoverPreviewUrl(json.data.path_medium || json.data.path_original);
      toast.success("Cover image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload cover");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        excerpt: excerpt || title.slice(0, 150),
        content,
        category_id: categoryId ? Number(categoryId) : null,
        cover_media_id: coverMediaId,
        tag_ids: selectedTagIds,
        status,
      };

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
      if (!res.ok) throw new Error(json.message || "Failed to save article");

      toast.success(
        editingPost
          ? json.message || "Article updated!"
          : "Article submitted for admin review!"
      );
      setModalOpen(false);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save article");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTargetId === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/talent/posts/${deleteTargetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete post");
      toast.success("Article deleted");
      setDeleteTargetId(null);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <DashboardLayout role="talent" title="My Blog Articles">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Thought Leadership
              </span>
              <span className="text-xs text-ink-500 font-semibold">
                Articles published under your name
              </span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">My Blog Articles</h1>
            <p className="text-xs text-ink-500">
              Publish technical write-ups and industry insights with TipTap rich text formatting.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </button>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-ink-100 p-12 text-center text-xs text-ink-400">
            Loading articles...
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-ink-100 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                        p.status === "published" && "bg-emerald-100 text-emerald-800",
                        p.status === "pending" && "bg-brand-500 text-ink-900",
                        p.status === "rejected" && "bg-red-50 text-danger",
                        p.status === "draft" && "bg-neutral-200 text-ink-700"
                      )}
                    >
                      {p.status}
                    </span>
                    <span className="text-[11px] text-ink-400">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>

                  <h3 className="font-bold text-ink-900 text-sm line-clamp-2">{p.title}</h3>
                  <p className="text-xs text-ink-500 mt-1 line-clamp-3">{p.excerpt}</p>

                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.tags.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="px-2 py-0.5 rounded-md bg-neutral-100 text-ink-700 text-[10px] font-semibold"
                        >
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-ink-100 flex items-center justify-between">
                  {p.status === "published" ? (
                    <a
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <span>View Public</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-ink-400 font-semibold">
                      {p.status === "pending" ? "Awaiting review" : "Not published"}
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-neutral-100 transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(p.id)}
                      className="p-1.5 rounded-lg text-ink-500 hover:text-red-600 hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-ink-100 p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-ink-300 mx-auto" />
            <h3 className="font-bold text-ink-900 text-sm">No articles published yet</h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              Write and share your insights to boost your professional reputation on PayTrizz.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-brand-500 text-ink-900"
            >
              <Plus className="w-4 h-4" />
              <span>Write My First Article</span>
            </button>
          </div>
        )}

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-ink-100 flex flex-col">
              <div className="p-6 border-b border-ink-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-base font-extrabold text-ink-900">
                  {editingPost ? "Edit Article" : "Write New Article"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5 flex-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    Article Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Scaling Microservices with Go and AWS SES"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  />
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
                      disabled={editingPost?.status === "published"}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                    >
                      {editingPost?.status === "published" && (
                        <option value="published">Published (live)</option>
                      )}
                      <option value="pending">Submit for review (admin approves)</option>
                      <option value="draft">Save as draft (private)</option>
                    </select>
                    {editingPost?.status === "published" && (
                      <p className="text-[11px] text-ink-500 mt-1">
                        Published articles can&apos;t be edited directly — saving creates a revision for admin
                        approval while the live version stays untouched.
                      </p>
                    )}
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    Cover Image
                  </label>
                  <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-ink-100">
                    {coverPreviewUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverPreviewUrl}
                        alt="Cover"
                        className="w-16 h-12 rounded-lg object-cover"
                      />
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-ink-200 hover:border-brand-500 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingCover ? "Uploading..." : "Upload Cover Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </label>
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
                    Article Content (TipTap Rich Editor)
                  </label>
                  <RichTextEditor
                    content={content}
                    onChange={setContent}
                    placeholder="Write your in-depth technical story here..."
                  />
                </div>

                <div className="pt-4 border-t border-ink-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-ink-700 hover:bg-neutral-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 transition shadow-sm disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : editingPost ? "Save Changes" : "Publish Article"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete this article?"
        description="The article will be permanently removed from the public blog. This cannot be undone."
        confirmLabel="Delete Article"
        danger
        loading={deleting}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
