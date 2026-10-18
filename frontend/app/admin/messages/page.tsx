"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  RefreshCw,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

interface ContactMessageItem {
  id: number;
  ticket_code: string;
  channel: string;
  talent_id?: number | null;
  talent?: { id: number; name: string } | null;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: string;
  ip?: string | null;
  user_agent?: string | null;
  source_url?: string | null;
  created_at: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  // Selected message for detail modal
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (channelFilter !== "all") params.append("channel", channelFilter);
      params.append("per_page", "50");

      const res = await fetch(`/api/proxy/admin/messages?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data.data || []);
      }
    } catch {
      toast.error("Failed to load contact messages");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, channelFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const updateMessageStatus = async (id: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/proxy/admin/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Message marked as ${newStatus}`);
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
        );
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error while updating status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteMessage = async () => {
    if (deleteTargetId === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/admin/messages/${deleteTargetId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Message deleted successfully");
        setMessages((prev) => prev.filter((m) => m.id !== deleteTargetId));
        if (selectedMessage?.id === deleteTargetId) setSelectedMessage(null);
        setDeleteTargetId(null);
      } else {
        toast.error("Failed to delete message");
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
      case "read":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Read
          </span>
        );
      case "replied":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Replied
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
            Archived
          </span>
        );
      case "spam":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Spam
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
    <DashboardLayout role="admin" title="Contact Inquiries">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">Contact Inquiries</h1>
            <p className="text-sm text-ink-700">
              Manage visitor submissions from the general contact form and talent profile inboxes.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchMessages}
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
                placeholder="Search by ticket, name, email, or subject..."
                className="w-full h-10 pl-10 pr-4 text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {["all", "new", "read", "replied", "archived", "spam"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    statusFilter === s
                      ? "bg-brand-500 text-ink-900 shadow-sm"
                      : "bg-neutral-100 text-ink-600 hover:bg-neutral-200"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Filter Sub-row */}
          <div className="flex items-center gap-2 text-xs pt-2 border-t border-neutral-100">
            <span className="font-bold text-ink-500 uppercase tracking-wider">Channel:</span>
            {["all", "general", "talent"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChannelFilter(c)}
                className={cn(
                  "px-2.5 py-1 rounded-md capitalize transition-colors font-semibold",
                  channelFilter === c
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-neutral-100"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-xs font-bold uppercase tracking-wider text-ink-500 border-b border-neutral-200">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Sender</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4">Subject & Excerpt</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Received</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ink-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                      Loading inquiries...
                    </td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ink-500">
                      No inquiries match the current filter.
                    </td>
                  </tr>
                ) : (
                  messages.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-xs text-ink-900">
                        {item.ticket_code}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-ink-900">{item.name}</div>
                        <div className="text-xs text-ink-500">{item.email}</div>
                        {item.phone && <div className="text-xs text-ink-400">{item.phone}</div>}
                      </td>
                      <td className="py-4 px-4">
                        {item.channel === "talent" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Talent: {item.talent?.name || `#${item.talent_id}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                            General
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-medium text-ink-900 truncate">{item.subject}</div>
                        <div className="text-xs text-ink-500 truncate">{item.message}</div>
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-4 px-4 text-xs text-ink-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMessage(item);
                              if (item.status === "new") {
                                updateMessageStatus(item.id, "read");
                              }
                            }}
                            className="p-1.5 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-neutral-100 transition-colors"
                            title="View Message"
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

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-ink-900 bg-neutral-100 px-2.5 py-1 rounded-md">
                      {selectedMessage.ticket_code}
                    </span>
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                  <h3 className="text-xl font-bold text-ink-900">{selectedMessage.subject}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sender Details */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-ink-400 font-bold uppercase tracking-wider block">Sender</span>
                  <span className="text-ink-900 font-bold text-sm block mt-0.5">{selectedMessage.name}</span>
                  <span className="text-ink-600 block">{selectedMessage.email}</span>
                  {selectedMessage.phone && <span className="text-ink-600 block">{selectedMessage.phone}</span>}
                </div>
                <div>
                  <span className="text-ink-400 font-bold uppercase tracking-wider block">Routing Info</span>
                  <span className="text-ink-900 font-semibold block mt-0.5 capitalize">
                    Channel: {selectedMessage.channel}
                  </span>
                  {selectedMessage.talent && (
                    <span className="text-purple-700 font-semibold block">
                      Target Talent: {selectedMessage.talent.name}
                    </span>
                  )}
                  <span className="text-ink-500 block">
                    Received: {new Date(selectedMessage.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                  Inquiry Content
                </span>
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-sm text-ink-900 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Audit / Metadata */}
              {(selectedMessage.ip || selectedMessage.source_url) && (
                <div className="text-xs text-ink-400 space-y-1 pt-2 border-t border-neutral-100">
                  {selectedMessage.ip && <div>Client IP: {selectedMessage.ip}</div>}
                  {selectedMessage.source_url && (
                    <div className="truncate">Source URL: {selectedMessage.source_url}</div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-ink-500">Mark Status:</span>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => updateMessageStatus(selectedMessage.id, "replied")}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                  >
                    Replied
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => updateMessageStatus(selectedMessage.id, "archived")}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => updateMessageStatus(selectedMessage.id, "spam")}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors"
                  >
                    Spam
                  </button>
                </div>

                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: [${selectedMessage.ticket_code}] ${selectedMessage.subject}`}
                  className="px-4 py-2 bg-brand-500 text-ink-900 font-bold rounded-full text-xs hover:bg-brand-600 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="Delete this message?"
        description="The inquiry and its ticket history will be permanently removed. This cannot be undone."
        confirmLabel="Delete Message"
        danger
        loading={deleting}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={deleteMessage}
      />
    </DashboardLayout>
  );
}
