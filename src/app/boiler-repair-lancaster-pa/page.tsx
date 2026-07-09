import type { Metadata } from "next";
import { HighIntentServicePage } from "@/components/high-intent-service-page";
import { brandConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Boiler Repair Lancaster PA",
  description: "Request boiler repair and heating service intake for Lancaster PA homes, commercial buildings, facilities, and property managers.",
  path: "/boiler-repair-lancaster-pa"
});

const faq = [
  {
    question: "Can I request boiler repair in Lancaster PA?",
    answer: "Yes. The HVAC service form accepts boiler service requests with address, system, issue, urgency, and contact details."
  },
  {
    question: "What boiler details should I submit?",
    answer: "Helpful details include no-heat status, system type, building type, occupancy, access notes, and any recent service history."
  },
  {
    question: "Who should call for urgent boiler or heating help?",
    answer: `If there is no heat or the issue needs immediate attention, call ${brandConfig.phone} directly and submit emergency intake details.`
  }
];

export default function BoilerRepairLancasterPage() {
  return (
    <HighIntentServicePage
      body="Request boiler service intake for heating issues, no-heat situations, occupied properties, and commercial buildings in Lancaster and Central Pennsylvania."
      eyebrow="Boiler repair Lancaster PA"
      faq={faq}
      features={[
        { title: "Boiler concerns", body: "Submit details about heat loss, uneven heating, system concerns, and service history." },
        { title: "Occupied buildings", body: "Include occupancy and urgency details for homes, offices, facilities, and managed properties." },
        { title: "Follow-up ready", body: "Address, town, phone, email, and access notes help the request move cleanly." }
      ]}
      introBody="Boiler and heating service requests should include the full address, building type, system details, urgency, and best phone number for follow-up."
      introTitle="Boiler repair and heating request intake."
      path="/boiler-repair-lancaster-pa"
      primaryHref="/hvac-services#service-request"
      primaryLabel="Request boiler service"
      schemaDescription="Boiler repair and heating service request intake for Lancaster PA homes, commercial buildings, facilities, and property managers."
      schemaName="Boiler repair Lancaster PA"
      secondaryHref="/emergency-service"
      secondaryLabel="Emergency heating help"
      title="Boiler Repair in Lancaster, PA"
      urgent
    />
  );
}
