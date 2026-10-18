"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Image as ImageIcon, X, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface PickedMedia {
  id: number;
  path_original: string;
  path_medium?: string | null;
  path_thumb?: string | null;
  original_name: string;
  alt_text?: string | null;
}

interface ImagePickerDialogProps {
  open: boolean;
  title?: string;
  /** Upload module folder, e.g. site, page, talent */
  module: string;
  /** Restrict library listing to a module; omit to show all */
  libraryModule?: string;
  onSelect: (media: PickedMedia) => void;
  onClose: () => void;
}

/**
 * Image picker with Upload + Library tabs (BOILERPLATE 4.3 #12).
 * No manual URL input — files go through the backend uploader only.
 */
export function ImagePickerDialog({
  open,
  title = "Choose Image",
  module,
  libraryModule,
  onSelect,
  onClose,
}: ImagePickerDialogProps) {
  const [tab, setTab] = useState<"upload" | "library">("library");
  const [items, setItems] = useState<PickedMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<PickedMedia | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelected(null);
    }
  }

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "60" });
      if (libraryModule) params.append("module", libraryModule);
      const res = await fetch(`/api/proxy/admin/media?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        const list = (json.data?.data || []).filter((m: any) => m.kind === "image");
        setItems(list);
      }
    } catch {
      toast.error("Failed to load media library");
    } finally {
      setLoading(false);
    }
  }, [libraryModule]);

  useEffect(() => {
    if (open) {
      fetchLibrary();
    }
  }, [open, fetchLibrary]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed here");
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("module", module);
    fd.append("alt_text", file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));

    try {
      const res = await fetch("/api/proxy/admin/media", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Upload failed");
      const media: PickedMedia = {
        id: json.data.id,
        path_original: json.data.path_original,
        path_medium: json.data.path_medium,
        path_thumb: json.data.path_thumb,
        original_name: json.data.original_name,
        alt_text: json.data.alt_text,
      };
      setSelected(media);
      setItems((prev) => [media, ...prev]);
      setTab("library");
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!open) return null;

  const previewOf = (m: PickedMedia) => m.path_thumb || m.path_medium || m.path_original;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-ink-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-extrabold text-ink-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4 flex items-center gap-1.5 p-1 flex-shrink-0">
          {(
            [
              { id: "library", label: "Library", icon: ImageIcon },
              { id: "upload", label: "Upload", icon: Upload },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2",
                  tab === t.id ? "bg-brand-500 text-ink-900 shadow-sm" : "text-ink-600 hover:text-ink-900"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
          <button
            onClick={fetchLibrary}
            className="ml-auto p-2 rounded-lg text-ink-500 hover:bg-ink-100 transition cursor-pointer"
            title="Refresh library"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "upload" ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-ink-300 hover:border-brand-500 rounded-3xl p-12 text-center cursor-pointer transition"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
              {uploading ? (
                <>
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-3" />
                  <p className="text-sm font-bold text-ink-900">Uploading & converting to WebP...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-ink-400 mb-3" />
                  <p className="text-sm font-bold text-ink-900">Click to upload an image</p>
                  <p className="text-xs text-ink-500 mt-1">
                    PNG, JPG, WebP or GIF — converted automatically. Stored in module &ldquo;{module}&rdquo;.
                  </p>
                </>
              )}
            </div>
          ) : loading ? (
            <div className="py-16 text-center text-xs text-ink-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
              Loading library...
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <ImageIcon className="w-10 h-10 text-ink-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-ink-700">No images in library</p>
              <p className="text-xs text-ink-400 mt-1">Switch to the Upload tab to add one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((m) => {
                const isSelected = selected?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={cn(
                      "relative aspect-square rounded-2xl overflow-hidden border-2 transition cursor-pointer group",
                      isSelected ? "border-brand-500 ring-2 ring-brand-500/40" : "border-transparent hover:border-ink-300"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewOf(m)}
                      alt={m.alt_text || m.original_name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-500 text-ink-900 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="absolute bottom-0 inset-x-0 px-2 py-1 bg-ink-900/70 text-white text-[9px] font-semibold truncate opacity-0 group-hover:opacity-100 transition">
                      {m.original_name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-ink-100 flex items-center justify-between flex-shrink-0 gap-4">
          <p className="text-[11px] text-ink-500 truncate">
            {selected ? (
              <>
                Selected: <span className="font-bold text-ink-900">{selected.original_name}</span>
              </>
            ) : (
              "Select an image to continue"
            )}
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-ink-200 text-ink-700 font-bold text-xs hover:bg-ink-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!selected}
              onClick={() => {
                if (selected) {
                  onSelect(selected);
                  onClose();
                }
              }}
              className="px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              Use This Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
