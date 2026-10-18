"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Search,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MailLogItem {
  id: number;
  event: string;
  actor_user_id?: number;
  actor_user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  mailbox_id?: number;
  mailbox_address?: string;
  recipient?: string;
  subject?: string;
  ip?: string;
  user_agent?: string;
  meta?: string;
  created_at: string;
}

const EVENT_FILTERS = [
  { key: "", label: "All Events" },
  { key: "admin_viewed", label: "Admin Inspections" },
  { key: "sent", label: "Sent Emails" },
  { key: "received", label: "Inbound SES" },
  { key: "mailbox_created", label: "Mailbox Created" },
  { key: "bounced", label: "Bounces" },
];

export default function MailLogsPage() {
  const [logs, setLogs] = useState<MailLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: "25" });
      if (selectedEvent) params.append("event", selectedEvent);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/proxy/admin/mail-logs?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setLogs(json.data.data || []);
        setTotal(json.data.total || 0);
      } else {
        toast.error("Failed to fetch mail logs");
      }
    } catch {
      toast.error("Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  }, [page, selectedEvent, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    window.open("/api/proxy/admin/mail-logs/export", "_blank");
    toast.success("CSV export initiated");
  };

  const getEventBadgeClass = (event: string) => {
    switch (event) {
      case "admin_viewed":
        return "bg-amber-100 text-amber-900 border-amber-300 font-bold";
      case "sent":
        return "bg-blue-100 text-blue-900 border-blue-200 font-medium";
      case "received":
        return "bg-emerald-100 text-emerald-900 border-emerald-200 font-medium";
      case "bounced":
      case "complained":
        return "bg-red-100 text-red-900 border-red-200 font-bold";
      case "mailbox_created":
        return "bg-purple-100 text-purple-900 border-purple-200 font-medium";
      default:
        return "bg-ink-100 text-ink-800 border-ink-200";
    }
  };

  return (
    <DashboardLayout role="admin" title="Mail Audit Logs | PayTrizz">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Immutable Ledger
              </span>
              <span className="text-[11px] font-semibold text-ink-500">Security & Forensics</span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">Mail Audit Trail</h1>
            <p className="text-xs text-ink-500">
              Complete append-only audit trail for email transmissions, SES webhooks, and administrative inspections.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-white border border-ink-200 text-ink-800 hover:bg-ink-50 shadow-sm transition-all self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-ink-100 p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {EVENT_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setSelectedEvent(f.key);
                    setPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs transition-colors",
                    selectedEvent === f.key
                      ? "bg-brand-500 text-ink-900 font-bold"
                      : "bg-ink-50 text-ink-600 hover:bg-ink-100 font-medium"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search IP, mailbox, or meta..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-ink-50 border border-ink-100 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-[#FAFAFA] text-[11px] font-bold text-ink-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Event</th>
                  <th className="py-3.5 px-6">Mailbox</th>
                  <th className="py-3.5 px-6">Actor / User</th>
                  <th className="py-3.5 px-6">Client IP / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-ink-400">
                      Loading audit entries...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-ink-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-ink-50/70 transition-colors">
                      <td className="py-4 px-6 font-mono text-[11px] text-ink-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={cn(
                            "inline-block px-2.5 py-1 rounded-full text-[10px] border uppercase tracking-wider",
                            getEventBadgeClass(log.event)
                          )}
                        >
                          {log.event.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-medium text-ink-900">
                        {log.mailbox_address || "-"}
                      </td>
                      <td className="py-4 px-6">
                        {log.actor_user ? (
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center text-[10px] font-bold">
                              {log.actor_user.name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <p className="font-bold text-ink-900 leading-tight">{log.actor_user.name}</p>
                              <p className="text-[10px] text-ink-400">{log.actor_user.role}</p>
                            </div>
                          </div>
                        ) : log.actor_user_id ? (
                          <span className="text-ink-600">User #{log.actor_user_id}</span>
                        ) : (
                          <span className="text-ink-400 italic">System Automation</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-ink-600 max-w-xs">
                        <div className="font-mono text-[11px] text-ink-800">{log.ip || "127.0.0.1"}</div>
                        {log.meta && (
                          <div className="text-[10px] text-ink-400 font-mono truncate max-w-sm mt-0.5">
                            {log.meta}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer pagination info */}
          <div className="p-4 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500 bg-[#FAFAFA]">
            <div>
              Total Audit Entries: <span className="font-bold text-ink-900">{total}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-ink-200 bg-white text-ink-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-bold text-ink-900 px-1">Page {page}</span>
              <button
                disabled={logs.length < 25}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-ink-200 bg-white text-ink-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
