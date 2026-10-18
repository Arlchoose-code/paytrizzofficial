"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  Mail,
  FileText,
  CheckCircle2,
  User,
  ArrowRight,
  RefreshCw,
  Clock,
  Circle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

interface StatusCount {
  status: string;
  count: number;
}

interface TalentDashboardData {
  profile: {
    id: number;
    name: string;
    slug: string;
    headline: string;
    availability: string;
    is_published: boolean;
    is_featured: boolean;
    completion_percent: number;
    completion_completed: number;
    completion_total: number;
    checklist: ChecklistItem[];
  };
  messages: { total: number; new: number };
  posts: StatusCount[];
  projects: StatusCount[];
  pending_revisions: number;
}

interface InquiryItem {
  id: number;
  name: string;
  email: string;
  subject: string;
  status: string;
  created_at: string;
}

function statusOf(list: StatusCount[], status: string) {
  return list.find((s) => s.status === status)?.count ?? 0;
}

function StatusPills({ label, counts }: { label: string; counts: StatusCount[] }) {
  const statuses = [
    { key: "draft", label: "Draft", color: "bg-ink-100 text-ink-700" },
    { key: "pending", label: "Pending", color: "bg-brand-100 text-ink-900" },
    { key: "published", label: "Published", color: "bg-emerald-50 text-emerald-700 border border-emerald-100" },
    { key: "rejected", label: "Rejected", color: "bg-red-50 text-danger border border-red-100" },
  ];
  const total = counts.reduce((acc, c) => acc + c.count, 0);
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAFAFA] border border-ink-100">
      <div>
        <p className="text-xs font-bold text-ink-900">{label}</p>
        <p className="text-[11px] text-ink-500">{total} item(s) total</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 justify-end">
        {statuses.map((s) => {
          const count = statusOf(counts, s.key);
          if (count === 0) return null;
          return (
            <span key={s.key} className={cn("px-2 py-0.5 rounded-full text-[10px] font-extrabold", s.color)}>
              {count} {s.label}
            </span>
          );
        })}
        {total === 0 && <span className="text-[11px] text-ink-400">Nothing yet</span>}
      </div>
    </div>
  );
}

export default function TalentDashboardPage() {
  const [data, setData] = useState<TalentDashboardData | null>(null);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [unreadMail, setUnreadMail] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    else setLoading(true);
    try {
      const [dashRes, msgRes, mailRes] = await Promise.all([
        fetch("/api/proxy/talent/dashboard").then((r) => r.json()).catch(() => null),
        fetch("/api/proxy/talent/messages?per_page=5").then((r) => r.json()).catch(() => null),
        fetch("/api/proxy/mail/counts").then((r) => r.json()).catch(() => null),
      ]);

      if (dashRes?.success) setData(dashRes.data);

      if (msgRes?.success) {
        const list = Array.isArray(msgRes.data?.data) ? msgRes.data.data : Array.isArray(msgRes.data) ? msgRes.data : [];
        setInquiries(list.slice(0, 4));
      }

      if (mailRes?.success && mailRes.data?.inbox !== undefined) {
        setUnreadMail(mailRes.data.inbox);
      }

      if (isSilent) toast.success("Dashboard refreshed");
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const profile = data?.profile;
  const percentage = profile?.completion_percent ?? 0;
  const pendingPosts = statusOf(data?.posts ?? [], "pending");
  const publishedPosts = statusOf(data?.posts ?? [], "published");

  return (
    <DashboardLayout role="talent" title="Overview">
      <div className="space-y-7">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                  profile?.is_published ? "bg-emerald-100 text-emerald-800" : "bg-ink-100 text-ink-600"
                )}
              >
                {profile?.is_published ? "Published on directory" : "Hidden from directory"}
              </span>
              <span className="text-xs text-ink-500 font-semibold">
                Availability:{" "}
                <span className="capitalize font-bold text-ink-900">{profile?.availability || "—"}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
              Hi, {profile?.name?.split(" ")[0] || "Specialist"} 👋
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              Keep your profile sharp, respond to clients, and grow your portfolio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-ink-200 bg-white hover:bg-neutral-50 text-ink-800 font-bold text-sm transition shadow-sm disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-brand-600")} />
              <span>Refresh</span>
            </button>
            <Link
              href="/talent/profile"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition shadow-sm"
            >
              <User className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Profile strength */}
          <div className="bg-white p-6 rounded-3xl border border-ink-100 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Profile Strength</span>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-ink-900">{loading ? "..." : `${percentage}%`}</span>
              <div className="w-full h-2 bg-ink-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-ink-500 mt-3">
              {percentage === 100
                ? "Profile fully complete — great job!"
                : `${profile?.completion_completed ?? 0} of ${profile?.completion_total ?? 0} items complete`}
            </p>
          </div>

          {/* New messages */}
          <Link
            href="/talent/messages"
            className="bg-white p-6 rounded-3xl border border-ink-100 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Client Messages</span>
              <Mail className="w-5 h-5 text-ink-300 group-hover:text-brand-600 transition" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-ink-900">{loading ? "..." : data?.messages.new ?? 0}</span>
              <p className="text-sm font-semibold text-ink-700 mt-1">
                {(data?.messages.new ?? 0) === 1 ? "New Message" : "New Messages"}
              </p>
            </div>
            <p className="text-xs text-brand-600 font-bold mt-3">{data?.messages.total ?? 0} total →</p>
          </Link>

          {/* Unread email */}
          <Link
            href="/webmail?from=talent"
            className="bg-white p-6 rounded-3xl border border-ink-100 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Webmail</span>
              <Mail className="w-5 h-5 text-ink-300 group-hover:text-brand-600 transition" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-ink-900">{loading ? "..." : unreadMail}</span>
              <p className="text-sm font-semibold text-ink-700 mt-1">Unread Inbox</p>
            </div>
            <p className="text-xs text-ink-500 mt-3">@paytrizz.com mailbox →</p>
          </Link>

          {/* Posts */}
          <Link
            href="/talent/blog"
            className="bg-white p-6 rounded-3xl border border-ink-100 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">My Blog</span>
              <FileText className="w-5 h-5 text-ink-300 group-hover:text-brand-600 transition" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-ink-900">{loading ? "..." : pendingPosts + publishedPosts}</span>
              <p className="text-sm font-semibold text-ink-700 mt-1">
                {pendingPosts > 0 ? `${pendingPosts} pending review` : "Articles"}
              </p>
            </div>
            <p className="text-xs text-brand-600 font-bold mt-3">Manage articles →</p>
          </Link>
        </div>

        {/* Checklist + content status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checklist */}
          <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-ink-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink-900">Profile Completion Checklist</h2>
                <p className="text-xs text-ink-500">
                  Complete items to rank higher on the public talent directory
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-brand-100 text-ink-900 rounded-full">
                {profile?.completion_completed ?? 0}/{profile?.completion_total ?? 0}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {(profile?.checklist ?? []).map((item) => (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-xs",
                    item.done ? "bg-emerald-50/40 border-emerald-100" : "bg-[#FAFAFA] border-ink-100"
                  )}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-ink-300 flex-shrink-0" />
                    )}
                    <span className={cn("truncate", item.done ? "text-ink-600" : "text-ink-900 font-bold")}>
                      {item.label}
                    </span>
                  </span>
                  {!item.done && (
                    <Link href={item.href} className="text-[11px] font-bold text-brand-600 hover:underline flex-shrink-0">
                      Complete →
                    </Link>
                  )}
                </div>
              ))}
              {loading && <div className="col-span-2 py-6 text-center text-xs text-ink-400">Loading checklist...</div>}
            </div>
          </div>

          {/* Content status + pending revisions */}
          <div className="space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-ink-100 shadow-sm space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500">My Content Status</h3>
              <StatusPills label="Blog articles" counts={data?.posts ?? []} />
              <StatusPills label="Projects & cases" counts={data?.projects ?? []} />
              {(data?.pending_revisions ?? 0) > 0 && (
                <Link
                  href="/talent/revisions"
                  className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-brand-50 border border-brand-100 hover:border-brand-300 transition"
                >
                  <Clock className="w-4 h-4 text-ink-900 flex-shrink-0" />
                  <span className="text-xs font-bold text-ink-900">
                    {data?.pending_revisions} revision(s) awaiting admin review
                  </span>
                </Link>
              )}
            </div>

            <div className="bg-brand-50 p-6 rounded-3xl border border-brand-100 space-y-4">
              <div>
                <span className="text-[11px] font-extrabold text-brand-600 uppercase tracking-wider">
                  Writer&apos;s Desk
                </span>
                <h3 className="text-lg font-extrabold text-ink-900 mt-1.5">Share your expertise</h3>
                <p className="text-xs text-ink-700 mt-1.5 leading-relaxed">
                  Articles you submit are reviewed by the PayTrizz team, then published under your name.
                </p>
              </div>
              <Link
                href="/talent/blog"
                className="w-full h-10 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                Write an Article
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent inquiries */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-ink-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink-900">Recent Client Messages</h2>
              <p className="text-xs text-ink-500">Inquiries sent directly to your public profile</p>
            </div>
            <Link href="/talent/messages" className="text-xs font-bold text-brand-600 hover:underline">
              View all ({data?.messages.total ?? 0})
            </Link>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-ink-400">Loading messages...</div>
          ) : inquiries.length > 0 ? (
            <div className="space-y-3">
              {inquiries.map((msg) => (
                <Link
                  key={msg.id}
                  href="/talent/messages"
                  className="p-4 rounded-2xl bg-neutral-50 border border-ink-100 hover:border-brand-400 transition flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink-900">{msg.name}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase",
                          msg.status === "new" ? "bg-brand-500 text-ink-900" : "bg-neutral-200 text-ink-700"
                        )}
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-600 truncate">{msg.subject}</p>
                  </div>
                  <span className="text-[11px] text-ink-400 flex-shrink-0">
                    {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ""}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-ink-500">
              No messages yet. Keep your profile updated to attract clients!
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
