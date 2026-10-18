"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Save,
  Code,
  Palette,
  Smartphone,
  Video,
  TrendingUp,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ServiceItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  image_media_id?: number | null;
  sort_order: number;
  is_active: boolean;
}

const ICON_OPTIONS = [
  { key: "code", label: "Code / Engineering", icon: Code },
  { key: "palette", label: "Palette / Design", icon: Palette },
  { key: "smartphone", label: "Smartphone / Mobile", icon: Smartphone },
  { key: "video", label: "Video / Motion", icon: Video },
  { key: "trending-up", label: "Trending / Growth", icon: TrendingUp },
  { key: "file-text", label: "FileText / Copy", icon: FileText },
  { key: "briefcase", label: "Briefcase / General", icon: Briefcase },
];

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("code");
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<ServiceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/proxy/admin/services?search=${encodeURIComponent(search)}&per_page=50`
        : `/api/proxy/admin/services?per_page=50`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.data) {
        setServices(json.data.data || json.data || []);
      } else {
        toast.error("Failed to load services");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleOpenCreate = () => {
    setEditingService(null);
    setTitle("");
    setDescription("");
    setIcon("code");
    setSortOrder(services.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: ServiceItem) => {
    setEditingService(s);
    setTitle(s.title);
    setDescription(s.description);
    setIcon(s.icon || "code");
    setSortOrder(s.sort_order);
    setIsActive(s.is_active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        title,
        description,
        icon,
        sort_order: Number(sortOrder),
        is_active: isActive,
      };

      let res: Response;
      if (editingService) {
        res = await fetch(`/api/proxy/admin/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/proxy/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (res.ok) {
        toast.success(editingService ? "Service updated" : "Service created");
        setModalOpen(false);
        fetchServices();
      } else {
        toast.error(json.message || "Failed to save service");
      }
    } catch {
      toast.error("Error saving service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/proxy/admin/services/${deletingService.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (res.ok) {
        toast.success("Service deleted");
        setDeleteDialogOpen(false);
        setDeletingService(null);
        fetchServices();
      } else {
        toast.error(json.message || "Failed to delete service");
      }
    } catch {
      toast.error("Error deleting service");
    } finally {
      setDeleting(false);
    }
  };

  const renderIconBadge = (iconKey: string) => {
    const item = ICON_OPTIONS.find((i) => i.key === iconKey);
    const IconComp = item ? item.icon : Briefcase;
    return (
      <div className="w-8 h-8 rounded-xl bg-ink-100 flex items-center justify-center text-ink-800 flex-shrink-0">
        <IconComp className="w-4 h-4" />
      </div>
    );
  };

  return (
    <DashboardLayout role="admin" title="Services | PayTrizz">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Core Catalog
              </span>
              <span className="text-xs text-ink-500 font-medium">Public Capabilities</span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">Services Management</h1>
            <p className="text-xs text-ink-500">
              Manage agency capability disciplines displayed on the homepage and services grid.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchServices}
              className="p-2 rounded-xl bg-white border border-ink-200 text-ink-700 hover:bg-ink-100 transition shadow-xs"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-ink-900 text-xs font-bold hover:bg-brand-400 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-ink-100 p-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
            <input
              type="text"
              placeholder="Search services by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
            />
          </div>
          <span className="text-xs font-bold text-ink-500 whitespace-nowrap">
            {services.length} items
          </span>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ink-50 border-b border-ink-100 text-ink-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-ink-400" />
                      Loading services...
                    </td>
                  </tr>
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-500 font-medium">
                      No services found. Click &quot;Add Service&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  services.map((s) => (
                    <tr key={s.id} className="hover:bg-ink-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-ink-600">
                        #{s.sort_order}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {renderIconBadge(s.icon)}
                          <span className="font-bold text-ink-900 text-sm">{s.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-ink-500 text-[11px]">
                        /{s.slug}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-ink-600 truncate">
                        {s.description}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase",
                            s.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-ink-100 text-ink-600"
                          )}
                        >
                          {s.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100 hover:text-ink-900 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingService(s);
                              setDeleteDialogOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-ink-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-ink-100">
                <h3 className="text-base font-black text-ink-900">
                  {editingService ? "Edit Service" : "Add New Service"}
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-1 text-ink-400 hover:text-ink-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Web Development"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 font-semibold focus:outline-none focus:ring-1 focus:ring-ink-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Brief capability description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-ink-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink-700 mb-1">Icon Category</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-ink-900"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 font-semibold focus:outline-none focus:ring-1 focus:ring-ink-900"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveService"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isActiveService" className="text-xs font-bold text-ink-900 cursor-pointer">
                    Display Service on Website (Active)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-ink-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 text-ink-900 text-xs font-bold hover:bg-brand-400 disabled:opacity-50"
                  >
                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Dialog */}
        {deleteDialogOpen && deletingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-ink-100 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2.5 rounded-2xl bg-red-50">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-900">Delete Service</h3>
                  <p className="text-xs text-ink-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-ink-700">
                Are you sure you want to remove &quot;<strong>{deletingService.title}</strong>&quot;?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-ink-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
