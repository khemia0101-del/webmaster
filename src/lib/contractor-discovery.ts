import "server-only";

import { createHash } from "crypto";
import {
  validateContractorSearch,
  type ContractorSearchInput
} from "@/lib/contractor-discovery-policy";
import { normalizeUsPhone } from "@/lib/vapi-outbound-policy";

type HermesCandidate = Record<string, unknown>;

type HermesContractorResearchReply = {
  candidates?: HermesCandidate[];
  data?: { candidates?: HermesCandidate[] };
  result?: { candidates?: HermesCandidate[] };
};

export type ContractorCandidate = {
  researchId: string;
  company: string;
  phone: string;
  city: string;
  serviceHint: string;
  sourceUrl: string;
  sourceLabel: string;
  targetTimeZone: string;
};

function clean(value: unknown, maximum: number) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function publicHttpsUrl(value: unknown) {
  const candidate = clean(value, 500);
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function candidateList(reply: HermesContractorResearchReply) {
  if (Array.isArray(reply.candidates)) return reply.candidates;
  if (Array.isArray(reply.data?.candidates)) return reply.data.candidates;
  if (Array.isArray(reply.result?.candidates)) return reply.result.candidates;
  return [];
}

function validatedCandidate(candidate: HermesCandidate): ContractorCandidate | null {
  const company = clean(candidate.company ?? candidate.companyName ?? candidate.name, 120);
  const phone = normalizeUsPhone(candidate.phone ?? candidate.businessPhone);
  const sourceUrl = publicHttpsUrl(candidate.sourceUrl ?? candidate.sourceURL ?? candidate.url);
  if (!company || !phone || !sourceUrl) return null;

  const researchId = createHash("sha256")
    .update(`${company}|${phone}|${sourceUrl}`)
    .digest("hex")
    .slice(0, 16);

  return {
    researchId,
    company,
    phone,
    city: clean(candidate.city ?? candidate.location ?? candidate.address, 100),
    serviceHint: clean(candidate.serviceHint ?? candidate.services ?? candidate.service, 180),
    sourceUrl,
    sourceLabel: clean(candidate.sourceLabel ?? candidate.sourceName, 80) || "Public web source",
    targetTimeZone: clean(candidate.targetTimeZone ?? candidate.timeZone, 80)
  };
}

export async function findContractorCandidates(input: ContractorSearchInput) {
  const validated = validateContractorSearch(input);
  if (!validated.ok) throw new Error(validated.error);

  const url = process.env.HERMES_REVENUE_DESK_WEBHOOK_URL?.trim();
  if (!url) throw new Error("HERMES_REVENUE_DESK_WEBHOOK_URL is not configured.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.HERMES_REVENUE_DESK_SECRET
          ? { Authorization: `Bearer ${process.env.HERMES_REVENUE_DESK_SECRET}` }
          : {})
      },
      body: JSON.stringify({
        targetAgent: "Conquistador Revenue Desk",
        mode: "contractor_discovery",
        humanRequired: true,
        autoCallAllowed: false,
        search: {
          service: validated.search.service,
          location: validated.search.location,
          country: "US",
          maximumCandidates: 8
        },
        requiredCandidateFields: [
          "company",
          "phone",
          "city",
          "serviceHint",
          "sourceUrl",
          "sourceLabel",
          "targetTimeZone"
        ],
        guardrails: [
          "Use web research only; do not place calls or contact anyone.",
          "Return current public business contact information from a direct HTTPS source.",
          "Never guess a company, phone number, source URL, line type, consent, license, or availability.",
          "Return no more than eight candidates and no raw search pages, transcripts, or commentary.",
          "A human operator must verify and approve every candidate before Vapi is called."
        ]
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Hermes contractor research timed out.");
    }
    throw new Error("Hermes contractor research could not be reached.");
  } finally {
    clearTimeout(timeout);
  }

  const reply = (await response.json().catch(() => ({}))) as HermesContractorResearchReply;
  if (!response.ok) throw new Error(`Hermes contractor research returned HTTP ${response.status}.`);

  const seen = new Set<string>();
  const candidates = candidateList(reply)
    .map(validatedCandidate)
    .filter((candidate): candidate is ContractorCandidate => Boolean(candidate))
    .filter((candidate) => {
      if (seen.has(candidate.phone)) return false;
      seen.add(candidate.phone);
      return true;
    })
    .slice(0, 8);

  return { candidates, query: validated.search };
}
