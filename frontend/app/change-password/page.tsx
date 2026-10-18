"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ShieldCheck, Loader2, LogOut, AlertTriangle } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { changePasswordApi, getMeApi, logoutApi } from "@/lib/api/auth";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [forced, setForced] = useState(false);
  const [email, setEmail] = useState("");

  // A temporary password issued by an admin must be replaced before the
  // dashboard becomes usable (PRD 4.1: "Force change on first login").
  useEffect(() => {
    getMeApi()
      .then((res) => {
        if (!res.success || !res.data) {
          router.push("/login");
          return;
        }
        setForced(Boolean(res.data.must_change_password));
        setEmail(res.data.email);
      })
      .catch(() => router.push("/login"))
      .finally(() => setChecking(false));
  }, [router]);

  const signOut = async () => {
    try {
      await logoutApi();
    } catch {
      /* cookie may already be gone */
    }
    router.push("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 10) {
      toast.error("New password must be at least 10 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await changePasswordApi(current, password);
      if (res.success) {
        toast.success("Password changed. Please sign in again.", {
          description: "For your security all other sessions were signed out.",
        });
        setTimeout(() => signOut(), 1200);
      } else {
        toast.error(res.message || "Unable to change your password");
      }
    } catch {
      toast.error("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo href="/" className="justify-center mb-6" />
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Change your password</h1>
        <p className="mt-2 text-sm text-ink-500">
          {forced
            ? "Your account still uses a temporary password. Set your own to continue."
            : "Keep your account secure with a password only you know."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {checking ? (
          <div className="bg-white py-14 px-6 shadow-xl shadow-ink-900/5 rounded-3xl border border-ink-100 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-brand-600" />
            <p className="text-sm text-ink-500">Checking your session...</p>
          </div>
        ) : (
          <div className="bg-white py-10 px-6 sm:px-10 shadow-xl shadow-ink-900/5 rounded-3xl border border-ink-100 space-y-6">
            {forced && (
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-brand-50 border border-brand-100">
                <AlertTriangle className="w-5 h-5 text-ink-900 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-ink-700 leading-relaxed">
                  Signing in as <span className="font-bold text-ink-900">{email}</span>. Until you replace the
                  temporary password you cannot use the dashboard or webmail.
                </p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="current" className="block text-sm font-semibold text-ink-900 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="current"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    placeholder="Temporary or current password"
                    className="block w-full h-12 pl-11 pr-4 rounded-xl border border-ink-300 text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-ink-900 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-500">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 10 characters"
                    className="block w-full h-12 pl-11 pr-11 rounded-xl border border-ink-300 text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-500 hover:text-ink-900 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-semibold text-ink-900 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your new password"
                    className="block w-full h-12 pl-11 pr-4 rounded-xl border border-ink-300 text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent text-sm transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-ink-100">
              <button
                type="button"
                onClick={signOut}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-ink-700 hover:text-ink-900 hover:underline cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign out of this device
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
