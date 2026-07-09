import { AlertTriangle, CheckCircle2, MapPin, PhoneCall } from "lucide-react";
import { FAQSection, FeatureGrid, PageHero } from "@/components/page-shell";
import { JsonLd } from "@/components/structured-data";
import { ButtonLink, Section } from "@/components/ui";
import { brandConfig } from "@/lib/config";
import { faqSchema, serviceSchema } from "@/lib/seo";

type ServicePageProps = {
  path: string;
  schemaName: string;
  schemaDescription: string;
  eyebrow: string;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  introTitle: string;
  introBody: string;
  features: { title: string; body: string }[];
  faq: { question: string; answer: string }[];
  urgent?: boolean;
};

export function HighIntentServicePage({
  path,
  schemaName,
  schemaDescription,
  eyebrow,
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref = "/commercial-quote",
  secondaryLabel = "Request quote",
  introTitle,
  introBody,
  features,
  faq,
  urgent = false
}: ServicePageProps) {
  return (
    <>
      <JsonLd data={[serviceSchema(schemaName, schemaDescription, path), faqSchema(faq, path)]} />
      <PageHero
        body={body}
        eyebrow={eyebrow}
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
        title={title}
      >
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-white/90">
          <a className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2" href={`tel:${brandConfig.phoneHref}`}>
            <PhoneCall size={16} />
            {brandConfig.phone}
          </a>
          <span className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-2">
            <MapPin size={16} />
            Lancaster and Central PA
          </span>
        </div>
      </PageHero>
      <Section className="grid gap-8 md:grid-cols-[.95fr_1.05fr] md:items-start">
        <div>
          <h2 className="text-3xl font-bold">{introTitle}</h2>
          <p className="mt-4 leading-7 text-[#5c6570]">{introBody}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={primaryHref}>{primaryLabel}</ButtonLink>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#d8c2a6] bg-[#fff9ee]/85 px-5 py-3 text-sm font-semibold text-[#101827] shadow-sm transition hover:bg-white"
              href={`tel:${brandConfig.phoneHref}`}
            >
              Call {brandConfig.phone}
            </a>
          </div>
          {urgent ? (
            <div className="mt-6 flex gap-3 rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-4">
              <AlertTriangle className="mt-1 shrink-0 text-[#b86a32]" size={20} />
              <p className="leading-7 text-[#263544]">
                If this is urgent, involves no heat, or needs immediate attention, call {brandConfig.phone} directly.
              </p>
            </div>
          ) : null}
        </div>
        <FeatureGrid items={features} />
      </Section>
      <Section className="bg-[#fff9ee]">
        <p className="mb-4 text-sm font-bold uppercase tracking-wide text-[#b86a32]">What to include</p>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            "Service address and town",
            "Fuel, system, or equipment type",
            "Timing and access notes",
            "Best phone and email for follow-up"
          ].map((item) => (
            <div className="flex gap-3 rounded-lg border border-[#d8c2a6] bg-white p-4" key={item}>
              <CheckCircle2 className="mt-1 shrink-0 text-[#b86a32]" size={18} />
              <span className="text-sm font-semibold text-[#0b2f4a]">{item}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <h2 className="mb-5 text-2xl font-bold">Common questions</h2>
        <FAQSection items={faq} />
      </Section>
    </>
  );
}
