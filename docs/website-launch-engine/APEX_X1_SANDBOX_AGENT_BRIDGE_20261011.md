# Website Launch Engine: Apex X1 + Super Agents Sandbox Integration Packet
Mission: WLE-SANDBOX-AGENT-BRIDGE-20261011
Date: 2026-10-11
Phase: PLAN -> DISCOVERY / READ-COMPLETE, DESIGN-CONTRACT DRAFT
Status: NOT_CONNECTED / NOT_DEPLOYED
Action scope: READ + draft branch documentation only; no production, secret, DNS, customer message, cost, or schedule change

## 00 Source truth
- Public approved website: https://website-launch-engine-xps.vercel.app/
- Latest premium preview: https://website-launch-engine-joj4ni51v-strategic-minds-advisory.vercel.app/
- Admin shell: /admin.html; Client shell: /client.html. These are unauthenticated, demo-only UIs, not customer-ready.
- Vercel project: website-launch-engine-xps, project ID prj_70bwCwyXR7yqb0Yicku8rHzRVAZc.
- Existing donor source: XTREME-SYSTEMS/digital-dominance; branch feature/wle-premium-portals-20261010 (this file is on that branch). Determine Strategic-Minds-AI canonical code destination before any canonical promotion.
- The visual designs are APPROVED. Never replace the marketing presentation, premium homepage or industry previews while wiring backends.
- Florida business phone: (772) 209-0266.

## 01 Verified callable tools (read-only checks on 2026-10-11)
- XTREME SUPER AGENTS router and capability-bootstrap skill: loaded and defines Apex -> specialist -> independent validator -> receipt.
- Apex X1 router: loaded; twenty roles; shared X1 Supabase and Vercel heartbeat are intended authorities, not independently proven bound for WLE.
- Xtreme Cloud Browser backend browser_health: HTTP 200; engine version 3.1.0; worker_id 69af5dd9-c5d4-49da-addb-8854d08a4fd7; active_sessions 3 at time of check. Health alone does not prove WLE-specific sandbox isolation.
- Browser app Sandbox entity: only two historical example.com records, no verified WLE-specific sandbox.
- Browser app Integration entity: zero integrations returned with selected query; this does NOT prove connectors outside this app are missing.
- Auto Builder 2 health_check: status=ok, xps-ai-factory-control-plane, Vercel environment; self-reported topology says factory-install-required and incomplete runtime/secret/queue binding. Treat its Strategic-Minds/AUTO_BUILDER repository mapping as separate/unreconciled, not canonical code authority.
- Railway Strategic Sandbox System project: 15f90272-e2f6-4739-8286-91447f545d71, environments include sandbox-orchestrator, sandbox-code, sandbox-brand, sandbox-swarm, staging and production; worker services include worker-sandbox-orchestrator, worker-sandbox-code and worker-sandbox-swarm. Existence of services != deployed/healthy/bound.
- XTREME TEAM Swarm Builder/Coordinator/Tester agent actions callable; live execution and tenant authority are unverified.
- Xtreme Fault Line independent QA connector callable (previous surface inventory), no WLE-specific validation receipt inspected.
- Xtreme Cloud Browser Clean separately supplied by operator but distinct writable/browser action not verified here.
- AI_HUB project query returned link_id eligibility error; treat that route as UNBOUND pending eligible account verification.

## 02 Ownership: ONE shared sandbox, not another factory
Apex X1 COMMANDS; Website Launch Engine is tenant-facing UI and product surface; shared Strategic Sandbox System is execution substrate.
- Mission creation: WLE Admin (owner) or Client (tenant-scoped) -> authenticated backend API -> immutable Mission/BuildPacket -> X1 durable queue.
- Planner: Apex X1 / XTREME SUPER AGENTS (source-truth + permissions). Never let an app-side agent self-approve.
- Implementation: one authorized worker-sandbox-code isolated per tenant/project, branch-only source writes and fresh Vercel preview target, ephemeral storage and strict resource budgets.
- Browser: Xtreme Cloud Browser for accessibility, interaction, responsive verification. Disallow arbitrary unscoped site navigation / SSRF from user data.
- Independent reviewer: Fault Line + browser verifier, not the implementing worker.
- Preview approval: persist business/tenant ownership and immutable pack hash, QA receipt, screenshot artifact, deploy URL and SHA.
- Release: operator action with specific deployment identity and rollback pointer; production never triggered by sandbox completion.

## 03 Proposed minimum API contract (NOT IMPLEMENTED)
POST /api/sandbox/missions {tenant_id, website_id, template_version, goal, constraints, budget}
GET  /api/sandbox/missions/:id {status, phase, step, evidence_refs, preview_url, approvals}
POST /api/sandbox/missions/:id/revisions {request, base_artifact_sha}
GET  /api/sandbox/missions/:id/events [SSE or polling; tenant authorized]
POST /api/sandbox/missions/:id/preview {action:"request_preview"} // idempotent
POST /api/sandbox/missions/:id/release-request {deployment_id, approved_pack_sha} // operator approval gate
POST /api/sandbox/missions/:id/cancel // must terminate sandbox leases and prevent new work
State: PLANNED -> QUEUED -> LEASED -> BUILDING -> PREVIEW_READY -> VALIDATING -> VALIDATED -> AWAITING_APPROVAL -> LIVE or FAILED/CANCELLED.
All transitions require tenant_id, actor_id, mission_id, idempotency_key, expected_state and durable receipt_id.
Reject cross-tenant reads and writes by RLS and negative tests. Persist no raw model/provider credentials in mission records.

## 04 Scope / security gates
- Before provision: verify environment/project/tenant, canonical repo, default branch, commit SHA, runtime worker state, existing heartbeat and queue contract, budget, expiration and rollback.
- No duplicate scheduler/queue, no always-on tenant browser session by default; lease with TTL, bounded retries, dead-letter.
- No real client data in unauthenticated demo portals. Verify Auth + RBAC + RLS before enabling real onboarding or leads.
- Sandbox isolation: ephemeral per-workspace VM/container, restricted outbound network and filesystem, no production tokens, cleanup TTL, rate limits and log redaction.
- Must not imply isolated VM or authenticated agents from HTML demo UI alone.
- Explicit approval for production deploy, secrets, production DB/RLS, DNS, spend, payments, outbound communication and live publishing.

## 05 Acceptance: pilot one synthetic roofing site
1. Admin launches WLE sandbox from an authenticated development account.
2. Reuses existing mission/queue; returns an immutable mission ID and observed lease.
3. Builder creates real versioned files in isolated branch, with evidence and exact SHA.
4. Fresh Vercel private preview returns HTTP 200 and real pages, not configured market rows.
5. Browser tests hero, nav, category, template, consultation/contact, phone, tablet/desktop/mobile; no critical JS/accessibility errors.
6. Independent validator runs cross-tenant denial tests, API/queue idempotency, auth, rollback and visual/screenshot comparison.
7. Client can review version and request changes; cannot publish without separate operator-scoped approval.
8. Sandbox cleanup and receipt verification PASS; orphaned work is dead-lettered.
9. Report cost/time-to-preview based on actual receipts, not guesses.

## 06 Work packets / safe next action
WLE-SB-001 READ: Reconcile canonical source identity, Railway orchestrator deployment health, Supabase queue and existing heartbeat. Deliver authority/conflict matrix.
WLE-SB-002 READ: Inspect Auto Builder controller build-packet API vs X1 runtime contract; choose one master command path, mark donor-only paths.
WLE-SB-003 BRANCH_WRITE: Add tenant-safe mission client to WLE admin portal (disabled by default), no secrets.
WLE-SB-004 PREVIEW_WRITE: Bind nonproduction queue and isolated code worker after WLE-SB-001 and security review.
WLE-SB-005 VALIDATE: Independent QA on synthetic end-to-end pilot, screenshot evidence.
WLE-SB-006 PROTECTED: Production activation only after signed operator approval tied to tested candidate SHA.

## Evidence and limitations
This packet documents observed endpoints and a proposed integration contract. It is NOT proof that integration has been built or a mission dispatched. No production changes were made by this packet.
