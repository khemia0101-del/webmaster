import Link from "next/link";
import { ContractorOutreachForm } from "@/components/contractor-outreach-form";
import { Section } from "@/components/ui";

export const dynamic = "force-dynamic";

function configured(name: string) {
  return Boolean(process.env[name]?.trim());
}

export default function ContractorOutreachPage() {
  const checks = [
    ["HERMES_REVENUE_DESK_WEBHOOK_URL", "Hermes contractor research"],
    ["VAPI_PRIVATE_KEY", "Vapi private key"],
    ["VAPI_OUTBOUND_PHONE_NUMBER_ID", "Vapi outbound phone number ID"],
    ["VAPI_OUTBOUND_WEBHOOK_SECRET", "Outbound webhook shared secret"],
    ["NEXT_PUBLIC_SITE_URL", "Production site URL"],
    ["ZOHO_SMTP_PASS", "Zoho app password"]
  ] as const;
  const ready = checks.every(([key]) => configured(key));

  return (
    <Section className="grid gap-8">
      <div>
        <Link className="text-sm font-bold text-[#0b2f4a] underline" href="/admin">
          Back to admin dashboard
        </Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-wide text-[#b86a32]">Human-approved Vapi outreach</p>
        <h1 className="mt-2 text-4xl font-bold">Contractor qualification calls</h1>
        <p className="mt-3 max-w-3xl text-[#5c6570]">
          Ask Hermes to research local business candidates or enter one manually, verify the prospect, then start a single Vapi qualification call. The virtual assistant asks permission, gathers contractor capabilities, records opt-outs, and sends only structured fields for human review.
        </p>
      </div>

      <section className="rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Runtime readiness</h2>
            <p className="mt-1 text-sm text-[#5c6570]">Secret values stay server-side and are never rendered here.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${ready ? "bg-[#dff3e7] text-[#17613a]" : "bg-[#f8dfd8] text-[#8d2f20]"}`}>
            {ready ? "Configured" : "Missing environment values"}
          </span>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {checks.map(([key, label]) => (
            <div className="rounded-md border border-[#eadcc8] bg-white p-3 text-sm" key={key}>
              <div className="font-bold">{label}</div>
              <div className={configured(key) ? "mt-1 text-[#17613a]" : "mt-1 text-[#8d2f20]"}>
                {configured(key) ? "Configured" : "Missing"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#d8c2a6] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold">Start one outreach call</h2>
        <p className="mt-2 text-sm text-[#5c6570]">
          Hermes web research supplies sourced candidates but never starts calls. Calls are restricted to 9:00 AM-5:00 PM weekdays in the prospect&apos;s timezone. This is a qualification tool, not an unattended mass dialer.
        </p>
        <div className="mt-6">
          <ContractorOutreachForm />
        </div>
      </section>

      <section className="rounded-lg border border-[#d8c2a6] bg-[#edf5f8] p-5 text-sm text-[#263544]">
        <h2 className="font-bold text-[#101827]">Operational guardrails</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>No call recording, transcript storage, or raw Vapi message history.</li>
          <li>“Do not call” ends questioning immediately and suppresses the stored number.</li>
          <li>No automatic contractor approval, job promise, pricing, payment, or document collection.</li>
          <li>Every interested contractor remains in human vetting before receiving leads.</li>
        </ul>
      </section>
    </Section>
  );
}
