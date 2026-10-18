"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Briefcase,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProjectFormModal, ProjectItem } from "@/components/admin/ProjectFormModal";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

type ModuleTab = "projects" | "categories" | "tags";

export default function AdminProjectsPage() {
  const [mainTab, setMainTab] = useState<ModuleTab>("projects");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Categories
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Project Modal (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const url = search
        ? `/api/proxy/admin/projects?search=${encodeURIComponent(search)}&per_page=50`
        : `/api/proxy/admin/projects?per_page=50`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setProjects(json.data.data || []);
      }
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/proxy/admin/project-categories");
      if (res.ok) {
        const json = await res.json();
        setCategories(json.data || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, [fetchProjects, fetchCategories]);

  const openCreateModal = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const openEditModal = (p: ProjectItem) => {
    setEditingProject(p);
    setModalOpen(true);
  };

  const openDeleteDialog = (p: ProjectItem) => {
    setDeletingProject(p);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/proxy/admin/projects/${deletingProject.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Project "${deletingProject.title}" deleted successfully!`);
        setDeleteDialogOpen(false);
        setDeletingProject(null);
        fetchProjects();
      } else {
        toast.error(json.message || "Failed to delete project");
      }
    } catch {
      toast.error("Network error while deleting project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin" title="Projects">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">
              Projects Management
            </h1>
            <p className="text-sm text-ink-500">
              Manage portfolio showcases, project categories, tags, and assigned squads.
            </p>
          </div>

          {mainTab === "projects" && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-brand-500 text-ink-900 font-bold px-5 py-2.5 rounded-full hover:bg-brand-600 transition-all shadow-[0_4px_14px_rgba(252,207,0,0.35)] cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          )}
        </div>

        {/* Module Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-ink-50 rounded-2xl w-fit border border-neutral-200">
          <button
            onClick={() => setMainTab("projects")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer",
              mainTab === "projects" ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
            )}
          >
            Projects
          </button>
          <button
            onClick={() => setMainTab("categories")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer",
              mainTab === "categories" ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
            )}
          >
            Project Categories
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

        {mainTab === "projects" && (
          <>
            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400 ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by title, client, or category..."
            className="w-full text-sm outline-none text-ink-900 placeholder:text-neutral-400 bg-transparent"
          />
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-neutral-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-16 text-center text-neutral-400">
              <Briefcase className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
              <p className="font-semibold text-neutral-700">No projects found</p>
              <p className="text-xs text-neutral-400 mt-1">
                Create your first project case study using the button above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/75">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      PROJECT TITLE
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      CATEGORY
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      CLIENT
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      CASE STUDY
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
                  {projects.map((p) => (
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
                              <Briefcase className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-ink-900 truncate max-w-sm">{p.title}</div>
                            <div className="text-xs text-neutral-400">/{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700 font-medium">
                        {p.category?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700">
                        {p.client_name || "—"}
                      </td>
                      <td className="px-6 py-4">
                        {p.is_case_study ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-ink-900 border border-brand-200">
                            <CheckCircle2 className="w-3 h-3 text-brand-600" />
                            Case Study
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400 font-medium">Standard</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                            p.status === "published" && "bg-green-50 text-green-700 border border-green-200",
                            p.status === "draft" && "bg-neutral-100 text-neutral-700 border border-neutral-200",
                            p.status === "pending" && "bg-brand-50 text-ink-900 border border-brand-200"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              p.status === "published" ? "bg-green-600" : "bg-neutral-400"
                            )}
                          />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/projects/${p.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-brand-600 transition px-2 py-1 rounded-lg hover:bg-neutral-100"
                          >
                            <span>Live</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => openEditModal(p)}
                            title="Edit project"
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-ink-900 hover:bg-neutral-100 transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openDeleteDialog(p)}
                            title="Delete project"
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
        key="project-categories"
        title="Project Category"
        description="Categories for portfolio projects, client case studies, and engineering squad showcases."
        endpoint="/admin/project-categories"
        addLabel="Add Category"
        emptyLabel="No project categories yet."
        fields={[{ key: "name", label: "Category Name", type: "text", required: true, placeholder: "Web Apps & Platforms" }]}
        columns={[{ key: "name", label: "Category" }, { key: "slug", label: "Slug" }]}
      />
    )}

    {mainTab === "tags" && (
      <TaxonomyManager
        key="project-tags"
        title="Tag"
        description="Free-form tags used across projects and blog posts for cross-filtering."
        endpoint="/admin/tags"
        addLabel="Add Tag"
        emptyLabel="No tags yet."
        fields={[{ key: "name", label: "Tag Name", type: "text", required: true, placeholder: "golang" }]}
        columns={[{ key: "name", label: "Tag" }, { key: "slug", label: "Slug" }]}
      />
    )}
  </div>

      {/* CREATE & EDIT MODAL */}
      <ProjectFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        categories={categories}
        onSuccess={fetchProjects}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteDialogOpen && deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-danger flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-ink-900">Delete Project?</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Are you sure you want to delete &ldquo;{deletingProject.title}&rdquo;? This action will remove the case study and unbind squad links.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeleteDialogOpen(false)}
                className="px-5 py-2.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDelete}
                className="px-6 py-2.5 rounded-full bg-danger hover:bg-red-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
