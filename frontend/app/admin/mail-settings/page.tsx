"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReservedName {
  id: number;
  name: string;
  reason?: string | null;
  created_at: string;
}

interface MailSettingsState {
  mail_unknown_policy: string;
  mail_max_mailboxes_per_talent: string;
  mail_send_limit_hour: string;
  mail_send_limit_day: string;
  mail_deleted_retention_days: string;
  mail_trash_retention_days: string;
  mail_domain: string;
}

const DEFAULT_SETTINGS: MailSettingsState = {
  mail_unknown_policy: "drop",
  mail_max_mailboxes_per_talent: "0",
  mail_send_limit_hour: "50",
  mail_send_limit_day: "200",
  mail_deleted_retention_days: "30",
  mail_trash_retention_days: "30",
  mail_domain: "paytrizz.com",
};

export default function AdminMailSettingsPage() {
  const [settings, setSettings] = useState<MailSettingsState>(DEFAULT_SETTINGS);
  const [reserved, setReserved] = useState<ReservedName[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newName, setNewName] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReservedName | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, reservedRes] = await Promise.all([
        fetch("/api/proxy/admin/settings").then((r) => r.json()).catch(() => null),
        fetch("/api/proxy/admin/reserved-mail-names").then((r) => r.json()).catch(() => null),
      ]);

      if (settingsRes?.data) {
        const map: Record<string, string> = {};
        settingsRes.data.forEach((s: any) => {
          let val = s.value;
          if (typeof val === "string" && val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
          }
          map[s.key] = String(val);
        });
        setSettings((prev) => ({ ...prev, ...map }));
      }

      if (reservedRes?.data) {
        setReserved(reservedRes.data);
      }
    } catch {
      toast.error("Failed to load mail settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/proxy/admin/settings/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to save settings");
      toast.success("Mail settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addReserved = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/proxy/admin/reserved-mail-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim().toLowerCase(), reason: newReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to reserve name");
      toast.success(`"${newName.trim().toLowerCase()}" is now reserved`);
      setNewName("");
      setNewReason("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to reserve name");
    } finally {
      setAdding(false);
    }
  };

  const removeReserved = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/admin/reserved-mail-names/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to release name");
      toast.success(`"${deleteTarget.name}" released — anyone can claim it now`);
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to release name");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof MailSettingsState,
    label: string,
    helper: string,
    type: "number" | "text" = "number"
  ) => (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={settings[key]}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
        className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
      />
      <p className="text-[11px] text-ink-500 mt-1">{helper}</p>
    </div>
  );

  return (
    <DashboardLayout role="admin" title="Mail Settings">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
                Webmail Policy
              </span>
              <span className="text-[11px] font-semibold text-ink-500">Domain: {settings.mail_domain}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">Mail Settings</h1>
            <p className="text-sm text-ink-500 mt-1">
              Reserved names, mailbox limits, delivery policy, and retention windows for the webmail system.
            </p>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition shadow-sm cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>

        {/* Limits & policy */}
        <div className="bg-white rounded-3xl border border-ink-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-ink-900" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-ink-900">Limits & Policy</h2>
              <p className="text-xs text-ink-500">Applied server-side for every mailbox operation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Unknown Address Policy
              </label>
              <select
                value={settings.mail_unknown_policy}
                onChange={(e) => setSettings({ ...settings, mail_unknown_policy: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
              >
                <option value="drop">Drop silently (log only)</option>
                <option value="forward_to_company_default">Forward to company default mailbox</option>
              </select>
              <p className="text-[11px] text-ink-500 mt-1">
                What happens to inbound mail for addresses without an active mailbox.
              </p>
            </div>

            {field(
              "mail_max_mailboxes_per_talent",
              "Max Mailboxes per Talent",
              "0 = unlimited. Applies to talent-owned mailboxes."
            )}
            {field("mail_send_limit_hour", "Send Limit per Mailbox / Hour", "Default 50 emails per hour.")}
            {field("mail_send_limit_day", "Send Limit per Mailbox / Day", "Default 200 emails per day.")}
            {field("mail_deleted_retention_days", "Deleted Mailbox Retention (days)", "After this window the mailbox and its contents are purged.")}
            {field("mail_trash_retention_days", "Trash Retention (days)", "Messages in Trash are purged after this window.")}
          </div>
        </div>

        {/* Reserved names */}
        <div className="bg-white rounded-3xl border border-ink-100 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-ink-900" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-ink-900">Reserved Names</h2>
              <p className="text-xs text-ink-500">
                These local parts can never be claimed as mailboxes by talents.
              </p>
            </div>
          </div>

          <form onSubmit={addReserved} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Reserve a Name
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.toLowerCase())}
                  placeholder="e.g. billing"
                  className="flex-1 px-3.5 py-2.5 rounded-l-xl border border-ink-200 text-xs font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                />
                <span className="px-3 py-2.5 bg-ink-100 border border-l-0 border-ink-200 rounded-r-xl text-xs font-mono text-ink-500">
                  @{settings.mail_domain}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Reason (optional)
              </label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g. billing team alias"
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-ink-900 hover:bg-black text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              {adding ? "Reserving..." : "Reserve"}
            </button>
          </form>

          {loading ? (
            <div className="p-8 text-center text-xs text-ink-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-500" />
              Loading reserved names...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {reserved.map((r) => (
                <span
                  key={r.id}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-50 border border-ink-100 text-xs"
                >
                  <span className="font-mono font-bold text-ink-900">{r.name}</span>
                  {r.reason && <span className="text-[10px] text-ink-500 max-w-32 truncate">{r.reason}</span>}
                  <button
                    onClick={() => setDeleteTarget(r)}
                    className="p-0.5 rounded-full text-ink-400 hover:text-danger transition cursor-pointer"
                    title="Release name"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {reserved.length === 0 && (
                <span className="text-xs text-ink-400">No reserved names configured.</span>
              )}
            </div>
          )}

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-50 border border-brand-100">
            <RotateCcw className="w-4 h-4 text-ink-900 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink-700 leading-relaxed">
              <strong>Deleted addresses become tombstones</strong> — they can&apos;t be reused by anyone else. Only
              admins can permanently release a deleted address.
            </p>
          </div>
        </div>

        {/* DNS checklist (PRD 5.9) */}
        <div className="bg-[#FFFDF0] rounded-3xl border border-brand-500/30 p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-extrabold text-ink-900">AWS SES & DNS Verification Checklist</h2>
          <p className="text-xs text-ink-600 -mt-2">
            Required DNS records for catch-all inbound and 100% deliverability.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              { title: "Easy DKIM (3× CNAME)", desc: "Sign all outbound email with 2048-bit DKIM key." },
              { title: "Custom MAIL FROM (mail.paytrizz.com)", desc: "MX + SPF TXT aligned with paytrizz.com." },
              { title: "Root MX SES Catch-All", desc: "10 inbound-smtp.<region>.amazonaws.com — receiving region must support SES inbound." },
              { title: "DMARC Policy (_dmarc TXT)", desc: "Start with p=none, then raise gradually to quarantine/reject." },
            ].map((item) => (
              <div key={item.title} className="p-3.5 bg-white rounded-xl border border-ink-100 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-ink-900">{item.title}</p>
                  <p className="text-[11px] text-ink-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className={cn("text-[11px] text-ink-500")}>
            Note: because the root MX points to SES, this domain cannot be used with other email providers
            (Google Workspace, etc.).
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Release reserved name?"
        description={
          <>
            <strong className="font-mono">{deleteTarget?.name}@paytrizz.com</strong> will no longer be reserved —
            any talent could claim it afterwards.
          </>
        }
        confirmLabel="Release Name"
        danger
        loading={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeReserved}
      />
    </DashboardLayout>
  );
}
