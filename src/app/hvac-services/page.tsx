import { IntakeForm } from "@/components/intake-form";
import { FeatureGrid, PageHero, Split } from "@/components/page-shell";
import { Section } from "@/components/ui";

export default function HvacServicesPage() {
  return (
    <>
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
            <p className="mt-4 leading-7 text-[#68706c]">
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
    </>
  );
}
