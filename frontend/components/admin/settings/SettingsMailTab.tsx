"use client";

import { Shield, CheckCircle2 } from "lucide-react";

interface SettingsMailTabProps {
  settings: Record<string, string>;
  handleChange: (key: string, value: string) => void;
}

export function SettingsMailTab({
  settings,
  handleChange,
}: SettingsMailTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-ink-900 border-b border-ink-100 pb-3">
          Webmail Domain &amp; AWS SES Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              System From Address
            </label>
            <input
              type="text"
              value={settings.mail_from_address || "noreply@paytrizz.com"}
              onChange={(e) => handleChange("mail_from_address", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              System Reply-To Address
            </label>
            <input
              type="text"
              value={settings.mail_reply_to_address || "hello@paytrizz.com"}
              onChange={(e) => handleChange("mail_reply_to_address", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              AWS SES Region
            </label>
            <input
              type="text"
              value={settings.aws_ses_region || "ap-southeast-1"}
              onChange={(e) => handleChange("aws_ses_region", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-600 mb-1.5">
              SES Inbound S3 Bucket
            </label>
            <input
              type="text"
              value={settings.aws_s3_bucket || "paytrizz-ses-inbound"}
              onChange={(e) => handleChange("aws_s3_bucket", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* SES & DNS Verification Checklist */}
      <div className="bg-[#FFFDF0] rounded-2xl border border-brand-500/30 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-500 text-ink-900 font-bold flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink-900">AWS SES &amp; DNS Verification Checklist</h4>
            <p className="text-xs text-ink-600">Essential DNS records for 100% deliverability &amp; catch-all inbound</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[
            { title: "Easy DKIM (3x CNAME)", desc: "Sign all outbound emails with 2048-bit DKIM key." },
            { title: "Custom MAIL FROM (mail.paytrizz.com)", desc: "MX + TXT SPF aligned with paytrizz.com." },
            { title: "Root MX SES Catch-All", desc: "10 inbound-smtp.ap-southeast-1.amazonaws.com" },
            { title: "DMARC Policy TXT Record", desc: "v=DMARC1; p=quarantine; rua=mailto:dmarc@paytrizz.com" },
          ].map((r) => (
            <div key={r.title} className="p-3 bg-white rounded-xl border border-ink-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-ink-900">{r.title}</p>
                <p className="text-[11px] text-ink-500">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
