import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog-posts";

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
  "/service-areas",
  "/careers",
  "/heating-oil-delivery-lancaster-pa",
  "/furnace-repair-lancaster-pa",
  "/boiler-repair-lancaster-pa",
  "/emergency-heating-service-lancaster-pa",
  "/commercial-diesel-delivery-lancaster-pa"
];

const blogRoutes = ["/blog", ...blogPosts.map((post) => `/blog/${post.slug}`)];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  return [...routes, ...blogRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/blog" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/blog" ? 0.8 : 0.7
  }));
}
