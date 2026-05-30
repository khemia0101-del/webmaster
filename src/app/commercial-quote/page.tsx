import { IntakeForm } from "@/components/intake-form";
import { PageHero, Split } from "@/components/page-shell";
import { Section } from "@/components/ui";

export default function CommercialQuotePage() {
  return (
    <>
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
            <p className="mt-4 leading-7 text-[#68706c]">Share the basics of your fuel request so the team can review volume, sites, timing, and follow-up details.</p>
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
