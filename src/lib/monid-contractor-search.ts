import { createHash } from "crypto";
import { normalizeUsPhone } from "./vapi-outbound-policy";

export type MonidBusiness = {
  title?: unknown;
  phone?: unknown;
  address?: unknown;
  website?: unknown;
  place_id?: unknown;
  type?: unknown;
};

export type MonidContractorCandidate = {
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
  return String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maximum);
}

export function mapMonidBusinesses(value: unknown): MonidContractorCandidate[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const candidates: MonidContractorCandidate[] = [];

  for (const item of value as MonidBusiness[]) {
    const company = clean(item.title, 120);
    const phone = normalizeUsPhone(item.phone);
    const placeId = clean(item.place_id, 160);
    if (!company || !phone || !placeId || seen.has(phone)) continue;
    seen.add(phone);

    const sourceUrl = `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
    candidates.push({
      researchId: createHash("sha256").update(`monid|${placeId}|${phone}`).digest("hex").slice(0, 16),
      company,
      phone,
      city: clean(item.address, 100),
      serviceHint: clean(item.type, 180),
      sourceUrl,
      sourceLabel: "Google Maps via Monid",
      // The search result does not identify a business timezone. The caller must verify it.
      targetTimeZone: ""
    });
    if (candidates.length === 8) break;
  }
  return candidates;
}

export async function searchMonidContractors(service: string, location: string) {
  const token = process.env.MONID_API_KEY?.trim();
  if (!token) throw new Error("MONID_API_KEY is not configured.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  let response: Response;
  try {
    response = await fetch("https://api.monid.ai/v1/run", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        provider: "litescrape",
        endpoint: "/google/maps",
        input: { queryParams: { q: service, type: "search", location, m: 25_000, gl: "us" } }
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("Monid contractor search timed out.");
    throw new Error("Monid contractor search could not be reached.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) throw new Error(`Monid contractor search returned HTTP ${response.status}.`);
  const reply = (await response.json()) as {
    status?: string;
    providerResponse?: { httpStatus?: number };
    output?: { local_results?: unknown };
  };
  if (reply.status !== "COMPLETED" || reply.providerResponse?.httpStatus !== 200) {
    throw new Error("Monid contractor search did not complete successfully.");
  }
  return mapMonidBusinesses(reply.output?.local_results);
}
