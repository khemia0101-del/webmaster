"use client";

import { ButtonLink, Section } from "@/components/ui";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <Section className="grid min-h-[55vh] content-center">
      <p className="text-sm font-bold uppercase tracking-wide text-[#b4412a]">Something went wrong</p>
      <h1 className="mt-3 text-4xl font-bold">The page could not load.</h1>
      <p className="mt-4 max-w-2xl text-[#68706c]">
        Please try again. If the issue continues, use the service request page so the team can follow up.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#b4412a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#963523]"
          onClick={reset}
          type="button"
        >
          Try Again
        </button>
        <ButtonLink href="/emergency-service" variant="ghost">Request Service</ButtonLink>
      </div>
    </Section>
  );
}
