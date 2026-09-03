import { createHmac, createHash } from "node:crypto";
import { isIP } from "node:net";
import { consumePublicRateLimit, shouldUseSupabase } from "@/lib/supabase-store";
import { getExperiment } from "@/lib/experiments";

export class PublicRequestError extends Error {
  constructor(message: string, public status = 400, public retryAfter?: number) { super(message); }
}

export function publicErrorResponse(error: unknown) {
  if (!(error instanceof PublicRequestError)) return null;
  return Response.json({ error: error.message }, {
    status: error.status,
    headers: { "Cache-Control": "no-store", ...(error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}) }
  });
}

// Development-only counters; production always uses the atomic Supabase RPC.
const localLimits = new Map<string, { count: number; reset: number }>();
export function consumeLocalLimit(key: string, limit: number, seconds: number, now = Date.now()) {
  for (const [id, value] of localLimits) if (value.reset <= now) localLimits.delete(id);
  if (localLimits.size > 10_000) throw new PublicRequestError("Please try again later.", 503);
  const value = localLimits.get(key) ?? { count: 0, reset: now + seconds * 1000 };
  value.count += 1;
  localLimits.set(key, value);
  return { allowed: value.count <= limit, retryAfter: Math.max(1, Math.ceil((value.reset - now) / 1000)) };
}

export function requestIdentity(request: Request, env: Readonly<Record<string, string | undefined>> = process.env) {
  // Only trust the header when our platform is Vercel, which overwrites it.
  // Self-hosted production shares one conservative bucket until a trusted proxy is implemented.
  const candidate = env.VERCEL ? request.headers.get("x-vercel-forwarded-for")?.trim() : undefined;
  const ip = candidate && isIP(candidate) ? candidate : "shared";
  const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret && (env.VERCEL || env.NODE_ENV === "production")) {
    throw new PublicRequestError("Service temporarily unavailable. Please call (717) 397-9800.", 503);
  }
  return createHmac("sha256", secret || "local-development-only").update(ip).digest("hex");
}

export async function guardPublicRequest(request: Request, scope: "leads" | "impressions") {
  const origin = request.headers.get("origin");
  const allowed = new Set([new URL(request.url).origin]);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try { allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin); } catch { /* invalid configuration cannot add an origin */ }
  }
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && !allowed.has(origin))) {
    throw new PublicRequestError("Request origin not allowed.", 403);
  }
  const limit = scope === "leads" ? 10 : 60;
  const seconds = 900;
  try {
    const key = `${scope}:${requestIdentity(request)}`;
    const result = shouldUseSupabase()
      ? await consumePublicRateLimit(key, limit, seconds)
      : consumeLocalLimit(key, limit, seconds);
    if (!result.allowed) throw new PublicRequestError("Too many requests. Please try later or call (717) 397-9800.", 429, result.retryAfter);
  } catch (error) {
    if (error instanceof PublicRequestError) throw error;
    throw new PublicRequestError("Service temporarily unavailable. Please call (717) 397-9800.", 503);
  }
}

export async function boundedBody(request: Request, maxBytes: number) {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new PublicRequestError("Request is too large.", 413);
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          throw new PublicRequestError("Request is too large.", 413);
        }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
  }
  return Buffer.concat(chunks);
}

export async function publicJson(request: Request, maxBytes = 16_384): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new PublicRequestError("Expected JSON.", 415);
  }
  const bytes = await boundedBody(request, maxBytes);
  try {
    const value = JSON.parse(bytes.toString("utf8"));
    if (!value || Array.isArray(value) || typeof value !== "object") throw new Error();
    return value;
  } catch { throw new PublicRequestError("Invalid JSON request."); }
}

export function stringFields(value: Record<string, unknown>, allowed: string[]) {
  const clean: Record<string, string> = {};
  for (const [key, text] of Object.entries(value)) {
    if (!allowed.includes(key) || typeof text !== "string") throw new PublicRequestError("Unexpected request field.");
    const max = ["question", "issue", "documents", "termsRequested", "workHistory", "painPoints"].includes(key) ? 4000 : 300;
    if (text.length > max || text.includes("\0")) throw new PublicRequestError("A request field is too long or invalid.");
    clean[key] = text.trim();
  }
  if (clean.website) throw new PublicRequestError("Unable to accept this request.");
  if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) throw new PublicRequestError("Please enter a valid email.");
  if (clean.phone && (!/^[+\d\s().x-]{7,40}$/i.test(clean.phone) || clean.phone.replace(/\D/g, "").length < 7)) {
    throw new PublicRequestError("Please enter a valid phone number.");
  }
  return clean;
}

export const intakeFields = ["fallbackType", "source", "name", "email", "phone", "company", "zone", "fuelType", "volume", "termsRequested", "siteAddress", "buildingType", "occupancy", "issue", "equipment", "trades", "documents", "roleInterest", "licenseDetails", "yearsExperience", "availability", "workHistory", "facility", "annualGallons", "painPoints", "experimentId", "variantId", "website"];
export const leadTypes = ["emergency", "commercial_audit", "contractor", "commercial_quote", "fuel", "property_manager", "hiring", "other"] as const;

export async function publicForm(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (!/^(multipart\/form-data;|application\/x-www-form-urlencoded(?:;|$))/i.test(contentType)) throw new PublicRequestError("Expected form data.", 415);
  const bytes = await boundedBody(request, 32_768);
  let form: FormData;
  try { form = await new Response(bytes, { headers: { "Content-Type": contentType } }).formData(); }
  catch { throw new PublicRequestError("Invalid form data."); }
  const values: Record<string, unknown> = Object.create(null);
  for (const [key, value] of form) {
    if (Object.hasOwn(values, key)) throw new PublicRequestError("Duplicate form field.");
    values[key] = value;
  }
  const clean = stringFields(values, intakeFields);
  if (!clean.name || (!clean.phone && !clean.email)) throw new PublicRequestError("Please provide your name and a phone number or email.");
  if (!leadTypes.some((type) => type === (clean.fallbackType || "other"))) throw new PublicRequestError("Unknown intake type.");
  const result = new FormData();
  for (const [key, value] of Object.entries(clean)) if (key !== "website") result.set(key, value);
  result.set("source", "Website"); // Public callers cannot impersonate Vapi or internal sources.
  if (!validExperiment(clean.experimentId, clean.variantId, "/", request)) {
    result.delete("experimentId");
    result.delete("variantId");
  }
  return result;
}

export function cookieValue(request: Request, name: string) {
  return request.headers.get("cookie")?.split(/;\s*/).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function validExperiment(id: unknown, variant: unknown, page: unknown, request: Request) {
  if (typeof id !== "string" || typeof variant !== "string") return false;
  const experiment = getExperiment(id);
  return Boolean(experiment?.status === "active" && experiment.page === page &&
    experiment.variants.some((item) => item.id === variant) && cookieValue(request, "co_home_hero_variant") === variant);
}

export function impressionId(request: Request, experiment: string, now = Date.now()) {
  const visitor = cookieValue(request, "co_visitor");
  if (!visitor || !/^[0-9a-f-]{36}$/.test(visitor)) throw new PublicRequestError("Visit the homepage before recording an impression.");
  return `impression-${createHash("sha256").update(`${visitor}:${experiment}:${Math.floor(now / 1_800_000)}`).digest("hex")}`;
}
