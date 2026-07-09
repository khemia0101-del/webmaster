import type { Metadata } from "next";
import { brandConfig, coreServices, serviceAreas } from "@/lib/config";

const fallbackSiteUrl = "http://localhost:3000";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl).replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${normalized}`;
}

export function pageMetadata({
  title,
  description,
  path
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: brandConfig.name,
      locale: "en_US",
      type: "website"
    },
    robots: { index: true, follow: true }
  };
}

const address = {
  "@type": "PostalAddress",
  streetAddress: brandConfig.streetAddress,
  addressLocality: brandConfig.city,
  addressRegion: brandConfig.state,
  postalCode: brandConfig.postalCode,
  addressCountry: brandConfig.country
};

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl()}/#organization`,
    name: brandConfig.name,
    legalName: brandConfig.legalOwner,
    url: siteUrl(),
    logo: absoluteUrl("/brand/conquistador-oil-logo.png"),
    email: brandConfig.email,
    telephone: brandConfig.phone,
    foundingDate: brandConfig.foundedYear,
    address,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: brandConfig.phone,
        email: brandConfig.email,
        contactType: "customer service",
        areaServed: "Central Pennsylvania"
      }
    ]
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HVACBusiness"],
    "@id": `${siteUrl()}/#localbusiness`,
    name: brandConfig.name,
    url: siteUrl(),
    image: absoluteUrl("/brand/conquistador-oil-logo.png"),
    logo: absoluteUrl("/brand/conquistador-oil-logo.png"),
    telephone: brandConfig.phone,
    email: brandConfig.email,
    address,
    areaServed: serviceAreas.map((name) => ({ "@type": "Place", name })),
    description: "Heating oil, commercial fuel delivery, diesel delivery, HVAC service requests, and emergency heating help for Lancaster and Central Pennsylvania.",
    makesOffer: coreServices.map((service) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: service,
        areaServed: "Lancaster and Central Pennsylvania"
      }
    }))
  };
}

export function serviceSchema(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(path)}#service`,
    name,
    description,
    provider: { "@id": `${siteUrl()}/#localbusiness` },
    areaServed: serviceAreas.map((area) => ({ "@type": "Place", name: area })),
    url: absoluteUrl(path)
  };
}

export function faqSchema(items: { question: string; answer: string }[], path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absoluteUrl(path)}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function jobPostingSchema({
  title,
  description,
  path
}: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description,
    hiringOrganization: {
      "@type": "Organization",
      name: brandConfig.name,
      sameAs: siteUrl(),
      logo: absoluteUrl("/brand/conquistador-oil-logo.png")
    },
    jobLocation: {
      "@type": "Place",
      address
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: "US"
    },
    employmentType: "FULL_TIME",
    datePosted: "2026-06-29",
    validThrough: "2026-12-31",
    directApply: true,
    url: absoluteUrl(path)
  };
}
