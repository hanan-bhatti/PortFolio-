/**
 * @file app/robots.ts
 * @description Next.js route view page or layout component for robots.ts.
 * 
 * @exports
 * - robots (default): Main React component or function
 */

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/verify/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
