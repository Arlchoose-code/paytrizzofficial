"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ImagePickerDialog, PickedMedia } from "@/components/shared/ImagePickerDialog";
import { cn } from "@/lib/utils";
import { TalentProjectModal, type ProjectItem } from "@/components/talent/TalentProjectModal";

export default function TalentProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [availableTags, setAvailableTags] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [status, setStatus] = useState("pending");
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
    setStatus(p.status || "pending");
    setCoverMediaId(p.cover_media_id || null);
    setCoverPreviewUrl(p.cover_media?.path_medium || p.cover_media?.path_original || "");
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
      toast.error("Title and content are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title,
        excerpt: excerpt || title.slice(0, 150),
        content,
        client_name: clientName || null,
        project_url: projectUrl || null,
        category_id: categoryId ? Number(categoryId) : null,
        cover_media_id: coverMediaId,
        is_case_study: isCaseStudy,
        challenge: isCaseStudy ? challenge : null,
        solution: isCaseStudy ? solution : null,
        result: isCaseStudy ? result : null,
        tag_ids: selectedTagIds,
        status,
      };

      const url = editingProject
        ? `/api/proxy/talent/projects/${editingProject.id}`
        : "/api/proxy/talent/projects";
      const method = editingProject ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to save project");

      toast.success(
        editingProject ? json.message || "Project updated!" : "Project published successfully!"
      );
      setModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to save project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTargetId === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/talent/projects/${deleteTargetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
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

  return (
    <DashboardLayout role="talent" title="My Projects">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Showcase Portfolio
              </span>
              <span className="text-xs text-ink-500 font-semibold">
                Direct publishing enabled (No approval required)
              </span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">My Projects & Case Studies</h1>
            <p className="text-xs text-ink-500">
              Manage portfolio projects linked to your profile with TipTap rich text and metrics.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 shadow-sm transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Project</span>
          </button>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-ink-100 p-12 text-center text-xs text-ink-400">
            Loading projects...
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
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
                    {p.is_case_study && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ink-900 text-brand-500">
                        Case Study
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-ink-900 text-sm line-clamp-2">{p.title}</h3>
                  {p.client_name && (
                    <p className="text-xs font-semibold text-ink-600 mt-1">Client: {p.client_name}</p>
                  )}
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
                  <a
                    href={`/projects/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <span>View Public</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

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
            <Briefcase className="w-10 h-10 text-ink-300 mx-auto" />
            <h3 className="font-bold text-ink-900 text-sm">No projects added yet</h3>
            <p className="text-xs text-ink-500 max-w-sm mx-auto">
              Add your client work, open-source projects, and case studies to showcase your track record.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-brand-500 text-ink-900"
            >
              <Plus className="w-4 h-4" />
              <span>Add My First Project</span>
            </button>
          </div>
        )}

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
