import type { Metadata } from "next";
import { FAQSection, FeatureGrid, PageHero } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { ButtonLink, Section } from "@/components/ui";
import { faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Job-Site Fuel Delivery Lancaster PA",
  description: "Request job-site fuel delivery review for construction sites, equipment, generators, diesel needs, and commercial projects in Lancaster and Central Pennsylvania.",
  path: "/job-site-fuel"
});

const jobSiteFaq = [
  {
    question: "Can construction teams request job-site fuel?",
    answer: "Yes. Construction teams and commercial job sites can request fuel delivery review for diesel, equipment fueling, generators, and recurring site needs."
  },
  {
    question: "What should a job-site fuel request include?",
    answer: "Include the job-site address, fuel type, expected volume, delivery timing, access instructions, and the best field contact."
  }
];

export default function JobSiteFuelPage() {
  return (
    <>
      <JsonLd data={[serviceSchema("Job-site fuel delivery", "Job-site fuel delivery requests for construction sites, equipment, generators, diesel needs, and commercial projects in Lancaster and Central Pennsylvania.", "/job-site-fuel"), faqSchema(jobSiteFaq, "/job-site-fuel")]} />
      <PageHero
        body="Fuel request intake for construction teams, project sites, equipment operators, and commercial crews."
        eyebrow="Job-site fuel"
        primaryHref="/commercial-quote"
        primaryLabel="Request job-site fuel"
        title="Job-Site Fuel Support"
      />
      <Section>
        <h2 className="text-3xl font-bold">Fuel support for active work sites.</h2>
        <p className="mt-4 max-w-3xl leading-7 text-[#5c6570]">
          Share job-site location, fuel type, expected volume, delivery timing, and access instructions so the request can be reviewed.
        </p>
        <div className="mt-6">
          <FeatureGrid
            items={[
              { title: "Construction sites", body: "Fuel request intake for active project sites and commercial crews." },
              { title: "Equipment and generators", body: "Submit diesel and fuel needs for equipment, generators, and site operations." },
              { title: "Recurring needs", body: "Commercial teams can include expected frequency and volume for review." }
            ]}
          />
        </div>
        <div className="mt-6">
          <ButtonLink href="/commercial-quote">Request Job-Site Fuel</ButtonLink>
        </div>
      </Section>
      <Section>
        <h2 className="mb-5 text-2xl font-bold">Job-site fuel questions</h2>
        <FAQSection items={jobSiteFaq} />
      </Section>
    </>
  );
}
