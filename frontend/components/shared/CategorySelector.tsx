"use client";

import React, { useState, useEffect } from "react";
import { Plus, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  existingCategories: string[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function CategorySelector({
  value,
  onChange,
  existingCategories,
  placeholder = "e.g. frontend, backend, devops",
  required = false,
  className,
}: CategorySelectorProps) {
  // Sort and remove duplicates
  const categories = React.useMemo(() => {
    return Array.from(new Set(existingCategories.map((c) => c?.trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [existingCategories]);

  // Determine if initial value is custom (not in existing categories) or user requested new category
  const [isCreatingNew, setIsCreatingNew] = useState(
    () => categories.length === 0 || (Boolean(value) && !categories.includes(value))
  );

  useEffect(() => {
    if (categories.length === 0) {
      setIsCreatingNew(true);
    } else if (value && !categories.includes(value)) {
      setIsCreatingNew(true);
    }
  }, [categories, value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__NEW__") {
      setIsCreatingNew(true);
      onChange("");
    } else {
      setIsCreatingNew(false);
      onChange(val);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {!isCreatingNew && categories.length > 0 ? (
        <div className="flex items-center gap-2">
          <select
            value={categories.includes(value) ? value : ""}
            onChange={handleSelectChange}
            required={required}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70 cursor-pointer"
          >
            <option value="" disabled>
              Select an existing category...
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__NEW__" className="font-bold text-brand-600">
              + Add New Category...
            </option>
          </select>
          <button
            type="button"
            onClick={() => {
              setIsCreatingNew(true);
              onChange("");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-ink-200 bg-ink-50 hover:bg-brand-50 hover:border-brand-300 text-xs font-semibold text-ink-700 transition cursor-pointer"
            title="Create new category"
          >
            <Plus className="w-3.5 h-3.5 text-brand-600" />
            <span>New</span>
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              required={required}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-ink-200 text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/70"
              autoFocus={isCreatingNew && categories.length > 0}
            />
            {categories.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  if (categories.length > 0 && !categories.includes(value)) {
                    onChange(categories[0]);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-ink-200 bg-white hover:bg-ink-100 text-xs font-semibold text-ink-700 transition cursor-pointer"
                title="Choose from existing categories"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Existing</span>
              </button>
            )}
          </div>
          {categories.length > 0 && (
            <p className="text-[11px] text-ink-500">
              Typing a new category name. Or click &ldquo;Existing&rdquo; to pick from {categories.length} existing categories.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
