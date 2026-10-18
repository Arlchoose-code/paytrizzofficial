"use client";

import { useState } from "react";
import { X, Tag, Plus, Pencil, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export interface MailLabel {
  id: number;
  name: string;
  color: string;
  message_count?: number;
}

interface ManageLabelsModalProps {
  labels: MailLabel[];
  onClose: () => void;
  onChanged: () => void;
}

const COLOR_PRESETS = [
  "#FCCF00",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
  "#06B6D4",
  "#64748B",
];

/** PRD 4.10: Manage Labels — create, rename, recolor, delete. */
export function ManageLabelsModal({ labels, onClose, onChanged }: ManageLabelsModalProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MailLabel | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setColor(COLOR_PRESETS[0]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please name the label");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/proxy/mail/labels/${editingId}` : "/api/proxy/mail/labels", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to save label");

      toast.success(editingId ? "Label updated" : "Label created");
      resetForm();
      onChanged();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save label");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/mail/labels/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete label");

      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) resetForm();
      onChanged();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete label");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-ink-100 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
              <Tag className="w-4 h-4 text-ink-900" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink-900">Manage Labels</h3>
              <p className="text-xs text-ink-500">{labels.length} label(s) available in this workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 border-b border-ink-100 space-y-3 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Label name (e.g. Clients)"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingId ? "Save" : "Add"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2.5 rounded-full border border-ink-200 text-ink-600 text-xs font-bold hover:bg-ink-100 transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "w-6 h-6 rounded-full transition-transform cursor-pointer",
                  color === c ? "scale-125 ring-2 ring-ink-900 ring-offset-2" : "hover:scale-110"
                )}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </form>

        <div className="p-5 space-y-2 max-h-[45vh] overflow-y-auto">
          {labels.length === 0 && (
            <p className="py-6 text-center text-xs text-ink-500">
              No labels yet. Create one above, then assign it from any message.
            </p>
          )}
          {labels.map((label) => (
            <div
              key={label.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-ink-100 bg-[#FAFAFA]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                <span className="text-xs font-bold text-ink-900 truncate">{label.name}</span>
                <span className="text-[11px] text-ink-500">{label.message_count ?? 0} message(s)</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingId(label.id);
                    setName(label.name);
                    setColor(label.color);
                  }}
                  className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
                  title="Rename label"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(label)}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-danger hover:bg-red-50 transition cursor-pointer"
                  title="Delete label"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete label?"
        description={
          <>
            <strong>{deleteTarget?.name}</strong> will be removed from every message. The messages themselves are not
            deleted.
          </>
        }
        confirmLabel="Delete Label"
        danger
        loading={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
