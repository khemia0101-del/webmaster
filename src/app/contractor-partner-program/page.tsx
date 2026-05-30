import { IntakeForm } from "@/components/intake-form";
import { FeatureGrid, PageHero, Split } from "@/components/page-shell";
import { Section } from "@/components/ui";

export default function ContractorPartnerPage() {
  return (
    <>
      <PageHero
        body="For independent fuel, HVAC, heating, tank, generator, and commercial service companies interested in future routed work."
        eyebrow="Contractor application"
        primaryHref="#apply"
        primaryLabel="Apply as contractor"
        title="Contractor Partner Application"
      />
      <Section id="apply">
        <Split>
          <div>
            <h2 className="text-3xl font-bold">Apply for future partner work.</h2>
            <p className="mt-4 leading-7 text-[#68706c]">
              Tell us about your company, service area, trades, equipment, and documentation so we can review fit for future work.
            </p>
            <div className="mt-6">
              <FeatureGrid
                items={[
                  { title: "Service areas", body: "Share where you work and what types of jobs you are equipped to handle." },
                  { title: "Documentation", body: "Insurance, permits, certifications, references, and tax forms help speed review." },
                  { title: "Reliable work", body: "Approved partners can be considered for routed commercial service opportunities." }
                ]}
              />
            </div>
          </div>
          <IntakeForm
            submitLabel="Submit contractor application"
            type="contractor"
            fields={[
              { label: "Contact name", name: "name", required: true },
              { label: "Phone", name: "phone", required: true },
              { label: "Email", name: "email", type: "email", required: true },
              { label: "Company", name: "company", required: true },
              { label: "Service area", name: "zone", required: true },
              { label: "Trucks or vans", name: "equipment" },
              { label: "Trades", name: "trades", placeholder: "Fuel delivery, HVAC, oil burner, tank service" },
              { label: "Permits, insurance, certifications, and references", name: "documents", area: true, required: true }
            ]}
          />
        </Split>
      </Section>
    </>
  );
}
