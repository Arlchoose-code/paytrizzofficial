"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Search,
  Eye,
  CheckCircle2,
  RefreshCw,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TalentMessageItem {
  id: number;
  ticket_code: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: string;
  source_url?: string | null;
  created_at: string;
}

export default function TalentMessagesPage() {
  const [messages, setMessages] = useState<TalentMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected message for detail modal
  const [selectedMessage, setSelectedMessage] = useState<TalentMessageItem | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("per_page", "50");

      const res = await fetch(`/api/proxy/talent/messages?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data.data || []);
      }
    } catch {
      toast.error("Failed to load your inquiries");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const updateMessageStatus = async (id: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/proxy/talent/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Inquiry marked as ${newStatus}`);
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
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
            {status}
          </span>
        );
    }
  };

  return (
    <DashboardLayout role="talent" title="Client Inquiries">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">
              Client Messages & Inquiries
            </h1>
            <p className="text-sm text-ink-700">
              Prospective clients reaching out directly via your PayTrizz talent showcase profile.
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
        <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client name, email, subject, or ticket..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {["all", "new", "read", "replied", "archived"].map((s) => (
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

        {/* Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-xs font-bold uppercase tracking-wider text-ink-500 border-b border-neutral-200">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Subject & Excerpt</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                      Loading your inquiries...
                    </td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ink-500">
                      No client inquiries match the current filter.
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
                      <td className="py-4 px-4 max-w-sm">
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
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMessage(item);
                            if (item.status === "new") {
                              updateMessageStatus(item.id, "read");
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-ink-900 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
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
                  <span className="text-ink-400 font-bold uppercase tracking-wider block">Client</span>
                  <span className="text-ink-900 font-bold text-sm block mt-0.5">{selectedMessage.name}</span>
                  <a href={`mailto:${selectedMessage.email}`} className="text-brand-600 font-semibold block underline">
                    {selectedMessage.email}
                  </a>
                  {selectedMessage.phone && <span className="text-ink-600 block">{selectedMessage.phone}</span>}
                </div>
                <div>
                  <span className="text-ink-400 font-bold uppercase tracking-wider block">Context</span>
                  <span className="text-ink-600 block mt-0.5">
                    Received: {new Date(selectedMessage.created_at).toLocaleString()}
                  </span>
                  {selectedMessage.source_url && (
                    <span className="text-ink-400 block truncate">
                      Source: {selectedMessage.source_url}
                    </span>
                  )}
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                  Client Message
                </span>
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-sm text-ink-900 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </div>
              </div>

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
                </div>

                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: [${selectedMessage.ticket_code}] ${selectedMessage.subject}`}
                  className="px-5 py-2 bg-brand-500 text-ink-900 font-bold rounded-full text-xs hover:bg-brand-600 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply to Client</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
