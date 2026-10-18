export interface SiteSettings {
  site_name?: string;
  site_tagline?: string;
  site_description?: string;
  footer_text?: string;
  logo_url?: string;
  site_logo_light?: string;
  logo_dark_url?: string;
  site_logo_dark?: string;
  favicon_url?: string;
  site_favicon?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  contact_reply_eta_text?: string;
  title_separator?: string;
  maintenance_mode?: string;
  [key: string]: string | undefined;
}

export const DEFAULT_PUBLIC_SETTINGS: SiteSettings = {
  site_name: "PayTrizz",
  site_tagline: "Vetted Elite Tech Squads",
  site_description:
    "Talent Agency Platform connecting you with vetted specialists in development, design, and digital growth.",
  footer_text: "© 2026 PayTrizz. All rights reserved.",
  title_separator: "—",
  maintenance_mode: "false",
  contact_email: "hello@paytrizz.com",
  contact_phone: "+62 812-3456-7890",
  contact_address: "Jakarta Selatan, DKI Jakarta, Indonesia",
  contact_reply_eta_text: "1–2 business days",
  logo_url: "",
  logo_dark_url: "",
  favicon_url: "",
};

export async function getPublicSettings(): Promise<SiteSettings> {
  const isServer = typeof window === "undefined";
  const apiBase = isServer
    ? (process.env.API_URL || "http://localhost:8080/api").replace(/\/+$/, "")
    : "/api/proxy";

  try {
    const fetchOptions: RequestInit = { cache: "no-store" };

    const res = await fetch(`${apiBase}/settings`, fetchOptions).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      if (json && json.data) {
        const data = json.data as Record<string, string>;
        const logoUrl = data.logo_url || data.site_logo_light || "";
        const logoDarkUrl = data.logo_dark_url || data.site_logo_dark || logoUrl;
        const faviconUrl = data.favicon_url || data.site_favicon || "";

        return {
          ...DEFAULT_PUBLIC_SETTINGS,
          ...data,
          logo_url: logoUrl,
          site_logo_light: logoUrl,
          logo_dark_url: logoDarkUrl,
          site_logo_dark: logoDarkUrl,
          favicon_url: faviconUrl,
          site_favicon: faviconUrl,
        };
      }
    }
  } catch {
    // Graceful fallback to default settings
  }

  return { ...DEFAULT_PUBLIC_SETTINGS };
}
