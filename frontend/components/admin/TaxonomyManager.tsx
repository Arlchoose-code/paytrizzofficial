"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Edit2, Trash2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

export interface TaxonomyFieldOption {
  value: string;
  label: string;
}

export interface TaxonomyField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "color" | "checkbox" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: TaxonomyFieldOption[];
  defaultValue?: string | number | boolean;
  helper?: string;
  /** Only send this field when editing (e.g. keys that are create-only) */
  editOnly?: boolean;
  /** Only send this field when creating */
  createOnly?: boolean;
}

export interface TaxonomyColumn {
  key: string;
  label: string;
  render?: (row: Record<string, any>) => React.ReactNode;
  className?: string;
}

interface TaxonomyManagerProps {
  title: string;
  description?: string;
  endpoint: string;
  columns: TaxonomyColumn[];
  fields: TaxonomyField[];
  addLabel?: string;
  emptyLabel?: string;
  /** Rows are wrapped in { data: [] } if paged=true, else raw array */
  paged?: boolean;
}

function buildInitialForm(fields: TaxonomyField[], row?: Record<string, any>) {
  const form: Record<string, any> = {};
  for (const f of fields) {
    if (row) {
      form[f.key] = row[f.key] ?? (f.type === "checkbox" ? false : "");
    } else {
      form[f.key] = f.defaultValue ?? (f.type === "checkbox" ? false : f.type === "number" ? 0 : "");
    }
  }
  return form;
}

export function TaxonomyManager({
  title,
  description,
  endpoint,
  columns,
  fields,
  addLabel = "Add New",
  emptyLabel = "No records yet.",
  paged = false,
}: TaxonomyManagerProps) {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy${endpoint}`);
      const json = await res.json();
      if (res.ok && json.success) {
        const data = json.data;
        setRows(paged ? data?.data || [] : Array.isArray(data) ? data : []);
      } else {
        toast.error(json.message || `Failed to load ${title.toLowerCase()}`);
      }
    } catch {
      toast.error(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [endpoint, paged, title]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setForm(buildInitialForm(fields));
    setModalOpen(true);
  };

  const openEdit = (row: Record<string, any>) => {
    setEditing(row);
    setForm(buildInitialForm(fields, row));
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: Record<string, any> = {};
    for (const f of fields) {
      if (editing && f.createOnly) continue;
      if (!editing && f.editOnly) continue;
      payload[f.key] = form[f.key];
    }

    try {
      const url = editing ? `/api/proxy${endpoint}/${editing.id}` : `/api/proxy${endpoint}`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Request failed");

      toast.success(editing ? `${title} updated` : `${title} created`);
      setModalOpen(false);
      fetchRows();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy${endpoint}/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Delete failed");
      toast.success(`${title} deleted`);
      setDeleteTarget(null);
      fetchRows();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink-900">{title}</h2>
          {description && <p className="text-xs text-ink-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRows}
            className="p-2.5 rounded-full border border-ink-200 bg-white hover:bg-ink-100 text-ink-700 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{addLabel}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-ink-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-500" />
            Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-400">{emptyLabel}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-50/60 border-b border-ink-100 text-[11px] font-bold text-ink-600 uppercase tracking-wider">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className={cn("py-3 px-5", col.className)}>
                      {col.label}
                    </th>
                  ))}
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-ink-50/40 transition">
                    {columns.map((col) => (
                      <td key={col.key} className={cn("py-3.5 px-5 text-xs text-ink-800", col.className)}>
                        {col.render ? col.render(row) : (row[col.key] ?? "—")}
                      </td>
                    ))}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="p-1.5 rounded-lg text-ink-400 hover:text-danger hover:bg-red-50 transition cursor-pointer"
                          title="Delete"
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

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => !saving && setModalOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-ink-400 hover:text-ink-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-ink-900">
              {editing ? `Edit ${title}` : `New ${title}`}
            </h3>

            <div className="space-y-3.5 pt-1">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                    {f.label} {f.required && <span className="text-danger">*</span>}
                  </label>

                  {f.type === "select" ? (
                    <select
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      required={f.required}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                    >
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-ink-100 bg-ink-50/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(form[f.key])}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                        className="w-4 h-4 accent-brand-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-ink-800">{f.helper || f.label}</span>
                    </label>
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      required={f.required}
                      placeholder={f.placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                    />
                  ) : f.type === "color" ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form[f.key] || "#FCCF00"}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        className="w-10 h-10 rounded-lg border border-ink-200 cursor-pointer bg-white p-0.5"
                      />
                      <input
                        type="text"
                        value={form[f.key] ?? ""}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        placeholder="#FCCF00"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                      />
                    </div>
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : "text"}
                      value={form[f.key] ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                        })
                      }
                      required={f.required}
                      placeholder={f.placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                    />
                  )}
                  {f.helper && f.type !== "checkbox" && (
                    <p className="text-[11px] text-ink-500 mt-1">{f.helper}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="px-5 py-2.5 rounded-full border border-ink-200 bg-white hover:bg-ink-100 text-ink-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${title}?`}
        description={
          <>
            This will permanently remove{" "}
            <strong>{deleteTarget?.label || deleteTarget?.name || `#${deleteTarget?.id}`}</strong>. This
            action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        danger
        loading={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
