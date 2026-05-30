import Link from "next/link";
import { PageHero } from "@/components/page-shell";
import { Section } from "@/components/ui";
import { serviceAreas } from "@/lib/config";

export default function ServiceAreasPage() {
  return (
    <>
      <PageHero
        body="Service-area expansion follows contractor density, compliance readiness, route economics, and performance history."
        eyebrow="Central Pennsylvania"
        title="Service Areas"
      />
      <Section>
        <div className="grid gap-3 md:grid-cols-3">
          {serviceAreas.map((area) => (
            <Link className="rounded-lg border border-[#d8d1c3] bg-[#fffdf8] p-5 font-bold text-[#0f4c45]" href="/commercial-audit" key={area}>
              {area}
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
