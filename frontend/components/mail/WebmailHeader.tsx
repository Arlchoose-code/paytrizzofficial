"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Search, X, PenSquare, Menu } from "lucide-react";
import { MailboxItem } from "./MailSidebar";
import { getMainAppUrl } from "@/lib/subdomain";

interface WebmailHeaderProps {
  mailboxes: MailboxItem[];
  selectedMailboxId: number | null;
  setSelectedMailboxId: (id: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenCompose: () => void;
  scope?: "company" | "talent";
  onOpenMobileFolders?: () => void;
}

export function WebmailHeader({
  mailboxes,
  selectedMailboxId,
  setSelectedMailboxId,
  searchQuery,
  setSearchQuery,
  onOpenCompose,
  scope = "talent",
  onOpenMobileFolders,
}: WebmailHeaderProps) {
  const workspaceHref = getMainAppUrl(scope === "company" ? "/admin" : "/talent");

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-2 sm:gap-4">
        {onOpenMobileFolders && (
          <button
            type="button"
            onClick={onOpenMobileFolders}
            className="lg:hidden p-1.5 text-ink-700 hover:text-ink-900 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
            title="Open Mailboxes & Folders"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <Link
          href={workspaceHref}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold text-ink-600 hover:text-ink-900 hover:bg-neutral-100 transition-colors"
          title="Back to Workspace"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Workspace</span>
        </Link>
        <div className="h-4 w-px bg-neutral-200" />
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500 text-ink-900 flex items-center justify-center font-black shadow-xs">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-ink-900 tracking-tight">PayTrizz</span>
              <span className="px-1.5 py-0.2 rounded-md bg-brand-100 text-brand-900 text-[10px] font-bold">Webmail</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">webmail.paytrizz.com</span>
          </div>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="flex-1 max-w-2xl hidden md:flex items-center">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search mail (e.g. has:attachment, from:alex, subject:advisory)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-neutral-100 hover:bg-neutral-100/80 focus:bg-white border border-transparent focus:border-brand-500 rounded-full text-xs text-ink-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {mailboxes.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-semibold text-ink-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <select
              value={selectedMailboxId || ""}
              onChange={(e) => setSelectedMailboxId(Number(e.target.value))}
              className="bg-transparent outline-none cursor-pointer text-xs font-bold text-ink-900 max-w-[140px] sm:max-w-[200px] truncate"
            >
              {mailboxes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.address}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenCompose}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-ink-900 font-bold rounded-full text-xs shadow-xs transition-all cursor-pointer"
        >
          <PenSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compose</span>
        </button>
      </div>
    </header>
  );
}
