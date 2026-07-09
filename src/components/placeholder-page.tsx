import { PageHero } from "@/components/page-shell";
import { ButtonLink, Section } from "@/components/ui";

export function PlaceholderPage({ title, segment }: { title: string; segment: string }) {
  return (
    <>
      <PageHero
        body={`Phase-3 intake page for ${segment}. Requests currently route into the commercial audit and quote workflows for human review.`}
        eyebrow="Phase 3 page"
        primaryHref="/commercial-audit"
        primaryLabel="Request audit"
        title={title}
      />
      <Section>
        <h2 className="text-3xl font-bold">Ready for targeted SEO and segment-specific intake.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[#5c6570]">
          This placeholder preserves the planned page map while keeping claims conservative until contractor coverage, pricing rules, and service terms are approved.
        </p>
        <div className="mt-6 flex gap-3">
          <ButtonLink href="/commercial-audit">Request Audit</ButtonLink>
          <ButtonLink href="/commercial-quote" variant="ghost">Quote Intake</ButtonLink>
        </div>
      </Section>
    </>
  );
}
