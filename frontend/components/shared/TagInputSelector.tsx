"use client";

import React, { useState } from "react";
import { Plus, X, Tag as TagIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TagOption {
  id: number;
  name: string;
  slug?: string;
}

interface TagInputSelectorProps {
  availableTags: TagOption[];
  selectedTagIds: number[];
  onChange: (ids: number[]) => void;
  onTagCreated?: (newTag: TagOption) => void;
  apiEndpoint?: string; // defaults to "/api/proxy/talent/tags"
  label?: string;
}

export function TagInputSelector({
  availableTags = [],
  selectedTagIds = [],
  onChange,
  onTagCreated,
  apiEndpoint = "/api/proxy/talent/tags",
  label = "Tags",
}: TagInputSelectorProps) {
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const toggleTag = (id: number) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((tId) => tId !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  const handleCreateTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagName.trim();
    if (!clean) return;

    // Check if tag already exists in availableTags
    const existing = availableTags.find(
      (t) => t.name.toLowerCase() === clean.toLowerCase()
    );
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        onChange([...selectedTagIds, existing.id]);
      }
      setNewTagName("");
      setShowInput(false);
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        const created: TagOption = {
          id: data.data.id,
          name: data.data.name,
          slug: data.data.slug,
        };
        if (onTagCreated) {
          onTagCreated(created);
        }
        if (!selectedTagIds.includes(created.id)) {
          onChange([...selectedTagIds, created.id]);
        }
        toast.success(`Tag #${created.name} added`);
        setNewTagName("");
        setShowInput(false);
      } else {
        toast.error(data?.message || "Failed to create tag");
      }
    } catch {
      toast.error("Network error creating tag");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-ink-600">
          {label}
        </label>
        {!showInput && (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-full transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Custom Tag</span>
          </button>
        )}
      </div>

      {showInput && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-brand-300">
          <TagIcon className="w-4 h-4 text-brand-600 shrink-0 ml-1" />
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateTag();
              } else if (e.key === "Escape") {
                setShowInput(false);
              }
            }}
            placeholder="Type tag name and press Enter..."
            disabled={creating}
            className="flex-1 text-xs bg-white px-3 py-1.5 rounded-lg border border-ink-200 text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoFocus
          />
          <button
            type="button"
            onClick={() => handleCreateTag()}
            disabled={creating || !newTagName.trim()}
            className="px-3 py-1.5 rounded-lg bg-brand-500 text-ink-900 font-bold text-xs hover:bg-brand-600 disabled:opacity-50 transition cursor-pointer"
          >
            {creating ? "Adding..." : "Add"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInput(false);
              setNewTagName("");
            }}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-neutral-200 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-xl border border-ink-100 bg-white">
        {availableTags.length === 0 ? (
          <p className="text-xs text-ink-400 py-1">No tags available yet. Click &apos;Add Custom Tag&apos; to create one.</p>
        ) : (
          availableTags.map((t) => {
            const isSelected = selectedTagIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer",
                  isSelected
                    ? "bg-brand-500 text-ink-900 shadow-xs border border-brand-600"
                    : "bg-neutral-100 text-ink-600 hover:bg-neutral-200 border border-transparent"
                )}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                <span>#{t.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
