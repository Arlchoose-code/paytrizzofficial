import { Suspense } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { getPublicSettings } from "@/lib/settings";

import { MaintenanceBanner } from "@/components/public/MaintenanceBanner";
import { NavigationProgressBar } from "@/components/public/NavigationProgressBar";
import { constructMetadata } from "@/lib/seo";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();
  const siteName = settings.site_name || "PayTrizz";
  const siteTagline = settings.site_tagline || "Talent Agency Platform";
  const iconUrl = settings.favicon_url || settings.site_favicon || "/favicon.ico";

  const separator = settings.title_separator !== undefined ? settings.title_separator : "—";
  const sepStr = separator ? ` ${separator} ` : " ";

  const baseMeta = await constructMetadata({
    path: "/",
    title: `${siteName}${sepStr}${siteTagline}`,
    description: settings.site_description,
  });

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

  return {
    ...baseMeta,
    metadataBase: new URL(baseUrl),
    title: {
      default: `${siteName}${sepStr}${siteTagline}`,
      template: `%s${sepStr}${siteName}`,
    },
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSettings();
  const maintenanceActive = settings.maintenance_mode === "true";

  return (
    <html lang="en" className={`${plusJakartaSans.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-ink-900 selection:bg-brand-500 selection:text-ink-900">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <MaintenanceBanner initialActive={maintenanceActive} />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
