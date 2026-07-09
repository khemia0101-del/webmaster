import { ButtonLink, Section } from "@/components/ui";

export default function NotFound() {
  return (
    <Section className="grid min-h-[55vh] content-center">
      <p className="text-sm font-bold uppercase tracking-wide text-[#b86a32]">Page not found</p>
      <h1 className="mt-3 text-4xl font-bold">This page is not available.</h1>
      <p className="mt-4 max-w-2xl text-[#5c6570]">
        The page may have moved, but you can still request HVAC service, emergency heating help, or fuel delivery from the main site.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/emergency-service" variant="ghost">Request Service</ButtonLink>
      </div>
    </Section>
  );
}
