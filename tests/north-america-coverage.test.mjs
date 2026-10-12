import test from "node:test";
import assert from "node:assert/strict";
import {
  GEOGRAPHIES,
  normalizePostalCode,
  isValidPostalCode,
  createMarketCandidate,
  checkMarketIndexEligibility,
  indexableMarketUrls,
} from "../src/lib/northAmericaCoverage.mjs";

test("country-specific postal patterns normalize and reject malformed values", () => {
  assert.equal(isValidPostalCode("US", "33009"), true);
  assert.equal(isValidPostalCode("US", "33009-1000"), true);
  assert.equal(isValidPostalCode("US", "AAAAA"), false);
  assert.equal(isValidPostalCode("CA", "m5v2t6"), true);
  assert.equal(normalizePostalCode("CA", "m5v2t6"), "M5V 2T6");
  assert.equal(isValidPostalCode("MX", "06000"), true);
  assert.equal(isValidPostalCode("MX", "0600"), false);
  assert.equal(isValidPostalCode("XX", "33009"), false);
});
test("official geographic systems are country specific", () => {
  assert.equal(GEOGRAPHIES.US.regionType, "county_or_equivalent");
  assert.equal(GEOGRAPHIES.CA.regionType, "census_division");
  assert.equal(GEOGRAPHIES.MX.regionType, "municipio");
});
test("imported geography must default to noindex and unverified", () => {
  const m = createMarketCandidate({ country: "US", governmentId: "12011", name: "Broward", region: "Florida" });
  assert.equal(m.noindex, true);
  assert.equal(m.verifiedServiceArea, false);
  assert.equal(checkMarketIndexEligibility(m).eligible, false);
  assert.deepEqual(indexableMarketUrls([m]), []);
});
test("nothing indexes without documented coverage, originality, routing, QA and release", () => {
  const m = createMarketCandidate({ country: "CA", governmentId: "3518", name: "Durham", region: "Ontario" });
  m.publishedUrl = "https://preview.example.test/ca/on/durham";
  m.noindex = false;
  m.verifiedServiceArea = true;
  m.uniqueLocalValueReviewed = true;
  m.leadRoutingTested = true;
  m.independentQaPassed = true;
  m.receipts = {qa: "test-qa", approval: "test-approval", coverage: "test-service-area"};
  assert.equal(checkMarketIndexEligibility(m).eligible, false);
  m.approvedForRelease = true;
  assert.equal(checkMarketIndexEligibility(m).eligible, true);
  assert.deepEqual(indexableMarketUrls([m, m]), [m.publishedUrl]);
});
test("unknown and duplicate geography cannot silently become markets", () => {
  assert.throws(() => createMarketCandidate({country: "FR", governmentId:"1",name:"Paris",region:"Paris"}));
  assert.throws(() => createMarketCandidate({country:"US",governmentId:"",name:"X",region:"Y"}));
});
