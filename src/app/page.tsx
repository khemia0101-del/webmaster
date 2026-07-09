import { BriefcaseBusiness, Building2, CheckCircle2, Clock, Flame, Fuel, MapPin, PhoneCall, Star, ThermometerSun } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { ExperimentBeacon } from "@/components/experiment-beacon";
import { FAQSection, FeatureGrid, PageHero } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { ButtonLink, Section } from "@/components/ui";
import { brandConfig, coreServices, highIntentServiceLinks, serviceAreas } from "@/lib/config";
import { getVariant } from "@/lib/experiments";
import { faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Heating Oil, HVAC Service and Fuel Delivery Lancaster PA",
  description: "Conquistador Oil helps Lancaster and Central Pennsylvania customers request heating oil delivery, commercial fuel delivery, HVAC service, no-heat help, and fuel quotes.",
  path: "/"
});

const homeFaq = [
  {
    question: "What does Conquistador Oil help with in Lancaster PA?",
    answer: "Conquistador Oil helps customers request heating oil delivery, commercial fuel delivery, HVAC service, emergency heating help, and commercial account support in Lancaster and Central Pennsylvania."
  },
  {
    question: "How do I contact Conquistador Oil?",
    answer: `Call ${brandConfig.phone} or email ${brandConfig.email}. The business address is ${brandConfig.streetAddress}, ${brandConfig.city}, ${brandConfig.state} ${brandConfig.postalCode}.`
  },
  {
    question: "Does Conquistador Oil serve areas beyond Lancaster?",
    answer: "The site accepts requests from Lancaster, York, Harrisburg, Lebanon, Ephrata, Lititz, Manheim, Columbia, Mount Joy, Reading, Berks County, and nearby Central Pennsylvania communities."
  }
];

const trustHeadline = `Serving Lancaster since ${brandConfig.foundedYear} with heating oil, fuel, and HVAC request support.`;

const trustImages = [
  {
    alt: "Illustrated heating oil delivery truck placeholder",
    src: "/brand/placeholder-oil-delivery.svg"
  },
  {
    alt: "Illustrated HVAC service placeholder",
    src: "/brand/placeholder-hvac-service.svg"
  },
  {
    alt: "Illustrated local service building placeholder",
    src: "/brand/placeholder-local-building.svg"
  }
];

export default async function Home() {
  const cookieStore = await cookies();
  const variant = getVariant("home-hero-v1", cookieStore.get("co_home_hero_variant")?.value);

  return (
    <>
      <ExperimentBeacon experimentId="home-hero-v1" page="/" variantId={variant.id} />
      <JsonLd
        data={[
          serviceSchema("Heating oil, HVAC and commercial fuel service requests", "Heating oil delivery, commercial fuel delivery, HVAC service requests, and emergency heating help for Lancaster and Central Pennsylvania.", "/"),
          faqSchema(homeFaq, "/")
        ]}
      />
      <PageHero
        body="Request heating oil delivery, commercial fuel delivery, HVAC service, furnace or boiler help, and emergency no-heat intake from a Lancaster-based team."
        eyebrow="Lancaster PA heating oil and HVAC"
        primaryHref={variant.primaryHref}
        primaryLabel={variant.primaryLabel || brandConfig.primaryCta}
        secondaryHref={variant.secondaryHref}
        secondaryLabel={variant.secondaryLabel}
        title="Heating Oil Delivery and HVAC Service in Lancaster, PA"
      >
        <div className="mt-6 grid gap-3 text-sm font-semibold text-white/90 sm:grid-cols-3">
          <a className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2" href={`tel:${brandConfig.phoneHref}`}>
            <PhoneCall size={16} />
            {brandConfig.phone}
          </a>
          <span className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2">
            <MapPin size={16} />
            {brandConfig.city}, {brandConfig.state}
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2">
            <Clock size={16} />
            Call for current availability
          </span>
        </div>
      </PageHero>
      <Section className="grid gap-8 md:grid-cols-[1.1fr_.9fr]">
        <div>
          <h2 className="text-3xl font-bold">One place to request fuel delivery, heating service, and HVAC help.</h2>
          <p className="mt-4 leading-7 text-[#5c6570]">
            Conquistador Oil serves homes, commercial buildings, farms, property managers, and job sites that need practical help with heating oil, diesel, HVAC service, and urgent heating issues.
          </p>
          <address className="mt-4 not-italic leading-7 text-[#263544]">
            <div>{brandConfig.streetAddress}, {brandConfig.city}, {brandConfig.state} {brandConfig.postalCode}</div>
            <a className="font-semibold text-[#0b2f4a] hover:text-[#b86a32]" href={`tel:${brandConfig.phoneHref}`}>{brandConfig.phone}</a>
            <span> | </span>
            <a className="font-semibold text-[#0b2f4a] hover:text-[#b86a32]" href={`mailto:${brandConfig.email}`}>{brandConfig.email}</a>
          </address>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/emergency-service">Request Service</ButtonLink>
            <ButtonLink href="/commercial-quote" variant="ghost">Request Fuel Quote</ButtonLink>
          </div>
        </div>
        <div className="rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-6">
          <h3 className="text-xl font-bold text-[#0b2f4a]">Need HVAC or heating help?</h3>
          <p className="mt-3 leading-7 text-[#5c6570]">
            Send the site address, issue, and contact details. We will review the request and follow up about the next available service option.
          </p>
          <div className="mt-5">
            <ButtonLink href="/hvac-services">View HVAC Services</ButtonLink>
          </div>
        </div>
      </Section>
      <Section className="grid gap-8 md:grid-cols-[.95fr_1.05fr] md:items-center">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-[#b86a32]">Local trust</p>
          <h2 className="text-3xl font-bold">{trustHeadline}</h2>
          <p className="mt-4 leading-7 text-[#5c6570]">
            Customers can call, submit a service request, or send a chat message with the site address, service type, and best contact details. For urgent no-heat issues, call directly so the request can be reviewed quickly.
          </p>
          <div className="mt-5 grid gap-3 text-sm font-semibold sm:grid-cols-2">
            {[
              `${brandConfig.streetAddress}, ${brandConfig.city}, ${brandConfig.state} ${brandConfig.postalCode}`,
              brandConfig.phone,
              brandConfig.email,
              "Call for current availability"
            ].map((item) => (
              <div className="rounded-md border border-[#d8c2a6] bg-white px-3 py-2 text-[#0b2f4a]" key={item}>{item}</div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {trustImages.map((image) => (
            <div className="overflow-hidden rounded-lg border border-[#d8c2a6] bg-[#071d32] shadow-sm" key={image.src}>
              <Image alt={image.alt} className="h-48 w-full object-cover" height={900} src={image.src} width={1200} />
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <p className="mb-4 text-sm font-bold uppercase tracking-wide text-[#b86a32]">Core services</p>
        <FeatureGrid
          items={coreServices.slice(0, 6).map((service) => ({
            title: service,
            body: `${service} requests are reviewed for Lancaster and Central Pennsylvania customers with follow-up based on the details submitted.`
          }))}
        />
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {highIntentServiceLinks.map((service) => (
            <a className="rounded-lg border border-[#d8c2a6] bg-white p-4 text-sm font-bold text-[#0b2f4a] transition hover:border-[#b86a32]" href={service.href} key={service.href}>
              {service.label.replace(" Lancaster PA", "")}
            </a>
          ))}
        </div>
      </Section>
      <Section className="grid gap-8 md:grid-cols-[1fr_1fr]">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-[#b86a32]">What happens next</p>
          <h2 className="text-3xl font-bold">A clear path from request to follow-up.</h2>
          <div className="mt-6 grid gap-4">
            {[
              "Send the address, service type, issue, and best contact details.",
              "Conquistador Oil reviews the request details and service fit.",
              "You are contacted by phone or email about practical next steps.",
              `If the issue is urgent or no heat is involved, call ${brandConfig.phone} directly.`
            ].map((step) => (
              <div className="flex gap-3 rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-4" key={step}>
                <CheckCircle2 className="mt-1 shrink-0 text-[#b86a32]" size={20} />
                <p className="leading-7 text-[#263544]">{step}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-6">
          <div className="flex items-start gap-3">
            <Star className="mt-1 text-[#b86a32]" />
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#b86a32]">Reviews and local proof</p>
              <h2 className="mt-3 text-2xl font-bold">Check the Google listing before you request service.</h2>
              <p className="mt-3 leading-7 text-[#5c6570]">
                For current public reviews, directions, and listing details, search for Conquistador Oil Heating & Air Conditioning in Lancaster, PA. Customers who have worked with the business can also share feedback there.
              </p>
              <a
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-[#b86a32] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#935126]"
                href="https://www.google.com/search?q=Conquistador+Oil+Heating+%26+Air+Conditioning+Lancaster+PA"
                rel="noreferrer"
                target="_blank"
              >
                View Google listing
              </a>
            </div>
          </div>
        </div>
      </Section>
      <Section className="grid gap-8 md:grid-cols-[.9fr_1.1fr] md:items-center">
        <div className="rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-6">
          <div className="flex items-start gap-3">
            <BriefcaseBusiness className="mt-1 text-[#b86a32]" />
            <div>
              <h2 className="text-2xl font-bold">Now hiring CDL drivers and HVAC technicians.</h2>
              <p className="mt-3 leading-7 text-[#5c6570]">
                Conquistador Oil is looking for reliable CDL fuel delivery drivers and licensed, experienced HVAC technicians serving Lancaster and Central Pennsylvania.
              </p>
              <div className="mt-5">
                <ButtonLink href="/careers">Apply for a role</ButtonLink>
              </div>
            </div>
          </div>
        </div>
        <FeatureGrid
          items={[
            {
              title: "CDL drivers",
              body: "Apply for fuel and oil delivery work if you have CDL driving experience and a dependable service mindset."
            },
            {
              title: "HVAC technicians",
              body: "Apply for heating and cooling service opportunities if you are licensed, experienced, and ready for field work."
            },
            {
              title: "Local service",
              body: "Tell us your availability, credentials, service area, and experience so we can review fit quickly."
            }
          ]}
        />
      </Section>
      <Section className="bg-[#fff9ee]">
        <div className="grid gap-6 md:grid-cols-4">
          <div className="flex gap-3">
            <ThermometerSun className="mt-1 text-[#b86a32]" />
            <div><h3 className="font-bold">HVAC service requests</h3><p className="mt-1 text-sm text-[#5c6570]">Service intake for heating, cooling, furnace, boiler, and oil burner issues.</p></div>
          </div>
          <div className="flex gap-3">
            <Fuel className="mt-1 text-[#b86a32]" />
            <div><h3 className="font-bold">Fuel delivery</h3><p className="mt-1 text-sm text-[#5c6570]">Heating oil, diesel, off-road diesel, and job-site fuel requests.</p></div>
          </div>
          <div className="flex gap-3">
            <Flame className="mt-1 text-[#b86a32]" />
            <div><h3 className="font-bold">No-heat support</h3><p className="mt-1 text-sm text-[#5c6570]">Emergency intake for urgent heating problems and occupied buildings.</p></div>
          </div>
          <div className="flex gap-3">
            <Building2 className="mt-1 text-[#b86a32]" />
            <div><h3 className="font-bold">Commercial accounts</h3><p className="mt-1 text-sm text-[#5c6570]">Account support for facilities, farms, property portfolios, and job sites.</p></div>
          </div>
        </div>
      </Section>
      <Section>
        <h2 className="text-2xl font-bold">Service areas</h2>
        <p className="mt-3 max-w-3xl leading-7 text-[#5c6570]">
          Conquistador Oil reviews fuel, heating, and HVAC service requests across Lancaster and nearby Central Pennsylvania communities.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {serviceAreas.map((area) => (
            <span className="rounded-full border border-[#d8c2a6] bg-white px-3 py-2 text-sm" key={area}>{area}</span>
          ))}
        </div>
      </Section>
      <Section>
        <h2 className="mb-5 text-2xl font-bold">Common questions</h2>
        <FAQSection items={homeFaq} />
      </Section>
    </>
  );
}
