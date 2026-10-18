export interface PageSection {
  id: number;
  page_id: number;
  key: string;
  type: string;
  content: any;
  sort_order: number;
  is_visible: boolean;
}

export interface PageData {
  id: number;
  key: string;
  title: string;
  is_active: boolean;
  sections: PageSection[];
  created_at?: string;
}

export interface HeroContent {
  eyebrow?: string;
  headline_line1?: string;
  headline_line2?: string;
  description?: string;
  highlight_word?: string;
  cta_primary_text?: string;
  cta_primary_link?: string;
  cta_secondary_text?: string;
  cta_secondary_link?: string;
  stats_badge?: string;
}

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || "http://127.0.0.1:8080";

export async function getPublicPage(key: string): Promise<PageData | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/pages/${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err: any) {
    if (err?.digest === "DYNAMIC_SERVER_USAGE") throw err;
    console.error(`[getPublicPage] Failed to fetch page "${key}":`, err);
    return null;
  }
}

export function getHeroSection(page: PageData | null, fallback: HeroContent): HeroContent {
  if (!page || !page.sections) return fallback;
  const section = page.sections.find((s) => s.key === "hero" || s.type === "hero");
  if (!section || !section.content) return fallback;

  let content = section.content;
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      return fallback;
    }
  }

  return {
    eyebrow: content.eyebrow || fallback.eyebrow,
    headline_line1: content.headline_line1 || fallback.headline_line1,
    headline_line2: content.headline_line2 || fallback.headline_line2,
    description: content.description || fallback.description,
    highlight_word: content.highlight_word || fallback.highlight_word,
    cta_primary_text: content.cta_primary_text || fallback.cta_primary_text,
    cta_primary_link: content.cta_primary_link || fallback.cta_primary_link,
    cta_secondary_text: content.cta_secondary_text || fallback.cta_secondary_text,
    cta_secondary_link: content.cta_secondary_link || fallback.cta_secondary_link,
    stats_badge: content.stats_badge || fallback.stats_badge,
  };
}
