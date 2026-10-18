"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { toast } from "sonner";
import { RefreshCw, Search, ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLogItem {
  id: number;
  actor_user_id?: number | null;
  actor_name?: string;
  module: string;
  action: string;
  target_type: string;
  target_id?: number | null;
  summary: string;
  ip: string;
  created_at: string;
}

const MODULES = ["", "auth", "user", "talents", "posts", "projects", "pages", "services", "faqs", "menus", "settings", "media", "messages", "applications", "revisions", "badges", "specialties", "skills", "tags", "mail_settings", "mailboxes"];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "25" });
      if (moduleFilter) params.append("module", moduleFilter);
      if (search.trim()) params.append("search", search.trim());
      const res = await fetch(`/api/proxy/admin/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setLogs(json.data?.data || []);
        setLastPage(json.data?.last_page || 1);
        setTotal(json.data?.total || 0);
      }
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionColor = (action: string) => {
    if (action.includes("delete") || action.includes("reject")) return "bg-red-50 text-danger border border-red-100";
    if (action.includes("create") || action.includes("approve")) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (action.includes("update") || action.includes("reset")) return "bg-brand-50 text-ink-900 border border-brand-100";
    return "bg-ink-50 text-ink-600 border border-ink-100";
  };

  return (
    <DashboardLayout role="admin" title="Audit Logs">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-ink-900 text-white">
              Append-only
            </span>
            <span className="text-[11px] font-semibold text-ink-500">{total} recorded events</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Audit Logs</h1>
          <p className="text-sm text-ink-500 mt-1">
            Every create, update, and delete across the platform — who did what, when, and from where.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search summary or actor..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-ink-50 border border-ink-100 rounded-xl text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-ink-200 text-xs font-bold bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
            >
              <option value="">All modules</option>
              {MODULES.filter(Boolean).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button
              onClick={fetchLogs}
              className="p-2.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-100 text-ink-700 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-ink-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-500" />
              Loading audit trail...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center">
              <ScrollText className="w-10 h-10 text-ink-300 mx-auto mb-3" />
              <p className="font-bold text-ink-700 text-sm">No audit events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50/60 border-b border-ink-100 text-[11px] font-bold text-ink-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Time</th>
                    <th className="py-3 px-5">Actor</th>
                    <th className="py-3 px-5">Module</th>
                    <th className="py-3 px-5">Action</th>
                    <th className="py-3 px-5">Summary</th>
                    <th className="py-3 px-5">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-ink-50/40 transition">
                      <td className="py-3.5 px-5 text-[11px] text-ink-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="text-xs font-bold text-ink-900">
                          {log.actor_name || (log.actor_user_id ? `User #${log.actor_user_id}` : "System")}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-mono text-[11px] text-ink-600">{log.module}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                            actionColor(log.action)
                          )}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-ink-700 max-w-md truncate" title={log.summary}>
                        {log.summary}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[11px] text-ink-500">{log.ip || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-ink-100">
              <span className="text-xs text-ink-500">
                Page {page} of {lastPage}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg border border-ink-200 text-ink-700 hover:bg-ink-100 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  className="p-2 rounded-lg border border-ink-200 text-ink-700 hover:bg-ink-100 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
