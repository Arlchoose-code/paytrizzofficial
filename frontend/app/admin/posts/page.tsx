"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  BookOpen,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PostFormModal, PostItem } from "@/components/admin/PostFormModal";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

type StatusTab = "all" | "pending" | "published" | "draft";
type ModuleTab = "articles" | "categories" | "tags";

export default function AdminPostsPage() {
  const [mainTab, setMainTab] = useState<ModuleTab>("articles");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [, startTransition] = useTransition();

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [talents, setTalents] = useState<{ id: number; name: string }[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState<PostItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      let url = `/api/proxy/admin/posts?per_page=100`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPosts(json.data.data || []);
      }
    } catch {
      toast.error("Failed to load blog articles");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/admin/post-categories");
      if (res.ok) {
        const json = await res.json();
        setCategories(json.data || []);
      }
    } catch {}
  }, []);

  const fetchTalents = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/admin/talents?per_page=50");
      if (res.ok) {
        const json = await res.json();
        setTalents(json.data.data || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchTalents();
  }, [fetchPosts, fetchCategories, fetchTalents]);

  const openCreateModal = () => {
    setEditingPost(null);
    setModalOpen(true);
  };

  const openEditModal = (post: PostItem) => {
    setEditingPost(post);
    setModalOpen(true);
  };

  const openDeleteDialog = (post: PostItem) => {
    setDeletingPost(post);
    setDeleteDialogOpen(true);
  };

  const handleQuickApprove = async (post: PostItem) => {
    setActionBusyId(post.id);
    try {
      const res = await fetch(`/api/proxy/admin/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          status: "published",
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Article "${post.title}" approved and published live!`);
        startTransition(() => {
          fetchPosts();
        });
      } else {
        toast.error(json.message || "Failed to approve article");
      }
    } catch {
      toast.error("Network error while approving article");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingPost) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/proxy/admin/posts/${deletingPost.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Article "${deletingPost.title}" deleted successfully!`);
        setDeleteDialogOpen(false);
        setDeletingPost(null);
        fetchPosts();
      } else {
        toast.error(json.message || "Failed to delete article");
      }
    } catch {
      toast.error("Network error while deleting article");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = posts.filter((p) => p.status === "pending").length;

  return (
    <DashboardLayout role="admin" title="Blog">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">
              Blog & Editorial Management
            </h1>
            <p className="text-sm text-ink-500">
              Publish technical articles, manage blog categories, tags, and author attributions.
            </p>
          </div>

          {mainTab === "articles" && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-brand-500 text-ink-900 font-bold px-5 py-2.5 rounded-full hover:bg-brand-600 transition-all shadow-[0_4px_14px_rgba(252,207,0,0.35)] cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Article</span>
            </button>
          )}
        </div>

        {/* Module Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-ink-50 rounded-2xl w-fit border border-neutral-200">
          <button
            onClick={() => setMainTab("articles")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer",
              mainTab === "articles" ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
            )}
          >
            Articles
          </button>
          <button
            onClick={() => setMainTab("categories")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer",
              mainTab === "categories" ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
            )}
          >
            Blog Categories
          </button>
          <button
            onClick={() => setMainTab("tags")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer",
              mainTab === "tags" ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
            )}
          >
            Tags
          </button>
        </div>

        {mainTab === "articles" && (
          <>
            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="inline-flex items-center p-1 bg-neutral-100 rounded-2xl border border-neutral-200">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition",
                statusFilter === "all" ? "bg-white text-ink-900 shadow-sm" : "text-neutral-500 hover:text-ink-900"
              )}
            >
              All Articles
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition relative",
                statusFilter === "pending"
                  ? "bg-brand-500 text-ink-900 shadow-sm"
                  : "text-neutral-500 hover:text-ink-900"
              )}
            >
              <span>Pending Review</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition",
                statusFilter === "published"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-neutral-500 hover:text-ink-900"
              )}
            >
              Published
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition",
                statusFilter === "draft"
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-neutral-500 hover:text-ink-900"
              )}
            >
              Drafts
            </button>
          </div>

          {/* Search Box */}
          <div className="bg-white px-4 py-2 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-3 sm:w-72">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full text-xs outline-none text-ink-900 placeholder:text-neutral-400 bg-transparent"
            />
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-neutral-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              Loading articles...
            </div>
          ) : posts.length === 0 ? (
            <div className="p-16 text-center text-neutral-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
              <p className="font-semibold text-neutral-700">No articles found</p>
              <p className="text-xs text-neutral-400 mt-1">
                {statusFilter === "pending"
                  ? "All talent submissions have been reviewed."
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
                      AUTHOR
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      READING TIME
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
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-neutral-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {post.cover_media ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                post.cover_media.path_thumb ||
                                post.cover_media.path_medium ||
                                post.cover_media.path_original
                              }
                              alt={post.title}
                              className="w-12 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-400">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-ink-900 truncate max-w-sm">{post.title}</div>
                            <div className="text-xs text-neutral-400">/{post.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700 font-medium">
                        {post.category?.name || "General"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-100 text-ink-900 font-bold text-[10px] flex items-center justify-center border border-brand-200">
                            {post.author_talent?.name ? post.author_talent.name.charAt(0) : "P"}
                          </div>
                          <span className="text-sm font-semibold text-ink-900">
                            {post.author_talent?.name || "PayTrizz Team"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-neutral-500">
                        {post.reading_minutes} min read
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                            post.status === "published" && "bg-green-50 text-green-700 border border-green-200",
                            post.status === "draft" && "bg-neutral-100 text-neutral-700 border border-neutral-200",
                            post.status === "pending" && "bg-amber-50 text-amber-800 border border-amber-200"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              post.status === "published"
                                ? "bg-green-600"
                                : post.status === "pending"
                                  ? "bg-amber-500 animate-pulse"
                                  : "bg-neutral-400"
                            )}
                          />
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Quick Approve Button for Pending Articles */}
                          {post.status === "pending" && (
                            <button
                              onClick={() => handleQuickApprove(post)}
                              disabled={actionBusyId === post.id}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                              title="Approve and Publish live to public site"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{actionBusyId === post.id ? "Publishing..." : "Approve"}</span>
                            </button>
                          )}

                          {post.status === "published" && (
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-brand-600 transition px-2 py-1 rounded-lg hover:bg-neutral-100"
                            >
                              <span>Live</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          <button
                            onClick={() => openEditModal(post)}
                            title="Edit article"
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-ink-900 hover:bg-neutral-100 transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openDeleteDialog(post)}
                            title="Delete article"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-danger hover:bg-red-50 transition cursor-pointer"
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
      </>
    )}

    {mainTab === "categories" && (
      <TaxonomyManager
        key="post-categories"
        title="Blog Category"
        description="Categories for grouping technical blog articles and editorial insights."
        endpoint="/admin/post-categories"
        addLabel="Add Category"
        emptyLabel="No blog categories yet."
        fields={[{ key: "name", label: "Category Name", type: "text", required: true, placeholder: "Engineering & Architecture" }]}
        columns={[{ key: "name", label: "Category" }, { key: "slug", label: "Slug" }]}
      />
    )}

    {mainTab === "tags" && (
      <TaxonomyManager
        key="post-tags"
        title="Tag"
        description="Free-form tags used across blog posts and projects for cross-filtering."
        endpoint="/admin/tags"
        addLabel="Add Tag"
        emptyLabel="No tags yet."
        fields={[{ key: "name", label: "Tag Name", type: "text", required: true, placeholder: "kubernetes" }]}
        columns={[{ key: "name", label: "Tag" }, { key: "slug", label: "Slug" }]}
      />
    )}

        {/* Create / Edit Article Modal */}
        <PostFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            fetchPosts();
          }}
          post={editingPost}
          categories={categories}
          talents={talents}
        />

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && deletingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3 text-danger">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-ink-900">Delete Article</h3>
              </div>
              <p className="text-sm text-neutral-600">
                Are you sure you want to permanently delete &ldquo;
                <span className="font-semibold text-ink-900">{deletingPost.title}</span>&rdquo;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-danger text-white hover:bg-red-700 transition"
                >
                  {submitting ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
