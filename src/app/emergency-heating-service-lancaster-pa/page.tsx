import type { Metadata } from "next";
import { HighIntentServicePage } from "@/components/high-intent-service-page";
import { brandConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Emergency Heating Service Lancaster PA",
  description: "Start emergency heating and no-heat intake for Lancaster PA homes, occupied buildings, property managers, and commercial facilities.",
  path: "/emergency-heating-service-lancaster-pa"
});

const faq = [
  {
    question: "How do I request emergency heating help in Lancaster PA?",
    answer: `Use the emergency intake form and call ${brandConfig.phone} directly for urgent no-heat situations or occupied buildings.`
  },
  {
    question: "Does emergency intake guarantee immediate dispatch?",
    answer: "No. Emergency intake helps the request get reviewed, but dispatch depends on availability, site details, safety, and follow-up confirmation."
  },
  {
    question: "What information helps emergency heating follow-up?",
    answer: "Include the full address, occupancy, system type, fuel status, issue details, access notes, and best phone number."
  }
];

export default function EmergencyHeatingServiceLancasterPage() {
  return (
    <HighIntentServicePage
      body="Start no-heat and emergency heating intake for Lancaster homes, occupied properties, facilities, farms, and commercial buildings."
      eyebrow="Emergency heating Lancaster PA"
      faq={faq}
      features={[
        { title: "No-heat details", body: "Explain what is happening, who is affected, and what heating system is involved." },
        { title: "Occupied properties", body: "Include occupancy and vulnerable-person details when relevant for human review." },
        { title: "Direct calling", body: "Urgent requests should include a phone call in addition to website intake." }
      ]}
      introBody="Emergency heating intake is for urgent heating problems, no-heat issues, and occupied buildings that need quick human review. Submit the form and call directly when timing matters."
      introTitle="No-heat and emergency heating intake for Lancaster."
      path="/emergency-heating-service-lancaster-pa"
      primaryHref="/emergency-service#intake"
      primaryLabel="Start emergency intake"
      schemaDescription="Emergency heating and no-heat intake for Lancaster PA homes, occupied buildings, property managers, and commercial facilities."
      schemaName="Emergency heating service Lancaster PA"
      secondaryHref="/emergency-service"
      secondaryLabel="Emergency service page"
      title="Emergency Heating Service in Lancaster, PA"
      urgent
    />
  );
}
