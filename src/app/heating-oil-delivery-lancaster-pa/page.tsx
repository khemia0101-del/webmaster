import type { Metadata } from "next";
import { HighIntentServicePage } from "@/components/high-intent-service-page";
import { brandConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Heating Oil Delivery Lancaster PA",
  description: "Request heating oil delivery review from Conquistador Oil for homes, commercial buildings, facilities, farms, and properties in Lancaster and Central Pennsylvania.",
  path: "/heating-oil-delivery-lancaster-pa"
});

const faq = [
  {
    question: "Can I request heating oil delivery in Lancaster PA?",
    answer: "Yes. Use the fuel quote form to share your delivery address, fuel type, timing, expected volume, and contact details for review."
  },
  {
    question: "What details help with a heating oil request?",
    answer: "Include the full service address, town, tank or delivery notes, timing, contact name, phone number, and email address."
  },
  {
    question: "How do I contact Conquistador Oil about heating oil?",
    answer: `Call ${brandConfig.phone}, email ${brandConfig.email}, or submit the fuel quote form on the website.`
  }
];

export default function HeatingOilDeliveryLancasterPage() {
  return (
    <HighIntentServicePage
      body="Request heating oil delivery review for Lancaster homes, facilities, farms, property portfolios, and commercial sites."
      eyebrow="Heating oil delivery"
      faq={faq}
      features={[
        { title: "Residential requests", body: "Submit heating oil delivery details for Lancaster-area homes and occupied properties." },
        { title: "Commercial buildings", body: "Facilities, offices, warehouses, and property managers can request recurring or one-time delivery review." },
        { title: "Clear follow-up", body: "Address, timing, tank notes, and contact details help the team review the next practical step." }
      ]}
      introBody="Conquistador Oil accepts heating oil delivery requests for Lancaster and Central Pennsylvania customers. Share the address, town, fuel need, timing, and access notes so the request can be reviewed."
      introTitle="Heating oil delivery requests for Lancaster and nearby communities."
      path="/heating-oil-delivery-lancaster-pa"
      primaryHref="/commercial-quote"
      primaryLabel="Request heating oil quote"
      schemaDescription="Heating oil delivery request intake for homes, commercial buildings, facilities, farms, and properties in Lancaster and Central Pennsylvania."
      schemaName="Heating oil delivery Lancaster PA"
      secondaryHref="/emergency-service"
      secondaryLabel="Emergency heating help"
      title="Heating Oil Delivery in Lancaster, PA"
    />
  );
}
