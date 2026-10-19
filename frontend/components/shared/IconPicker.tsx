"use client";

import React, { useMemo, useState } from "react";
import { icons, Search, X, Check } from "lucide-react";
import { DynamicIcon } from "./DynamicIcon";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
  className?: string;
}

const POPULAR_BADGES = [
  "Star",
  "Crown",
  "Shield",
  "ShieldCheck",
  "Award",
  "Trophy",
  "Zap",
  "Sparkles",
  "Flame",
  "Heart",
  "Target",
  "Activity",
  "CheckCircle2",
  "Medal",
  "Compass",
  "Rocket",
];

const POPULAR_TECH = [
  "Code",
  "CodeXml",
  "Terminal",
  "Cpu",
  "Server",
  "Database",
  "Layers",
  "Layout",
  "Globe",
  "GitBranch",
  "Workflow",
  "Boxes",
  "FileCode",
  "Network",
  "Binary",
  "Smartphone",
  "Laptop",
  "Cloud",
  "Fingerprint",
  "Bug",
];

const POPULAR_ROLES = [
  "Briefcase",
  "Users",
  "UserCheck",
  "GraduationCap",
  "TrendingUp",
  "BarChart",
  "Lightbulb",
  "PenTool",
  "Palette",
  "Key",
  "Lock",
  "Settings",
  "Wrench",
  "Gauge",
  "Clock",
  "Flag",
];

const ALL_ICON_KEYS = Object.keys(icons).sort();

export function IconPicker({
  value,
  onChange,
  placeholder = "Choose an icon...",
  className,
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"popular" | "tech" | "roles" | "all">("popular");

  const filteredIcons = useMemo(() => {
    const q = search.trim().toLowerCase();
    let baseList: string[] = ALL_ICON_KEYS;

    if (!q) {
      if (activeTab === "popular") baseList = POPULAR_BADGES;
      else if (activeTab === "tech") baseList = POPULAR_TECH;
      else if (activeTab === "roles") baseList = POPULAR_ROLES;
      else baseList = ALL_ICON_KEYS.slice(0, 150);
    } else {
      baseList = ALL_ICON_KEYS.filter((k) => k.toLowerCase().includes(q));
    }

    return baseList.slice(0, 200);
  }, [search, activeTab]);

  const selectIcon = (name: string) => {
    onChange(name);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-50/50 text-xs text-ink-900 transition focus:outline-none focus:ring-2 focus:ring-ink-900/70 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 truncate">
            <span className="w-6 h-6 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-ink-900 shrink-0">
              <DynamicIcon name={value || "Shield"} className="w-3.5 h-3.5 text-ink-900" />
            </span>
            <span className={cn("truncate font-semibold", !value && "text-ink-400 font-normal")}>
              {value || placeholder}
            </span>
          </div>
          <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider shrink-0 ml-2">
            Select
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-2.5 rounded-xl border border-ink-200 bg-white hover:bg-red-50 hover:text-danger text-ink-400 transition cursor-pointer"
            title="Clear icon"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-ink-900">Select Icon</h3>
                <p className="text-xs text-ink-500">Pick from over 1,800 official Lucide icons</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ink-400 hover:text-ink-900 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons (e.g. star, code, shield, rocket)..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
                autoFocus
              />
            </div>

            {/* Tabs for quick categories */}
            {!search && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(
                  [
                    { id: "popular", label: "Popular Badges" },
                    { id: "tech", label: "Tech & Code" },
                    { id: "roles", label: "Roles & Squad" },
                    { id: "all", label: "All Icons" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer",
                      activeTab === tab.id
                        ? "bg-brand-500 text-ink-900 shadow-sm"
                        : "bg-ink-100/70 text-ink-600 hover:bg-ink-200"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Icon Grid */}
            <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[380px] pr-1">
              {filteredIcons.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-400">
                  No icons found matching &quot;{search}&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {filteredIcons.map((name) => {
                    const isSelected = value.toLowerCase() === name.toLowerCase();
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => selectIcon(name)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2.5 rounded-xl border transition group cursor-pointer text-center",
                          isSelected
                            ? "border-brand-500 bg-brand-50 text-ink-900 ring-2 ring-brand-500/40"
                            : "border-ink-100 hover:border-ink-300 hover:bg-ink-50/70 text-ink-700"
                        )}
                        title={name}
                      >
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                          <DynamicIcon name={name} className="w-5 h-5" />
                        </span>
                        <span className="text-[10px] font-medium leading-tight truncate w-full px-0.5">
                          {name}
                        </span>
                        {isSelected && (
                          <span className="absolute top-1 right-1 text-brand-600">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with current selection */}
            <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-xs">
              <span className="text-ink-500">
                Selected: <strong className="text-ink-900 font-semibold">{value || "None"}</strong>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-full bg-ink-900 hover:bg-ink-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
