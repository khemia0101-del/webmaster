import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeUsPhone,
  outboundCallingWindow,
  validateContractorProspect,
  type ContractorProspectInput
} from "./vapi-outbound-policy";

const mondayMorning = new Date("2026-08-17T14:00:00.000Z");

function prospect(overrides: Partial<ContractorProspectInput> = {}): ContractorProspectInput {
  return {
    company: "Test HVAC",
    contactName: "Pat",
    phone: "(717) 555-0100",
    city: "Lancaster",
    serviceHint: "HVAC",
    source: "Written test consent",
    targetTimeZone: "America/New_York",
    lineType: "business_landline",
    consentBasis: "business_to_business",
    complianceConfirmed: true,
    ...overrides
  };
}

test("normalizes U.S. phone numbers to E.164", () => {
  assert.equal(normalizeUsPhone("(717) 555-0100"), "+17175550100");
  assert.equal(normalizeUsPhone("+1 717 555 0100"), "+17175550100");
  assert.equal(normalizeUsPhone("555"), "");
});

test("allows conservative weekday business hours", () => {
  assert.equal(outboundCallingWindow(mondayMorning, "America/New_York").allowed, true);
  assert.equal(
    outboundCallingWindow(new Date("2026-08-22T14:00:00.000Z"), "America/New_York").allowed,
    false
  );
});

test("rejects AI-voice calls to mobile or unknown lines without written consent", () => {
  const mobile = validateContractorProspect(
    prospect({ lineType: "mobile", consentBasis: "business_to_business" }),
    mondayMorning
  );
  assert.equal(mobile.ok, false);
  const unknown = validateContractorProspect(
    prospect({ lineType: "unknown", consentBasis: "established_business_relationship" }),
    mondayMorning
  );
  assert.equal(unknown.ok, false);
});

test("accepts a mobile number with documented written consent", () => {
  const result = validateContractorProspect(
    prospect({ lineType: "mobile", consentBasis: "written_consent" }),
    mondayMorning
  );
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.prospect.phone, "+17175550100");
});

test("requires an operator compliance confirmation", () => {
  const result = validateContractorProspect(prospect({ complianceConfirmed: false }), mondayMorning);
  assert.equal(result.ok, false);
});

test("rejects unknown enum values from direct API callers", () => {
  const invalidLine = validateContractorProspect(
    prospect({ lineType: "fax" as ContractorProspectInput["lineType"] }),
    mondayMorning
  );
  assert.equal(invalidLine.ok, false);
  const invalidBasis = validateContractorProspect(
    prospect({ consentBasis: "guessed" as ContractorProspectInput["consentBasis"] }),
    mondayMorning
  );
  assert.equal(invalidBasis.ok, false);
});
