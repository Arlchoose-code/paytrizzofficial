"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ImagePickerDialog, PickedMedia } from "@/components/shared/ImagePickerDialog";
import { cn } from "@/lib/utils";
import { TalentProjectModal, type ProjectItem } from "@/components/talent/TalentProjectModal";
import type { TagOption } from "@/components/shared/TagInputSelector";

type StatusFilter = "all" | "published" | "draft";

export default function TalentProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isCaseStudy, setIsCaseStudy] = useState(false);
  const [challenge, setChallenge] = useState("");
  const [solution, setSolution] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("published");
  const [coverMediaId, setCoverMediaId] = useState<number | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, tRes] = await Promise.all([
        fetch("/api/proxy/talent/projects").then((r) => r.json()).catch(() => null),
        fetch("/api/proxy/project-categories").then((r) => r.json()).catch(() => null),
        fetch("/api/proxy/tags").then((r) => r.json()).catch(() => null),
      ]);

      if (pRes?.data) setProjects(pRes.data);
      if (cRes?.data) setCategories(cRes.data);
      if (tRes?.data) setAvailableTags(tRes.data);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setTitle("");
    setExcerpt("");
    setContent("");
    setClientName("");
    setProjectUrl("");
    setCategoryId(categories[0]?.id || "");
    setSelectedTagIds([]);
    setIsCaseStudy(false);
    setChallenge("");
    setSolution("");
    setResult("");
    setStatus("published");
    setCoverMediaId(null);
    setCoverPreviewUrl("");
    setModalOpen(true);
  };

  const openEditModal = (p: ProjectItem) => {
    setEditingProject(p);
    setTitle(p.title);
    setExcerpt(p.excerpt || "");
    setContent(p.content || "");
    setClientName(p.client_name || "");
    setProjectUrl(p.project_url || "");
    setCategoryId(p.category_id || "");
    setSelectedTagIds(p.tags?.map((t) => t.id) || []);
    setIsCaseStudy(Boolean(p.is_case_study));
    setChallenge(p.challenge || "");
    setSolution(p.solution || "");
    setResult(p.result || "");
    setStatus(p.status);
    setCoverMediaId(p.cover_media_id || null);
    setCoverPreviewUrl(
      p.cover_media?.path_medium || p.cover_media?.path_original || ""
    );
    setModalOpen(true);
  };

  const handleCoverSelect = (media: PickedMedia) => {
    setCoverMediaId(media.id);
    setCoverPreviewUrl(media.path_medium || media.path_original || "");
    toast.success("Cover image selected");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and description content are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        excerpt,
        content,
        client_name: clientName || null,
        project_url: projectUrl || null,
        category_id: categoryId ? Number(categoryId) : null,
        tag_ids: selectedTagIds,
        is_case_study: isCaseStudy,
        challenge: isCaseStudy ? challenge : null,
        solution: isCaseStudy ? solution : null,
        result: isCaseStudy ? result : null,
        cover_media_id: coverMediaId,
        status,
      };

      const endpoint = editingProject
        ? `/api/proxy/talent/projects/${editingProject.id}`
        : `/api/proxy/talent/projects`;

      const method = editingProject ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to save project");
      }

      toast.success(
        editingProject
          ? "Project updated successfully"
          : status === "published"
          ? "Project published live immediately!"
          : "Project saved as draft"
      );

      setModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/talent/projects/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to delete project");
      }
      toast.success("Project deleted");
      setDeleteTargetId(null);
      fetchProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleTagCreated = (newTag: TagOption) => {
    setAvailableTags((prev) => {
      if (prev.some((t) => t.id === newTag.id)) return prev;
      return [...prev, newTag];
    });
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        (p.client_name && p.client_name.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  return (
    <DashboardLayout role="talent" title="My Projects">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Direct Publishing
              </span>
              <span className="text-xs text-ink-500 font-semibold">
                No admin review required for projects
              </span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">My Projects & Case Studies</h1>
            <p className="text-xs text-ink-500">
              Manage portfolio projects linked to your profile with TipTap rich text, tags, and metrics.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 shadow-sm transition self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Project</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-2xl">
            {(["all", "published", "draft"] as StatusFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer",
                  statusFilter === tab
                    ? "bg-white text-ink-900 shadow-xs"
                    : "text-neutral-500 hover:text-ink-900"
                )}
              >
                {tab === "all" ? `All (${projects.length})` : tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="bg-white px-3.5 py-2 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-2.5 sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title, client..."
              className="w-full text-xs outline-none text-ink-900 placeholder:text-neutral-400 bg-transparent"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-16 text-center text-neutral-400 space-y-3">
              <Briefcase className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="font-semibold text-neutral-700 text-sm">No projects found</p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {search || statusFilter !== "all"
                  ? "Try clearing your search or status filter."
                  : "Add your client work, open-source projects, and case studies to showcase your track record."}
              </p>
              {!search && statusFilter === "all" && (
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-brand-500 text-ink-900 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add My First Project</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/75">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      PROJECT
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      CATEGORY
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
                      CLIENT & TYPE
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
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50 transition">
                      {/* Project Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.cover_media ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                p.cover_media.path_medium ||
                                p.cover_media.path_original
                              }
                              alt={p.title}
                              className="w-12 h-9 rounded-lg object-cover border border-neutral-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-400">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-ink-900 truncate max-w-xs sm:max-w-sm">
                              {p.title}
                            </div>
                            <div className="text-xs text-neutral-400 font-mono">
                              /{p.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-xs font-semibold text-neutral-700">
                        {p.category?.name || "General"}
                      </td>

                      {/* Client & Type */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-ink-900">
                            {p.client_name || "Internal / Showcase"}
                          </div>
                          {p.is_case_study && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-ink-900 text-brand-500">
                              Case Study
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {p.tags && p.tags.length > 0 ? (
                            p.tags.slice(0, 3).map((t) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded-md bg-neutral-100 text-ink-700 text-[10px] font-semibold"
                              >
                                #{t.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-neutral-400 text-xs">—</span>
                          )}
                          {p.tags && p.tags.length > 3 && (
                            <span className="text-[10px] text-neutral-400 self-center">
                              +{p.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                            p.status === "published" &&
                              "bg-emerald-50 text-emerald-700 border border-emerald-200",
                            p.status === "draft" &&
                              "bg-neutral-100 text-neutral-700 border border-neutral-200",
                            p.status === "pending" &&
                              "bg-amber-50 text-amber-800 border border-amber-200"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              p.status === "published"
                                ? "bg-emerald-600"
                                : p.status === "draft"
                                ? "bg-neutral-400"
                                : "bg-amber-500"
                            )}
                          />
                          <span className="capitalize">{p.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {p.status === "published" && (
                            <a
                              href={`/projects/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-brand-600 transition px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer"
                              title="View Live Public Page"
                            >
                              <span>Live</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-ink-900 hover:bg-neutral-100 transition cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteTargetId(p.id)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Project"
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

        {/* Create / Edit Modal */}
        <TalentProjectModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editingProject={editingProject}
          title={title}
          setTitle={setTitle}
          clientName={clientName}
          setClientName={setClientName}
          projectUrl={projectUrl}
          setProjectUrl={setProjectUrl}
          excerpt={excerpt}
          setExcerpt={setExcerpt}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          categories={categories}
          status={status}
          setStatus={setStatus}
          isCaseStudy={isCaseStudy}
          setIsCaseStudy={setIsCaseStudy}
          challenge={challenge}
          setChallenge={setChallenge}
          solution={solution}
          setSolution={setSolution}
          result={result}
          setResult={setResult}
          coverPreviewUrl={coverPreviewUrl}
          onOpenPicker={() => setPickerOpen(true)}
          onRemoveCover={() => {
            setCoverMediaId(null);
            setCoverPreviewUrl("");
          }}
          availableTags={availableTags}
          selectedTagIds={selectedTagIds}
          toggleTag={toggleTag}
          setSelectedTagIds={setSelectedTagIds}
          onTagCreated={handleTagCreated}
          content={content}
          setContent={setContent}
          submitting={submitting}
          handleSave={handleSave}
        />
      </div>

      <ImagePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose Project Cover Image"
        module="project"
        libraryModule="project"
        onSelect={handleCoverSelect}
      />

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete this project?"
        description="The project and its case study will be permanently removed from the public portfolio. This cannot be undone."
        confirmLabel="Delete Project"
        danger
        loading={deleting}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
