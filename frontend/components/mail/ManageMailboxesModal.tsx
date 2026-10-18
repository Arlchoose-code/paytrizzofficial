"use client";

import { useState } from "react";
import { X, Mail, Trash2, AlertTriangle, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MailboxItem } from "./MailSidebar";

interface ManageMailboxesModalProps {
  scope: "company" | "talent";
  mailboxes: MailboxItem[];
  /** Mailbox ids this actor may delete (admins: company boxes, talents: their own). */
  onClose: () => void;
  onChanged: () => void;
}

/**
 * Mailbox directory with soft delete. PRD 4.10 / UI 7.5: deleting a mailbox
 * requires typing the full address, and the address stays reserved afterwards.
 */
export function ManageMailboxesModal({ scope, mailboxes, onClose, onChanged }: ManageMailboxesModalProps) {
  const [target, setTarget] = useState<MailboxItem | null>(null);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!target || typed.trim().toLowerCase() !== target.address.toLowerCase()) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/mail/mailboxes/${target.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to delete mailbox");
      toast.success(`${target.address} scheduled for deletion`, {
        description: "Soft deleted — the address stays reserved for 30 days.",
      });
      setTarget(null);
      setTyped("");
      onChanged();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete mailbox");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-ink-100 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-ink-900" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink-900">
                {scope === "company" ? "Company Mailboxes" : "My Mailboxes"}
              </h3>
              <p className="text-xs text-ink-500">
                {mailboxes.length} address{mailboxes.length === 1 ? "" : "es"} · deletion is soft and reversible for 30
                days
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {mailboxes.length === 0 && (
            <p className="py-8 text-center text-xs text-ink-500">No mailboxes yet.</p>
          )}
          {mailboxes.map((box) => (
            <div
              key={box.id}
              className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-ink-100 bg-[#FAFAFA]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold text-ink-900 flex-shrink-0"
                  style={{ backgroundColor: box.color || "#FCCF00" }}
                >
                  {box.address[0]?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate flex items-center gap-1.5">
                    {box.address}
                    {box.is_default && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand-100 text-[9px] font-extrabold uppercase text-ink-900">
                        <Star className="w-2.5 h-2.5" /> Default
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-ink-500 truncate">{box.display_name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTarget(box);
                  setTyped("");
                }}
                className="p-2 rounded-lg text-ink-400 hover:text-danger hover:bg-red-50 transition-colors cursor-pointer"
                title="Delete mailbox"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Typed-address confirmation (UI_REFERENCE 3: mailbox delete requires typing the address) */}
      {target && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-ink-900/50" onClick={() => !deleting && setTarget(null)} />
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-2xl bg-red-50 text-danger flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-ink-900">Delete {target.address}?</h4>
                <p className="text-xs text-ink-500 mt-1">
                  The mailbox is soft deleted, mail stops being delivered, and the address stays reserved for 30 days.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Type the address to confirm
              </label>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={target.address}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-full border border-ink-200 bg-white hover:bg-ink-100 text-ink-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting || typed.trim().toLowerCase() !== target.address.toLowerCase()}
                className={cn(
                  "px-6 py-2.5 rounded-full bg-danger hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5"
                )}
              >
                {deleting ? "Deleting..." : (<><Check className="w-3.5 h-3.5" /> Delete mailbox</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
