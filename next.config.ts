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
      { source: "/portfolio", destination: "/works", permanent: true },
      { source: "/case-studies", destination: "/works", permanent: true },
      { source: "/case-studies/:slug", destination: "/works/:slug", permanent: true },
      { source: "/services/web-design", destination: "/services/web-development", permanent: true },
      { source: "/services/seo", destination: "/services/seo-and-content", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
