import "server-only";

import { timingSafeEqual } from "crypto";

export function normalizeE164(value: string | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

export function vapiWebhookAuthorized(request: Request) {
  const secret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const authorization = request.headers.get("authorization") ?? "";
  const supplied =
    (authorization.startsWith("Bearer ") ? authorization.slice(7) : "") ||
    request.headers.get("x-vapi-secret") ||
    "";
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}
