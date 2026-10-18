"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, ArrowLeft, Send, CheckCircle2, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { forgotPasswordApi } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordApi(email);
      // The backend never reveals whether an address exists (anti-enumeration),
      // so the same success state is shown either way.
      if (res.success) {
        setSent(true);
      } else {
        toast.error(res.message || "Unable to send the reset link");
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
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Forgot your password?</h1>
        <p className="mt-2 text-sm text-ink-500">
          Enter the personal email you use to sign in and we will send you a one-time reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-10 px-6 sm:px-10 shadow-xl shadow-ink-900/5 rounded-3xl border border-ink-100">
          {sent ? (
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-extrabold text-ink-900">Check your inbox</h2>
                <p className="text-sm text-ink-500">
                  If <span className="font-semibold text-ink-900">{email}</span> is registered, a password reset link
                  is on its way. The link expires in 60 minutes.
                </p>
              </div>
              <p className="text-xs text-ink-500">
                Nothing arrived? Check your spam folder or wait a minute before trying again.
              </p>
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  className="w-full h-12 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition cursor-pointer"
                >
                  Send to another email
                </button>
                <Link
                  href="/login"
                  className="w-full h-12 rounded-full border border-ink-200 hover:bg-ink-100 text-ink-900 font-bold text-sm transition inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-ink-900 mb-2">
                  Personal Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="block w-full h-12 pl-11 pr-4 rounded-xl border border-ink-300 text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent text-sm transition"
                  />
                </div>
                <p className="mt-2 text-xs text-ink-500">
                  Your login email is your personal address — not your @paytrizz.com mailbox.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending link...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send reset link
                  </>
                )}
              </button>

              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-ink-700 hover:text-ink-900 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
