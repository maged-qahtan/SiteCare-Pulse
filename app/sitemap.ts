import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const siteUrl = "https://sitecare-pulse1.pages.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/help/`, changeFrequency: "monthly", priority: 0.5 }
  ];
}
