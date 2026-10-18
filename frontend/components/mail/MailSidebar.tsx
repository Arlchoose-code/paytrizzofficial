"use client";

import {
  Inbox,
  Star,
  Clock,
  Send,
  FileText,
  Calendar,
  Archive,
  AlertOctagon,
  Trash2,
  Plus,
  Mail,
  ChevronDown,
  Settings as SettingsIcon,
  Tag,
  BellOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface MailLabel {
  id: number;
  name: string;
  color: string;
  message_count?: number;
}

export interface MailboxItem {
  id: number;
  address: string;
  display_name: string;
  color: string;
  unread_count?: number;
  is_default?: boolean;
}

export interface FolderCounts {
  inbox: number;
  starred: number;
  snoozed: number;
  sent: number;
  drafts: number;
  scheduled: number;
  all_mail: number;
  spam: number;
  trash: number;
}

export const FOLDERS = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "starred", label: "Starred", icon: Star },
  { key: "snoozed", label: "Snoozed", icon: Clock },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileText },
  { key: "scheduled", label: "Scheduled", icon: Calendar },
  { key: "all", label: "All Mail", icon: Archive },
  { key: "spam", label: "Spam", icon: AlertOctagon },
  { key: "trash", label: "Trash", icon: Trash2 },
];

interface MailSidebarProps {
  scope: "company" | "talent";
  readOnly: boolean;
  mailboxes: MailboxItem[];
  selectedMailboxId: number | null;
  onSelectMailbox: (id: number | null) => void;
  activeFolder: string;
  onSelectFolder: (folder: string) => void;
  folderCounts: FolderCounts;
  labels?: MailLabel[];
  activeLabelId?: number | null;
  onSelectLabel?: (id: number | null) => void;
  onOpenCompose: () => void;
  onOpenAddMailbox: () => void;
  onManageMailboxes: () => void;
  onOpenManageLabels?: () => void;
  onOpenManageSubscriptions?: () => void;
}

export function MailSidebar({
  scope,
  readOnly,
  mailboxes,
  selectedMailboxId,
  onSelectMailbox,
  activeFolder,
  onSelectFolder,
  folderCounts,
  labels = [],
  activeLabelId,
  onSelectLabel,
  onOpenCompose,
  onOpenAddMailbox,
  onManageMailboxes,
  onOpenManageLabels,
  onOpenManageSubscriptions,
}: MailSidebarProps) {
  return (
    <div className="w-[240px] flex-shrink-0 border-r border-ink-100 bg-[#FAFAFA] flex flex-col p-4 space-y-4">
      {/* Mailbox Switcher */}
      {!readOnly && (
        <div className="relative">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">
            Active Inbox
          </label>
          <div className="relative">
            <select
              value={selectedMailboxId || ""}
              onChange={(e) => onSelectMailbox(e.target.value ? Number(e.target.value) : null)}
              className="w-full text-xs font-semibold bg-white border border-ink-200 rounded-xl px-3 py-2 pr-8 text-ink-900 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">
                {scope === "company" ? "All Company Inboxes" : "All My Inboxes"}
              </option>
              {mailboxes.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.address} ({box.display_name})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-ink-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Action Button: Compose or Add Mailbox */}
      {!readOnly && (
        <div className="space-y-2">
          <button
            onClick={onOpenCompose}
            className="w-full py-2.5 px-4 rounded-full font-bold text-xs bg-brand-500 hover:bg-brand-400 text-ink-900 shadow-sm transition-all flex items-center justify-center gap-2 group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Compose Mail</span>
          </button>

          {/* Sidebar actions are only valid for a mailbox manager: talents own
              their addresses, admins own the company ones (PRD 4.10). */}
          <button
            onClick={onOpenAddMailbox}
            className="w-full py-2 px-3 rounded-full text-xs font-semibold text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{scope === "company" ? "+ Add Company Box" : "+ Add Box"}</span>
          </button>

          <button
            onClick={onManageMailboxes}
            className="w-full py-2 px-3 rounded-full text-xs font-semibold text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Manage Mailboxes</span>
          </button>
        </div>
      )}

      {/* Folder Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto pr-1">
        {FOLDERS.map((folder) => {
          const Icon = folder.icon;
          const isActive = !activeLabelId && activeFolder === folder.key;
          const count = folderCounts[folder.key as keyof FolderCounts] || 0;

          return (
            <button
              key={folder.key}
              onClick={() => onSelectFolder(folder.key)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors",
                isActive
                  ? "bg-brand-500/15 text-ink-900 font-bold border-l-4 border-brand-500"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("w-4 h-4", isActive ? "text-brand-600" : "text-ink-400")} />
                <span>{folder.label}</span>
              </div>
              {count > 0 && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                    folder.key === "inbox"
                      ? "bg-brand-500 text-ink-900"
                      : "bg-ink-200 text-ink-700"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Labels Section (PRD 4.10, UI_REFERENCE 7.1) */}
        {!readOnly && (
          <div className="pt-3 mt-3 border-t border-ink-200/60 space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">
              <span>Labels</span>
              {onOpenManageLabels && (
                <button
                  type="button"
                  onClick={onOpenManageLabels}
                  className="p-1 rounded-md text-ink-500 hover:text-ink-900 hover:bg-ink-200 transition cursor-pointer"
                  title="New Label"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-0.5 max-h-[140px] overflow-y-auto pr-1">
              {labels && labels.length > 0 ? (
                labels.map((l) => {
                  const isLabelActive = activeLabelId === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => onSelectLabel && onSelectLabel(l.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left",
                        isLabelActive
                          ? "bg-brand-500/15 text-ink-900 font-bold border-l-4 border-brand-500"
                          : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: l.color }}
                        />
                        <span className="truncate">{l.name}</span>
                      </div>
                      {l.message_count !== undefined && l.message_count > 0 && (
                        <span className="text-[10px] text-ink-400 font-semibold ml-1">
                          {l.message_count}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-1 text-[11px] text-ink-400 italic">No labels created</p>
              )}
            </div>

            <div className="pt-1.5 space-y-0.5">
              {onOpenManageLabels && (
                <button
                  type="button"
                  onClick={onOpenManageLabels}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5 text-ink-400" />
                  <span>Manage labels</span>
                </button>
              )}

              {onOpenManageSubscriptions && (
                <button
                  type="button"
                  onClick={onOpenManageSubscriptions}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition cursor-pointer"
                >
                  <BellOff className="w-3.5 h-3.5 text-ink-400" />
                  <span>Manage subscriptions</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
