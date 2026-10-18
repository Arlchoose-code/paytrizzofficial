"use client";

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { MailApp } from "@/components/mail/MailApp";
import { CheckCircle2 } from "lucide-react";
import { navigateToWebmail } from "@/lib/subdomain";

export default function TalentMailPage() {
  return (
    <DashboardLayout role="talent" title="Talent Webmail | PayTrizz">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Talent Workspace
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Zero-Fee Internal Delivery
              </span>
            </div>
            <h1 className="text-2xl font-black text-ink-900 tracking-tight">Talent Webmail</h1>
            <p className="text-xs text-ink-500">
              Communicate directly with clients and fellow squad members via your @paytrizz.com address.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => navigateToWebmail()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl text-xs transition-all shadow-xs cursor-pointer"
            >
              <span>Launch Fullscreen Webmail</span>
              <span className="text-brand-400 font-mono text-[11px]">webmail.url ↗</span>
            </button>
          </div>
        </div>

        {/* Webmail App Interface */}
        <MailApp scope="talent" />
      </div>
    </DashboardLayout>
  );
}
