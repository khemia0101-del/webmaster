import { PageHero } from "@/components/page-shell";
import { ButtonLink, Section } from "@/components/ui";

export default function CommercialFuelDeliveryLancasterPage() {
  return (
    <>
      <PageHero
        body="Heating oil, diesel, off-road diesel, and job-site fuel requests for Lancaster businesses, property managers, farms, facilities, construction sites, and industrial users."
        eyebrow="Commercial Fuel Delivery Lancaster PA"
        primaryHref="/commercial-quote"
        primaryLabel="Request fuel quote"
        title="Commercial Fuel Delivery Lancaster"
      />
      <Section>
        <h2 className="text-3xl font-bold">Commercial fuel support for Lancaster-area operators.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[#68706c]">
          Share your site location, expected volume, fuel type, and timing. We will review the request and follow up with the next practical step.
        </p>
        <div className="mt-6 flex gap-3">
          <ButtonLink href="/commercial-quote">Request Fuel Quote</ButtonLink>
          <ButtonLink href="/hvac-services" variant="ghost">HVAC Services</ButtonLink>
        </div>
      </Section>
    </>
  );
}
