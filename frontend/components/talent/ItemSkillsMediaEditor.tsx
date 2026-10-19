"use client";

import React, { useState } from "react";
import { Plus, X, Paperclip, ExternalLink, Image as ImageIcon } from "lucide-react";
import { ImagePickerDialog, PickedMedia } from "@/components/shared/ImagePickerDialog";

export interface ItemMediaAttachment {
  id?: number;
  title: string;
  url: string;
  type?: "image" | "document" | "link";
}

interface ItemSkillsEditorProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  catalog?: string[];
  label?: string;
}

export function ItemSkillsEditor({
  skills = [],
  onChange,
  label = "Skills (tools & technologies applied)",
}: ItemSkillsEditorProps) {
  const [newSkill, setNewSkill] = useState("");
  const [adding, setAdding] = useState(false);

  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setNewSkill("");
    setAdding(false);
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-ink-600 uppercase flex items-center justify-between">
        <span>{label}</span>
      </label>

      <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] p-2 rounded-xl border border-ink-200 bg-white">
        {skills.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-ink-900 border border-brand-200"
          >
            <span>{s}</span>
            <button
              type="button"
              onClick={() => removeSkill(i)}
              className="text-ink-400 hover:text-danger p-0.5 rounded-full transition"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {adding ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill(newSkill);
                } else if (e.key === "Escape") {
                  setAdding(false);
                }
              }}
              placeholder="e.g. Next.js, Golang..."
              className="px-2.5 py-1 text-xs rounded-lg border border-brand-500 bg-white text-ink-900 focus:outline-none w-36"
              autoFocus
            />
            <button
              type="button"
              onClick={() => addSkill(newSkill)}
              className="px-2 py-1 text-xs font-bold rounded-lg bg-brand-500 text-ink-900 hover:bg-brand-600"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="p-1 text-ink-400 hover:text-ink-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add skill</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface ItemMediaEditorProps {
  media: ItemMediaAttachment[];
  onChange: (media: ItemMediaAttachment[]) => void;
  label?: string;
}

export function ItemMediaEditor({
  media = [],
  onChange,
  label = "Media (projects, proofs, documents or certificates)",
}: ItemMediaEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const handleMediaPick = (picked: PickedMedia) => {
    const url = picked.path_medium || picked.path_original || picked.path_thumb || "";
    onChange([
      ...media,
      {
        id: picked.id,
        title: picked.original_name || "Attachment Image",
        url,
        type: "image",
      },
    ]);
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    onChange([
      ...media,
      {
        title: linkTitle.trim() || linkUrl.trim(),
        url: linkUrl.trim(),
        type: "link",
      },
    ]);
    setLinkTitle("");
    setLinkUrl("");
    setLinkModalOpen(false);
  };

  const removeMedia = (index: number) => {
    onChange(media.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-ink-600 uppercase flex items-center justify-between">
        <span>{label}</span>
      </label>

      {/* Media Items Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {media.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-xl border border-ink-200 bg-white shadow-xs group relative overflow-hidden"
            >
              {m.type === "image" || m.url.match(/\.(webp|jpg|jpeg|png|gif)$/i) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt={m.title}
                  className="w-10 h-10 rounded-lg object-cover border border-ink-100 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-ink-50 border border-ink-100 flex items-center justify-center shrink-0 text-brand-600">
                  <Paperclip className="w-4 h-4" />
                </div>
              )}

              <div className="min-w-0 flex-1 pr-6">
                <p className="text-xs font-bold text-ink-900 truncate" title={m.title}>
                  {m.title}
                </p>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-brand-600 hover:underline flex items-center gap-1 truncate"
                >
                  <span className="truncate">{m.url}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => removeMedia(i)}
                className="absolute top-2 right-2 p-1 rounded-full text-ink-400 hover:text-danger hover:bg-red-50 transition"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-ink-200 hover:border-brand-500 hover:bg-brand-50 text-ink-800 transition cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
          <span>Upload / Pick Image</span>
        </button>

        <button
          type="button"
          onClick={() => setLinkModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-ink-200 hover:border-brand-500 hover:bg-brand-50 text-ink-800 transition cursor-pointer"
        >
          <Paperclip className="w-3.5 h-3.5 text-brand-600" />
          <span>Add Link / Document</span>
        </button>
      </div>

      <ImagePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleMediaPick}
        title="Select Media Attachment"
        module="talent"
      />

      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleAddLink}
            className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl border border-ink-100"
          >
            <div className="flex items-center justify-between pb-2 border-b border-ink-100">
              <h4 className="text-xs font-extrabold text-ink-900">Add Link / Document</h4>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-ink-400 hover:text-ink-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-[11px] font-bold text-ink-600 uppercase">Title</label>
              <input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="e.g. Project Architecture Slide"
                className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-ink-600 uppercase">URL *</label>
              <input
                type="url"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 mt-1 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-ink-600 hover:bg-ink-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-500 text-ink-900 hover:bg-brand-600"
              >
                Add Link
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
