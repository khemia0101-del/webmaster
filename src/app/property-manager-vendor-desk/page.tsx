import { PageHero } from "@/components/page-shell";
import { ButtonLink, Section } from "@/components/ui";

export default function PropertyManagerVendorDeskPage() {
  return (
    <>
      <PageHero
        body="Fuel delivery, HVAC service requests, heating support, tank service, generator service, and multi-site account help for property managers."
        eyebrow="Property manager service support"
        primaryHref="/commercial-audit"
        primaryLabel="Request account review"
        title="Property Manager Fuel & HVAC Support"
      />
      <Section>
        <h2 className="text-3xl font-bold">Service support for multi-site properties.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[#68706c]">
          Share your properties, heating systems, fuel needs, service history, and urgent coverage concerns. We will review the account and follow up with next steps.
        </p>
        <div className="mt-6">
          <ButtonLink href="/commercial-audit">Request Account Review</ButtonLink>
        </div>
      </Section>
    </>
  );
}
