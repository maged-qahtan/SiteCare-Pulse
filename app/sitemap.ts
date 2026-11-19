import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const siteUrl = "https://sitecare-pulse1.pages.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/help/`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/pricing/`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/terms/`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacy/`, changeFrequency: "yearly", priority: 0.2 }
  ];
}
