import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2678400,
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  // Keep old and mistyped URLs out of 404s — every redirect preserves link equity.
  async redirects() {
    return [
      { source: "/blog/feed", destination: "/blog/rss.xml", permanent: true },
      { source: "/rss.xml", destination: "/blog/rss.xml", permanent: true },
      { source: "/portfolio", destination: "/case-studies", permanent: true },
      // Case studies moved off /works, which is now the areas-of-work page.
      { source: "/works/:slug", destination: "/case-studies/:slug", permanent: true },
      // The per-service pages are gone; the disciplines live on /works. Listed
      // explicitly so this can never shadow a static file under /public/services.
      {
        source:
          "/services/:slug(web-development|seo-and-content|digital-marketing|it-solutions|brand-and-design|growth-retainers|web-design|seo)",
        destination: "/works",
        permanent: true,
      },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
