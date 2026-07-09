import type { Metadata } from "next";
import { FAQSection, FeatureGrid, PageHero } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { ButtonLink, Section } from "@/components/ui";
import { faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Farm Fuel and Heating Oil Support Central PA",
  description: "Request farm fuel, heating oil, diesel, off-road diesel, and heating support for agricultural operators in Lancaster and Central Pennsylvania.",
  path: "/farm-fuel-heating"
});

const farmFaq = [
  {
    question: "Can farms request heating oil or fuel delivery?",
    answer: "Yes. Agricultural operators can request review for heating oil, diesel, off-road diesel, and recurring fuel needs across Lancaster and Central Pennsylvania."
  },
  {
    question: "What should a farm fuel request include?",
    answer: "Include the farm location, fuel type, expected volume, tank or site access notes, timing, and the best contact for follow-up."
  }
];

export default function FarmFuelHeatingPage() {
  return (
    <>
      <JsonLd data={[serviceSchema("Farm fuel and heating support", "Farm fuel, heating oil, diesel, off-road diesel, and heating support requests for agricultural operators in Lancaster and Central Pennsylvania.", "/farm-fuel-heating"), faqSchema(farmFaq, "/farm-fuel-heating")]} />
      <PageHero
        body="Fuel and heating support requests for farms, agricultural facilities, equipment operators, and rural sites across Central Pennsylvania."
        eyebrow="Farm fuel and heating"
        primaryHref="/commercial-quote"
        primaryLabel="Request fuel quote"
        title="Farm Fuel & Heating Support"
      />
      <Section>
        <h2 className="text-3xl font-bold">Fuel request intake for agricultural operators.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[#5c6570]">
          Share the location, fuel type, expected volume, timing, and access notes so the request can be reviewed for the next practical follow-up step.
        </p>
        <div className="mt-6">
          <FeatureGrid
            items={[
              { title: "Heating oil", body: "Heating oil requests for farm buildings, shops, and rural properties." },
              { title: "Diesel and off-road diesel", body: "Fuel request intake for equipment, agricultural sites, and recurring needs." },
              { title: "Site details", body: "Access notes, timing, tank location, and contact details help speed review." }
            ]}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/commercial-quote">Request Fuel Quote</ButtonLink>
          <ButtonLink href="/commercial-audit" variant="ghost">Commercial Account Review</ButtonLink>
        </div>
      </Section>
      <Section>
        <h2 className="mb-5 text-2xl font-bold">Farm fuel questions</h2>
        <FAQSection items={farmFaq} />
      </Section>
    </>
  );
}
