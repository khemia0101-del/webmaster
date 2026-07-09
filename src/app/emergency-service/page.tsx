import type { Metadata } from "next";
import { IntakeForm } from "@/components/intake-form";
import { FAQSection, FeatureGrid, PageHero, Split } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { Section } from "@/components/ui";
import { brandConfig } from "@/lib/config";
import { faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Emergency Heating and No-Heat Help Lancaster PA",
  description: "Start emergency heating and HVAC intake for no-heat issues, burner problems, HVAC outages, occupied buildings, and urgent service needs in Lancaster and Central Pennsylvania.",
  path: "/emergency-service"
});

const emergencyFaq = [
  {
    question: "What should I do if there is no heat?",
    answer: `Submit the emergency intake with the site address, building type, occupancy, and issue details. For urgent help, call ${brandConfig.phone}.`
  },
  {
    question: "What information helps with emergency heating follow-up?",
    answer: "Helpful details include whether the building is occupied, vulnerable occupants are present, system type, access notes, fuel status, and the best phone number for follow-up."
  },
  {
    question: "Does emergency intake guarantee immediate dispatch?",
    answer: "No. Emergency intake helps a coordinator review the request quickly, but dispatch depends on service availability, site details, safety, and follow-up confirmation."
  }
];

export default function EmergencyServicePage() {
  return (
    <>
      <JsonLd data={[serviceSchema("Emergency heating and HVAC intake", "Emergency heating and HVAC intake for no-heat issues, burner problems, HVAC outages, occupied buildings, and urgent follow-up in Lancaster and Central Pennsylvania.", "/emergency-service"), faqSchema(emergencyFaq, "/emergency-service")]} />
      <PageHero
        body="Tell us what is happening, where service is needed, and how to reach you. A coordinator will review urgent heating and HVAC requests as quickly as possible."
        eyebrow="Emergency HVAC and heating coordination"
        primaryHref="#intake"
        primaryLabel="Start emergency intake"
        title="Emergency Service Coordination"
      />
      <Section id="intake">
        <Split>
          <div>
            <h2 className="text-3xl font-bold">Start with the details that matter.</h2>
            <p className="mt-4 leading-7 text-[#5c6570]">
              Share the site address, building type, occupancy, and issue. The more complete the intake, the faster a coordinator can understand the request.
            </p>
            <div className="mt-6">
              <FeatureGrid
                items={[
                  { title: "Heating issues", body: "No heat, burner problems, HVAC outages, and related service requests." },
                  { title: "Commercial sites", body: "Useful for offices, warehouses, retail buildings, farms, and property portfolios." },
                  { title: "Clear follow-up", body: "A coordinator can use your intake to confirm next steps and contact details." }
                ]}
              />
            </div>
          </div>
          <IntakeForm
            submitLabel="Submit emergency intake"
            type="emergency"
            fields={[
              { label: "Name", name: "name", required: true },
              { label: "Phone", name: "phone", required: true },
              { label: "Email", name: "email", type: "email" },
              { label: "Company or site", name: "company" },
              { label: "Site address", name: "siteAddress", required: true },
              { label: "Zone", name: "zone", placeholder: "Lancaster" },
              { label: "Building type", name: "buildingType", required: true },
              { label: "Occupancy", name: "occupancy", placeholder: "Staff, tenants, vulnerable occupants" },
              { label: "Issue", name: "issue", area: true, required: true, placeholder: "No heat, burner fault, HVAC outage, timing, access notes" }
            ]}
          />
        </Split>
      </Section>
      <Section>
        <h2 className="mb-5 text-2xl font-bold">Emergency heating questions</h2>
        <FAQSection items={emergencyFaq} />
      </Section>
    </>
  );
}
