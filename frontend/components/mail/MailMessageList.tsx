"use client";

import { useState } from "react";
import {
  Inbox,
  Star,
  Clock,
  Search,
  RotateCw,
  CheckSquare,
  Square,
  Paperclip,
  Check,
  Tag,
  Trash2,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageItem } from "./MailReadingPane";
import type { MailLabel } from "./MailSidebar";

interface MailMessageListProps {
  messages: MessageItem[];
  loading: boolean;
  selectedMessage: MessageItem | null;
  selectedIds: number[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFolder: string;
  readOnly: boolean;
  labels: MailLabel[];
  onSelectMessage: (msg: MessageItem) => void;
  onToggleSelectAll: () => void;
  onToggleSelectOne: (id: number, e: React.MouseEvent) => void;
  onToggleStar: (id: number, currentStarred: boolean, e: React.MouseEvent) => void;
  onBulkMarkRead: (read: boolean) => void;
  onBulkTrash: () => void;
  onBulkAssignLabel: (labelId: number) => void;
  onRefresh: () => void;
  onOpenMobileFolders?: () => void;
}

export function MailMessageList({
  messages,
  loading,
  selectedMessage,
  selectedIds,
  searchQuery,
  setSearchQuery,
  activeFolder,
  readOnly,
  labels,
  onSelectMessage,
  onToggleSelectAll,
  onToggleSelectOne,
  onToggleStar,
  onBulkMarkRead,
  onBulkTrash,
  onBulkAssignLabel,
  onRefresh,
  onOpenMobileFolders,
}: MailMessageListProps) {
  const [bulkLabelOpen, setBulkLabelOpen] = useState(false);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 border-r border-ink-100 flex flex-col bg-white h-full">
      {/* Top Search & Filter Bar */}
      <div className="p-3 border-b border-ink-100 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search mail (e.g. from:alex, subject:advisory)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-ink-50 border border-ink-100 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Quick action bar */}
        <div className="flex items-center justify-between pt-1 text-ink-500 text-xs">
          <div className="flex items-center gap-2">
            {onOpenMobileFolders && (
              <button
                type="button"
                onClick={onOpenMobileFolders}
                className="lg:hidden p-1 text-ink-700 hover:text-ink-900 rounded hover:bg-ink-100 transition cursor-pointer"
                title="Mailboxes & Folders"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onToggleSelectAll}
              className="p-1 hover:text-ink-900 rounded"
              title="Select all"
            >
              {selectedIds.length > 0 && selectedIds.length === messages.length ? (
                <CheckSquare className="w-4 h-4 text-brand-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onRefresh}
              className="p-1 hover:text-ink-900 rounded"
              title="Refresh"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {!readOnly && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-[11px] font-bold text-ink-700">{selectedIds.length} selected</span>
              <div className="relative">
                <button
                  onClick={() => setBulkLabelOpen(!bulkLabelOpen)}
                  className="p-1 hover:text-ink-900 text-ink-600"
                  title="Apply label to selected"
                >
                  <Tag className="w-4 h-4" />
                </button>
                {bulkLabelOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-ink-100 py-1 z-20">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-ink-400">Add label</div>
                    {labels.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-ink-400">No labels created</div>
                    ) : (
                      labels.map((lbl) => (
                        <button
                          key={lbl.id}
                          onClick={() => {
                            onBulkAssignLabel(lbl.id);
                            setBulkLabelOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs hover:bg-ink-50 flex items-center gap-2"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lbl.color }} />
                          <span className="truncate">{lbl.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => onBulkMarkRead(true)}
                className="p-1 hover:text-ink-900 text-ink-600"
                title="Mark as read"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onBulkTrash}
                className="p-1 hover:text-red-600 text-ink-600"
                title="Move to trash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-ink-50">
        {loading ? (
          <div className="p-8 text-center text-xs text-ink-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Inbox className="w-8 h-8 text-ink-300 mx-auto" />
            <p className="text-xs font-semibold text-ink-600">No messages found</p>
            <p className="text-[11px] text-ink-400">Folder {activeFolder} is currently empty.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelected = selectedMessage?.id === msg.id;
            const isChecked = selectedIds.includes(msg.id);

            return (
              <div
                key={msg.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectMessage(msg)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectMessage(msg);
                  }
                }}
                className={cn(
                  "p-3.5 cursor-pointer transition-colors relative flex items-start gap-2.5",
                  isSelected
                    ? "bg-brand-500/10 border-l-4 border-brand-500"
                    : msg.is_read
                    ? "hover:bg-ink-50/70"
                    : "bg-[#FFFDF0] hover:bg-[#FFF9D6]"
                )}
              >
                <div className="flex flex-col items-center gap-2 pt-0.5">
                  <button
                    onClick={(e) => onToggleSelectOne(msg.id, e)}
                    className="text-ink-400 hover:text-ink-700"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => onToggleStar(msg.id, msg.is_starred, e)}
                    className={cn(
                      "transition-transform hover:scale-125",
                      msg.is_starred ? "text-amber-500 fill-amber-500" : "text-ink-300 hover:text-amber-400"
                    )}
                  >
                    <Star className={cn("w-3.5 h-3.5", msg.is_starred && "fill-current")} />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs truncate",
                        !msg.is_read ? "font-bold text-ink-900" : "font-medium text-ink-700"
                      )}
                    >
                      {msg.direction === "outbound"
                        ? `To: ${msg.to_json?.[0]?.address || "Recipient"}`
                        : msg.from_name || msg.from_address}
                    </span>
                    <span className="text-[10px] text-ink-400 ml-2 whitespace-nowrap">
                      {formatDate(msg.sort_at)}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "text-xs truncate mb-1",
                      !msg.is_read ? "font-bold text-ink-900" : "text-ink-800"
                    )}
                  >
                    {msg.subject || "(No Subject)"}
                  </div>

                  <p className="text-[11px] text-ink-500 line-clamp-1 truncate">
                    {msg.snippet || msg.body_text || "No preview available"}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {msg.labels &&
                      msg.labels.length > 0 &&
                      msg.labels.map((lbl) => (
                        <span
                          key={lbl.id}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ backgroundColor: `${lbl.color}20`, color: lbl.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lbl.color }} />
                          {lbl.name}
                        </span>
                      ))}
                    {msg.has_attachments && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-ink-100 text-[10px] text-ink-600 font-medium">
                        <Paperclip className="w-2.5 h-2.5" />
                        File
                      </span>
                    )}
                    {msg.state === "scheduled" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-[10px] text-blue-700 font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        Scheduled
                      </span>
                    )}
                    {msg.state === "draft" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-[10px] text-amber-700 font-medium">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
