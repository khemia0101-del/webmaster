import { IntakeForm } from "@/components/intake-form";
import { PageHero, Split } from "@/components/page-shell";
import { Section } from "@/components/ui";

export default function CommercialAuditPage() {
  return (
    <>
      <PageHero
        body="A simple review for businesses with recurring fuel, heating, HVAC, or multi-site service needs."
        eyebrow="Commercial account review"
        primaryHref="#audit"
        primaryLabel="Request account review"
        title="Commercial Fuel & HVAC Account Review"
      />
      <Section id="audit">
        <Split>
          <div>
            <h2 className="text-3xl font-bold">Tell us about your buildings, fuel use, and service needs.</h2>
            <p className="mt-4 leading-7 text-[#68706c]">
              This is for property managers, facilities teams, farms, offices, warehouses, and commercial operators who want help with recurring fuel, HVAC, or heating service requests.
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-[#394340]">
              <li>Fuel type, estimated usage, site count, and delivery needs.</li>
              <li>Heating, HVAC, oil burner, boiler, furnace, and emergency service concerns.</li>
              <li>Preferred follow-up timing and the best contact for the account.</li>
            </ul>
          </div>
          <IntakeForm
            type="commercial_audit"
            fields={[
              { label: "Name", name: "name", required: true },
              { label: "Phone", name: "phone", required: true },
              { label: "Email", name: "email", type: "email", required: true },
              { label: "Company", name: "company", required: true },
              { label: "Facility type", name: "facility", required: true },
              { label: "Zone", name: "zone", placeholder: "Lancaster" },
              { label: "Fuel or service type", name: "fuelType", placeholder: "Heating oil, diesel, HVAC, boiler, furnace" },
              { label: "Estimated annual gallons", name: "annualGallons", type: "number" },
              { label: "Service needs", name: "painPoints", area: true, required: true }
            ]}
          />
        </Split>
      </Section>
    </>
  );
}
