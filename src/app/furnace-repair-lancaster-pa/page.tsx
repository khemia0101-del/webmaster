import type { Metadata } from "next";
import { HighIntentServicePage } from "@/components/high-intent-service-page";
import { brandConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Furnace Repair Lancaster PA",
  description: "Request furnace repair and heating service intake for no heat, uneven heat, oil burner issues, and commercial heating concerns in Lancaster PA.",
  path: "/furnace-repair-lancaster-pa"
});

const faq = [
  {
    question: "Can I request furnace repair in Lancaster PA?",
    answer: "Yes. Use the HVAC service form to submit the service address, system type, issue, urgency, and best contact information."
  },
  {
    question: "What furnace issues should I include?",
    answer: "Include whether there is no heat, uneven heat, burner trouble, unusual sounds, recent service history, occupancy, and access notes."
  },
  {
    question: "What should I do for an urgent no-heat issue?",
    answer: `Submit emergency intake and call ${brandConfig.phone} directly if the situation is urgent or the building is occupied.`
  }
];

export default function FurnaceRepairLancasterPage() {
  return (
    <HighIntentServicePage
      body="Request furnace service intake for no heat, uneven heat, oil burner problems, occupied buildings, and commercial heating concerns."
      eyebrow="Furnace repair Lancaster PA"
      faq={faq}
      features={[
        { title: "No-heat intake", body: "Share occupancy, system type, and urgency so the request can be reviewed clearly." },
        { title: "Oil burner issues", body: "Submit burner trouble, furnace concerns, or heating service details in one form." },
        { title: "Commercial heating", body: "Property managers and facilities teams can include building and access details." }
      ]}
      introBody="Use the HVAC service form to request furnace and heating service review. Complete address, system, issue, urgency, and contact details help with follow-up."
      introTitle="Furnace repair and heating service request intake."
      path="/furnace-repair-lancaster-pa"
      primaryHref="/hvac-services#service-request"
      primaryLabel="Request furnace service"
      schemaDescription="Furnace repair and heating service request intake for no heat, uneven heat, oil burner issues, and commercial heating concerns in Lancaster PA."
      schemaName="Furnace repair Lancaster PA"
      secondaryHref="/emergency-service"
      secondaryLabel="No-heat help"
      title="Furnace Repair in Lancaster, PA"
      urgent
    />
  );
}
