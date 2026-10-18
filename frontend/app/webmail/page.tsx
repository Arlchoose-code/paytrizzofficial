"use client";

import { MailApp } from "@/components/mail/MailApp";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { getMainAppUrl, navigateToWebmail } from "@/lib/subdomain";

function WebmailContent() {
  // Safe default: least privilege
  const [scope, setScope] = useState<"company" | "talent">("talent");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const authenticate = async () => {
      // 1. Check if SSO ticket was passed in URL for cross-subdomain handoff
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const ticket = urlParams.get("ticket");

        if (ticket) {
          try {
            const exchangeRes = await fetch("/api/proxy/auth/sso/exchange", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticket }),
            });
            const exchangeJson = await exchangeRes.json();
            if (exchangeJson?.success && exchangeJson?.data) {
              if (cancelled) return;
              const role = exchangeJson.data.role;
              setScope(role === "admin" || role === "superadmin" ? "company" : "talent");
              // Clean ticket from address bar
              window.history.replaceState(null, "", window.location.pathname);
              setCheckingAuth(false);
              return;
            }
          } catch {}
        }
      }

      // 2. If opened on main host instead of webmail.* subdomain, hand off to genuine subdomain via SSO
      if (typeof window !== "undefined") {
        const host = window.location.host.toLowerCase();
        if (!host.startsWith("webmail.")) {
          await navigateToWebmail();
          return;
        }
      }

      // 3. Standard session check via auth/me
      try {
        const meRes = await fetch("/api/proxy/auth/me");
        const json = await meRes.json();
        if (cancelled) return;

        if (!json?.success || !json?.data) {
          const loginUrl = getMainAppUrl("/login?redirect=/webmail");
          window.location.href = loginUrl;
          return;
        }

        if (json.data.must_change_password) {
          window.location.href = getMainAppUrl("/change-password");
          return;
        }

        // Strict RBAC enforcement:
        // Scope is determined SOLELY by authenticated server JWT role.
        // It CANNOT be modified or spoofed via query parameters.
        const role = json.data.role;
        setScope(role === "admin" || role === "superadmin" ? "company" : "talent");

        // Clean up any extraneous query params from address bar for clean URL
        if (typeof window !== "undefined" && window.location.search) {
          window.history.replaceState(null, "", window.location.pathname);
        }

        setCheckingAuth(false);
      } catch {
        if (!cancelled) {
          const loginUrl = getMainAppUrl("/login?redirect=/webmail");
          window.location.href = loginUrl;
        }
      }
    };

    authenticate();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checkingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 text-ink-900 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm font-semibold text-neutral-600">Verifying PayTrizz Webmail session...</p>
      </div>
    );
  }

  return <MailApp scope={scope} standalone={true} />;
}

export default function WebmailPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 text-ink-900 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm font-semibold text-neutral-600">Loading PayTrizz Webmail...</p>
        </div>
      }
    >
      <WebmailContent />
    </Suspense>
  );
}
