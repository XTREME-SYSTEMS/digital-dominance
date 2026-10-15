import fs from "node:fs";

const checks = [];
const read = (path) => fs.readFileSync(path, "utf8");
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const leadSchema = read("base44/entities/Lead.jsonc");
const funnelSchema = read("base44/entities/FunnelEvent.jsonc");
const tracking = read("src/lib/tracking.js");
const attribution = read("src/lib/estimatorStore.js");
const estimator = read("src/pages/Estimator.jsx");
const funnel = read("src/pages/Funnel.jsx");
const callback = read("src/components/home/ConsultationForm.jsx");
const binder = read("base44/functions/bindFunnelSessionToLead/entry.ts");
const hubspotPush = read("base44/functions/pushLeadToHubspot/entry.ts");
const revenueSync = read("base44/functions/syncHubspotRevenue/entry.ts");
const gsc = read("base44/functions/pullSearchConsoleData/entry.ts");

check(
  "Lead schema stores session identity",
  leadSchema.includes('"session_id"') && leadSchema.includes('"site_id"') && leadSchema.includes('"build_sha"'),
  "Every lead needs a stable join back to the acquisition session/site/build."
);

check(
  "Lead schema stores first and last touch attribution",
  leadSchema.includes('"first_landing_page"') &&
    leadSchema.includes('"last_landing_page"') &&
    leadSchema.includes('"first_utm_source"') &&
    leadSchema.includes('"last_utm_source"'),
  "DDV3 must distinguish first-touch acquisition from last-touch conversion."
);

check(
  "Lead schema separates booked from collected revenue",
  leadSchema.includes('"actual_revenue"') &&
    leadSchema.includes('"revenue_evidence_class"') &&
    leadSchema.includes('"closed_won_booked"'),
  "CRM deal value cannot be silently labeled collected cash."
);

check(
  "FunnelEvent has session and lead join keys",
  funnelSchema.includes('"session_id"') && funnelSchema.includes('"lead_id"'),
  "Funnel events must be joinable to a lead."
);

check(
  "Attribution capture emits stable session plus explicit touch fields",
  attribution.includes("session_id") &&
    attribution.includes("first_utm_source") &&
    attribution.includes("last_utm_source") &&
    attribution.includes("conversion_page"),
  "Lead creation must carry the attribution keys."
);

check(
  "Lead linker records lead_created and invokes guarded binder",
  tracking.includes("linkLeadAttribution") &&
    tracking.includes('"bindFunnelSessionToLead"') &&
    tracking.includes('"lead_created"'),
  "One helper should close the event-to-lead join after lead creation."
);

check(
  "Session binder rejects mismatched lead sessions",
  binder.includes("lead.session_id !== sessionId") &&
    binder.includes("SESSION_BINDING_REJECTED") &&
    binder.includes("conflicts_skipped"),
  "A public funnel must not be able to arbitrarily rebind another session's events."
);

check(
  "Primary lead surfaces use session linker",
  estimator.includes("linkLeadAttribution") &&
    funnel.includes("linkLeadAttribution") &&
    callback.includes("linkLeadAttribution"),
  "Estimator, main funnel and homepage callback must all close attribution."
);

check(
  "HubSpot push persists CRM identity",
  hubspotPush.includes("hubspot_contact_id") &&
    hubspotPush.includes("hubspot_deal_id") &&
    hubspotPush.includes("Lead.update"),
  "Revenue sync requires stable CRM IDs on the Lead."
);

check(
  "HubSpot revenue sync is gated",
  revenueSync.includes("Admin or approved cron authorization required") &&
    revenueSync.includes("RAILWAY_CRON_KEY"),
  "Closed-won synchronization is a governed write."
);

check(
  "HubSpot closed-won value is not labeled collected cash",
  revenueSync.includes('revenue_evidence_class: "closed_won_booked"') &&
    revenueSync.includes("patch.won_value = amount") &&
    !revenueSync.includes("patch.actual_revenue = amount"),
  "HubSpot deal amount is booked closed-won value unless payment evidence proves collection."
);

const diagnosticIndex = gsc.indexOf('body.action === "diagnose"');
const registryWriteIndex = gsc.indexOf("CanonicalSiteRegistry.update");
check(
  "GSC diagnostic mode exits before registry writes",
  diagnosticIndex >= 0 && registryWriteIndex >= 0 && diagnosticIndex < registryWriteIndex &&
    gsc.includes("diagnostic_only: true"),
  "Search Console binding can be diagnosed read-only before any production state change."
);

const failed = checks.filter((c) => !c.pass);
for (const c of checks) {
  console.log(`${c.pass ? "PASS" : "FAIL"} | ${c.name} | ${c.detail}`);
}
console.log(`\nDDV3 measurement regression: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
