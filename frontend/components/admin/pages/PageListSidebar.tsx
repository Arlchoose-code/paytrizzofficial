"use client";

import { FolderOpen, RefreshCw, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanTitleSuffix } from "@/lib/seo";

interface PageSummary {
  id: number;
  key: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

interface PageListSidebarProps {
  pages: PageSummary[];
  loading: boolean;
  selectedPageId: number | undefined;
  siteName: string;
  separator: string;
  onSelectPage: (id: number, key: string) => void;
}

export function PageListSidebar({
  pages,
  loading,
  selectedPageId,
  siteName,
  separator,
  onSelectPage,
}: PageListSidebarProps) {
  return (
    <div className="lg:col-span-4 space-y-3">
      <h2 className="text-sm font-bold text-ink-900 flex items-center gap-2 px-1">
        <FolderOpen className="w-4 h-4 text-brand-500" />
        Website Pages ({pages.length})
      </h2>

      {loading ? (
        <div className="bg-white rounded-2xl border border-ink-100 p-8 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-ink-500 mx-auto mb-2" />
          <p className="text-xs text-ink-500 font-medium">Loading pages...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((p) => {
            const isSelected = selectedPageId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectPage(p.id, p.key)}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                  isSelected
                    ? "bg-white border-brand-500 ring-2 ring-brand-500/20 shadow-xs"
                    : "bg-white border-ink-100 hover:border-ink-200 hover:bg-ink-50/50"
                )}
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-ink-900 truncate">
                      {cleanTitleSuffix(p.title, siteName, separator)}
                    </h3>
                    <span
                      className={cn(
                        "text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase",
                        p.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-ink-100 text-ink-600"
                      )}
                    >
                      {p.is_active ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-ink-500 truncate">
                    /{p.key === "home" ? "" : p.key}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <ChevronRight
                    className={cn("w-4 h-4 text-ink-400", isSelected && "text-brand-500")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
