"use client";

import { useState, useEffect, useCallback } from "react";
import { X, BellOff, Search, ShieldAlert, CheckCircle2, ExternalLink, RefreshCw, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export interface MailSubscription {
  id: number;
  mailbox_id: number;
  sender_address: string;
  sender_name?: string | null;
  list_id?: string | null;
  unsubscribe_http?: string | null;
  unsubscribe_mailto?: string | null;
  one_click: boolean;
  message_count: number;
  last_received_at: string;
  status: "active" | "unsubscribed" | "blocked";
  unsubscribed_at?: string | null;
}

interface ManageSubscriptionsModalProps {
  onClose: () => void;
  selectedMailboxId?: number | null;
}

/** PRD 4.10 & 5.6, UI_REFERENCE 7.7: Manage Subscriptions */
export function ManageSubscriptionsModal({ onClose, selectedMailboxId }: ManageSubscriptionsModalProps) {
  const [subscriptions, setSubscriptions] = useState<MailSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionTarget, setActionTarget] = useState<{ sub: MailSubscription; type: "unsubscribe" | "block" } | null>(null);
  const [acting, setActing] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMailboxId) params.append("mailbox_id", selectedMailboxId.toString());
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/proxy/mail/subscriptions?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setSubscriptions(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [selectedMailboxId, search]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleActionConfirm = async () => {
    if (!actionTarget) return;
    setActing(true);
    const { sub, type } = actionTarget;
    try {
      const endpoint =
        type === "unsubscribe"
          ? `/api/proxy/mail/subscriptions/${sub.id}/unsubscribe`
          : `/api/proxy/mail/subscriptions/${sub.id}/block`;

      const res = await fetch(endpoint, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || `Failed to ${type}`);

      toast.success(
        type === "unsubscribe"
          ? `Unsubscribed from ${sub.sender_name || sub.sender_address}`
          : `Blocked sender ${sub.sender_address}`
      );

      // If user unsubscribed and there is an external HTTP link, give option to open
      if (type === "unsubscribe" && sub.unsubscribe_http && !sub.one_click) {
        toast.info("External unsubscribe link available", {
          action: {
            label: "Open Link",
            onClick: () => window.open(sub.unsubscribe_http!, "_blank", "noopener,noreferrer"),
          },
        });
      }

      setActionTarget(null);
      fetchSubscriptions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${type}`);
    } finally {
      setActing(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-ink-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center">
              <BellOff className="w-4 h-4 text-ink-900" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-ink-900">Manage Subscriptions</h3>
              <p className="text-xs text-ink-500">
                Senders detected with newsletter &amp; subscription headers (RFC 8058)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-ink-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sender name or address..."
              className="w-full h-10 pl-10 pr-4 text-xs bg-ink-50 border border-ink-100 rounded-xl text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
            />
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="flex-1 p-5 space-y-3 overflow-y-auto bg-white">
          {loading ? (
            <div className="py-12 text-center text-xs text-ink-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-500" />
              Loading subscriptions...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <BellOff className="w-8 h-8 text-ink-300 mx-auto" />
              <p className="text-xs font-bold text-ink-700">No active subscriptions detected</p>
              <p className="text-[11px] text-ink-400 max-w-sm mx-auto">
                Newsletters and mailing lists with unsubscribe headers will appear here automatically when received.
              </p>
            </div>
          ) : (
            subscriptions.map((sub) => {
              const initial = (sub.sender_name || sub.sender_address).charAt(0).toUpperCase();

              return (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-ink-100 bg-[#FAFAFA] hover:bg-ink-50/50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 text-ink-900 font-extrabold text-sm flex items-center justify-center flex-shrink-0 select-none">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink-900 truncate">
                          {sub.sender_name || sub.sender_address}
                        </span>
                        {sub.status === "unsubscribed" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Unsubscribed
                          </span>
                        )}
                        {sub.status === "blocked" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-danger flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3" /> Blocked
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-ink-500 truncate">{sub.sender_address}</p>
                      <p className="text-[10px] text-ink-400 mt-0.5">
                        {sub.message_count} email(s) &bull; Last received {formatDate(sub.last_received_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                    {sub.unsubscribe_http && (
                      <a
                        href={sub.unsubscribe_http}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl border border-ink-200 text-ink-600 hover:text-ink-900 hover:bg-white text-xs font-semibold flex items-center gap-1 transition"
                        title="Open unsubscribe link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {sub.status === "active" && (
                      <>
                        <button
                          onClick={() => setActionTarget({ sub, type: "unsubscribe" })}
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-600 text-ink-900 transition cursor-pointer shadow-sm"
                        >
                          Unsubscribe
                        </button>
                        <button
                          onClick={() => setActionTarget({ sub, type: "block" })}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold border border-red-200 text-danger hover:bg-red-50 transition cursor-pointer"
                        >
                          Block
                        </button>
                      </>
                    )}

                    {sub.status === "unsubscribed" && (
                      <button
                        onClick={() => setActionTarget({ sub, type: "block" })}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border border-ink-200 text-ink-600 hover:bg-ink-100 transition cursor-pointer"
                      >
                        Block sender
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-ink-100 bg-[#FAFAFA] flex items-center justify-between text-[11px] text-ink-500">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-ink-400" />
            <span>Unsubscribing sends a one-click request (RFC 8058) or mailto to the sender.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-ink-900 text-white font-bold text-xs hover:bg-black transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(actionTarget)}
        title={
          actionTarget?.type === "unsubscribe"
            ? `Unsubscribe from ${actionTarget?.sub.sender_name || actionTarget?.sub.sender_address}?`
            : `Block emails from ${actionTarget?.sub.sender_address}?`
        }
        description={
          actionTarget?.type === "unsubscribe"
            ? "We will dispatch an automated unsubscribe request. Future messages from this sender may stop within a few business days."
            : "Future messages from this sender will be automatically classified as Spam and kept out of your Inbox."
        }
        confirmLabel={actionTarget?.type === "unsubscribe" ? "Unsubscribe" : "Block Sender"}
        danger={actionTarget?.type === "block"}
        loading={acting}
        onCancel={() => setActionTarget(null)}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
}
