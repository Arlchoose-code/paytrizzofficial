import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  const apiBase = (process.env.API_URL || "http://127.0.0.1:8080/api").replace(/\/+$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/talents`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/request-project`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const [servicesRes, projectsRes, postsRes, talentsRes] = await Promise.all([
      fetch(`${apiBase}/services`, { next: { revalidate: 300 } }).catch(() => null),
      fetch(`${apiBase}/projects?per_page=100`, { next: { revalidate: 300 } }).catch(() => null),
      fetch(`${apiBase}/posts?per_page=100`, { next: { revalidate: 300 } }).catch(() => null),
      fetch(`${apiBase}/talents?per_page=100`, { next: { revalidate: 300 } }).catch(() => null),
    ]);

    if (servicesRes && servicesRes.ok) {
      const json = await servicesRes.json();
      (json.data || []).forEach((s: any) => {
        if (s.slug) {
          dynamicRoutes.push({
            url: `${baseUrl}/services/${s.slug}`,
            lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      });
    }

    if (projectsRes && projectsRes.ok) {
      const json = await projectsRes.json();
      (json.data?.data || []).forEach((p: any) => {
        if (p.slug) {
          dynamicRoutes.push({
            url: `${baseUrl}/projects/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      });
    }

    if (postsRes && postsRes.ok) {
      const json = await postsRes.json();
      (json.data?.data || []).forEach((p: any) => {
        if (p.slug) {
          dynamicRoutes.push({
            url: `${baseUrl}/blog/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      });
    }

    if (talentsRes && talentsRes.ok) {
      const json = await talentsRes.json();
      (json.data?.data || []).forEach((t: any) => {
        if (t.slug) {
          dynamicRoutes.push({
            url: `${baseUrl}/talents/${t.slug}`,
            lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      });
    }
  } catch {}

  return [...staticRoutes, ...dynamicRoutes];
}
