export type OutboundLineType = "business_landline" | "mobile" | "unknown";

export type OutboundConsentBasis =
  | "business_to_business"
  | "established_business_relationship"
  | "written_consent";

export type ContractorProspectInput = {
  company: string;
  contactName?: string;
  phone: string;
  city?: string;
  serviceHint?: string;
  source: string;
  targetTimeZone: string;
  lineType: OutboundLineType;
  consentBasis: OutboundConsentBasis;
  complianceConfirmed: boolean;
};

export type ValidatedContractorProspect = Omit<ContractorProspectInput, "contactName" | "city" | "serviceHint"> & {
  contactName: string;
  city: string;
  serviceHint: string;
};

const WEEKDAYS = new Set(["mon", "tue", "wed", "thu", "fri"]);

function clean(value: unknown, maximum: number) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

export function normalizeUsPhone(value: unknown) {
  const raw = clean(value, 40);
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

export function outboundCallingWindow(at: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(at);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const weekday = clean(values.weekday, 3).toLowerCase();
    const minutes = Number(values.hour) * 60 + Number(values.minute);
    const allowed = WEEKDAYS.has(weekday) && minutes >= 9 * 60 && minutes < 17 * 60;
    return {
      allowed,
      localTime: `${values.weekday} ${values.hour}:${values.minute}`,
      reason: allowed
        ? "Within the conservative weekday calling window."
        : "Outbound contractor calls are limited to 9:00 AM-5:00 PM on weekdays in the prospect's timezone."
    };
  } catch {
    return {
      allowed: false,
      localTime: "unknown",
      reason: "The prospect timezone is invalid."
    };
  }
}

export function validateContractorProspect(
  input: ContractorProspectInput,
  now = new Date()
): { ok: true; prospect: ValidatedContractorProspect } | { ok: false; error: string } {
  const company = clean(input.company, 120);
  const contactName = clean(input.contactName, 100);
  const phone = normalizeUsPhone(input.phone);
  const city = clean(input.city, 100);
  const serviceHint = clean(input.serviceHint, 180);
  const source = clean(input.source, 240);
  const targetTimeZone = clean(input.targetTimeZone, 80);

  if (!company) return { ok: false, error: "Company is required." };
  if (!phone) return { ok: false, error: "Enter a valid U.S. phone number." };
  if (!source) return { ok: false, error: "Document where this contractor prospect came from." };
  if (!["business_landline", "mobile", "unknown"].includes(input.lineType)) {
    return { ok: false, error: "Select a valid line type." };
  }
  if (!["business_to_business", "established_business_relationship", "written_consent"].includes(input.consentBasis)) {
    return { ok: false, error: "Select a valid contact basis." };
  }
  if (!input.complianceConfirmed) {
    return { ok: false, error: "An operator must confirm the contact basis and suppression check." };
  }
  if (
    input.lineType !== "business_landline" &&
    input.consentBasis !== "written_consent"
  ) {
    return {
      ok: false,
      error: "Mobile and unknown line types require documented written consent before an AI-voice call."
    };
  }

  const window = outboundCallingWindow(now, targetTimeZone);
  if (!window.allowed) return { ok: false, error: `${window.reason} Local time: ${window.localTime}.` };

  return {
    ok: true,
    prospect: {
      company,
      contactName,
      phone,
      city,
      serviceHint,
      source,
      targetTimeZone,
      lineType: input.lineType,
      consentBasis: input.consentBasis,
      complianceConfirmed: true
    }
  };
}
