"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import {
  User,
  Lock,
  Mail,
  Shield,
  Save,
  Eye,
  EyeOff,
  Laptop,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface MailboxItem {
  id: number;
  address: string;
  display_name: string;
  color: string;
  status: string;
}

interface SessionItem {
  id: number;
  ip: string;
  user_agent: string;
  created_at: string;
  is_current: boolean;
}

export default function TalentAccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [revokingSessions, setRevokingSessions] = useState(false);
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const fetchProfileData = async () => {
    try {
      const [meRes, mailRes, sessRes] = await Promise.all([
        fetch("/api/proxy/auth/me"),
        fetch("/api/proxy/mail/mailboxes"),
        fetch("/api/proxy/auth/sessions"),
      ]);

      const meJson = await meRes.json();
      if (meRes.ok && meJson.data) {
        setUser(meJson.data);
      }

      const mailJson = await mailRes.json();
      if (mailRes.ok && mailJson.data) {
        setMailboxes(mailJson.data);
      }

      const sessJson = await sessRes.json();
      if (sessRes.ok && Array.isArray(sessJson.data)) {
        setSessions(sessJson.data);
      }
    } catch {
      toast.error("Failed to load account data");
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleRevokeOtherSessions = async () => {
    setRevokingSessions(true);
    try {
      const res = await fetch("/api/proxy/auth/sessions/revoke-others", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to terminate sessions");
      toast.success("Other active sessions terminated successfully");
      fetchProfileData();
    } catch (err: any) {
      toast.error(err.message || "Failed to terminate sessions");
    } finally {
      setRevokingSessions(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setPasswordUpdating(true);
    try {
      const res = await fetch("/api/proxy/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update password");

      toast.success("Password changed successfully", {
        description: "Your account credentials have been updated.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setPasswordUpdating(false);
    }
  };

  return (
    <DashboardLayout role="talent" title="My Account | PayTrizz">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-500 text-ink-900">
              Talent Security
            </span>
            <span className="text-[11px] font-semibold text-ink-500">Identity & Access</span>
          </div>
          <h1 className="text-2xl font-black text-ink-900 tracking-tight">Account & Credentials</h1>
          <p className="text-xs text-ink-500">
            Manage your account security and view your provisioned @paytrizz.com addresses.
          </p>
        </div>

        {/* Identity Overview */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2 border-b border-ink-100 pb-3">
            <User className="w-4 h-4 text-brand-600" />
            <span>Profile Identity</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                disabled
                value={user?.name || ""}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-ink-50 text-ink-800 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  Login Email
                </label>
                <span className="text-[10px] text-ink-400 italic">Managed by Agency Admin</span>
              </div>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-ink-50 text-ink-800 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2 border-b border-ink-100 pb-3">
            <Lock className="w-4 h-4 text-brand-600" />
            <span>Change Password</span>
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-ink-200 text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-ink-400 hover:text-ink-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                  New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-600 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={passwordUpdating}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-brand-500 hover:bg-brand-400 text-ink-900 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{passwordUpdating ? "Updating..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Provisioned Webmail Inboxes */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2 border-b border-ink-100 pb-3">
            <Mail className="w-4 h-4 text-brand-600" />
            <span>Provisioned @paytrizz.com Mailboxes</span>
          </h3>

          <div className="divide-y divide-ink-100">
            {mailboxes.length === 0 ? (
              <p className="text-xs text-ink-400 py-3">No mailboxes currently provisioned.</p>
            ) : (
              mailboxes.map((box) => (
                <div key={box.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: box.color || "#FCCF00" }}
                    />
                    <div>
                      <p className="font-bold text-ink-900 font-mono">{box.address}</p>
                      <p className="text-[11px] text-ink-400">{box.display_name}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {box.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Sessions & Device Security */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-ink-100 pb-3">
            <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>Active Sessions & Device Security</span>
            </h3>
            {sessions.filter((s) => !s.is_current).length > 0 && (
              <button
                type="button"
                onClick={handleRevokeOtherSessions}
                disabled={revokingSessions}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <LogOut className="w-3 h-3" />
                <span>{revokingSessions ? "Revoking..." : "Terminate Other Sessions"}</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-ink-100">
            {sessions.length === 0 ? (
              <p className="text-xs text-ink-400 py-3">No active sessions tracked.</p>
            ) : (
              sessions.map((sess) => (
                <div key={sess.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-ink-50 border border-ink-100 flex items-center justify-center text-ink-600 flex-shrink-0">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-900 font-mono">{sess.ip || "127.0.0.1"}</span>
                        {sess.is_current && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-brand-500 text-ink-900">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-400 truncate max-w-md">
                        {sess.user_agent || "Browser Session"} · {sess.created_at}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
