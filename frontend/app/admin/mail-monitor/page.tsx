"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { MailApp } from "@/components/mail/MailApp";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Search,
  Eye,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface MonitoredMailbox {
  id: number;
  user_id: number;
  address: string;
  display_name: string;
  color: string;
  status: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export default function MailMonitorPage() {
  const [mailboxes, setMailboxes] = useState<MonitoredMailbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingBox, setInspectingBox] = useState<MonitoredMailbox | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MonitoredMailbox | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMonitoredAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/admin/mail-monitor");
      const json = await res.json();
      if (res.ok && json.data) {
        setMailboxes(json.data);
      } else {
        toast.error("Failed to retrieve monitored mailboxes");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/admin/mail-monitor/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Mailbox dan seluruh pesan berhasil dihapus");
        setMailboxes((prev) => prev.filter((m) => m.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        toast.error(json.message || "Gagal menghapus mailbox");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menghapus mailbox");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchMonitoredAccounts();
  }, [fetchMonitoredAccounts]);

  const filteredMailboxes = mailboxes.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.address.toLowerCase().includes(q) ||
      b.display_name.toLowerCase().includes(q) ||
      (b.user?.name && b.user.name.toLowerCase().includes(q)) ||
      (b.user?.email && b.user.email.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout role="admin" title="Mail Monitor | PayTrizz">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Audited Feature
              </span>
              <span className="text-[11px] font-semibold text-ink-500">
                Compliance & Quality Assurance
              </span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">Mailbox Monitor</h1>
            <p className="text-xs text-ink-500">
              Inspect talent communication for quality control and compliance. Every inspection is permanently logged.
            </p>
          </div>

          {inspectingBox && (
            <button
              onClick={() => setInspectingBox(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white border border-ink-200 text-ink-700 hover:bg-ink-100 shadow-sm transition-all self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Directory</span>
            </button>
          )}
        </div>

        {/* View Mode: Inspection vs Directory */}
        {inspectingBox ? (
          <div className="space-y-4">
            <MailApp
              scope="talent"
              readOnly={false}
              monitoredMailboxId={inspectingBox.id}
              monitoredMailboxAddress={inspectingBox.address}
              monitoredTalentName={inspectingBox.user?.name}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
            {/* Search Header */}
            <div className="p-4 border-b border-ink-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FAFAFA]">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by talent name, mailbox address, or login email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-ink-200 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="text-xs font-semibold text-ink-500">
                Total Monitored Mailboxes: <span className="font-bold text-ink-900">{filteredMailboxes.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-ink-100 bg-[#FAFAFA] text-[11px] font-bold text-ink-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Talent Member</th>
                    <th className="py-3.5 px-6">Webmail Address</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Created Date</th>
                    <th className="py-3.5 px-6 text-right">Audit Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-ink-400">
                        Loading monitored talent accounts...
                      </td>
                    </tr>
                  ) : filteredMailboxes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-ink-400">
                        No talent mailboxes found.
                      </td>
                    </tr>
                  ) : (
                    filteredMailboxes.map((box) => (
                      <tr key={box.id} className="hover:bg-ink-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-700 font-bold flex items-center justify-center text-xs">
                              {(box.user?.name || "T").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-ink-900">{box.user?.name || "Talent Member"}</p>
                              <p className="text-[11px] text-ink-400">{box.user?.email || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: box.color || "#FCCF00" }}
                            />
                            <span className="font-mono font-semibold text-ink-900">{box.address}</span>
                          </div>
                          <span className="text-[11px] text-ink-400">{box.display_name}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {box.status || "active"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-ink-500 text-[11px]">
                          {new Date(box.created_at).toLocaleDateString([], {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setInspectingBox(box);
                                toast.info("Entering monitored view", {
                                  description: `Accessing ${box.address}. Event recorded in audit log.`,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 shadow-sm transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect Mail</span>
                            </button>
                            <button
                              onClick={() => setDeleteTarget(box)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm transition-all cursor-pointer"
                              title="Delete mailbox and all messages"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
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
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus Mailbox?"
        description={
          <span>
            Hapus mailbox <strong className="text-ink-900 font-bold">&ldquo;{deleteTarget?.address}&rdquo;</strong> beserta seluruh email di dalamnya secara permanen? Tindakan ini tidak dapat dibatalkan.
          </span>
        }
        confirmLabel="Hapus Permanen"
        cancelLabel="Batal"
        danger
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  );
}
