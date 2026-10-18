"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { loginApi } from "@/lib/api/auth";
import { navigateToWebmail } from "@/lib/subdomain";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const formEmail = ((formData.get("email") as string) || email).trim();
    const formPassword = (formData.get("password") as string) || password;

    if (!formEmail || !formPassword) {
      toast.error("Please fill in both email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi({ email: formEmail, password: formPassword });
      if (res.success && res.data) {
        // A temporary password must be replaced before the dashboard opens (PRD 4.1)
        if (res.data.user.must_change_password) {
          toast.info("Please set your own password to continue");
          router.push("/change-password");
          return;
        }

        toast.success(`Welcome back, ${res.data.user.name}!`);

        // Check if redirected from webmail
        if (typeof window !== "undefined") {
          const redirectParam = new URLSearchParams(window.location.search).get("redirect");
          if (redirectParam === "/webmail") {
            await navigateToWebmail();
            return;
          }
        }

        // Redirect based on role with full session reload
        if (res.data.user.role === "admin") {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/admin";
        } else {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/talent";
        }
      } else {
        toast.error(res.message || "Invalid credentials");
      }
    } catch {
      toast.error("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <BrandLogo href="/" className="justify-center mb-6" />
        <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Sign in to access your PayTrizz dashboard & webmail
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white py-10 px-6 sm:px-10 shadow-xl shadow-ink-900/5 rounded-3xl border border-ink-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-ink-900 mb-2"
              >
                Work / Personal Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full h-12 pl-11 pr-4 rounded-xl border border-ink-300 text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-ink-900"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-ink-700 hover:text-ink-900 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full h-12 pl-11 pr-11 rounded-xl border border-ink-300 text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:border-transparent text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-500 hover:text-ink-900"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-ink-900 font-bold rounded-full transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ink-900 focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
