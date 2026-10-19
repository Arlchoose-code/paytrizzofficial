"use client";

import React from "react";
import { icons, Shield, type LucideProps } from "lucide-react";

export interface DynamicIconProps extends Omit<LucideProps, "name"> {
  name?: string | null;
  fallback?: React.ComponentType<LucideProps>;
}

/**
 * Resolves any Lucide icon name dynamically (supports PascalCase, camelCase, kebab-case, snake_case, lowercase).
 */
export function resolveLucideIcon(name?: string | null): React.ComponentType<LucideProps> {
  if (!name || typeof name !== "string") return Shield;

  const trimmed = name.trim();
  if (!trimmed) return Shield;

  // 1. Direct match in icons object
  const iconMap = icons as unknown as Record<string, React.ComponentType<LucideProps>>;
  if (iconMap[trimmed]) {
    return iconMap[trimmed];
  }

  // 2. Convert kebab-case or snake_case or spaced to PascalCase (e.g. 'code-2' -> 'Code2', 'shield-check' -> 'ShieldCheck')
  const pascal = trimmed
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");

  if (iconMap[pascal]) {
    return iconMap[pascal];
  }

  // 3. Normalized alphanumeric case-insensitive match
  const lowerAlnum = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
  const foundKey = Object.keys(iconMap).find(
    (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === lowerAlnum
  );

  if (foundKey && iconMap[foundKey]) {
    return iconMap[foundKey];
  }

  return Shield;
}

export function DynamicIcon({ name, fallback: Fallback = Shield, ...props }: DynamicIconProps) {
  const iconComponent = resolveLucideIcon(name) || Fallback;
  return React.createElement(iconComponent, props);
}
