# XPS XPRESS LOCAL LEAD FACTORY - PILOT EXECUTION CONTRACT
Date: 2026-10-15. Source authority: XTREME-SYSTEMS/digital-dominance. Scope: branch-safe proof of concept; no production launch.

## Mission
Generate qualified supply buyers for nearby XPS Xpress stores, not installation-price enquiries. Primary conversion: call store, directions, request product availability. Secondary: professional training interest. 70 stores is target capacity, not verified count of active operations.

## Source-backed initial market registry
pilot/xps-xpress/store-registry.json lists Pompano Beach, Miami, Tampa, Fort Myers, Naples from official XPS site. Actual operation/hours and stock availability require confirmation prior to launch. Store IDs are immutable routing keys, never infer store by unvalidated IP or arbitrary city text.

## Six-step pipeline
1. LOCATIONS: ingest canonical directory in staging as candidate records. Validate address and phone against individual official store page; separately confirm operational status by store owner and geocoded location. Mark candidates not ACTIVE until confirmed.
2. RESEARCH: per store perform three comparable supplier audits plus Google Search Console/keyword evidence if access is verified; track source date, exact query, intent and competitor differentiation. No fabricated keyword volumes, competitor ratings or economics.
3. FUNNELS: use approved XPS Business Systems layout/capture only where its precise design contract applies. Dedicated per-intent landing page: epoxy supplies, polyaspartic, concrete grinders, diamond tooling, contractor training. Unique store facts + actual product support + directions, not near-duplicate doorway pages. Store source and content must be human reviewed.
4. LEAD ROUTING: events CALL_CLICK and DIRECTIONS_CLICK keyed by store_id, intent, route_id, campaign and consent. Existing XPS CRM destination is TBD. Future server-side leads require consent, secured endpoint, abuse controls, dedupe and delivery acknowledgements. No personal form capture in pilot.
5. QA: robots noindex, visible correct phone and address, mobile viewport, accessible selectors, source link, click-to-call, directions, no 3rd-party exfiltration, no fabricated pricing. Independent browser proof and linked Vercel preview remain outstanding.
6. RELEASE: five-store canary only after human approval, confirmed store operation, verified call routing and CRM integration, consent/legal QA and attribution. Expand to 70 in batches with quality/economics thresholds and rollback.

## Attribution event schema (proposed, not installed)
{event_id, occurred_at, session_id, store_id, funnel_id, intent, action, campaign_source, campaign_medium, campaign_id, consent_state, attribution_confidence, receipt_id}
Current HTML populates local window.dataLayer for store-specific CALL_CLICK and DIRECTIONS_CLICK only; no telemetry destination is bound.

## Acceptance checklist
- 5/5 store records source-grounded and unique: PASS for public listing only, operational verification UNKNOWN.
- Branch HTML contains responsive layout and 5 store links: PASS static readback, browser QA UNKNOWN.
- Store phone dynamically matches selected location: IMPLEMENTED, E2E browser test UNKNOWN.
- Call/directions analytics: local dataLayer hook IMPLEMENTED, ingestion UNKNOWN.
- Contact form to CRM: NOT CONNECTED (deliberately, no fake submissions).
- Search Console verified demand and local competitors: NOT YET ANALYZED.
- Public Google-compliant content and policy validation: PENDING.
- Live Vercel preview: BLOCKED; previous Vercel preview renderer returned BLOCKED and no functional URL.
- National full directory, live product feeds and sales attribution: NOT YET VERIFIED.
- Protected release approval: NOT GRANTED.

## Receipts
Store registry GitHub commit 296b92589a710180b8173a2e64e331ba629d0643.
Lead prototype GitHub commit 854f1f4f2df1bb5bbb6c6f20cf20f46ca7b22692.
Existing branch feature/god-mode-control-plane-convergence-20261014.

## Safe next actions
1. Read the full official XPS 70-store directory, normalize each location, and reconcile actual operating status.
2. Identify canonical product/offer sets and actual click-to-call/local CRM pathways.
3. Determine why Vercel preview renderer deployment is BLOCKED; repair preview only without disturbing digital-dominance production.
4. Obtain independently validated desktop/mobile browser screenshot and lead click tests.
5. Launch only approved pilot, with operational receipt and rollback.
