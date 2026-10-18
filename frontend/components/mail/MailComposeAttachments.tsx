"use client";

import { X, Paperclip } from "lucide-react";

export interface AttachmentItem {
  id: number;
  original_name: string;
  size_bytes: number;
  mime: string;
  download_url?: string;
}

interface MailComposeAttachmentsProps {
  attachments: AttachmentItem[];
  onRemove: (id: number) => void;
}

export function MailComposeAttachments({
  attachments,
  onRemove,
}: MailComposeAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="px-4 py-2.5 border-t border-neutral-100 flex flex-wrap gap-2 bg-[#fcfcfc]">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 rounded-xl text-xs font-medium text-neutral-900 border border-neutral-200 transition-colors max-w-full"
        >
          <Paperclip className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span className="truncate max-w-[160px] sm:max-w-[220px]" title={att.original_name}>
            {att.original_name}
          </span>
          <span className="text-[10px] text-neutral-400 shrink-0">
            ({(att.size_bytes / 1024).toFixed(0)} KB)
          </span>
          <button
            type="button"
            onClick={() => onRemove(att.id)}
            className="p-0.5 hover:text-red-600 rounded-full transition-colors cursor-pointer shrink-0"
            title="Remove attachment"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
