import assert from "node:assert/strict";
import test from "node:test";
import { isContractorOpen, planPhoneRouting, rankContractors } from "./phone-routing";
import type { Contractor, Lead } from "./types";

const mondayHours = {
  mon: [{ open: "08:00", close: "17:00" }]
};

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-test",
    createdAt: "2026-07-27T12:00:00.000Z",
    source: "Vapi Phone",
    type: "other",
    status: "new",
    name: "Test Caller",
    phone: "+17175550199",
    siteAddress: "Lancaster, PA",
    zone: "Lancaster",
    details: {
      serviceType: "HVAC repair",
      latitude: "40.04",
      longitude: "-76.31",
      postalCode: "17602"
    },
    paymentRequirement: "No payment collected.",
    hermesRecommendation: "Route lead.",
    safetyCritical: false,
    phoneRouting: {
      vapiCallId: "call-test",
      inquiryKind: "service",
      serviceType: "HVAC repair",
      consentToShare: true,
      status: "collecting",
      candidateContractorIds: [],
      attemptedContractorIds: []
    },
    ...overrides
  };
}

function contractor(id: string, latitude: number, overrides: Partial<Contractor> = {}): Contractor {
  return {
    id,
    company: `Contractor ${id}`,
    trades: ["HVAC"],
    zones: ["Lancaster"],
    status: "active",
    score: 85,
    missingDocuments: [],
    successfulJobs: 20,
    onTimeRate: 0.9,
    verificationStatus: "verified",
    verificationConfidence: "high",
    routingProfile: {
      phoneNumber: `+17175550${id.padStart(3, "0")}`,
      timeZone: "America/New_York",
      businessHours: mondayHours,
      acceptingLeads: true,
      postalCode: "17602",
      latitude,
      longitude: -76.31,
      priority: 50
    },
    ...overrides
  };
}

test("automatic routing waits for three eligible contractors", () => {
  const now = new Date("2026-07-27T13:00:00.000Z");
  const plan = planPhoneRouting(lead(), [contractor("1", 40.04), contractor("2", 40.05)], { now });
  assert.equal(plan.status, "queued_coverage");
  assert.equal(plan.eligibleCount, 2);
  assert.ok(plan.nextAttemptAt);
});

test("three open eligible contractors enable a transfer", () => {
  const now = new Date("2026-07-27T13:00:00.000Z");
  const plan = planPhoneRouting(
    lead(),
    [contractor("1", 40.04), contractor("2", 40.05), contractor("3", 40.06)],
    { now }
  );
  assert.equal(plan.status, "transfer_ready");
  assert.equal(plan.candidates.length, 3);
});

test("closed contractors remain available as later follow-up candidates", () => {
  const now = new Date("2026-07-27T13:00:00.000Z");
  const closedHours = { mon: [{ open: "12:00", close: "17:00" }] };
  const plan = planPhoneRouting(
    lead(),
    [
      contractor("1", 40.04),
      contractor("2", 40.05, { routingProfile: { ...contractor("2", 40.05).routingProfile!, businessHours: closedHours } }),
      contractor("3", 40.06, { routingProfile: { ...contractor("3", 40.06).routingProfile!, businessHours: closedHours } })
    ],
    { now }
  );
  assert.equal(plan.status, "transfer_ready");
  assert.equal(plan.candidates.length, 3);
});

test("working hours are evaluated in the contractor timezone", () => {
  const candidate = contractor("1", 40.04);
  assert.equal(isContractorOpen(candidate, new Date("2026-07-27T13:00:00.000Z")), true);
  assert.equal(isContractorOpen(candidate, new Date("2026-07-27T23:00:00.000Z")), false);
});

test("after-hours leads are queued until the next opening", () => {
  const now = new Date("2026-07-27T23:00:00.000Z");
  const plan = planPhoneRouting(
    lead(),
    [contractor("1", 40.04), contractor("2", 40.05), contractor("3", 40.06)],
    { now }
  );
  assert.equal(plan.status, "queued_after_hours");
  assert.ok(plan.nextAttemptAt);
  assert.ok(new Date(plan.nextAttemptAt!).getTime() > now.getTime());
});

test("proximity outweighs a modest reliability advantage", () => {
  const now = new Date("2026-07-27T13:00:00.000Z");
  const nearby = contractor("near", 40.04, { score: 75, onTimeRate: 0.8 });
  const distant = contractor("far", 40.5, { score: 100, onTimeRate: 1 });
  const ranked = rankContractors(lead(), [distant, nearby], now);
  assert.equal(ranked[0].contractor.id, "near");
});
