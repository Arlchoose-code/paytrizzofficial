"use client";

import {
  CornerUpLeft,
  CornerUpRight,
  Clock,
  Star,
  Trash2,
  Tag,
  Check,
  Pencil,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { MessageItem, MailLabelItem } from "@/types/mail";

interface MailReadingPaneHeaderProps {
  message: MessageItem;
  readOnly: boolean;
  allLabels?: MailLabelItem[];
  onReply: () => void;
  onForward: () => void;
  onEditDraft?: (msg: MessageItem) => void;
  onSnooze: (id: number) => void;
  onToggleStar: (id: number, currentStarred: boolean) => void;
  onMoveFolder: (id: number, folder: string) => void;
  onAssignLabels?: (messageId: number, labelIds: number[]) => Promise<void>;
  onBack?: () => void;
}

export function MailReadingPaneHeader({
  message,
  readOnly,
  allLabels = [],
  onReply,
  onForward,
  onEditDraft,
  onSnooze,
  onToggleStar,
  onMoveFolder,
  onAssignLabels,
  onBack,
}: MailReadingPaneHeaderProps) {
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false);

  return (
    <div className="px-4 sm:px-6 py-3 border-b border-ink-100 flex items-center justify-between bg-[#FAFAFA] shrink-0">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="lg:hidden p-1.5 -ml-2 mr-1 text-ink-600 hover:text-ink-900 rounded-full hover:bg-neutral-200 transition cursor-pointer"
            title="Back to message list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        {!readOnly && (
          <>
            {message.folder === "drafts" || message.state === "draft" ? (
              <button
                type="button"
                onClick={() => onEditDraft?.(message)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-500 text-ink-900 hover:bg-brand-400 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Draft
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onReply}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-ink-200 text-ink-700 hover:bg-ink-100 flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Reply to this message"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  Reply
                </button>
                <button
                  type="button"
                  onClick={onForward}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-ink-200 text-ink-700 hover:bg-ink-100 flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Forward this message"
                >
                  <CornerUpRight className="w-3.5 h-3.5" />
                  Forward
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onSnooze(message.id)}
              className="p-1.5 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 cursor-pointer"
              title="Snooze"
            >
              <Clock className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onToggleStar(message.id, message.is_starred)}
              className={cn(
                "p-1.5 rounded-lg cursor-pointer",
                message.is_starred
                  ? "text-amber-500"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              )}
              title="Star"
            >
              <Star className={cn("w-4 h-4", message.is_starred && "fill-current")} />
            </button>

            <button
              type="button"
              onClick={() => onMoveFolder(message.id, "trash")}
              className="p-1.5 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-red-600 cursor-pointer"
              title={message.folder === "trash" ? "Delete permanently" : "Move to trash"}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Labels dropdown */}
            {allLabels.length > 0 && onAssignLabels && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLabelDropdownOpen(!labelDropdownOpen)}
                  className="p-1.5 rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 cursor-pointer"
                  title="Labels"
                >
                  <Tag className="w-4 h-4" />
                </button>

                {labelDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-ink-100 p-2 z-30 space-y-1">
                    <p className="px-2 py-1 text-[10px] font-bold uppercase text-ink-400">
                      Apply Label
                    </p>
                    {allLabels.map((lbl) => {
                      const isAssigned = (message.labels || []).some((l) => l.id === lbl.id);
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => {
                            const currentIds = (message.labels || []).map((l) => l.id);
                            const newIds = isAssigned
                              ? currentIds.filter((id) => id !== lbl.id)
                              : [...currentIds, lbl.id];
                            onAssignLabels(message.id, newIds);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-ink-50 transition cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: lbl.color }}
                            />
                            <span className="truncate text-ink-800">{lbl.name}</span>
                          </div>
                          {isAssigned && <Check className="w-3.5 h-3.5 text-brand-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-ink-400">ID: #{message.id}</span>
      </div>
    </div>
  );
}
