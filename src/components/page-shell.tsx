import type { ReactNode } from "react";
import { ButtonLink, Section } from "@/components/ui";

export function PageHero({
  title,
  eyebrow,
  body,
  primaryHref = "/commercial-audit",
  primaryLabel = "Request Audit",
  secondaryHref = "/emergency-service",
  secondaryLabel = "Emergency Intake",
  children
}: {
  title: string;
  eyebrow: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="hero-texture text-white">
      <Section className="grid min-h-[520px] content-center gap-8 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-[#e3b56e]">{eyebrow}</p>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">{body}</p>
          {children}
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={primaryHref}>{primaryLabel}</ButtonLink>
            <ButtonLink href={secondaryHref} variant="secondary">{secondaryLabel}</ButtonLink>
          </div>
        </div>
      </Section>
    </div>
  );
}

export function FeatureGrid({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <article className="rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-5 shadow-sm" key={item.title}>
          <h3 className="text-lg font-bold text-[#0b2f4a]">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#5c6570]">{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export function Split({ children }: { children: ReactNode }) {
  return <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-start">{children}</div>;
}

export function FAQSection({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <article className="rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-5 shadow-sm" key={item.question}>
          <h3 className="text-lg font-bold text-[#0b2f4a]">{item.question}</h3>
          <p className="mt-2 leading-7 text-[#5c6570]">{item.answer}</p>
        </article>
      ))}
    </div>
  );
}
