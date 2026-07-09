import type { Metadata } from "next";
import Link from "next/link";
import { FAQSection, PageHero } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { Section } from "@/components/ui";
import { brandConfig, coreServices, highIntentServiceLinks, serviceAreas } from "@/lib/config";
import { faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Service Areas Lancaster, York, Harrisburg and Central PA",
  description: "Conquistador Oil accepts heating oil, commercial fuel delivery, HVAC, emergency heating, farm fuel, job-site fuel, and off-road diesel requests across Central Pennsylvania.",
  path: "/service-areas"
});

const areaFaq = [
  {
    question: "What areas does Conquistador Oil serve?",
    answer: "Conquistador Oil reviews requests from Lancaster, York, Harrisburg, Lebanon, Ephrata, Lititz, Manheim, Columbia, Mount Joy, Reading, Berks County, and nearby Central Pennsylvania communities."
  },
  {
    question: "What services are available in these areas?",
    answer: "Available request types include heating oil delivery, commercial fuel delivery, diesel, off-road diesel, job-site fuel, HVAC service requests, emergency heating intake, and commercial account review."
  },
  {
    question: "How do I confirm service for my address?",
    answer: `Submit the relevant request form or call ${brandConfig.phone}. Include the full site address, town, service type, and timing so the request can be reviewed.`
  }
];

export default function ServiceAreasPage() {
  return (
    <>
      <JsonLd data={[serviceSchema("Central Pennsylvania service area requests", "Heating oil, commercial fuel, diesel, HVAC, emergency heating, farm fuel, job-site fuel, and off-road diesel request intake across Lancaster and Central Pennsylvania.", "/service-areas"), faqSchema(areaFaq, "/service-areas")]} />
      <PageHero
        body="Heating oil, commercial fuel delivery, diesel, HVAC service requests, and emergency heating intake for Lancaster and nearby Central Pennsylvania communities."
        eyebrow="Central Pennsylvania"
        title="Service Areas"
      />
      <Section>
        <h2 className="text-3xl font-bold">Local service-area request coverage.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[#5c6570]">
          Use the service pages to submit full address details and request type. The team reviews site location, timing, service fit, and follow-up details before confirming next steps.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {serviceAreas.map((area) => (
            <Link className="rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-5 text-[#0b2f4a]" href="/commercial-audit" key={area}>
              <span className="block font-bold">{area}</span>
              <span className="mt-2 block text-sm leading-6 text-[#5c6570]">
                Request review for {coreServices.slice(0, 4).join(", ").toLowerCase()}, HVAC, and heating support.
              </span>
            </Link>
          ))}
        </div>
      </Section>
      <Section className="bg-[#fff9ee]">
        <h2 className="text-2xl font-bold">Popular local service requests</h2>
        <p className="mt-3 max-w-3xl leading-7 text-[#5c6570]">
          These pages help customers find the right intake path for heating oil, furnace, boiler, emergency heating, and diesel delivery requests.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {highIntentServiceLinks.map((service) => (
            <Link className="rounded-lg border border-[#d8c2a6] bg-white p-4 text-sm font-bold text-[#0b2f4a]" href={service.href} key={service.href}>
              {service.label}
            </Link>
          ))}
        </div>
      </Section>
      <Section>
        <h2 className="mb-5 text-2xl font-bold">Service-area questions</h2>
        <FAQSection items={areaFaq} />
      </Section>
    </>
  );
}
