import type { Metadata } from "next";
import { FAQSection, FeatureGrid, PageHero } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { ButtonLink, Section } from "@/components/ui";
import { faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Off-Road Diesel Delivery Central PA",
  description: "Request off-road diesel delivery review for equipment, farms, construction sites, facilities, and commercial operators in Lancaster and Central Pennsylvania.",
  path: "/off-road-diesel"
});

const dieselFaq = [
  {
    question: "Who can request off-road diesel delivery?",
    answer: "Farms, construction sites, facilities, equipment operators, and commercial sites can submit off-road diesel delivery requests for review."
  },
  {
    question: "What details help with an off-road diesel request?",
    answer: "Helpful details include site address, fuel volume, tank or equipment access, delivery timing, and the best contact person."
  }
];

export default function OffRoadDieselPage() {
  return (
    <>
      <JsonLd data={[serviceSchema("Off-road diesel delivery", "Off-road diesel delivery requests for equipment, farms, construction sites, facilities, and commercial operators in Lancaster and Central Pennsylvania.", "/off-road-diesel"), faqSchema(dieselFaq, "/off-road-diesel")]} />
      <PageHero
        body="Request off-road diesel support for equipment, farms, job sites, and commercial operations in Lancaster and Central Pennsylvania."
        eyebrow="Off-road diesel"
        primaryHref="/commercial-quote"
        primaryLabel="Request diesel quote"
        title="Off-Road Diesel Delivery Central PA"
      />
      <Section>
        <h2 className="text-3xl font-bold">Off-road diesel request intake.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[#5c6570]">
          Submit your location, expected volume, timing, access notes, and fuel details so the request can be reviewed.
        </p>
        <div className="mt-6">
          <FeatureGrid
            items={[
              { title: "Equipment fuel", body: "Request review for equipment and non-road diesel needs." },
              { title: "Farm and site support", body: "Useful for farms, job sites, facilities, and operators with recurring needs." },
              { title: "Clear access notes", body: "Tank location, delivery windows, and site restrictions help with follow-up." }
            ]}
          />
        </div>
        <div className="mt-6">
          <ButtonLink href="/commercial-quote">Request Diesel Quote</ButtonLink>
        </div>
      </Section>
      <Section>
        <h2 className="mb-5 text-2xl font-bold">Off-road diesel questions</h2>
        <FAQSection items={dieselFaq} />
      </Section>
    </>
  );
}
