"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  X,
  FileText,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

interface ApplicationItem {
  id: number;
  ticket_code: string;
  type: string;
  full_name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  title?: string | null;
  message: string;
  portfolio_url?: string | null;
  specialty_id?: number | null;
  specialty?: { id: number; name: string } | null;
  budget_range?: string | null;
  timeline?: string | null;
  status: string;
  admin_notes?: string | null;
  files?: Array<{
    id: number;
    label?: string;
    media?: {
      id: number;
      original_name: string;
      path_original: string;
      size_bytes: number;
      mime: string;
    };
  }>;
  created_at: string;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected application for detail modal
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [statusForm, setStatusForm] = useState({
    status: "new",
    adminNotes: "",
  });
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("per_page", "50");

      const res = await fetch(`/api/proxy/admin/applications?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setApplications(json.data.data || []);
      }
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const openDetailModal = (app: ApplicationItem) => {
    setSelectedApp(app);
    setStatusForm({
      status: app.status,
      adminNotes: app.admin_notes || "",
    });
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSavingStatus(true);
    try {
      const res = await fetch(`/api/proxy/admin/applications/${selectedApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusForm.status,
          admin_notes: statusForm.adminNotes || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success("Application status updated and applicant notified via email!");
        setApplications((prev) =>
          prev.map((a) =>
            a.id === selectedApp.id
              ? { ...a, status: statusForm.status, admin_notes: statusForm.adminNotes }
              : a
          )
        );
        setSelectedApp((prev) =>
          prev
            ? { ...prev, status: statusForm.status, admin_notes: statusForm.adminNotes }
            : null
        );
      } else {
        toast.error(json.message || "Failed to update status");
      }
    } catch {
      toast.error("Network error while updating status");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTargetId === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/admin/applications/${deleteTargetId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Application removed successfully");
        setApplications((prev) => prev.filter((a) => a.id !== deleteTargetId));
        if (selectedApp?.id === deleteTargetId) setSelectedApp(null);
        setDeleteTargetId(null);
      } else {
        toast.error("Failed to delete application");
      }
    } catch {
      toast.error("Network error while deleting");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-500 text-ink-900 border border-brand-600">
            <span className="w-1.5 h-1.5 rounded-full bg-ink-900 animate-pulse" />
            NEW
          </span>
        );
      case "reviewing":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Reviewing
          </span>
        );
      case "shortlisted":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            Shortlisted
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Rejected
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
            {status}
          </span>
        );
    }
  };

  return (
    <DashboardLayout role="admin" title="Applications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">
              Project Proposals & Squad Requests
            </h1>
            <p className="text-sm text-ink-700">
              Review and manage incoming client project scoping requests submitted via /request-project.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchApplications}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 rounded-xl text-sm font-semibold text-ink-900 hover:bg-neutral-50 shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticket, name, email, or company..."
                className="w-full h-10 pl-10 pr-4 text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900"
              />
            </div>
          </div>

          {/* Status Filter Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-2 border-t border-neutral-100">
            <span className="font-bold text-ink-500 uppercase tracking-wider mr-1">Status:</span>
            {["all", "new", "reviewing", "shortlisted", "accepted", "rejected", "archived"].map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1 rounded-lg capitalize transition-colors font-semibold",
                    statusFilter === s
                      ? "bg-ink-900 text-white"
                      : "bg-neutral-100 text-ink-600 hover:bg-neutral-200"
                  )}
                >
                  {s}
                </button>
              )
            )}
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-xs font-bold uppercase tracking-wider text-ink-500 border-b border-neutral-200">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Client / Company</th>
                  <th className="py-3.5 px-4">Project & Scope</th>
                  <th className="py-3.5 px-4">Budget & Timeline</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ink-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                      Loading project requests...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ink-500">
                      No project scoping requests match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  applications.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-xs text-ink-900">
                        {item.ticket_code}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-ink-900">
                          {item.company_name || item.full_name}
                        </div>
                        <div className="text-xs text-ink-600">
                          {item.company_name ? `${item.full_name} · ${item.email}` : item.email}
                        </div>
                        {item.phone && <div className="text-xs text-ink-400">{item.phone}</div>}
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-semibold text-ink-900">
                          {item.title || "Project Scoping"}
                        </div>
                        <div className="text-xs text-ink-500 line-clamp-1">
                          {item.message}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs">
                        <div className="font-semibold text-ink-800">
                          {item.budget_range || "Flexible"}
                        </div>
                        <div className="text-ink-500">
                          {item.timeline || "N/A"}
                        </div>
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-4 px-4 text-xs text-ink-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDetailModal(item)}
                            className="p-1.5 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-neutral-100 transition-colors"
                            title="Review Application"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(item.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Application Review & Status Modal */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-ink-900 bg-neutral-100 px-2.5 py-1 rounded-md">
                      {selectedApp.ticket_code}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
                      {selectedApp.type === "freelance" ? "Freelance Application" : "Project Request"}
                    </span>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-ink-900">
                    {selectedApp.full_name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-2 text-xs">
                  <span className="font-bold text-ink-400 uppercase tracking-wider block">
                    Contact Details
                  </span>
                  <div>
                    <span className="text-ink-500">Email: </span>
                    <a href={`mailto:${selectedApp.email}`} className="text-ink-900 font-semibold underline">
                      {selectedApp.email}
                    </a>
                  </div>
                  {selectedApp.phone && (
                    <div>
                      <span className="text-ink-500">Phone: </span>
                      <span className="text-ink-900 font-semibold">{selectedApp.phone}</span>
                    </div>
                  )}
                  {selectedApp.portfolio_url && (
                    <div className="pt-1">
                      <a
                        href={selectedApp.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-brand-600 font-bold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Portfolio / GitHub</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-2 text-xs">
                  <span className="font-bold text-ink-400 uppercase tracking-wider block">
                    Project Requirements
                  </span>
                  {selectedApp.company_name && (
                    <div>
                      <span className="text-ink-500">Company: </span>
                      <span className="text-ink-900 font-semibold">{selectedApp.company_name}</span>
                    </div>
                  )}
                  {selectedApp.title && (
                    <div>
                      <span className="text-ink-500">Project Title: </span>
                      <span className="text-ink-900 font-semibold">{selectedApp.title}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-ink-500">Budget: </span>
                    <span className="text-ink-900 font-semibold">{selectedApp.budget_range || "Flexible"}</span>
                  </div>
                  <div>
                    <span className="text-ink-500">Timeline: </span>
                    <span className="text-ink-900 font-semibold">{selectedApp.timeline || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-ink-500">Submitted: </span>
                    <span className="text-ink-700">{new Date(selectedApp.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Message / Project Description */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                  Project Description &amp; Technical Requirements
                </span>
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-sm text-ink-900 whitespace-pre-wrap leading-relaxed">
                  {selectedApp.message}
                </div>
              </div>

              {/* Uploaded Files / Attachments */}
              {selectedApp.files && selectedApp.files.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    Uploaded Documents & Attachments
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedApp.files.map((f) => (
                      <a
                        key={f.id}
                        href={f.media?.path_original || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-brand-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-ink-900 truncate">
                            {f.media?.original_name || "Attachment"}
                          </p>
                          <p className="text-[10px] text-ink-400">
                            {f.label ? `${f.label} · ` : ""}
                            {f.media?.size_bytes ? `${Math.round(f.media.size_bytes / 1024)} KB` : ""}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-ink-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update Form */}
              <form onSubmit={handleUpdateStatus} className="pt-4 border-t border-neutral-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
                      Update Status *
                    </label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl border border-neutral-300 text-sm text-ink-900 focus:ring-2 focus:ring-ink-900 outline-none bg-white font-semibold"
                    >
                      <option value="new">New</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-ink-700">
                      Internal Admin Notes & Applicant Feedback
                    </label>
                    <input
                      type="text"
                      value={statusForm.adminNotes}
                      onChange={(e) => setStatusForm({ ...statusForm, adminNotes: e.target.value })}
                      placeholder="e.g. Schedule technical interview for next Tuesday..."
                      className="w-full h-11 px-3 rounded-xl border border-neutral-300 text-sm text-ink-900 focus:ring-2 focus:ring-ink-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-ink-500">
                    Updating status automatically triggers an email notification to the applicant.
                  </div>
                  <button
                    type="submit"
                    disabled={savingStatus}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-500 text-ink-900 font-bold text-xs hover:bg-brand-600 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingStatus ? "Saving..." : "Save & Notify Applicant"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete this application?"
        description="The application, its attachments and internal notes will be permanently removed. This cannot be undone."
        confirmLabel="Delete Application"
        danger
        loading={deleting}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}
