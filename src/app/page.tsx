import { Building2, Flame, Fuel, ThermometerSun } from "lucide-react";
import { cookies } from "next/headers";
import { ExperimentBeacon } from "@/components/experiment-beacon";
import { FeatureGrid, PageHero } from "@/components/page-shell";
import { ButtonLink, Section } from "@/components/ui";
import { brandConfig, serviceAreas } from "@/lib/config";
import { getVariant } from "@/lib/experiments";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const variant = getVariant("home-hero-v1", cookieStore.get("co_home_hero_variant")?.value);

  return (
    <>
      <ExperimentBeacon experimentId="home-hero-v1" page="/" variantId={variant.id} />
      <PageHero
        body={variant.body}
        eyebrow="Fuel delivery and HVAC service"
        primaryHref={variant.primaryHref}
        primaryLabel={variant.primaryLabel || brandConfig.primaryCta}
        secondaryHref={variant.secondaryHref}
        secondaryLabel={variant.secondaryLabel}
        title={variant.headline}
      />
      <Section className="grid gap-8 md:grid-cols-[1.1fr_.9fr]">
        <div>
          <h2 className="text-3xl font-bold">One place to request fuel delivery, heating service, and HVAC help.</h2>
          <p className="mt-4 leading-7 text-[#68706c]">
            Conquistador Oil serves homes, commercial buildings, farms, property managers, and job sites that need practical help with heating oil, diesel, HVAC service, and urgent heating issues.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/emergency-service">Request Service</ButtonLink>
            <ButtonLink href="/commercial-quote" variant="ghost">Request Fuel Quote</ButtonLink>
          </div>
        </div>
        <div className="rounded-lg border border-[#d8d1c3] bg-[#fffdf8] p-6">
          <h3 className="text-xl font-bold text-[#0f4c45]">Need HVAC or heating help?</h3>
          <p className="mt-3 leading-7 text-[#68706c]">
            Send the site address, issue, and contact details. We will review the request and follow up about the next available service option.
          </p>
          <div className="mt-5">
            <ButtonLink href="/hvac-services">View HVAC Services</ButtonLink>
          </div>
        </div>
      </Section>
      <Section>
        <FeatureGrid
          items={[
            {
              title: "HVAC service",
              body: "Heating and cooling service requests for furnaces, boilers, oil burners, rooftop units, and commercial systems."
            },
            {
              title: "Heating oil and fuel",
              body: "Heating oil, diesel, off-road diesel, and job-site fuel requests for homes, facilities, farms, and commercial accounts."
            },
            {
              title: "Emergency heating help",
              body: "Urgent no-heat and heating issue intake when you need a fast, clear response path."
            }
          ]}
        />
      </Section>
      <Section className="bg-[#fffdf8]">
        <div className="grid gap-6 md:grid-cols-4">
          <div className="flex gap-3">
            <ThermometerSun className="mt-1 text-[#b4412a]" />
            <div><h3 className="font-bold">HVAC service requests</h3><p className="mt-1 text-sm text-[#68706c]">Service intake for heating, cooling, furnace, boiler, and oil burner issues.</p></div>
          </div>
          <div className="flex gap-3">
            <Fuel className="mt-1 text-[#b4412a]" />
            <div><h3 className="font-bold">Fuel delivery</h3><p className="mt-1 text-sm text-[#68706c]">Heating oil, diesel, off-road diesel, and job-site fuel requests.</p></div>
          </div>
          <div className="flex gap-3">
            <Flame className="mt-1 text-[#b4412a]" />
            <div><h3 className="font-bold">No-heat support</h3><p className="mt-1 text-sm text-[#68706c]">Emergency intake for urgent heating problems and occupied buildings.</p></div>
          </div>
          <div className="flex gap-3">
            <Building2 className="mt-1 text-[#b4412a]" />
            <div><h3 className="font-bold">Commercial accounts</h3><p className="mt-1 text-sm text-[#68706c]">Account support for facilities, farms, property portfolios, and job sites.</p></div>
          </div>
        </div>
      </Section>
      <Section>
        <h2 className="text-2xl font-bold">Service areas</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {serviceAreas.map((area) => (
            <span className="rounded-full border border-[#d8d1c3] bg-white px-3 py-2 text-sm" key={area}>{area}</span>
          ))}
        </div>
      </Section>
    </>
  );
}
