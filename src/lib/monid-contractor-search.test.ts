import assert from "node:assert/strict";
import test from "node:test";
import { mapMonidBusinesses } from "./monid-contractor-search";

test("maps public Monid business records and drops duplicate or incomplete contacts", () => {
  const candidates = mapMonidBusinesses([
    { title: "Example HVAC", phone: "717-555-0123", address: "Lancaster, PA", type: "HVAC contractor", place_id: "abc" },
    { title: "Duplicate", phone: "(717) 555-0123", place_id: "def" },
    { title: "No phone", place_id: "ghi" },
    { title: "No source", phone: "717-555-0134" }
  ]);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].phone, "+17175550123");
  assert.equal(candidates[0].sourceLabel, "Google Maps via Monid");
  assert.match(candidates[0].sourceUrl, /^https:\/\/www\.google\.com\/maps\/place\/\?q=place_id:/);
  assert.equal(candidates[0].targetTimeZone, "");
});
