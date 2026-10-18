"use client";

import Link from "next/link";
import {
  RefreshCw,
  Star,
  ExternalLink,
  Pencil,
  KeyRound,
  Inbox,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TalentItem } from "@/components/admin/TalentFormModal";

interface TalentsDirectoryTableProps {
  loading: boolean;
  talents: TalentItem[];
  togglePublished: (t: TalentItem) => void;
  openEdit: (t: TalentItem) => void;
  setResetTarget: (t: TalentItem) => void;
  setDeleteTarget: (t: TalentItem) => void;
  page: number;
  lastPage: number;
  total: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

export function TalentsDirectoryTable({
  loading,
  talents,
  togglePublished,
  openEdit,
  setResetTarget,
  setDeleteTarget,
  page,
  lastPage,
  total,
  setPage,
}: TalentsDirectoryTableProps) {
  const statusOf = (t: TalentItem) => {
    if (t.user_is_active === false) return { label: "Inactive", cls: "bg-red-50 text-danger" };
    if (t.is_published) return { label: "Published", cls: "bg-emerald-100 text-emerald-800" };
    return { label: "Hidden", cls: "bg-ink-100 text-ink-600" };
  };

  return (
    <div className="bg-white rounded-3xl border border-ink-100 shadow-sm overflow-hidden">
      {loading ? (
        <div className="p-12 text-center text-ink-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
          Loading specialists...
        </div>
      ) : talents.length === 0 ? (
        <div className="p-16 text-center">
          <p className="font-bold text-ink-700">No talents found</p>
          <p className="text-xs text-ink-400 mt-1">Onboard a new specialist using the button above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50/60 border-b border-ink-100 text-[11px] font-bold text-ink-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Talent</th>
                <th className="py-3.5 px-5">Badges</th>
                <th className="py-3.5 px-5">Specialist</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Last Login</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {talents.map((t) => {
                const st = statusOf(t);
                const avatar =
                  t.avatar_media?.path_thumb ||
                  t.avatar_media?.path_medium ||
                  t.avatar_media?.path_original;
                return (
                  <tr key={t.id} className="hover:bg-ink-50/40 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        {avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatar}
                            alt={t.name}
                            className="w-10 h-10 rounded-full object-cover border border-ink-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-brand-100 text-ink-900 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-ink-900 text-xs truncate">{t.name}</span>
                            {t.is_featured && <Star className="w-3 h-3 text-brand-600 fill-brand-500" />}
                          </div>
                          <p className="text-[11px] text-ink-500 truncate max-w-52">
                            {t.headline || `/${t.slug}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-wrap gap-1 max-w-40">
                        {(t.badges || []).length > 0 ? (
                          (t.badges || []).map((b) => (
                            <span
                              key={b.id}
                              className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-ink-900 border border-ink-100"
                              style={{ backgroundColor: `${b.color}33` }}
                            >
                              {b.label}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-ink-300">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex flex-wrap gap-1 max-w-40">
                        {(t.specialties || []).length > 0 ? (
                          (t.specialties || []).map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-ink-900"
                            >
                              {s.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-ink-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => togglePublished(t)}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase transition cursor-pointer",
                          st.cls
                        )}
                        title="Click to toggle visibility"
                      >
                        {st.label}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-[11px] text-ink-500 whitespace-nowrap">
                      {t.user_last_login_at ? new Date(t.user_last_login_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/talents/${t.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"
                          title="View public profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openEdit(t)}
                          title="Edit talent"
                          className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setResetTarget(t)}
                          title="Reset password"
                          className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <Link
                          href="/admin/mail-monitor"
                          title="View mailboxes"
                          className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition"
                        >
                          <Inbox className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          title="Delete talent"
                          className="p-1.5 rounded-lg text-ink-400 hover:text-danger hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-ink-100">
          <span className="text-xs text-ink-500">
            Page {page} of {lastPage} · {total} talents
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
  );
}
