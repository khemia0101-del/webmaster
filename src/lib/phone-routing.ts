import type { BusinessDay, Contractor, Lead } from "./types";

export const DEFAULT_MINIMUM_CONTRACTOR_COVERAGE = 3;
export const MAX_CONTRACTOR_ATTEMPTS = 3;

export type RankedContractor = {
  contractor: Contractor;
  score: number;
};

export type PhoneRoutingPlan = {
  status: "queued_coverage" | "queued_after_hours" | "transfer_ready";
  reason: string;
  candidates: RankedContractor[];
  eligibleCount: number;
  nextAttemptAt?: string;
};

type RoutingOptions = {
  now?: Date;
  minimumCoverage?: number;
  coverageRecheckMinutes?: number;
};

const DAYS: BusinessDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function normalize(value: string | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function localTime(date: Date, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const day = normalize(value.weekday).slice(0, 3) as BusinessDay;
    const dayIndex = DAYS.indexOf(day);
    if (dayIndex < 0) return null;
    return {
      day,
      dayIndex,
      minutes: Number(value.hour) * 60 + Number(value.minute)
    };
  } catch {
    return null;
  }
}

function windowIsOpen(open: number, close: number, minutes: number) {
  if (open === close) return true;
  if (open < close) return minutes >= open && minutes < close;
  return minutes >= open;
}

export function isContractorOpen(contractor: Contractor, at = new Date()) {
  const profile = contractor.routingProfile;
  if (!profile?.acceptingLeads) return false;
  const local = localTime(at, profile.timeZone || "America/New_York");
  if (!local) return false;

  const today = profile.businessHours[local.day] ?? [];
  if (
    today.some((window) => {
      const open = parseTime(window.open);
      const close = parseTime(window.close);
      return open !== null && close !== null && windowIsOpen(open, close, local.minutes);
    })
  ) {
    return true;
  }

  const previousDay = DAYS[(local.dayIndex + 6) % 7];
  return (profile.businessHours[previousDay] ?? []).some((window) => {
    const open = parseTime(window.open);
    const close = parseTime(window.close);
    return open !== null && close !== null && open > close && local.minutes < close;
  });
}

export function nextContractorOpening(contractor: Contractor, after = new Date()) {
  if (isContractorOpen(contractor, after)) return after;
  const rounded = new Date(Math.ceil(after.getTime() / 900_000) * 900_000);
  const limit = rounded.getTime() + 8 * 24 * 60 * 60 * 1000;
  for (let timestamp = rounded.getTime(); timestamp <= limit; timestamp += 900_000) {
    const candidate = new Date(timestamp);
    if (isContractorOpen(contractor, candidate)) return candidate;
  }
  return null;
}

function serviceGroup(value: string) {
  const text = normalize(value);
  if (/\b(diesel|fuel|heating oil|oil delivery|kerosene)\b/.test(text)) return "fuel";
  if (/\b(hvac|heat|heating|no heat|furnace|boiler|burner|air conditioning|cooling|ac)\b/.test(text)) {
    return "hvac";
  }
  return text;
}

function serviceMatchScore(lead: Lead, contractor: Contractor) {
  const requested = serviceGroup(lead.phoneRouting?.serviceType || lead.details.serviceType || lead.type);
  if (!requested) return 0;
  const trades = contractor.trades.map(serviceGroup);
  if (trades.includes(requested)) return 100;
  if (trades.some((trade) => trade.includes(requested) || requested.includes(trade))) return 85;
  const requestedWords = new Set(requested.split(" ").filter((word) => word.length > 2));
  const overlap = trades.some((trade) => trade.split(" ").some((word) => requestedWords.has(word)));
  return overlap ? 65 : 0;
}

function zoneMatches(lead: Lead, contractor: Contractor) {
  const zone = normalize(lead.zone || lead.details.city || lead.details.postalCode);
  if (!zone) return false;
  return contractor.zones.some((candidate) => {
    const normalizedCandidate = normalize(candidate);
    return normalizedCandidate === zone || zone.includes(normalizedCandidate) || normalizedCandidate.includes(zone);
  });
}

export function contractorEligibleForLead(lead: Lead, contractor: Contractor) {
  const profile = contractor.routingProfile;
  return Boolean(
    contractor.status === "active" &&
      contractor.missingDocuments.length === 0 &&
      contractor.verificationStatus === "verified" &&
      profile?.acceptingLeads &&
      profile.phoneNumber.trim() &&
      zoneMatches(lead, contractor) &&
      serviceMatchScore(lead, contractor) > 0
  );
}

function toFiniteNumber(value: string | number | undefined) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function proximityScore(lead: Lead, contractor: Contractor) {
  const profile = contractor.routingProfile;
  const leadLatitude = toFiniteNumber(lead.details.latitude);
  const leadLongitude = toFiniteNumber(lead.details.longitude);
  const contractorLatitude = toFiniteNumber(profile?.latitude);
  const contractorLongitude = toFiniteNumber(profile?.longitude);
  if (
    leadLatitude !== null &&
    leadLongitude !== null &&
    contractorLatitude !== null &&
    contractorLongitude !== null
  ) {
    return clamp(100 - distanceMiles(leadLatitude, leadLongitude, contractorLatitude, contractorLongitude) * 2);
  }

  const leadPostalCode = normalize(lead.details.postalCode);
  const contractorPostalCode = normalize(profile?.postalCode);
  if (leadPostalCode && contractorPostalCode && leadPostalCode === contractorPostalCode) return 100;
  return 70;
}

function reliabilityScore(contractor: Contractor) {
  return clamp(contractor.score) * 0.6 + clamp(contractor.onTimeRate * 100) * 0.4;
}

function rotationScore(contractor: Contractor, now: Date) {
  const profile = contractor.routingProfile;
  if (!profile?.lastAssignedAt) return 100;
  const lastAssigned = new Date(profile.lastAssignedAt).getTime();
  if (!Number.isFinite(lastAssigned)) return 100;
  const hoursSinceAssignment = Math.max(0, (now.getTime() - lastAssigned) / 3_600_000);
  const recency = hoursSinceAssignment >= 24 ? 90 : hoursSinceAssignment >= 6 ? 65 : 30;
  return clamp(recency - (profile.assignmentsToday ?? 0) * 5);
}

export function rankContractors(lead: Lead, contractors: Contractor[], now = new Date()) {
  return contractors
    .filter((contractor) => contractorEligibleForLead(lead, contractor))
    .map((contractor) => {
      const score =
        proximityScore(lead, contractor) * 0.5 +
        reliabilityScore(contractor) * 0.2 +
        serviceMatchScore(lead, contractor) * 0.15 +
        rotationScore(contractor, now) * 0.1 +
        clamp(contractor.routingProfile?.priority ?? 50) * 0.05;
      return { contractor, score: Math.round(score * 100) / 100 };
    })
    .sort((a, b) => b.score - a.score || a.contractor.company.localeCompare(b.contractor.company));
}

export function planPhoneRouting(lead: Lead, contractors: Contractor[], options: RoutingOptions = {}): PhoneRoutingPlan {
  const now = options.now ?? new Date();
  const minimumCoverage = options.minimumCoverage ?? DEFAULT_MINIMUM_CONTRACTOR_COVERAGE;
  const coverageRecheckMinutes = options.coverageRecheckMinutes ?? 60;
  const ranked = rankContractors(lead, contractors, now);

  if (ranked.length < minimumCoverage) {
    return {
      status: "queued_coverage",
      reason: `Automatic routing requires ${minimumCoverage} vetted contractors; ${ranked.length} are currently eligible.`,
      candidates: [],
      eligibleCount: ranked.length,
      nextAttemptAt: new Date(now.getTime() + coverageRecheckMinutes * 60_000).toISOString()
    };
  }

  const open = ranked.filter(({ contractor }) => isContractorOpen(contractor, now));
  if (open.length === 0) {
    const openings = ranked
      .map(({ contractor }) => nextContractorOpening(contractor, now))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => a.getTime() - b.getTime());
    return {
      status: "queued_after_hours",
      reason: "Qualified contractors are currently outside their configured working hours.",
      candidates: ranked.slice(0, MAX_CONTRACTOR_ATTEMPTS),
      eligibleCount: ranked.length,
      nextAttemptAt: (openings[0] ?? new Date(now.getTime() + coverageRecheckMinutes * 60_000)).toISOString()
    };
  }

  return {
    status: "transfer_ready",
    reason: "Qualified contractors are available for a warm transfer.",
    candidates: [
      ...open,
      ...ranked.filter(({ contractor }) => !open.some((candidate) => candidate.contractor.id === contractor.id))
    ].slice(0, MAX_CONTRACTOR_ATTEMPTS),
    eligibleCount: ranked.length
  };
}
