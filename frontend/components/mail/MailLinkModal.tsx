"use client";

import { Link2, X } from "lucide-react";

interface MailLinkModalProps {
  isOpen: boolean;
  linkText: string;
  setLinkText: (v: string) => void;
  linkUrl: string;
  setLinkUrl: (v: string) => void;
  onApply: () => void;
  onClose: () => void;
}

export function MailLinkModal({
  isOpen,
  linkText,
  setLinkText,
  linkUrl,
  setLinkUrl,
  onApply,
  onClose,
}: MailLinkModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-neutral-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-neutral-900">Sisipkan Link</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              Teks untuk ditampilkan
            </label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Contoh: Kunjungi PayTrizz"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-700 mb-1">
              Tautan web (URL)
            </label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs text-neutral-900 outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApply();
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onApply}
            className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#0b57d0] hover:bg-[#0842a0] text-white shadow-sm cursor-pointer"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  );
}
