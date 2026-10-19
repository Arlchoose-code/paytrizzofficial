"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or searchParams change, mark transition complete
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, isNavigating]);

  // Intercept clicks on internal links to provide instant visual feedback
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find closest anchor
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external, hash, protocols, blank target, or modifier clicks
      if (
        href.startsWith("http:") ||
        href.startsWith("https:") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // If clicking the current path, don't trigger progress bar
      const currentFullUrl = window.location.pathname + window.location.search;
      if (href === currentFullUrl || href === window.location.pathname) {
        return;
      }

      // Immediately start progress bar
      setIsNavigating(true);
      setProgress(28);
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  // Simulate progress progression while awaiting server response
  useEffect(() => {
    if (!isNavigating || progress >= 100) return;

    const t1 = setTimeout(() => {
      setProgress((prev) => (prev < 65 ? 65 : prev));
    }, 100);

    const t2 = setTimeout(() => {
      setProgress((prev) => (prev < 85 ? 85 : prev));
    }, 280);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isNavigating, progress]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none transition-opacity duration-200"
      style={{ opacity: progress === 100 ? 0 : 1 }}
      aria-hidden="true"
    >
      <div
        className="h-[3px] bg-brand-500 shadow-[0_0_12px_rgba(252,207,0,0.9),0_0_4px_rgba(252,207,0,1)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
