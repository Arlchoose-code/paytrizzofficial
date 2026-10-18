"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { resetPasswordApi } from "@/lib/api/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 10) {
      toast.error("Password must be at least 10 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordApi(token, password);
      if (res.success) {
        setDone(true);
        toast.success("Password reset. You can sign in now.");
        setTimeout(() => router.push("/login"), 1800);
      } else {
        toast.error(res.message || "This reset link is invalid or has expired");
      }
    } catch {
      toast.error("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto">
          <KeyRound className="w-7 h-7 text-danger" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-extrabold text-ink-900">Reset link missing</h2>
          <p className="text-sm text-ink-500">
            This page needs a valid reset token. Request a fresh link and open it from your inbox.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="w-full h-12 rounded-full bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold text-sm transition inline-flex items-center justify-center gap-2"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-extrabold text-ink-900">Password updated</h2>
          <p className="text-sm text-ink-500">Redirecting you to the sign-in page...</p>
        </div>
        <Link
          href="/login"
          className="w-full h-12 rounded-full border border-ink-200 hover:bg-ink-100 text-ink-900 font-bold text-sm transition inline-flex items-center justify-center gap-2"
        >
          Go to sign in now
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-ink-900 mb-2">
          New Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-500">
            <Lock className="h-5 w-5" />
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
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </>
        ) : (
          "Set new password"
        )}
      </button>

      <Link
        href="/login"
        className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-ink-700 hover:text-ink-900 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to sign in
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <BrandLogo href="/" className="justify-center mb-6" />
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-ink-500">Choose a strong password you have not used before.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-10 px-6 sm:px-10 shadow-xl shadow-ink-900/5 rounded-3xl border border-ink-100">
          <Suspense
            fallback={
              <div className="py-10 text-center text-sm text-ink-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-brand-600" />
                Loading reset form...
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
