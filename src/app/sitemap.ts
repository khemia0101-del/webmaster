import type { MetadataRoute } from "next";

const routes = [
  "",
  "/hvac-services",
  "/emergency-service",
  "/commercial-fuel-delivery-lancaster",
  "/commercial-quote",
  "/commercial-audit",
  "/property-manager-vendor-desk",
  "/farm-fuel-heating",
  "/off-road-diesel",
  "/job-site-fuel",
  "/service-areas"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
