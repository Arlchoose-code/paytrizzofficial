"use client";

import { useState } from "react";
import { X, Mail, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AddMailboxModalProps {
  scope?: "company" | "talent";
  onClose: () => void;
  onCreated: () => void;
}

const COLOR_PRESETS = [
  "#FCCF00", // PayTrizz Yellow
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#64748B", // Slate
];

export function AddMailboxModal({ scope = "talent", onClose, onCreated }: AddMailboxModalProps) {
  const [localPart, setLocalPart] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanLocalPart = localPart.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (!cleanLocalPart || cleanLocalPart.length < 3) {
      setErrorMsg("Mailbox username must be 3-32 characters (letters, numbers, dots, dashes, underscores)");
      return;
    }
    if (!displayName.trim()) {
      setErrorMsg("Please enter a display name");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/proxy/mail/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          local_part: cleanLocalPart,
          display_name: displayName.trim(),
          color: color,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to create mailbox");
      }

      toast.success("Mailbox provisioned!", {
        description: `${cleanLocalPart}@paytrizz.com is ready to send and receive.`,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-ink-100 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-600 flex items-center justify-center">
              <Mail className="w-4 h-4 text-ink-900" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink-900">
                {scope === "company" ? "Add Company Mailbox" : "Add Webmail Address"}
              </h3>
              <p className="text-xs text-ink-500">
                {scope === "company"
                  ? "Shared company inbox — every admin can access it"
                  : "Provision your official @paytrizz.com inbox"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1.5">
              Email Address
            </label>
            <div className="flex items-center rounded-xl border border-ink-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500">
              <input
                type="text"
                placeholder="your.name"
                value={localPart}
                onChange={(e) => setLocalPart(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                className="flex-1 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none"
                required
              />
              <span className="px-3.5 py-2.5 bg-ink-50 text-xs font-bold text-ink-600 border-l border-ink-200 select-none">
                @paytrizz.com
              </span>
            </div>
            <p className="text-[11px] text-ink-400 mt-1">
              3-32 characters: letters, numbers, dots, and hyphens only. System reserved names are blocked.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1.5">
              Display Name / Signature Sender
            </label>
            <input
              type="text"
              placeholder="e.g. Syahrul | Lead Architect"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-2">
              Color Accent
            </label>
            <div className="flex items-center gap-2.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-ink-900 ring-offset-2" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-ink-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-ink-600 hover:bg-ink-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>Provisioning...</>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Create Mailbox
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
