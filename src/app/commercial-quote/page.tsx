import type { Metadata } from "next";
import { IntakeForm } from "@/components/intake-form";
import { FAQSection, PageHero, Split } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { Section } from "@/components/ui";
import { faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Request Fuel Quote Lancaster and Central PA",
  description: "Request a heating oil, diesel, off-road diesel, job-site fuel, or recurring commercial fuel quote from Conquistador Oil in Lancaster and Central Pennsylvania.",
  path: "/commercial-quote"
});

const quoteFaq = [
  {
    question: "What fuel types can I request a quote for?",
    answer: "You can request review for heating oil, diesel, off-road diesel, job-site fuel, farm fuel, and recurring commercial fuel needs."
  },
  {
    question: "What information should a commercial fuel quote include?",
    answer: "Include the delivery location, fuel type, expected volume, timing, site access notes, company name, and best contact information."
  }
];

export default function CommercialQuotePage() {
  return (
    <>
      <JsonLd data={[serviceSchema("Commercial fuel quote requests", "Commercial fuel quote requests for heating oil, diesel, off-road diesel, job-site fuel, farm fuel, and recurring fuel accounts.", "/commercial-quote"), faqSchema(quoteFaq, "/commercial-quote")]} />
      <PageHero
        body="Request heating oil, diesel, off-road diesel, job-site fuel, or recurring commercial fuel support."
        eyebrow="Commercial fuel quote"
        primaryHref="#quote"
        primaryLabel="Request quote"
        title="Commercial Fuel Quote"
      />
      <Section id="quote">
        <Split>
          <div>
            <h2 className="text-3xl font-bold">Tell us what your sites need.</h2>
            <p className="mt-4 leading-7 text-[#5c6570]">Share the basics of your fuel request so the team can review volume, sites, timing, and follow-up details.</p>
            <div className="mt-6">
              <FAQSection items={quoteFaq} />
            </div>
          </div>
          <IntakeForm
            type="commercial_quote"
            fields={[
              { label: "Name", name: "name", required: true },
              { label: "Phone", name: "phone", required: true },
              { label: "Email", name: "email", type: "email", required: true },
              { label: "Company", name: "company", required: true },
              { label: "Zone", name: "zone", required: true },
              { label: "Fuel type", name: "fuelType", required: true },
              { label: "Expected volume", name: "volume", required: true },
              { label: "Sites, timing, and delivery notes", name: "termsRequested", area: true, required: true }
            ]}
          />
        </Split>
      </Section>
    </>
  );
}
