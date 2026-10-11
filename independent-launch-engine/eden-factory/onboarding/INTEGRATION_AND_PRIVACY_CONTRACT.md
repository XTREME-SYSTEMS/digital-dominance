# Eden Skye V2 | Progressive Client Onboarding + Consent-Scoped Business Intelligence

**Status:** Branch implementation and synthetic CI validation. **NOT publicly deployed**, no live customer submissions, no production scraping, no auto-contact.
**Donor:** `autobuilder.zip` provided 2026-10-11; inspected `src/pages/BusinessProfile.jsx`, `src/components/onboarding/WizardUI.jsx`, `src/components/ClientOnboarding.jsx`, `src/components/brand/AiOnboardingChat.jsx`, `src/components/onboarding/FinancialIntelligencePanel.jsx`, `base44/functions/getIndustryOnboarding/entry.ts`, `base44/shared/cloudBrowserScrape.ts`, `base44/docs/CLIENT_PORTAL_AUDIT.md`.
**Ownership:** Existing `XTREME-SYSTEMS/digital-dominance`, branch `feature/eden-consented-discovery-v2`, based on approved safe Eden V1 `feature/eden-universal-ai-factory-v1`. Do **not** overwrite production Website Launch Engine's visually locked website.

## Reuse classification
- **EXTRACT (UI)**: five-part BusinessProfile wizard progression, consistent progress, option chips, conditional industry/stage language, design/brand context.
- **EXTRACT (data)**: business stage, industry/company facts, services, customer pains, differentiators, visual style/tone, budget/market context, URLs and project constraints.
- **PRESERVE**: existing X1 AI Hub queue, Railway worker, `dominance_onboarding_sessions` staging, Strategic Intelligence domain tables and source-truth ownership.
- **ADAPT**: industry-specific question generation into **eight universal top-level steps**, with optional context fields; allow a new idea without a registered business.
- **DO NOT COPY**: Base44 runtime Auth/InvokeLLM, personal skip-tracing records, unconsented background research, authenticated-cookie scraping and anything tied to epoxy-only entities.

## Eight progressive steps
1. Your identity: name/email; phone optional unless they choose a call; preferred response method.
2. Starting point: business stage, brand name, location, official HTTPS website and official business social URLs. **Optional early opt-in** for public business research and business-account authority.
3. Outcome: plain-language vision and what would count as success.
4. Audience: customer type, their pain points, services/products.
5. Delivery: app/site/agent/automation/data/consulting intent, must-have capabilities, existing tools, sensitive-data awareness.
6. Creative identity: **client-stated** tone, favorite/avoided colors, inspirations and reusable assets. Never guess personality or psychological traits.
7. Boundaries: budget comfort, timeline, ongoing support, constraints and dependencies.
8. Review and granular consent: business-website, official-business-social, public-market, competitor research toggles. Follow-up and marketing consent remain separate. Clients may export their offline brief without consenting to follow-up or research.

## Browser research architecture: safe while onboarding
An authorized operator can collect publicly available BUSINESS facts, with the client's explicit research permission and verified server identity. Step-two early consent can be recorded by the future server while steps 3–8 continue.
`compileEarlyBusinessResearchJobs` plans exactly those permitted business-domain tasks, without sending personal name, phone or email in crawler payload.
`executeApprovedBrowserResearch` is the **server-only guarded provider boundary** for the existing Xtreme Cloud Browser, not a new browser service. Conditions: verified session/tenant, purpose-scoped and timestamped consent receipt, allowed public business domain, no third-party offsite crawling, robots/terms, DNS/IP SSRF checking, bounded 8 pages per domain, zero unapproved cloud spend, bounded rate, access logging, independent receipt. Research jobs remain DRAFT until the actual provider adapter is authenticated.
The server must perform DNS resolution/IP blocking on every redirect; pure URL syntax checking in the preview cannot prevent SSRF.
No people's personal addresses, data-broker enrichment, hidden accounts, login sessions, shadow profiling, psychological or protected-trait inference, CAPTCHA solving, or automated outreach.
`mergeProfileEvidence` separates **self-reported facts**, **sourced public business observations**, **uncertain/unverified claims**, **creative preferences** and **missing questions**. Every observed source should be shown with URL, timestamp, confidence and correction controls.

## Minimal persistent data contract (reuse existing tables)
- `public.dominance_onboarding_sessions` (X1 Staging) already has `tenant_id`, `answers`, `status`, `version`, `is_synthetic`. Bind through an authenticated **server** adapter after cross-tenant RLS and source mapping tests; no direct browser service_role.
- Store consent grants/revocations with independent timestamped versioned receipts, separate follow-up and marketing permission, expiry and scope.
- Cross-provider browser findings stored in a private business-research evidence store only after signed user consent. Do NOT enrich from email/phone identifiers.
- `public.catalog_quotes` in Strategic Intelligence is an existing donor, not automatically safe to link. Bind only after the existing RLS/grant exposures are independently resolved.
- `buildBrief` is client-local DRAFT. It is **not** a legally binding quote, payment authorization, permission to build, or a message to client.
- At real signup: reduce PII, encrypt in transit/at rest, deletion/retention preferences, enforce documented privacy notice and recorded permissions.
- No new X1 queue or cron. Reuse single authoritative supervisor, signing, leases, and sandbox fleet.

## Acceptance requirements
- Eight screens at 390x844 and 1440x900, accessible keyboard labels/focus and a clear Back button.
- New idea skips existing-business requirement. Answer-specific hints for websites/apps. Draft kept in memory in prototype, not persisting personal identifiers to localStorage.
- Every step validates; malicious social URLs and unknown scopes rejected. No backend fetch/Browser during offline preview.
- Consent declined: no scraping; project draft still exportable. Consent revoked: all pending browser jobs blocked; remove/expire retained evidence via compliant workflow.
- A real backend researcher must return a source URL and receipt for each assertion, never fabricated insight. Clients can correct brand identity.
- Independent preview E2E must test research-opt-in, research-opt-out, failed auth, revocation, cross-tenant denial, availability, data minimization, source quality and browser compliance.
- Production release and contact/billing still require scoped operator approval.

## Actual implementation artifacts
- `onboarding/index.html` interactive premium portal demonstration, Base44-independent.
- `onboarding/intake-engine.mjs` exactly eight stateful questions, conditional rules, all-step validation, structured preview brief.
- `onboarding/business-research-policy.mjs` public business URL/source constraints and consented research planning/evidence merge.
- `onboarding/browser-worker-bridge.mjs` guarded Xtreme Cloud Browser server adapter interface; **not connected to live worker**.
- `onboarding/tests/` three test suites, plus existing V1 pricing tests; GitHub Actions CI.
- Existing Eden V1 concept demo CTA links to onboarding preview.
- **Windows JARVIS local mirror:** `C:\_Strategic_Minds_AI_OS\49_WEBSITE LAUNCH EGINE\AUTONOMOUS_EXECUTION_V1\08_Sandbox\EDEN_V2_PORTAL`.

## Next gate
Bind authenticated staging consent API and Xtreme Cloud Browser worker with provider server credentials (never in JavaScript or prompts), test a synthetic consenting business end-to-end, and validate screenshots/mobile/desktop. Do not merge or deploy production until independent receipt.
