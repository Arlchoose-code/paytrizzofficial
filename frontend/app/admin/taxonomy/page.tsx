"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminTaxonomyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/blog");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-ink-500 text-sm">
      Redirecting to Blog & Categories...
    </div>
  );
}
