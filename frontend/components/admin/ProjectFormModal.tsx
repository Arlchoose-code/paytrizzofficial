"use client";

import { useEffect, useState } from "react";
import { X, Tag, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { ImagePickerDialog } from "@/components/shared/ImagePickerDialog";
import { cn } from "@/lib/utils";

export interface ProjectItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_media_id?: number | null;
  cover_media?: {
    id?: number;
    path_original?: string;
    path_large?: string;
    path_medium?: string;
    path_thumb?: string;
  } | null;
  client_name?: string | null;
  project_url?: string | null;
  category_id?: number | null;
  category?: { id: number; name: string } | null;
  tags?: { id: number; name: string }[];
  status: string;
  is_case_study: boolean;
  challenge?: string | null;
  solution?: string | null;
  result?: string | null;
  is_featured: boolean;
  published_at?: string | null;
}

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: ProjectItem | null;
  categories: { id: number; name: string }[];
  onSuccess: () => void;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  project,
  categories,
  onSuccess,
}: ProjectFormModalProps) {
  const isEditing = !!project;
  const [submitting, setSubmitting] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formClientName, setFormClientName] = useState("");
  const [formProjectUrl, setFormProjectUrl] = useState("");
  const [formIsCaseStudy, setFormIsCaseStudy] = useState(false);
  const [formChallenge, setFormChallenge] = useState("");
  const [formSolution, setFormSolution] = useState("");
  const [formResult, setFormResult] = useState("");
  const [formStatus, setFormStatus] = useState("published");
  const [formIsFeatured, setFormIsFeatured] = useState(false);
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

  const [prevProject, setPrevProject] = useState(project);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (project !== prevProject || isOpen !== prevIsOpen) {
    setPrevProject(project);
    setPrevIsOpen(isOpen);
    if (project) {
      setFormTitle(project.title);
      setFormExcerpt(project.excerpt);
      setFormContent(project.content || "");
      setFormCategoryId(project.category_id ? String(project.category_id) : "");
      setFormClientName(project.client_name || "");
      setFormProjectUrl(project.project_url || "");
      setFormIsCaseStudy(project.is_case_study);
      setFormChallenge(project.challenge || "");
      setFormSolution(project.solution || "");
      setFormResult(project.result || "");
      setFormStatus(project.status || "published");
      setFormIsFeatured(project.is_featured);
      setCoverMediaId(project.cover_media_id || project.cover_media?.id || null);
      setCoverPreviewUrl(
        project.cover_media?.path_medium ||
        project.cover_media?.path_original ||
        project.cover_media?.path_large ||
        ""
      );
      setSelectedTagIds(project.tags?.map((t) => t.id) || []);
    } else {
      setFormTitle("");
      setFormExcerpt("");
      setFormContent("");
      setFormCategoryId("");
      setFormClientName("");
      setFormProjectUrl("");
      setFormIsCaseStudy(false);
      setFormChallenge("");
      setFormSolution("");
      setFormResult("");
      setFormStatus("published");
      setFormIsFeatured(false);
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
        client_name: formClientName || null,
        project_url: formProjectUrl || null,
        is_case_study: formIsCaseStudy,
        challenge: formIsCaseStudy ? formChallenge : null,
        solution: formIsCaseStudy ? formSolution : null,
        result: formIsCaseStudy ? formResult : null,
        status: formStatus,
        is_featured: formIsFeatured,
        tag_ids: selectedTagIds,
      };

      const endpoint = isEditing
        ? `/api/proxy/admin/projects/${project.id}`
        : "/api/proxy/admin/projects";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(
          isEditing
            ? "Project updated successfully!"
            : "Project created successfully!"
        );
        onClose();
        onSuccess();
      } else {
        toast.error(json.message || "Failed to save project");
      }
    } catch {
      toast.error("Network error while saving project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <h2 className="text-xl font-extrabold text-ink-900">
            {isEditing ? `Edit Project #${project.id}` : "Add New Project"}
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
                Project Title *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. FinScale Enterprise Core Banking Engine"
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
                Client / Company Name
              </label>
              <input
                type="text"
                value={formClientName}
                onChange={(e) => setFormClientName(e.target.value)}
                placeholder="e.g. FinScale Ltd"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold bg-white text-ink-900 focus:outline-none focus:border-brand-500"
              />
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
              placeholder="Brief summary displayed on project cards..."
              className="w-full p-3 rounded-xl border border-neutral-200 text-xs bg-white text-ink-900 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Project Tags Selection */}
          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-500" />
              Project Tags &amp; Tech Stack
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
              Cover Image (Case Study Card Thumbnail &amp; OpenGraph Image)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50">
              <div className="w-32 h-20 rounded-xl border border-neutral-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                {coverPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreviewUrl} alt="Project cover preview" className="w-full h-full object-cover" />
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
              Full Project Content &amp; Details (TipTap Rich Editor) *
            </label>
            <RichTextEditor
              content={formContent}
              onChange={setFormContent}
              placeholder="Write the full case study or technical architecture details..."
              minHeight="220px"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Project URL (Live Demo)
              </label>
              <input
                type="url"
                value={formProjectUrl}
                onChange={(e) => setFormProjectUrl(e.target.value)}
                placeholder="https://client-product.com"
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

          {/* Case Study Toggle & Fields */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/40 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formIsCaseStudy}
                onChange={(e) => setFormIsCaseStudy(e.target.checked)}
                className="w-4 h-4 rounded text-brand-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-bold text-ink-900">
                Mark as Featured Case Study (Challenge / Solution / Result)
              </span>
            </label>

            {formIsCaseStudy && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">
                    The Challenge
                  </label>
                  <textarea
                    rows={3}
                    value={formChallenge}
                    onChange={(e) => setFormChallenge(e.target.value)}
                    placeholder="Core problem..."
                    className="w-full p-2.5 rounded-xl border border-neutral-200 text-xs bg-white text-ink-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">
                    The Solution
                  </label>
                  <textarea
                    rows={3}
                    value={formSolution}
                    onChange={(e) => setFormSolution(e.target.value)}
                    placeholder="How we solved it..."
                    className="w-full p-2.5 rounded-xl border border-neutral-200 text-xs bg-white text-ink-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">
                    The Result
                  </label>
                  <textarea
                    rows={3}
                    value={formResult}
                    onChange={(e) => setFormResult(e.target.value)}
                    placeholder="Key metrics..."
                    className="w-full p-2.5 rounded-xl border border-neutral-200 text-xs bg-white text-ink-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeaturedProject"
              checked={formIsFeatured}
              onChange={(e) => setFormIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded text-brand-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="isFeaturedProject" className="text-xs font-bold text-ink-900 cursor-pointer">
              Feature this project on agency homepage
            </label>
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
              {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>

      <ImagePickerDialog
        open={imagePickerOpen}
        title="Select Project Cover Image"
        module="project"
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
