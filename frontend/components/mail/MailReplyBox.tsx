"use client";

import {
  CornerUpLeft,
  CornerUpRight,
  Smile,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MessageItem } from "@/types/mail";
import type { MailboxItem } from "./MailSidebar";

interface MailReplyBoxProps {
  message: MessageItem;
  readOnly: boolean;
  mailboxes?: MailboxItem[];
  selectedMailboxId?: number | null;
  onSelectMailbox?: (id: number) => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  inlineReplyText?: string;
  setInlineReplyText?: (text: string) => void;
  replySending?: boolean;
  onSendReply?: () => void;
}

export function MailReplyBox({
  message,
  readOnly,
  onReply,
  onReplyAll,
  onForward,
}: MailReplyBoxProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactions, setReactions] = useState<string[]>([]);

  if (readOnly || message.folder === "drafts" || message.state === "draft") {
    return null;
  }

  const hasMultipleRecipients =
    (message.cc_json && message.cc_json.length > 0) ||
    (message.to_json && message.to_json.length > 1);

  return (
    <div className="p-4 border-t border-neutral-200 bg-[#FAFAFA] space-y-3 shrink-0">
      {/* Reaction chips */}
      {reactions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {reactions.map((em, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-neutral-300 text-xs shadow-2xs animate-in zoom-in-75 duration-150"
            >
              <span>{em}</span>
              <span className="text-[10px] text-neutral-500 font-semibold">1</span>
            </span>
          ))}
        </div>
      )}

      {/* Gmail-style Action Buttons (Reply, Reply All, Forward, Reactions) */}
      <div className="flex items-center gap-2.5 relative flex-wrap">
        <button
          type="button"
          onClick={onReply}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-semibold text-xs shadow-2xs transition-colors cursor-pointer bg-white"
        >
          <CornerUpLeft className="w-3.5 h-3.5 text-neutral-600" />
          <span>Reply</span>
        </button>

        {hasMultipleRecipients && (
          <button
            type="button"
            onClick={onReplyAll}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-semibold text-xs shadow-2xs transition-colors cursor-pointer bg-white"
          >
            <CornerUpLeft className="w-3.5 h-3.5 text-neutral-600" />
            <span>Reply All</span>
          </button>
        )}

        <button
          type="button"
          onClick={onForward}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-semibold text-xs shadow-2xs transition-colors cursor-pointer bg-white"
        >
          <CornerUpRight className="w-3.5 h-3.5 text-neutral-600" />
          <span>Forward</span>
        </button>

        {/* Emoji Reaction Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className={cn(
              "p-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer bg-white",
              showReactionPicker && "bg-neutral-100 text-neutral-900 border-neutral-400"
            )}
            title="Add emoji reaction"
          >
            <Smile className="w-4 h-4" />
          </button>

          {showReactionPicker && (
            <div className="absolute left-0 bottom-full mb-2 bg-white rounded-2xl shadow-xl border border-neutral-200 p-2 flex items-center gap-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
              {["👍", "❤️", "🎉", "😂", "🔥", "👏", "🚀", "🙏"].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    if (!reactions.includes(em)) {
                      setReactions((prev) => [...prev, em]);
                    }
                    setShowReactionPicker(false);
                    toast.success(`Reaction ${em} added!`);
                  }}
                  className="p-1.5 hover:bg-neutral-100 rounded-xl text-base transition-transform hover:scale-125 cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
