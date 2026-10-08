import assert from "node:assert/strict";
import { compileDDV3LearningMetrics } from "../base44/shared/ddv3LearningMetrics.js";

const now = new Date("2026-10-08T18:00:00.000Z");
const iso = (minsAgo) => new Date(now.getTime() - minsAgo * 60000).toISOString();

const estimateOnly = compileDDV3LearningMetrics({
  now,
  periodDays: 30,
  leads: [{
    created_date: iso(30),
    session_id: "s1",
    lead_score: 90,
    estimate_mid: 999999,
    won_value: 0,
    actual_revenue: 0,
  }],
  events: [{ created_date: iso(31), session_id: "s1", lead_id: "l1" }],
  validationReceipts: [],
});
assert.equal(estimateOnly.booked_closed_won_revenue, 0);
assert.equal(estimateOnly.collected_revenue, 0);
assert.equal(estimateOnly.verified_gross_profit, 0);

const bookedNotCollected = compileDDV3LearningMetrics({
  now,
  leads: [{
    created_date: iso(20),
    session_id: "s1",
    lead_score: 80,
    status: "WON",
    won_value: 5000,
    actual_revenue: 5000,
    revenue_evidence_class: "closed_won_booked",
    actual_gross_profit: 3000,
    margin_evidence_class: "unknown",
  }],
  events: [{ created_date: iso(21), session_id: "s1", lead_id: "l1" }],
  validationReceipts: [],
});
assert.equal(bookedNotCollected.booked_closed_won_revenue, 5000);
assert.equal(bookedNotCollected.collected_revenue, 0);
assert.equal(bookedNotCollected.verified_gross_profit, 0);

const sessions = Array.from({ length: 120 }, (_, i) => ({
  created_date: iso(200 - i),
  session_id: "sess_" + i,
  lead_id: i < 20 ? "lead_" + i : undefined,
}));
const leads = Array.from({ length: 20 }, (_, i) => ({
  id: "lead_" + i,
  created_date: iso(180 - i),
  session_id: "sess_" + i,
  lead_score: i < 15 ? 75 : 40,
  first_utm_source: "google",
  status: i < 5 ? "WON" : "NURTURE",
  won_value: i < 5 ? 4000 : 0,
  actual_revenue: i < 4 ? 3500 : 0,
  revenue_evidence_class: i < 4 ? "collected" : "unknown",
  actual_gross_profit: i < 4 ? 2100 : 0,
  margin_evidence_class: i < 4 ? "verified" : "unknown",
}));
const receipts = Array.from({ length: 20 }, (_, i) => ({
  timestamp: iso(150 - i),
  status: i < 19 ? "PASS" : "FAIL",
}));

const good = compileDDV3LearningMetrics({
  now,
  leads,
  events: sessions,
  validationReceipts: receipts,
  qualifiedLeadThreshold: 60,
});
assert.equal(good.sessions, 120);
assert.equal(good.leads, 20);
assert.equal(good.qualified_leads, 15);
assert.equal(good.won_leads, 5);
assert.equal(good.booked_closed_won_revenue, 20000);
assert.equal(good.collected_revenue, 14000);
assert.equal(good.verified_gross_profit, 8400);
assert.equal(good.attribution_coverage_pct, 100);
assert.equal(good.data_quality_state, "partial");
assert.ok(good.recommendations.every((r) => r.auto_execute === false));

const fullyLinkedEvents = sessions.map((e, i) => ({
  ...e,
  lead_id: "lead_" + (i % 20),
}));
const decisionGrade = compileDDV3LearningMetrics({
  now,
  leads,
  events: fullyLinkedEvents,
  validationReceipts: receipts,
});
assert.equal(decisionGrade.event_link_coverage_pct, 100);
assert.equal(decisionGrade.validation_pass_rate, 95);
assert.equal(decisionGrade.data_quality_state, "decision_grade");
assert.ok(decisionGrade.recommendations.some((r) => r.code === "ELIGIBLE_FOR_CONTROLLED_EXPERIMENT"));
assert.ok(decisionGrade.recommendations.every((r) => r.auto_execute === false));

const brokenAttribution = compileDDV3LearningMetrics({
  now,
  leads: [{ created_date: iso(10), lead_score: 80 }],
  events: [{ created_date: iso(11), session_id: "x" }],
  validationReceipts: [],
});
assert.ok(brokenAttribution.recommendations.some((r) => r.code === "REPAIR_LEAD_ATTRIBUTION"));
assert.ok(brokenAttribution.recommendations.some((r) => r.code === "REPAIR_EVENT_LINKAGE"));

console.log("PASS | Estimates never count as booked/collected revenue");
console.log("PASS | Booked closed-won is distinct from collected revenue");
console.log("PASS | Gross profit requires verified margin evidence");
console.log("PASS | First-party snapshot metrics are deterministic");
console.log("PASS | Decision-grade state requires strong linkage + validation coverage");
console.log("PASS | Learning recommendations never auto-execute");
console.log("PASS | Broken attribution produces repair recommendations");
console.log("\nDDV3 learning regression: 7/7 passed");
