import assert from "node:assert/strict";
import test from "node:test";
import { validateContractorSearch } from "./contractor-discovery-policy";

test("validates and cleans a Hermes contractor research request", () => {
  const result = validateContractorSearch({
    service: "  oil burner\nrepair ",
    location: " Lancaster, PA "
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.search.service, "oil burner repair");
    assert.equal(result.search.location, "Lancaster, PA");
  }
});

test("rejects incomplete contractor searches", () => {
  assert.equal(validateContractorSearch({ service: "", location: "Lancaster, PA" }).ok, false);
  assert.equal(validateContractorSearch({ service: "HVAC", location: "" }).ok, false);
});
