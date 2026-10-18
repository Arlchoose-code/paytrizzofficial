"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Search,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Copy,
  Pencil,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: number;
  module: string;
  kind: string;
  visibility: string;
  mime: string;
  size_bytes: number;
  original_name: string;
  alt_text?: string | null;
  width?: number | null;
  height?: number | null;
  path_original: string;
  path_medium?: string | null;
  path_thumb?: string | null;
  path_file?: string | null;
  created_at: string;
}

const MODULES = ["site", "page", "talent", "service", "project", "blog", "badge", "application"];

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [uploadModule, setUploadModule] = useState("site");

  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [editTarget, setEditTarget] = useState<MediaItem | null>(null);
  const [editAltText, setEditAltText] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "60" });
      if (moduleFilter) params.append("module", moduleFilter);
      const res = await fetch(`/api/proxy/admin/media?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setItems(json.data?.data || []);
      }
    } catch {
      toast.error("Failed to load media library");
    } finally {
      setLoading(false);
    }
  }, [moduleFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("module", uploadModule);
    fd.append("alt_text", file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));

    try {
      const res = await fetch("/api/proxy/admin/media", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Upload failed");
      toast.success("Media uploaded", { description: "Converted to WebP automatically." });
      fetchMedia();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/admin/media/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
      toast.success("Media deleted");
      setDeleteTarget(null);
      fetchMedia();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete media");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAlt = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/admin/media/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt_text: editAltText }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Update failed");
      toast.success("Alt text updated");
      setEditTarget(null);
      fetchMedia();
    } catch (err: any) {
      toast.error(err.message || "Failed to update media");
    } finally {
      setSaving(false);
    }
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    toast.success("Path copied to clipboard");
  };

  const imageOf = (m: MediaItem) => m.path_thumb || m.path_medium || m.path_original;
  const visible = items.filter((m) =>
    search.trim() ? m.original_name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <DashboardLayout role="admin" title="Media Library">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Assets
              </span>
              <span className="text-[11px] font-semibold text-ink-500">
                {items.length} files in library
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Media Library</h1>
            <p className="text-sm text-ink-500 mt-1">
              All uploads are converted to WebP and stored per module. Reuse images anywhere via the image picker.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <select
              value={uploadModule}
              onChange={(e) => setUploadModule(e.target.value)}
              className="h-11 px-3 rounded-full border border-ink-200 text-xs font-bold bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
            >
              {MODULES.map((m) => (
                <option key={m} value={m}>
                  Module: {m}
                </option>
              ))}
            </select>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? "Uploading..." : "Upload Media"}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by file name..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-ink-50 border border-ink-100 rounded-xl text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setModuleFilter("")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer",
                moduleFilter === "" ? "bg-brand-500 text-ink-900" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              )}
            >
              All
            </button>
            {MODULES.map((m) => (
              <button
                key={m}
                onClick={() => setModuleFilter(m)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition cursor-pointer",
                  moduleFilter === m ? "bg-brand-500 text-ink-900" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                )}
              >
                {m}
              </button>
            ))}
            <button
              onClick={fetchMedia}
              className="p-2 rounded-lg text-ink-500 hover:bg-ink-100 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-ink-100 p-16 text-center text-xs text-ink-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
            Loading media library...
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-3xl border border-ink-100 p-16 text-center">
            <ImageIcon className="w-10 h-10 text-ink-300 mx-auto mb-3" />
            <p className="font-bold text-ink-700 text-sm">No media found</p>
            <p className="text-xs text-ink-400 mt-1">Upload your first file or change the module filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {visible.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden group hover:shadow-md transition flex flex-col"
              >
                <div className="aspect-[4/3] bg-ink-50 relative flex items-center justify-center overflow-hidden">
                  {m.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageOf(m)}
                      alt={m.alt_text || m.original_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-ink-400">
                      <FileText className="w-8 h-8" />
                      <span className="text-[10px] font-bold uppercase">{m.mime.split("/")[1] || "file"}</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-ink-900/80 text-white backdrop-blur-xs">
                    {m.module}
                  </span>
                </div>

                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-ink-900 truncate" title={m.original_name}>
                      {m.original_name}
                    </p>
                    <p className="text-[10px] text-ink-400 mt-0.5">
                      {formatBytes(m.size_bytes)}
                      {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 pt-1">
                    <button
                      onClick={() => {
                        setEditTarget(m);
                        setEditAltText(m.alt_text || "");
                      }}
                      className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
                      title="Edit alt text"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => copyPath(m.path_original)}
                      className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
                      title="Copy path"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-danger hover:bg-red-50 transition cursor-pointer ml-auto"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alt text edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => setEditTarget(null)} />
          <div className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <button
              onClick={() => setEditTarget(null)}
              className="absolute top-5 right-5 text-ink-400 hover:text-ink-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-ink-900">Edit Alt Text</h3>
            <p className="text-xs text-ink-500 -mt-2">{editTarget.original_name}</p>
            <input
              type="text"
              value={editAltText}
              onChange={(e) => setEditAltText(e.target.value)}
              placeholder="Describe this image for accessibility & SEO"
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditTarget(null)}
                className="px-5 py-2.5 rounded-full border border-ink-200 text-ink-700 font-bold text-xs hover:bg-ink-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAlt}
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete media file?"
        description={
          <>
            <strong>{deleteTarget?.original_name}</strong> and all its generated variants will be removed from disk.
            Pages using it may show a broken image.
          </>
        }
        confirmLabel="Delete File"
        danger
        loading={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
