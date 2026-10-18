"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Mail,
  FileText,
  Users,
  Briefcase,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Inbox,
  CheckCircle2,
  FileCheck,
  Activity,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DashboardData {
  new_messages: number;
  total_messages: number;
  new_applications: number;
  pending_approvals: number;
  active_talents: number;
  total_talents: number;
  emails_last_24h: { sent: number; received: number; bounced: number };
  recent_activity: {
    id: number;
    actor_name: string;
    module: string;
    action: string;
    summary: string;
    created_at: string;
  }[];
  pending_items: {
    type: string;
    id: number;
    title: string;
    author_name: string;
    created_at: string;
  }[];
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/proxy/admin/dashboard");
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
        if (isSilent) toast.success("Dashboard refreshed");
      } else {
        throw new Error(json.message || "Failed to load dashboard");
      }
    } catch {
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const stats = [
    {
      label: "New Messages",
      value: data?.new_messages ?? 0,
      sub: `${data?.total_messages ?? 0} total inquiries`,
      icon: Inbox,
      href: "/admin/messages",
      highlight: (data?.new_messages ?? 0) > 0,
    },
    {
      label: "New Applications",
      value: data?.new_applications ?? 0,
      sub: "Freelance & project requests",
      icon: Users,
      href: "/admin/applications",
      highlight: (data?.new_applications ?? 0) > 0,
    },
    {
      label: "Pending Approvals",
      value: data?.pending_approvals ?? 0,
      sub: "Posts, projects & revisions",
      icon: FileCheck,
      href: "/admin/approvals",
      highlight: (data?.pending_approvals ?? 0) > 0,
    },
    {
      label: "Active Talents",
      value: data?.active_talents ?? 0,
      sub: `${data?.total_talents ?? 0} total on roster`,
      icon: Users,
      href: "/admin/talents",
      highlight: false,
    },
  ];

  const emails = data?.emails_last_24h ?? { sent: 0, received: 0, bounced: 0 };
  const emailMax = Math.max(emails.sent, emails.received, 1);

  return (
    <DashboardLayout role="admin" title="Overview">
      <div className="space-y-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Agency operations at a glance — inquiries, approvals, and the mail pipeline.
            </p>
          </div>
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-ink-200 bg-white hover:bg-neutral-50 text-ink-800 font-bold text-sm transition shadow-sm disabled:opacity-60 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-brand-600")} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Row 1: 4 stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                href={s.href}
                className="bg-white p-6 rounded-3xl border border-ink-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition",
                      s.highlight
                        ? "bg-brand-500 text-ink-900"
                        : "bg-brand-50 text-ink-900 group-hover:bg-brand-500"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-ink-300 group-hover:text-ink-900 transition" />
                </div>
                <div className="mt-5">
                  <span className="text-3xl font-extrabold text-ink-900 tracking-tight">
                    {loading ? "..." : s.value}
                  </span>
                  <p className="text-sm font-semibold text-ink-700 mt-0.5">{s.label}</p>
                  <p className="text-xs text-ink-500 mt-1">{s.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Row 2: Email 24h chart + Quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Emails last 24h */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-ink-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink-900">Email Pipeline · Last 24h</h2>
                <p className="text-xs text-ink-500">Webmail delivery & inbound traffic (AWS SES)</p>
              </div>
              <Link
                href="/admin/mail-logs"
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                Mail logs <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Sent", value: emails.sent, color: "bg-brand-500", icon: Mail },
                { label: "Received", value: emails.received, color: "bg-ink-900", icon: Inbox },
                { label: "Bounced", value: emails.bounced, color: "bg-danger", icon: AlertTriangle },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="p-4 rounded-2xl bg-ink-50/60 border border-ink-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                        {item.label}
                      </span>
                      <Icon className={cn("w-4 h-4", item.label === "Bounced" ? "text-danger" : "text-ink-500")} />
                    </div>
                    <p className="text-2xl font-extrabold text-ink-900">{loading ? "..." : item.value}</p>
                    <div className="w-full h-1.5 bg-ink-100 rounded-full mt-3 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", item.color)}
                        style={{ width: `${Math.min(100, (item.value / emailMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-ink-900 p-6 sm:p-7 rounded-3xl shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Quick Actions</h2>
              <p className="text-xs text-white/60">Jump straight into common tasks</p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Add New Talent", href: "/admin/talents", icon: Users },
                { label: "Write a Blog Post", href: "/admin/posts", icon: FileText },
                { label: "Create a Project", href: "/admin/projects", icon: Briefcase },
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 hover:bg-brand-500 text-white hover:text-ink-900 transition group"
                  >
                    <span className="w-8 h-8 rounded-xl bg-white/15 group-hover:bg-ink-900/10 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-bold flex-1">{a.label}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-60" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3: Recent activity + Pending approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending approvals */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-ink-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink-900">Pending Approvals</h2>
                <p className="text-xs text-ink-500">
                  {(data?.pending_approvals ?? 0) > 0
                    ? `${data?.pending_approvals} item(s) waiting for review`
                    : "Nothing waiting — all caught up"}
                </p>
              </div>
              <Link
                href="/admin/approvals"
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                Review all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-ink-400">Loading queue...</div>
            ) : (data?.pending_items?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {data!.pending_items.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href="/admin/approvals"
                    className="p-4 rounded-2xl bg-neutral-50 border border-ink-100 hover:border-brand-400 transition flex items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex-shrink-0",
                          item.type === "post"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : item.type === "project"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-brand-100 text-ink-900"
                        )}
                      >
                        {item.type}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink-900 truncate">{item.title}</p>
                        <p className="text-[11px] text-ink-500">
                          by {item.author_name || "Unknown"} · {timeAgo(item.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-brand-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                      Review →
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs text-ink-500">No content waiting for approval.</p>
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-ink-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink-900">Recent Activity</h2>
                <p className="text-xs text-ink-500">Latest changes across the platform</p>
              </div>
              <Link
                href="/admin/audit-logs"
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                Audit logs <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-ink-400">Loading activity...</div>
            ) : (data?.recent_activity?.length ?? 0) > 0 ? (
              <div className="space-y-1">
                {data!.recent_activity.map((a, idx) => (
                  <div key={a.id} className="flex gap-3.5">
                    {/* timeline */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center",
                          a.action.includes("delete") || a.action.includes("reject")
                            ? "bg-red-50 text-danger"
                            : a.action.includes("create") || a.action.includes("approve")
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-brand-50 text-ink-900"
                        )}
                      >
                        <Activity className="w-3.5 h-3.5" />
                      </span>
                      {idx < data!.recent_activity.length - 1 && (
                        <span className="w-px flex-1 bg-ink-100 my-1" />
                      )}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-xs text-ink-900 leading-snug">
                        <span className="font-bold">{a.actor_name}</span>{" "}
                        <span className="text-ink-600">{a.summary || `${a.action} on ${a.module}`}</span>
                      </p>
                      <p className="text-[10px] text-ink-400 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {timeAgo(a.created_at)}
                        <span className="px-1.5 py-px rounded bg-ink-50 font-mono">{a.module}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-ink-500">No activity recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
