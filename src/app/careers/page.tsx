import type { Metadata } from "next";
import { IntakeForm } from "@/components/intake-form";
import { FAQSection, FeatureGrid, PageHero, Split } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { Section } from "@/components/ui";
import { brandConfig } from "@/lib/config";
import { faqSchema, jobPostingSchema, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "CDL Driver and HVAC Technician Jobs Lancaster PA",
  description: "Apply for CDL fuel delivery driver and licensed HVAC technician opportunities with Conquistador Oil in Lancaster and Central Pennsylvania.",
  path: "/careers"
});

const careersFaq = [
  {
    question: "Is Conquistador Oil hiring CDL drivers?",
    answer: "Yes. CDL fuel delivery driver applicants can submit license details, delivery experience, availability, service area, and contact information through the careers form."
  },
  {
    question: "Is Conquistador Oil hiring HVAC technicians?",
    answer: "Yes. Licensed and experienced HVAC technicians can apply with certification details, system experience, years of experience, and availability."
  },
  {
    question: "How do applicants contact Conquistador Oil?",
    answer: `Applicants can use the careers form, call ${brandConfig.phone}, or email ${brandConfig.email}.`
  }
];

export default function CareersPage() {
  return (
    <>
      <JsonLd
        data={[
          jobPostingSchema({
            title: "CDL Fuel Delivery Driver",
            description: "Conquistador Oil is reviewing applications from reliable CDL fuel delivery drivers serving Lancaster and Central Pennsylvania. Applicants should share CDL details, delivery experience, service area, availability, and contact information.",
            path: "/careers"
          }),
          jobPostingSchema({
            title: "Licensed HVAC Technician",
            description: "Conquistador Oil is reviewing applications from licensed and experienced HVAC technicians serving Lancaster and Central Pennsylvania. Applicants should share license or certification details, system experience, years of experience, availability, and contact information.",
            path: "/careers"
          }),
          faqSchema(careersFaq, "/careers")
        ]}
      />
      <PageHero
        body="Apply for CDL fuel delivery driver and licensed HVAC technician opportunities serving Lancaster and Central Pennsylvania."
        eyebrow="Careers"
        primaryHref="#apply"
        primaryLabel="Apply now"
        secondaryHref="/hvac-services"
        secondaryLabel="View services"
        title="Join Conquistador Oil"
      />
      <Section id="apply">
        <Split>
          <div>
            <h2 className="text-3xl font-bold">We are hiring field-ready professionals.</h2>
            <p className="mt-4 leading-7 text-[#5c6570]">
              Conquistador Oil is reviewing applications from reliable CDL drivers and licensed, experienced HVAC technicians. Share your credentials, experience, availability, and service area so we can follow up about next steps.
            </p>
            <div className="mt-6">
              <FeatureGrid
                items={[
                  {
                    title: "CDL drivers",
                    body: "Fuel and heating oil delivery applicants should include CDL details, delivery experience, and availability."
                  },
                  {
                    title: "HVAC technicians",
                    body: "HVAC applicants should include licenses, certifications, system experience, and service strengths."
                  },
                  {
                    title: "Experienced applicants",
                    body: "We are prioritizing dependable people with field experience, clear communication, and strong customer service."
                  }
                ]}
              />
            </div>
            <div className="mt-6">
              <FAQSection items={careersFaq} />
            </div>
          </div>
          <IntakeForm
            source="Website Careers"
            submitLabel="Submit application"
            type="hiring"
            fields={[
              { label: "Full name", name: "name", required: true },
              { label: "Phone", name: "phone", required: true },
              { label: "Email", name: "email", type: "email", required: true },
              { label: "Role interested in", name: "roleInterest", placeholder: "CDL Driver or HVAC Technician", required: true },
              { label: "License or certification details", name: "licenseDetails", required: true },
              { label: "Years of experience", name: "yearsExperience", placeholder: "Example: 5 years", required: true },
              { label: "Service area or location", name: "zone", placeholder: "Lancaster, York, Harrisburg, etc.", required: true },
              { label: "Availability", name: "availability", placeholder: "Full-time, part-time, weekends, emergency coverage" },
              { label: "Work history or notes", name: "workHistory", area: true, required: true }
            ]}
          />
        </Split>
      </Section>
    </>
  );
}
