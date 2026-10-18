"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export function MaintenanceBanner({ initialActive = false }: { initialActive?: boolean }) {
  const pathname = usePathname();
  const [active, setActive] = useState(initialActive);

  useEffect(() => {
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/talent") || pathname === "/login") {
      return;
    }
    fetch("/api/proxy/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) {
          setActive(json.data.maintenance_mode === "true");
        }
      })
      .catch(() => {});
  }, [pathname]);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/talent") || pathname === "/login") {
    return null;
  }

  if (!active) return null;

  return (
    <div
      role="alert"
      id="maintenance-banner"
      className="bg-amber-400 text-ink-900 border-b border-amber-500 py-2.5 px-4 text-xs font-bold text-center sticky top-0 z-[100] shadow-sm flex items-center justify-center gap-2"
    >
      <AlertTriangle className="w-4 h-4 text-ink-900 flex-shrink-0" />
      <span>
        System Notice: Platform Maintenance Mode is currently ACTIVE. Some features may be temporarily limited.
      </span>
    </div>
  );
}
