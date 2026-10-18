"use client";

import { Check, Copy } from "lucide-react";

interface TalentPasswordModalProps {
  result: { email: string; password: string } | null;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

export function TalentPasswordModal({
  result,
  copied,
  onCopy,
  onClose,
}: TalentPasswordModalProps) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
        <h3 className="text-lg font-extrabold text-ink-900">Password Reset</h3>
        <p className="text-xs text-ink-500 -mt-2">
          The new password was emailed to <strong>{result.email}</strong>. All other sessions were revoked.
        </p>
        <div className="flex items-center gap-2 bg-ink-50 p-3 rounded-xl border border-ink-200">
          <span className="font-mono text-sm font-bold text-ink-900 flex-1 break-all">
            {result.password}
          </span>
          <button
            onClick={onCopy}
            className="p-1.5 rounded-lg bg-ink-100 hover:bg-brand-500 text-ink-700 transition cursor-pointer"
            title="Copy credentials"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-ink-900 text-white rounded-full text-xs font-bold hover:bg-black cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
