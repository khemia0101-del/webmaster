import type { Metadata } from "next";
import { IntakeForm } from "@/components/intake-form";
import { FAQSection, FeatureGrid, PageHero, Split } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { Section } from "@/components/ui";
import { brandConfig } from "@/lib/config";
import { faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "HVAC Services Lancaster PA",
  description: "Request HVAC service in Lancaster and Central Pennsylvania for furnaces, boilers, oil burners, heat pumps, AC systems, no-heat issues, and commercial HVAC needs.",
  path: "/hvac-services"
});

const hvacFaq = [
  {
    question: "Can I request furnace or boiler repair in Lancaster PA?",
    answer: "Yes. The HVAC service form accepts requests for furnace issues, boiler concerns, oil burner problems, uneven heat, and related heating service needs in Lancaster and Central Pennsylvania."
  },
  {
    question: "Does Conquistador Oil handle no-heat or emergency heating requests?",
    answer: `Use the emergency intake or call ${brandConfig.phone} for urgent no-heat situations. A coordinator reviews urgent heating details and contact information for follow-up.`
  },
  {
    question: "Can commercial properties request HVAC service?",
    answer: "Yes. Property managers, facilities teams, farms, offices, warehouses, and job sites can submit HVAC service requests and commercial account details."
  }
];

export default function HvacServicesPage() {
  return (
    <>
      <JsonLd data={[serviceSchema("HVAC service requests", "HVAC service requests for furnaces, boilers, oil burners, heat pumps, air conditioning systems, no-heat issues, and commercial HVAC support in Lancaster and Central Pennsylvania.", "/hvac-services"), faqSchema(hvacFaq, "/hvac-services")]} />
      <PageHero
        body="Request help with heating, cooling, furnaces, boilers, oil burners, rooftop units, and commercial HVAC issues in Lancaster and Central Pennsylvania."
        eyebrow="Heating and cooling service"
        primaryHref="#service-request"
        primaryLabel="Request HVAC Service"
        secondaryHref="/emergency-service"
        secondaryLabel="Emergency Heating Help"
        title="HVAC Services"
      />
      <Section id="service-request">
        <Split>
          <div>
            <h2 className="text-3xl font-bold">Heating, cooling, and oil-burner service requests.</h2>
            <p className="mt-4 leading-7 text-[#5c6570]">
              Use this form for HVAC repair, heating service, cooling issues, oil burner trouble, boiler or furnace concerns, and commercial system support.
            </p>
            <div className="mt-6">
              <FeatureGrid
                items={[
                  { title: "Heating service", body: "No heat, uneven heat, burner problems, furnace issues, and boiler concerns." },
                  { title: "Cooling service", body: "Air conditioning and commercial HVAC service requests for occupied buildings." },
                  { title: "Commercial HVAC", body: "Service intake for property managers, facilities teams, farms, offices, and job sites." }
                ]}
              />
            </div>
          </div>
          <IntakeForm
            submitLabel="Submit HVAC request"
            type="emergency"
            fields={[
              { label: "Name", name: "name", required: true },
              { label: "Phone", name: "phone", required: true },
              { label: "Email", name: "email", type: "email" },
              { label: "Company or property", name: "company" },
              { label: "Service address", name: "siteAddress", required: true },
              { label: "Town or service area", name: "zone", placeholder: "Lancaster" },
              { label: "System type", name: "buildingType", placeholder: "Furnace, boiler, oil burner, rooftop unit, AC" },
              { label: "Urgency", name: "occupancy", placeholder: "No heat, occupied building, routine service" },
              { label: "What service do you need?", name: "issue", area: true, required: true }
            ]}
          />
        </Split>
      </Section>
      <Section>
        <h2 className="mb-5 text-2xl font-bold">HVAC service questions</h2>
        <FAQSection items={hvacFaq} />
      </Section>
    </>
  );
}
