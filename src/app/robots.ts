import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const indexable = process.env.SITE_INDEXABLE === "true";
  return {
    rules: indexable ? { userAgent: "*", allow: "/" } : { userAgent: "*", disallow: "/" },
  };
}
