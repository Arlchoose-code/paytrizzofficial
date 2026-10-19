import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBadgeColorStyle(color?: string): React.CSSProperties {
  if (!color) return { backgroundColor: "#FCCF00", color: "#1D2023" };
  const cleanHex = color.replace("#", "").trim();
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    // Standard perceptual luminance formula
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return {
      backgroundColor: color,
      color: yiq >= 150 ? "#1D2023" : "#FFFFFF",
      borderColor: yiq >= 150 ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.25)",
    };
  }
  return { backgroundColor: color, color: "#1D2023" };
}
