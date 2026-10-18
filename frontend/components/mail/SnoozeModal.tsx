"use client";

import { useState } from "react";
import { X, Clock, Calendar, Sun, Sunrise, Compass } from "lucide-react";
import { toast } from "sonner";

interface SnoozeModalProps {
  messageId: number;
  onClose: () => void;
  onSnoozed: () => void;
}

export function SnoozeModal({ messageId, onClose, onSnoozed }: SnoozeModalProps) {
  const [customDate, setCustomDate] = useState("");
  const [loading, setLoading] = useState(false);

  const getLaterToday = () => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    if (d.getTime() <= Date.now()) {
      d.setHours(21, 0, 0, 0);
    }
    return d;
  };

  const getTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    return d;
  };

  const getThisWeekend = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(9, 0, 0, 0);
    return d;
  };

  const getNextWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (8 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(8, 0, 0, 0);
    return d;
  };

  const applySnooze = async (targetDate: Date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/mail/messages/${messageId}/snooze`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snoozed_until: targetDate.toISOString() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to snooze message");
      }

      toast.success("Message snoozed", {
        description: `Will return to inbox on ${targetDate.toLocaleString()}`,
      });
      onSnoozed();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to snooze");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) {
      toast.error("Please pick a date and time");
      return;
    }
    const d = new Date(customDate);
    if (d.getTime() <= Date.now()) {
      toast.error("Snooze time must be in the future");
      return;
    }
    applySnooze(d);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-ink-100 w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-100 bg-[#FAFAFA]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-ink-900">Snooze until...</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset choices */}
        <div className="p-3 divide-y divide-ink-100">
          <div className="space-y-1 pb-3">
            <button
              onClick={() => applySnooze(getLaterToday())}
              disabled={loading}
              className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-ink-50 transition-colors text-ink-800 font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Later today</span>
              </div>
              <span className="text-ink-400">6:00 PM</span>
            </button>

            <button
              onClick={() => applySnooze(getTomorrowMorning())}
              disabled={loading}
              className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-ink-50 transition-colors text-ink-800 font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Sunrise className="w-4 h-4 text-orange-500" />
                <span>Tomorrow morning</span>
              </div>
              <span className="text-ink-400">8:00 AM</span>
            </button>

            <button
              onClick={() => applySnooze(getThisWeekend())}
              disabled={loading}
              className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-ink-50 transition-colors text-ink-800 font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-emerald-500" />
                <span>This weekend</span>
              </div>
              <span className="text-ink-400">Sat, 9:00 AM</span>
            </button>

            <button
              onClick={() => applySnooze(getNextWeek())}
              disabled={loading}
              className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl hover:bg-ink-50 transition-colors text-ink-800 font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Next week</span>
              </div>
              <span className="text-ink-400">Mon, 8:00 AM</span>
            </button>
          </div>

          {/* Custom Date Form */}
          <form onSubmit={handleCustomSubmit} className="pt-3 px-1 space-y-2.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Pick date & time
            </label>
            <input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-full text-xs text-ink-600 hover:bg-ink-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !customDate}
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
