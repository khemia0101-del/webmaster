import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LeadChatWidget } from "@/components/lead-chat-widget";
import { MobileConversionBar } from "@/components/mobile-conversion-bar";
import { JsonLd } from "@/components/structured-data";
import { brandConfig } from "@/lib/config";
import { localBusinessSchema, organizationSchema } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Conquistador Oil | Heating Oil, HVAC and Fuel Delivery in Lancaster PA",
    template: "%s | Conquistador Oil"
  },
  description: "Heating oil delivery, commercial fuel delivery, HVAC service requests, and emergency heating help from Conquistador Oil in Lancaster and Central Pennsylvania.",
  applicationName: "Conquistador Oil",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Conquistador Oil",
    description: "Heating oil, commercial fuel delivery, HVAC service requests, and emergency heating help for Lancaster and Central Pennsylvania.",
    url: "/",
    siteName: "Conquistador Oil",
    locale: "en_US",
    type: "website"
  },
  other: {
    "business:contact_data:phone_number": brandConfig.phone,
    "business:contact_data:email": brandConfig.email,
    "business:contact_data:street_address": brandConfig.streetAddress,
    "business:contact_data:locality": brandConfig.city,
    "business:contact_data:region": brandConfig.state,
    "business:contact_data:postal_code": brandConfig.postalCode
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <LeadChatWidget />
        <MobileConversionBar />
        <JsonLd data={[organizationSchema(), localBusinessSchema()]} />
      </body>
    </html>
  );
}
