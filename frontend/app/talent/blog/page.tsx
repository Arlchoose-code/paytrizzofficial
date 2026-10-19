"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { type TagOption } from "@/components/shared/TagInputSelector";
import { TalentBlogModal, TalentPostItem } from "@/components/talent/TalentBlogModal";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "published" | "draft";

export default function TalentBlogPage() {
  const [posts, setPosts] = useState<TalentPostItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<TalentPostItem | null>(null);
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
    setModalOpen(true);
  };

  const openEditModal = (p: TalentPostItem) => {
    setEditingPost(p);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTargetId === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/talent/posts/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete post");
      toast.success("Article deleted");
      setDeleteTargetId(null);
      fetchPosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete post";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleTagCreated = (newTag: TagOption) => {
    setAvailableTags((prev) => {
      if (prev.some((t) => t.id === newTag.id)) return prev;
      return [...prev, newTag];
    });
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [posts, search, statusFilter]);

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
              <span className="text-xs text-neutral-500">Articles published under your name</span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">
              My Blog Articles
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Publish technical write-ups and industry insights with TipTap rich text formatting.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 shadow-sm transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex items-center p-1 bg-neutral-100 rounded-2xl border border-neutral-200">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer",
                statusFilter === "all"
                  ? "bg-white text-ink-900 shadow-xs"
                  : "text-neutral-500 hover:text-ink-900"
              )}
            >
              All ({posts.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer",
                statusFilter === "pending"
                  ? "bg-white text-ink-900 shadow-xs"
                  : "text-neutral-500 hover:text-ink-900"
              )}
            >
              Awaiting Review
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer",
                statusFilter === "published"
                  ? "bg-white text-ink-900 shadow-xs"
                  : "text-neutral-500 hover:text-ink-900"
              )}
            >
              Published
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer",
                statusFilter === "draft"
                  ? "bg-white text-ink-900 shadow-xs"
                  : "text-neutral-500 hover:text-ink-900"
              )}
            >
              Draft
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles by title..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-neutral-200 bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Articles Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              Loading articles...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-16 text-center text-neutral-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
              <p className="font-semibold text-neutral-700">No articles found</p>
              <p className="text-xs text-neutral-400 mt-1">
                {search
                  ? "Try adjusting your search criteria."
                  : "Write your first editorial article using the button above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/75">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      ARTICLE TITLE
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      CATEGORY
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      READING TIME
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      TAGS
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      STATUS
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500 text-right">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredPosts.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.cover_media ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                p.cover_media.path_thumb ||
                                p.cover_media.path_medium ||
                                p.cover_media.path_original
                              }
                              alt={p.title}
                              className="w-12 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-400">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-ink-900 truncate max-w-sm">
                              {p.title}
                            </div>
                            <div className="text-xs text-neutral-400">
                              /{p.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-neutral-700">
                        {p.category?.name || "Uncategorized"}
                      </td>

                      <td className="px-6 py-4 text-xs text-neutral-500">
                        {p.reading_time_minutes || 5} min read
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.tags && p.tags.length > 0 ? (
                            p.tags.slice(0, 3).map((t) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-semibold"
                              >
                                #{t.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-neutral-400 text-xs">—</span>
                          )}
                          {p.tags && p.tags.length > 3 && (
                            <span className="text-[10px] text-neutral-400 font-semibold">
                              +{p.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                            p.status === "published" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                            p.status === "draft" && "bg-neutral-100 text-neutral-700 border border-neutral-200",
                            p.status === "pending" && "bg-amber-50 text-amber-800 border border-amber-200"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              p.status === "published"
                                ? "bg-emerald-600"
                                : p.status === "pending"
                                ? "bg-amber-500 animate-pulse"
                                : "bg-neutral-400"
                            )}
                          />
                          <span>
                            {p.status === "pending"
                              ? "Awaiting Review"
                              : p.status}
                          </span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {p.status === "published" && (
                            <a
                              href={`/blog/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-brand-600 transition px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer"
                              title="View Live Public Article"
                            >
                              <span>Live</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-ink-900 hover:bg-neutral-100 transition cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteTargetId(p.id)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Extracted TalentBlogModal */}
        <TalentBlogModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editingPost={editingPost}
          categories={categories}
          availableTags={availableTags}
          onSaveSuccess={fetchPosts}
          onTagCreated={handleTagCreated}
        />
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete this article?"
        description="This article will be permanently removed. This cannot be undone."
        confirmLabel="Delete Article"
        danger
        loading={deleting}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
