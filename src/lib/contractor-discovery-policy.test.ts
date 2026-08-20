import assert from "node:assert/strict";
import test from "node:test";
import { validateContractorSearch } from "./contractor-discovery-policy";

test("validates and rounds a contractor search rating to Google's half-point cadence", () => {
  const result = validateContractorSearch({
    service: "oil burner repair",
    location: "Lancaster, PA",
    minimumRating: 4.1
  });

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.search.minimumRating, 4.5);
});

test("rejects incomplete contractor searches", () => {
  assert.equal(validateContractorSearch({ service: "", location: "Lancaster, PA" }).ok, false);
  assert.equal(validateContractorSearch({ service: "HVAC", location: "" }).ok, false);
});

test("rejects ratings outside Google's supported range", () => {
  assert.equal(
    validateContractorSearch({ service: "HVAC", location: "Lancaster, PA", minimumRating: 6 }).ok,
    false
  );
});
