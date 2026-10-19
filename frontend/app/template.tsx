"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/talent") ||
    pathname?.startsWith("/webmail");

  // Keep dashboard shells and sidebars rock-solid without full-page re-animations
  if (isDashboard) {
    return <div className="min-h-full flex-1 flex flex-col">{children}</div>;
  }

  return (
    <div key={pathname} className="page-transition min-h-full flex-1 flex flex-col">
      {children}
    </div>
  );
}
