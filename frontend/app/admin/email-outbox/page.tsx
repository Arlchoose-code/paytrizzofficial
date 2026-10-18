"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  RotateCcw,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EmailOutboxItem {
  id: number;
  template_key: string;
  to_email: string;
  to_name?: string | null;
  subject: string;
  body_html: string;
  body_text?: string | null;
  status: string;
  attempts: number;
  max_attempts: number;
  last_error?: string | null;
  sent_at?: string | null;
  created_at: string;
}

export default function AdminEmailOutboxPage() {
  const [entries, setEntries] = useState<EmailOutboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected entry for payload detail modal
  const [selectedEntry, setSelectedEntry] = useState<EmailOutboxItem | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const fetchOutbox = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      params.append("per_page", "50");

      const res = await fetch(`/api/proxy/admin/email-outbox?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setEntries(json.data.data || []);
      }
    } catch {
      toast.error("Failed to load email outbox");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOutbox();
  }, [fetchOutbox]);

  const handleRetry = async (id: number) => {
    setRetryingId(id);
    try {
      const res = await fetch(`/api/proxy/admin/email-outbox/${id}/retry`, {
        method: "POST",
      });

      const json = await res.json();
      if (res.ok) {
        toast.success("Email queued for immediate retry by worker!");
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, status: "pending", attempts: 0, last_error: null } : e
          )
        );
        if (selectedEntry?.id === id) {
          setSelectedEntry((prev) =>
            prev ? { ...prev, status: "pending", attempts: 0, last_error: null } : null
          );
        }
      } else {
        toast.error(json.message || "Failed to trigger retry");
      }
    } catch {
      toast.error("Network error while retrying email");
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Sent
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
            <Clock className="w-3 h-3 text-amber-700 animate-spin" />
            Pending
          </span>
        );
      case "retrying":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            Retrying
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800">
            {status}
          </span>
        );
    }
  };

  return (
    <DashboardLayout role="admin" title="Email Outbox">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900">
              Email Outbox Monitor
            </h1>
            <p className="text-sm text-ink-700">
              Real-time audit log of automated transactional emails dispatched through the PayTrizz background worker.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchOutbox}
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
              placeholder="Search by recipient, subject, or template..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {["all", "sent", "pending", "failed", "retrying"].map((s) => (
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
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Template</th>
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Attempts</th>
                  <th className="py-3.5 px-4">Dispatched At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-ink-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                      Loading outbox queue...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-ink-500">
                      No email records found.
                    </td>
                  </tr>
                ) : (
                  entries.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-ink-500">#{item.id}</td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-bold bg-neutral-100 text-ink-800 px-2 py-0.5 rounded border border-neutral-200">
                          {item.template_key}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-ink-900">{item.to_email}</div>
                        {item.to_name && (
                          <div className="text-xs text-ink-500">{item.to_name}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-medium text-ink-900 truncate">{item.subject}</div>
                        {item.last_error && (
                          <div className="text-xs text-rose-600 truncate flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{item.last_error}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-4 px-4 font-mono text-xs text-ink-700">
                        {item.attempts} / {item.max_attempts}
                      </td>
                      <td className="py-4 px-4 text-xs text-ink-500 whitespace-nowrap">
                        {item.sent_at
                          ? new Date(item.sent_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : new Date(item.created_at).toLocaleString([], {
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
                            onClick={() => setSelectedEntry(item)}
                            className="p-1.5 rounded-lg text-ink-600 hover:text-ink-900 hover:bg-neutral-100 transition-colors"
                            title="View Payload"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.status === "failed" && (
                            <button
                              type="button"
                              disabled={retryingId === item.id}
                              onClick={() => handleRetry(item.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-500 text-ink-900 hover:bg-brand-600 transition-colors"
                              title="Retry Email"
                            >
                              <RotateCcw
                                className={cn("w-3 h-3", retryingId === item.id && "animate-spin")}
                              />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payload Detail Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-ink-500">
                      Outbox #{selectedEntry.id}
                    </span>
                    {getStatusBadge(selectedEntry.status)}
                  </div>
                  <h3 className="text-xl font-bold text-ink-900">{selectedEntry.subject}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Delivery Metadata */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ink-400 font-bold uppercase tracking-wider block">Recipient</span>
                  <span className="text-ink-900 font-bold text-sm block mt-0.5">{selectedEntry.to_email}</span>
                  {selectedEntry.to_name && <span className="text-ink-600 block">{selectedEntry.to_name}</span>}
                </div>
                <div>
                  <span className="text-ink-400 font-bold uppercase tracking-wider block">Delivery Details</span>
                  <span className="text-ink-900 font-mono block mt-0.5">Template: {selectedEntry.template_key}</span>
                  <span className="text-ink-600 block">
                    Attempts: {selectedEntry.attempts} / {selectedEntry.max_attempts}
                  </span>
                  <span className="text-ink-500 block">
                    Queued: {new Date(selectedEntry.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Error Note if any */}
              {selectedEntry.last_error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Last Delivery Error:</span>
                  </div>
                  <p className="text-xs text-rose-700 font-mono">{selectedEntry.last_error}</p>
                </div>
              )}

              {/* Rendered HTML Preview */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                  Rendered Email Content Preview
                </span>
                <div className="border border-neutral-200 rounded-2xl p-6 bg-neutral-100">
                  <div
                    className="bg-white rounded-xl p-5 shadow-sm text-sm prose prose-neutral max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedEntry.body_html }}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <div className="text-xs text-ink-400">
                  Worker retries failed dispatches automatically with exponential backoff.
                </div>
                {selectedEntry.status === "failed" && (
                  <button
                    type="button"
                    disabled={retryingId === selectedEntry.id}
                    onClick={() => handleRetry(selectedEntry.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-500 text-ink-900 font-bold text-xs hover:bg-brand-600 transition-colors shadow-sm"
                  >
                    <RotateCcw className={cn("w-3.5 h-3.5", retryingId === selectedEntry.id && "animate-spin")} />
                    <span>Retry Immediately</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
