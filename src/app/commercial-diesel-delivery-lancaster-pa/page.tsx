import type { Metadata } from "next";
import { HighIntentServicePage } from "@/components/high-intent-service-page";
import { brandConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Commercial Diesel Delivery Lancaster PA",
  description: "Request commercial diesel delivery review for Lancaster PA job sites, farms, facilities, equipment operators, and recurring fuel accounts.",
  path: "/commercial-diesel-delivery-lancaster-pa"
});

const faq = [
  {
    question: "Can commercial sites request diesel delivery in Lancaster PA?",
    answer: "Yes. Commercial operators can request diesel delivery review for job sites, facilities, farms, equipment, and recurring fuel needs."
  },
  {
    question: "What should a diesel delivery request include?",
    answer: "Include the site address, fuel type, estimated volume, timing, access notes, equipment needs, company name, and contact details."
  },
  {
    question: "How do I request commercial diesel from Conquistador Oil?",
    answer: `Submit the commercial fuel quote form, call ${brandConfig.phone}, or email ${brandConfig.email}.`
  }
];

export default function CommercialDieselDeliveryLancasterPage() {
  return (
    <HighIntentServicePage
      body="Request commercial diesel delivery review for Lancaster job sites, farms, facilities, equipment operators, and recurring fuel accounts."
      eyebrow="Commercial diesel delivery"
      faq={faq}
      features={[
        { title: "Job sites", body: "Construction and project teams can submit location, timing, access, and equipment details." },
        { title: "Facilities and farms", body: "Commercial buildings, agricultural operators, and facilities can request diesel delivery review." },
        { title: "Recurring accounts", body: "Include estimated volume, frequency, site count, and contact details for account review." }
      ]}
      introBody="Commercial diesel requests should include fuel type, estimated volume, delivery location, site access, timing, and best contact information."
      introTitle="Diesel delivery request intake for Lancaster-area commercial operators."
      path="/commercial-diesel-delivery-lancaster-pa"
      primaryHref="/commercial-quote"
      primaryLabel="Request diesel quote"
      schemaDescription="Commercial diesel delivery request intake for Lancaster PA job sites, farms, facilities, equipment operators, and recurring fuel accounts."
      schemaName="Commercial diesel delivery Lancaster PA"
      secondaryHref="/commercial-fuel-delivery-lancaster"
      secondaryLabel="Fuel delivery services"
      title="Commercial Diesel Delivery in Lancaster, PA"
    />
  );
}
