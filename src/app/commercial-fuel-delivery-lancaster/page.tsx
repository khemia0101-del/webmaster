import type { Metadata } from "next";
import { PageHero } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { ButtonLink, Section } from "@/components/ui";
import { pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Commercial Fuel Delivery Lancaster PA",
  description: "Request commercial fuel delivery in Lancaster PA, including heating oil, diesel, off-road diesel, job-site fuel, farm fuel, and recurring account support.",
  path: "/commercial-fuel-delivery-lancaster"
});

export default function CommercialFuelDeliveryLancasterPage() {
  return (
    <>
      <JsonLd data={serviceSchema("Commercial fuel delivery Lancaster PA", "Commercial fuel delivery requests for heating oil, diesel, off-road diesel, farm fuel, job-site fuel, and recurring accounts in Lancaster and Central Pennsylvania.", "/commercial-fuel-delivery-lancaster")} />
      <PageHero
        body="Heating oil, diesel, off-road diesel, and job-site fuel requests for Lancaster businesses, property managers, farms, facilities, construction sites, and industrial users."
        eyebrow="Commercial Fuel Delivery Lancaster PA"
        primaryHref="/commercial-quote"
        primaryLabel="Request fuel quote"
        title="Commercial Fuel Delivery Lancaster"
      />
      <Section>
        <h2 className="text-3xl font-bold">Commercial fuel support for Lancaster-area operators.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[#5c6570]">
          Share your site location, expected volume, fuel type, and timing. We will review the request and follow up with the next practical step.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Heating oil delivery", "Commercial buildings, facilities, and properties can request heating oil delivery review."],
            ["Diesel and off-road diesel", "Farms, job sites, equipment operators, and facilities can request diesel or off-road diesel support."],
            ["Recurring accounts", "Businesses with repeated fuel needs can request account review for sites, timing, and expected usage."]
          ].map(([title, body]) => (
            <article className="rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-5" key={title}>
              <h3 className="font-bold text-[#0b2f4a]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5c6570]">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <ButtonLink href="/commercial-quote">Request Fuel Quote</ButtonLink>
          <ButtonLink href="/hvac-services" variant="ghost">HVAC Services</ButtonLink>
        </div>
      </Section>
    </>
  );
}
