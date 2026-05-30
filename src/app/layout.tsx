import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Conquistador Oil | Fuel Delivery and HVAC Services",
    template: "%s | Conquistador Oil"
  },
  description: "Heating oil, commercial fuel delivery, HVAC service requests, and emergency heating help for Lancaster and Central Pennsylvania.",
  applicationName: "Conquistador Oil",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Conquistador Oil",
    description: "Fuel delivery, heating, and HVAC service requests for Lancaster and Central Pennsylvania.",
    url: "/",
    siteName: "Conquistador Oil",
    locale: "en_US",
    type: "website"
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
      </body>
    </html>
  );
}
