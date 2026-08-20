"use client";

import { useRef, useState, type FormEvent } from "react";

type SubmissionState =
  | { tone: "idle"; message: string }
  | { tone: "working"; message: string }
  | { tone: "success"; message: string }
  | { tone: "error"; message: string };

type ContractorCandidate = {
  researchId: string;
  company: string;
  phone: string;
  city: string;
  serviceHint: string;
  sourceUrl: string;
  sourceLabel: string;
  targetTimeZone: string;
};

export function ContractorOutreachForm() {
  const outreachFormRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<SubmissionState>({ tone: "idle", message: "" });
  const [searchState, setSearchState] = useState<SubmissionState>({ tone: "idle", message: "" });
  const [candidates, setCandidates] = useState<ContractorCandidate[]>([]);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSearchState({ tone: "working", message: "Asking Hermes to research public business contacts..." });
    setCandidates([]);

    try {
      const response = await fetch("/api/admin/contractor-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: data.get("searchService"),
          location: data.get("searchLocation")
        })
      });
      const result = (await response.json()) as {
        error?: string;
        candidates?: ContractorCandidate[];
      };
      if (!response.ok) throw new Error(result.error || "Contractor search failed.");

      const found = result.candidates ?? [];
      setCandidates(found);
      setSearchState({
        tone: "success",
        message: found.length
          ? `Hermes returned ${found.length} sourced business ${found.length === 1 ? "candidate" : "candidates"}.`
          : "Hermes returned no candidates with both a valid U.S. phone number and a verifiable source."
      });
    } catch (error) {
      setSearchState({
        tone: "error",
        message: error instanceof Error ? error.message : "Contractor search failed."
      });
    }
  }

  function chooseCandidate(candidate: ContractorCandidate) {
    const form = outreachFormRef.current;
    if (!form) return;

    const setValue = (name: string, value: string) => {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) field.value = value;
    };

    setValue("company", candidate.company);
    setValue("phone", candidate.phone);
    setValue("city", candidate.city);
    setValue("serviceHint", candidate.serviceHint || "Hermes web result; capabilities not yet verified");
    setValue("source", `Hermes web research: ${candidate.sourceUrl}`.slice(0, 240));
    if (candidate.targetTimeZone) setValue("targetTimeZone", candidate.targetTimeZone);
    setValue("lineType", "unknown");
    setValue("consentBasis", "business_to_business");

    const confirmation = form.elements.namedItem("complianceConfirmed");
    if (confirmation instanceof HTMLInputElement) confirmation.checked = false;

    setState({
      tone: "idle",
      message: "Prospect loaded. Verify the line type, contact basis, timezone, and suppression status before authorizing a call."
    });
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ tone: "working", message: "Requesting one Vapi call..." });

    try {
      const response = await fetch("/api/admin/contractor-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: data.get("company"),
          contactName: data.get("contactName"),
          phone: data.get("phone"),
          city: data.get("city"),
          serviceHint: data.get("serviceHint"),
          source: data.get("source"),
          targetTimeZone: data.get("targetTimeZone"),
          lineType: data.get("lineType"),
          consentBasis: data.get("consentBasis"),
          complianceConfirmed: data.get("complianceConfirmed") === "on"
        })
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        callId?: string;
        leadId?: string;
      };
      if (!response.ok) throw new Error(result.error || "The call could not be started.");
      setState({
        tone: "success",
        message: `${result.message || "Call queued."} Call ${result.callId}; lead ${result.leadId}.`
      });
    } catch (error) {
      setState({
        tone: "error",
        message: error instanceof Error ? error.message : "The call could not be started."
      });
    }
  }

  const fieldClass =
    "mt-2 min-h-11 w-full rounded-md border border-[#d8c2a6] bg-white px-3 py-2 text-[#101827] outline-none focus:border-[#0b2f4a] focus:ring-2 focus:ring-[#0b2f4a]/15";

  return (
    <div className="grid gap-8">
      <form className="grid gap-5 rounded-md border border-[#d8c2a6] bg-[#fff9ee] p-4" onSubmit={search}>
        <div>
          <h3 className="font-bold">Find business candidates</h3>
          <p className="mt-1 text-sm text-[#5c6570]">
            Hermes researches public web sources and returns only structured candidates with a source link. Selecting a result never starts a call.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Contractor service
            <input className={fieldClass} name="searchService" required maxLength={100} placeholder="Oil burner repair" />
          </label>
          <label className="text-sm font-semibold">
            U.S. location
            <input className={fieldClass} name="searchLocation" required maxLength={120} placeholder="Lancaster, PA" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            className="min-h-11 rounded-md border border-[#0b2f4a] bg-white px-5 py-3 text-sm font-bold text-[#0b2f4a] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={searchState.tone === "working"}
          >
            {searchState.tone === "working" ? "Searching..." : "Find contractors"}
          </button>
          {searchState.message ? (
            <p className={searchState.tone === "error" ? "text-sm font-semibold text-[#8d2f20]" : "text-sm font-semibold text-[#5c6570]"} role="status">
              {searchState.message}
            </p>
          ) : null}
        </div>

        {candidates.length ? (
          <div className="grid gap-3 rounded-md border border-[#eadcc8] bg-white p-3">
            <p className="text-sm text-[#5c6570]">Hermes research results. Verify every source before authorizing a call.</p>
            {candidates.map((candidate) => (
              <article className="grid gap-3 rounded-md border border-[#eadcc8] p-4 md:grid-cols-[1fr_auto] md:items-center" key={candidate.researchId}>
                <div>
                  <h4 className="font-bold">{candidate.company}</h4>
                  <p className="mt-1 text-sm text-[#5c6570]">{candidate.city || "Location not returned"}</p>
                  <p className="mt-1 text-sm text-[#263544]">{candidate.phone}</p>
                  {candidate.serviceHint ? <p className="mt-1 text-sm text-[#5c6570]">{candidate.serviceHint}</p> : null}
                  <a className="mt-2 inline-block text-sm font-bold text-[#0b2f4a] underline" href={candidate.sourceUrl} target="_blank" rel="noreferrer">
                    Verify {candidate.sourceLabel}
                  </a>
                </div>
                <button
                  className="min-h-11 rounded-md bg-[#0b2f4a] px-4 py-2 text-sm font-bold text-white"
                  type="button"
                  onClick={() => chooseCandidate(candidate)}
                >
                  Use this prospect
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </form>

      <form className="grid scroll-mt-6 gap-5" onSubmit={submit} ref={outreachFormRef}>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Contractor company
          <input className={fieldClass} name="company" required maxLength={120} />
        </label>
        <label className="text-sm font-semibold">
          Contact name, if known
          <input className={fieldClass} name="contactName" maxLength={100} />
        </label>
        <label className="text-sm font-semibold">
          U.S. phone number
          <input className={fieldClass} name="phone" required inputMode="tel" placeholder="+17175550100" />
        </label>
        <label className="text-sm font-semibold">
          City or coverage clue
          <input className={fieldClass} name="city" maxLength={100} placeholder="Lancaster, PA" />
        </label>
        <label className="text-sm font-semibold">
          Unverified service hint
          <input className={fieldClass} name="serviceHint" maxLength={180} placeholder="HVAC, oil burner service" />
        </label>
        <label className="text-sm font-semibold">
          Prospect source
          <input className={fieldClass} name="source" required maxLength={240} placeholder="Application, referral, or public business directory" />
        </label>
        <label className="text-sm font-semibold">
          Prospect timezone
          <input className={fieldClass} name="targetTimeZone" required defaultValue="America/New_York" />
        </label>
        <label className="text-sm font-semibold">
          Line type
          <select className={fieldClass} name="lineType" defaultValue="business_landline">
            <option value="business_landline">Confirmed business landline</option>
            <option value="mobile">Mobile</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          Contact basis
          <select className={fieldClass} name="consentBasis" defaultValue="business_to_business">
            <option value="business_to_business">Business-to-business outreach</option>
            <option value="established_business_relationship">Established business relationship</option>
            <option value="written_consent">Documented written consent for AI-voice calls</option>
          </select>
          <span className="mt-2 block text-xs font-normal text-[#5c6570]">
            Mobile and unknown numbers are rejected unless documented written consent is selected.
          </span>
        </label>
      </div>

      <label className="flex gap-3 rounded-md border border-[#d8c2a6] bg-[#fff9ee] p-4 text-sm">
        <input className="mt-1 size-4" type="checkbox" name="complianceConfirmed" required />
        <span>
          I verified the source, contact basis, line type, local calling hours, and our internal suppression records. I am authorizing exactly one contractor qualification call.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          className="min-h-11 rounded-md bg-[#0b2f4a] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={state.tone === "working"}
        >
          {state.tone === "working" ? "Starting call..." : "Start one qualification call"}
        </button>
        {state.message ? (
          <p
            className={`text-sm font-semibold ${
              state.tone === "error"
                ? "text-[#8d2f20]"
                : state.tone === "success"
                  ? "text-[#17613a]"
                  : "text-[#5c6570]"
            }`}
            role="status"
          >
            {state.message}
          </p>
        ) : null}
      </div>
      </form>
    </div>
  );
}
