"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  /** When set, user must type this exact string (e.g. mailbox address) to enable confirm */
  requireTyped?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  requireTyped,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTyped("");
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const canConfirm = !requireTyped || typed.trim() === requireTyped;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            danger ? "bg-red-50 text-danger" : "bg-brand-50 text-ink-900"
          )}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-ink-900">{title}</h3>
          <div className="text-xs text-ink-500 mt-1.5 leading-relaxed">{description}</div>
        </div>

        {requireTyped && (
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              Type <span className="font-mono text-ink-900 normal-case">{requireTyped}</span> to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-300 text-xs font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full border border-ink-200 bg-white hover:bg-ink-100 text-ink-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading || !canConfirm}
            onClick={onConfirm}
            className={cn(
              "px-6 py-2.5 rounded-full font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50",
              danger
                ? "bg-danger hover:bg-red-700 text-white"
                : "bg-brand-500 hover:bg-brand-600 text-ink-900"
            )}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
