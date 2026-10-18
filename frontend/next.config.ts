import type { NextConfig } from "next";

// Media uploaded through the CMS is stored by the Go backend and exposed at
// `/storage/media/...`. The API returns those paths as root-relative URLs, so the
// frontend origin has to serve them too. Single source of truth: API_URL.
const apiOrigin = (process.env.API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/storage/media/:path*",
        destination: `${apiOrigin}/storage/media/:path*`,
      },
      {
        source: "/hooks/ses/:path*",
        destination: `${apiOrigin}/hooks/ses/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' http: https: ws: wss:; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
