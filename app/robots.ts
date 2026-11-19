import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/help/"],
      disallow: ["/dashboard/", "/clients/", "/sites/", "/requests/", "/reports/", "/sla-settings/", "/team/", "/setup/", "/reset-password/", "/auth/"]
    },
    sitemap: "https://sitecare-pulse1.pages.dev/sitemap.xml"
  };
}
