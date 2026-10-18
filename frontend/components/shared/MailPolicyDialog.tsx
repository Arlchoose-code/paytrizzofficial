"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Loader2, LogOut, Eye, FileClock } from "lucide-react";
import { acceptMailPolicyApi } from "@/lib/api/auth";

interface MailPolicyDialogProps {
  onAccepted: () => void;
  onSignOut: () => void;
}

/**
 * Blocking consent dialog shown on a talent's first sign-in (PRD 4.1).
 * Webmail stays locked until the policy is accepted, so this dialog has no
 * dismiss action — only Accept or Sign out.
 */
export function MailPolicyDialog({ onAccepted, onSignOut }: MailPolicyDialogProps) {
  const [saving, setSaving] = useState(false);

  const accept = async () => {
    setSaving(true);
    try {
      const res = await acceptMailPolicyApi();
      if (res.success) {
        toast.success("Mail policy accepted");
        onAccepted();
      } else {
        toast.error(res.message || "Unable to record your acceptance");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-2xl bg-brand-500 text-ink-900 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <div>
            <h3 className="text-lg font-extrabold text-ink-900">Company mail policy</h3>
            <p className="text-xs text-ink-500 mt-1">
              Before you can use your @paytrizz.com webmail, please review how mail is handled.
            </p>
          </div>
        </div>

        <div className="space-y-3 p-5 rounded-2xl bg-brand-50 border border-brand-100">
          <p className="text-sm text-ink-900 font-semibold leading-relaxed">
            The company may access mailboxes for compliance purposes. Access is logged.
          </p>
          <ul className="space-y-2.5 pt-1">
            <li className="flex items-start gap-2.5 text-xs text-ink-700">
              <Eye className="w-4 h-4 text-ink-900 flex-shrink-0 mt-0.5" />
              Administrators can open your mailbox in a read-only view. Every session and every message opened is
              recorded in the audit ledger.
            </li>
            <li className="flex items-start gap-2.5 text-xs text-ink-700">
              <FileClock className="w-4 h-4 text-ink-900 flex-shrink-0 mt-0.5" />
              Mail logs keep the sender, recipient, timestamps and event type for compliance review and abuse
              handling.
            </li>
          </ul>
        </div>

        <p className="text-[11px] text-ink-500 leading-relaxed">
          You can keep using the rest of your workspace while this notice is open, but webmail stays locked until you
          accept.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={accept}
            disabled={saving}
            className="w-full sm:flex-1 h-12 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              "I understand and accept"
            )}
          </button>
          <button
            onClick={onSignOut}
            disabled={saving}
            className="w-full sm:w-auto h-12 px-5 rounded-full border border-ink-200 hover:bg-ink-100 text-ink-700 font-bold text-sm transition inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
