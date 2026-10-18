"use client";

import { X, Maximize2 } from "lucide-react";

interface MailComposeMinimizedProps {
  subject: string;
  onRestore: () => void;
  onClose: () => void;
}

export function MailComposeMinimized({
  subject,
  onRestore,
  onClose,
}: MailComposeMinimizedProps) {
  return (
    <div className="fixed bottom-0 right-4 sm:right-8 z-50 w-72 bg-[#202124] text-white rounded-t-xl shadow-2xl border border-neutral-700 flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-neutral-800 transition-colors select-none">
      <div
        className="flex items-center gap-2 truncate font-medium text-xs flex-1 mr-2"
        onClick={onRestore}
      >
        <span className="truncate">{subject || "Pesan Baru"}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onRestore}
          className="p-1 hover:text-white text-neutral-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
          title="Pulihkan"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:text-white text-neutral-400 hover:bg-white/10 rounded transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
