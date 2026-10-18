"use client";

import {
  Send,
  Loader2,
  ChevronDown,
  Clock,
  Paperclip,
  Link2,
  Smile,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MailEmojiPicker } from "./MailEmojiPicker";

interface MailBottomBarProps {
  sending: boolean;
  uploading: boolean;
  isScheduled: boolean;
  showScheduleDropdown: boolean;
  setShowScheduleDropdown: (v: boolean) => void;
  showToolbar: boolean;
  setShowToolbar: (v: boolean) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (v: boolean) => void;
  isLinkActive: boolean;
  onSend: (asDraft?: boolean) => void;
  onScheduleSelect: () => void;
  onAttachClick: () => void;
  onLinkClick: () => void;
  onImageClick: () => void;
  onInsertEmoji: (emoji: string) => void;
  onClose: () => void;
  onDiscard?: () => void;
}

export function MailBottomBar({
  sending,
  uploading,
  isScheduled,
  showScheduleDropdown,
  setShowScheduleDropdown,
  showToolbar,
  setShowToolbar,
  showEmojiPicker,
  setShowEmojiPicker,
  isLinkActive,
  onSend,
  onScheduleSelect,
  onAttachClick,
  onLinkClick,
  onImageClick,
  onInsertEmoji,
  onClose,
  onDiscard,
}: MailBottomBarProps) {
  return (
    <div className="px-3 sm:px-4 py-2 bg-white border-t border-neutral-200 flex items-center justify-between select-none gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Blue Send Pill with Split Dropdown */}
        <div className="relative inline-flex items-center rounded-full bg-[#0b57d0] hover:bg-[#0842a0] text-white shadow-sm transition-all shrink-0">
          <button
            type="button"
            disabled={sending || uploading}
            onClick={() => onSend(false)}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{sending ? "Mengirim..." : isScheduled ? "Jadwalkan" : "Kirim"}</span>
          </button>
          <div className="w-[1px] h-4 bg-white/30" />
          <button
            type="button"
            onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
            className="px-1.5 sm:px-2 py-1.5 sm:py-2 hover:bg-white/10 rounded-r-full transition-colors cursor-pointer"
            title="Opsi pengiriman lainnya"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Schedule Dropdown Menu */}
          {showScheduleDropdown && (
            <div className="absolute left-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 text-xs text-neutral-800 z-30">
              <button
                type="button"
                onClick={onScheduleSelect}
                className="w-full text-left px-3.5 py-2 hover:bg-neutral-100 flex items-center gap-2 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Kirim terjadwal</span>
              </button>
            </div>
          )}
        </div>

        {/* Aa Formatting Options Toggle */}
        <button
          type="button"
          onClick={() => setShowToolbar(!showToolbar)}
          className={cn(
            "p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600 cursor-pointer",
            showToolbar && "bg-neutral-100 text-neutral-900"
          )}
          title="Opsi pemformatan"
        >
          <span className="font-serif font-bold text-xs">Aa</span>
        </button>

        {/* Attach Files (Paperclip) */}
        <button
          type="button"
          disabled={uploading}
          onClick={onAttachClick}
          className={cn(
            "p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600 cursor-pointer",
            uploading && "opacity-60 cursor-not-allowed"
          )}
          title="Lampirkan file"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        {/* Insert Link (🔗) */}
        <button
          type="button"
          onClick={onLinkClick}
          className={cn(
            "p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600 cursor-pointer",
            isLinkActive && "bg-blue-50 text-blue-700"
          )}
          title="Sisipkan link (Ctrl+K)"
        >
          <Link2 className="w-4 h-4" />
        </button>

        {/* Insert Emoji (😊) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600 cursor-pointer"
            title="Sisipkan emoji"
          >
            <Smile className="w-4 h-4" />
          </button>
          <MailEmojiPicker
            isOpen={showEmojiPicker}
            onSelectEmoji={onInsertEmoji}
          />
        </div>

        {/* Insert Image (🖼️) */}
        <button
          type="button"
          disabled={uploading}
          onClick={onImageClick}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-600 cursor-pointer"
          title="Sisipkan foto / gambar"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Right side: Save Draft & Trash */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSend(true)}
          className="px-2.5 py-1 text-xs font-semibold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
          title="Simpan sebagai draf"
        >
          Simpan Draf
        </button>
        <button
          type="button"
          onClick={onDiscard || onClose}
          className="p-1.5 sm:p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-red-600 transition-colors cursor-pointer shrink-0"
          title="Buang draf"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
