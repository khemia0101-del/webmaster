import { IntakeForm } from "@/components/intake-form";
import { FeatureGrid, PageHero, Split } from "@/components/page-shell";
import { Section } from "@/components/ui";

export default function EmergencyServicePage() {
  return (
    <>
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
            <p className="mt-4 leading-7 text-[#68706c]">
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
    </>
  );
}
