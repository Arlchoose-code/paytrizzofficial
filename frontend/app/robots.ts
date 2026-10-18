import type { MetadataRoute } from "next";
 
export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const apiBase = (process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/+$/, "");

  let allowAI = true;
  let indexTalents = true;
  let indexProjects = true;
  let indexBlog = true;

  try {
    const res = await fetch(`${apiBase}/settings`, {
      cache: "no-store",
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json();
      const data = json.data || {};
      if (data.robots_allow_ai_crawler === "false" || data.robots_allow_ai_crawler === "0") {
        allowAI = false;
      }
      if (data.robots_index_talents === "false" || data.robots_index_talents === "0") {
        indexTalents = false;
      }
      if (data.robots_index_projects === "false" || data.robots_index_projects === "0") {
        indexProjects = false;
      }
      if (data.robots_index_blog === "false" || data.robots_index_blog === "0") {
        indexBlog = false;
      }
    }
  } catch {}

  const disallowedPaths: string[] = ["/admin", "/api/admin", "/talent", "/login"];
  if (!indexTalents) disallowedPaths.push("/talents");
  if (!indexProjects) disallowedPaths.push("/projects");
  if (!indexBlog) disallowedPaths.push("/blog");

  const rules: MetadataRoute.Robots["rules"] = [
    {
      userAgent: "*",
      allow: "/",
      disallow: disallowedPaths,
    },
  ];

  if (!allowAI) {
    const aiBots = [
      "GPTBot",
      "ChatGPT-User",
      "CCBot",
      "ClaudeBot",
      "Claude-Web",
      "Google-Extended",
      "anthropic-ai",
      "Bytespider",
      "PetalBot",
      "Amazonbot",
      "Applebot-Extended",
      "Meta-ExternalAgent",
    ];
    for (const bot of aiBots) {
      (rules as any[]).push({
        userAgent: bot,
        disallow: "/",
      });
    }
  }

  return {
    rules,
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
