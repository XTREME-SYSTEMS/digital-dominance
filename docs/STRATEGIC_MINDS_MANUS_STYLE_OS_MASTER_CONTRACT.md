# STRATEGIC MINDS AI | MANUS-STYLE DIGITAL DOMINANCE OS
## Authoritative refactor contract | 2026-10-10 | PROPOSED / NOT RELEASED

### 0. Mission identity
Digital Dominance is the existing WORKING ADMIN in the XTREME-SYSTEMS/digital-dominance repository, associated with epoxyquotenearme.com. It is the foundational operating system for Strategic Minds AI, NOT an epoxy-only website business. Epoxy is an optional first-party vertical. Build a general-purpose, multi-client, multi-industry factory for websites, applications, PWAs, funnels, brand systems, CRM, portals, social media, AI agents, documentation, and customer operating systems.

Operator goal: one plain-language request from ChatGPT or the website chat, from desktop or phone -> one durable mission -> agents work asynchronously inside isolated project sandbox -> independently verified 3-pass quality gate -> scoped approval -> automated authorized provisioning -> LIVE_VERIFIED system with full handoff. Owner must not manage a maze of administrative buttons.

### 1. Source-truth / ownership
- CANONICAL FACTORY + ADMIN: XTREME-SYSTEMS/digital-dominance. Preserve functioning routes, components, data, existing user value and rollback. Do NOT substitute a separate reconstructed platform.
- HOST: epoxyquotenearme.com, with Admin owned by the factory and public-facing behavior kept stable until separately approved. Brand the operating product Strategic Minds AI; no fake physical presence or unapproved DNS changes.
- PUBLIC HOME VISUAL DONOR: Strategic-Minds-AI/dominance-engine, approved Vercel visual at commit a2864fc875e977ac0db5402ab18fc6e447fa7d3d. Preserve pixel direction, not all its Base44 runtime.
- CHAT VISUAL DONOR: XTREME-SYSTEMS/vision-cortex-V2, approved preview deployment whose source is dev/max-tier-vision-cortex-v1 commit 387b2113a9f26e2fb26a6bc561a325654da8106b. Transfer only approved UI/UX; build one mission-backed command interface.
- TEMPLATE DONORS: existing Digital Dominance packs, dominance-engine /templates, existing system libraries and the submitted scale-dominance-4.zip. Audit version, license and functionality before import.
- EXISTING PAGES / FUNCTIONS to audit BEFORE replacement: src/pages/admin/ManusRecreation.jsx; GeneratorSandbox.jsx; DominanceSandbox.jsx; SystemOperator.jsx; GptSyncPipeline.jsx; MasterPipeline.jsx; TemplateManager.jsx; UniversalTemplateStudio.jsx; SystemLibrary.jsx; WebsiteFactory.jsx; GoogleCommandCenter.jsx; SocialStudio.jsx; SwarmCommand.jsx; AgentBuilder.jsx; base44/functions/manusBenchmarkEngine; superAgentOrchestrator; postconditionValidator; independentAgentRunner; packSync; googleEcosystemSync; vercelDeploy.
- Existing Supabase projects have distinct duties. X1 staging uvdkzsbjackpjvpoxtyk must be reconciled before new orchestration; X1 production vgsmyhqqtkkluhypxyua must not be changed without authorization; Strategic Intelligence jadlpbokfdkonvnfxjzs is a metadata candidate after RLS review. Do not create duplicate heartbeats or queues.
- Inventory decisions for each module: REUSE, CONNECT, REPAIR, REFACTOR, MERGE, NEW_GAP, QUARANTINE, or RETIRE (the latter requires proof and approval).
- Evidence precedence: operator instruction > approved product and PageSpec > authenticated current runtime evidence > repo branch/SHA > deployment receipt > approved datasets > old handoff > inference. Report VERIFIED/INFERRED/UNKNOWN/BLOCKED, never conflate records with actual deployments.

### 2. Reproduce observable Manus task behavior, not proprietary internals
Official external behavioral reference: https://manus.im/blog/manus-sandbox ; https://www.manus.im/features/cloud-computer ; https://open.manus.im/docs/v2/task-lifecycle ; https://www.manus.im/features/projects
1. Project workspace stores instructions, approved sources, skills, tools, connector bindings, and previous successful artifact references.
2. Each mission launches an isolated disposable execution sandbox with filesystem, terminal/code tools, browser, bounded network and resource quotas. Multiple missions can run concurrently without sharing mutable workspace state.
3. Durable project workspace, object artifacts, event log, checkpoint manifests and optional approved persistent cloud computer survive disposable sandbox shutdown. Never rely on chat process or localStorage for continuity.
4. Mission planner breaks instructions into explicit checklists with dependent tasks, specialist assignment, state machine, resource/cost ceilings and tool permissions.
5. Agent activity/outputs stream to operator chat; interactive ask-user, scoped confirmation, pause/resume, stop, takeover and inspect controls available for exceptional cases.
6. Long-running work is independent of client connection. Background status and webhook/poll updates are truthful about running, waiting, blocked, failed, passed.
7. One user-visible agent receives commands; internal specialists operate invisibly unless operator chooses details.
8. All agents use existing authenticated connectors; no inference of access based on a UI icon.

### 3. The non-negotiable MissionSpec, one canonical versioned manifest
Mission must encode mission_id, tenant_id, requested_by, project_id, request_text, intent, project_kind [website|app|pwa|portal|crm|social|automation|full_business_os|other], client, business facts/provenance, target audience, industries, quantity, explicit locations and optional location discovery policy, geography/legal market, domain ownership, brand and selected design lock, templates/version/hash, feature requirements, data model, UX routes, integrations, copy/media provenance, SEO intent, social channels/calendar/assets/approval, CRM/lead routing, onboarding flows, privacy/security policy, budget, provisioning targets, approvals, checklists, test matrix, acceptance criteria, source_refs, source_sha, idempotency_key, sandbox_id, artifacts and receipts. Unknown essential facts generate a targeted clarification; known facts must not be asked twice. Never fabricate entities or locations.

### 4. Universal Template Vault and pack contracts
Catalog contains:
- WebPacks: layouts, pages, themes, hero treatments, conversion flows, mobile, SEO, structured data, accessibility, unique-local-evidence requirements.
- BrandPacks/LogoPacks: immutable colors, typography, logo assets, legal usage/rights, brand guardrails.
- AppPacks: auth, mobile/PWA, multi-tenant portals, data architecture, integrations, admin flows.
- WorkflowPacks: CRM, pipeline, notifications, recurring jobs, customer support, lead capture, SEO, social.
- Content/SocialPacks: channel strategy, captions, hashtags, validated image/video provenance, schedules, replies policies.
- Agent/ToolPacks: role, permissions, tool schemas, sandbox fixtures, output validators, stop/approval rules.
- DocumentPacks: requirements, market research, SiteSpec/PageSpec, architecture, API, data dictionary, testing, deployment, operations, support, cost and rollback.
- ProvisioningPacks: reusable provider binding manifests, non-secret connector references, owner approval, dry-run and read-back receipts.
Library is scalable and extensible, never described as literally infinite compute. Every pack has type, stable id, semver, author, ownership, lineage, dependencies, license, source SHA, hashes, maturity state DRAFT/TESTED/APPROVED/RETIRED and visual screenshot golden masters. GPT may upload draft packs; only versioned approved packs enter production templates.

### 5. Autonomous Super Agents, round-the-clock operating contract
Roles: Primary Mission Operator, Research, Strategy, Requirement Engineer, Design Guardian, Frontend, Backend, Data/RLS, Automation, Content, SEO and Schema, Social/Media, Provisioning, Security Guardian, QA-1, QA-2, Independent Fault Line QA-3, Release Controller, CRM and Client Success, Monitor/Recovery. A role is not proof of an available agent. Bind each to a verified worker/tool and capability.
- Single existing authoritative supervisor; 5-minute reconcile cadence only if runtime and owner identity verified. Do not install duplicate cron.
- Durable queue + leases with TTL/renewal + checkpoints + replays + bounded retries + dead-letter + idempotent per action + cost/time/concurrency limits.
- Work items transition REQUESTED > SCOPED > RESEARCHED > SPEC_READY > BUILDING > VALIDATING_1 > VALIDATING_2 > VALIDATING_3 > RELEASE_READY > APPROVED > PROVISIONING > LIVE_VERIFIED > OPERATING. Exceptional states PAUSED/WAITING_APPROVAL/BLOCKED/FAILED/ROLLED_BACK. Never jump by inference.
- Chat can submit, inspect, update and stop missions but cannot silently bypass privileged approval.
- Reports contain not only task states but exact deployed URLs, commit, provider IDs, test cases, evidence and rollback metadata.

### 6. Mandatory three-pass independent acceptance: RELEASE FAILS CLOSED
PASS ONE - ENGINEERING COMPLETENESS by implementer + deterministic CI: dependency resolution, compile, typecheck, lint, unit and integration tests, API contract, schema migration dry-run, permissions/auth/RLS and dependency scanning; checklist coverage for ALL specified components; code and doc references generated, no placeholder endpoints/credentials or fake simulation marked production.
PASS TWO - FULL-SYSTEM BEHAVIORAL VALIDATION by different test runner: real desktop/mobile browser screenshots against golden masters, complete navigation/forms, end-to-end synthetic transactions/leads and trace IDs, tenant-negative cases, workers, queue recovery and cancellation, cross-provider synthetic bindings, responsive/a11y/performance, correct SEO canonical/direct-route/index policy, complete social drafts + approvals. Rebuild and retest on failure.
PASS THREE - INDEPENDENT RELEASE AUTHORITY by separate reviewer/validator: re-check fresh SHA, independently reproduce failed/high-risk tests, validate business facts and legal content, content uniqueness/cannibalization, documentation and handoff package, security vulnerabilities, secrets/permissions, backup/rollback, cost budgets, complete provisioning DRY RUN, no claim of production status without fetched receipts. Final approval manifest immutable and linked to SHA/template hashes.
ALL mandatory checks must be green, all docs complete, zero release-blocking findings, no missing receipts. A 100% CHECKLIST-PASS TARGET is measurable; literal perfect bug-free software cannot be guaranteed. If any critical check unknown, FAIL or BLOCK. Implementer cannot certify own 3rd pass.

### 7. Sandbox isolation and promotion
Sandbox is a real per-mission isolated compute/worktree + isolated preview URL + synthetic data and provider fixtures, not a UI tab. Persist artifacts and provenance in governed storage; secrets as scoped provider references injected server side and never stored in pack. Keep separate from customer/production DB and active public domains. No actual outbound customer messages, public posts or irreversible payments from sandbox. Every generated system has a versioned manifest, complete docs, screenshots, QA receipts and signed approved release version. Promotion only uses exact validated revision (no rebuild with moving dependencies between QA and production). Canary then confirm and roll back if needed.

### 8. One-shot provisioning and always-on operation
On release authorization, the Release Controller executes an idempotent, reversible where possible, ProvisioningPlan:
(1) provider and domain ownership preflight; (2) correct account/tenant; (3) GitHub repo/branch/protected merge within permissions; (4) Vercel project and verified deployment; (5) Supabase project binding/schema/migrations/RLS/Storage with tenant scope; (6) Railway worker and existing single supervisor wiring; (7) domain registrar/DNS/SSL ONLY with scoped approval; (8) site and client portal auth; (9) lawful lead forms/CRM/routing; (10) GA4 tag/property binding and test collection; (11) Search Console property authorization/verification and sitemap submission ONLY if authorized and indexing rules pass; (12) consent, conversion events and attribution; (13) social account OAuth and draft-only pipeline until publishing is authorized; (14) operational monitoring, alarms, backups and rollback; (15) final independent live smoke tests, direct URL proof and documentation delivery.
OAuth, property ownership, new account billing, DNS delegation and authorization can require action from account owner/provider. These cannot be silently bypassed or guaranteed. Mark each target CONNECTED/NEEDS_AUTH/UNAVAILABLE/VALIDATED, not falsely 'done'. Production deploy, permissions, secrets, spend, external publishing, customer communications, destructive actions and data migration remain scoped approval gates.

### 9. Google and programmatic policy
Useful original content and verified regional/business evidence before index eligibility; NearMe transactional discovery vs NearYou decision-support purposes stay differentiated. No thin doorway fleets, fake reviews/pricing/availability/offices, mass keyword substitutions or unsupported schema. Generate drafts freely, publish/index only verified unique useful assets. Monitor GA4, Search Console, lead value, first-party attribution, CWV and conversions without ranking guarantees.

### 10. Critical existing-system repairs to prioritize
P0-a: Verify actual live Admin and repo mapping; inventory and classify all existing systems, agents, functions and templates. Identify feature parity with actual available providers.
P0-b: Disable/replace the existing simulated WebsiteFactory deployment path that waits two seconds then sets status 'live'. Actual deployed proof must be required to mark LIVE_VERIFIED.
P0-c: Fix GeneratorSandbox.jsx: entered request must create MissionSpec with durable queue receipt, not just navigate to /admin/agent-builder.
P0-d: Reconcile ManusRecreation benchmark with functional engine; percentages and button states are not independent proof.
P0-e: Inspect X1 staging queue, dead letters, worker identity, heartbeat and deduplicate runtime before adding workloads; inspect production security/RLS concerns before client data.
P1: Freeze approved homepage, Vision Cortex-like mission chat, premium templates look; route UI to true mission API without replacing working V1 Admin.
P2: Implement universal MissionSpec, template manifests and checklist engine, sandbox runner, agent capability registry and receipts.
P3: Implement independent three-pass CI+browser+Fault Line release validator, immutable promotion.
P4: Implement provider provisioning and GA4/GSC onboarding adapters, consent/approval workflow, client portals and social pipeline.
P5: Demonstrate one generic, non-epoxy mission end-to-end, then parallel 10, 100 with budgets and documented Google index eligibility.

### 11. First proving mission, independent of industry
Operator says: "Build a premium CRM-enabled service website and mobile client portal for a veterinary business in Austin, Texas; one site, five page types, brand pack, onboarding, lead capture, 30-day social DRAFT calendar, analytics, Search Console readiness, complete docs. Use existing templates, deliver validated preview and provisioning plan."
Expected: MissionSpec + checklists + sandbox + branch + preview + real tested CRM/contact flow + media+social draft + GA4/GSC plan + three PASS receipts + operator approval gate + provisioning only when explicitly authorized + final URLs and handoff. Run with synthetic data only until approved.

### 12. Protected rollout and audit
Work only on isolated branch/staging without further approval; no existing default-branch overwrite, live site changes, new production cron, provider secret mutation or spend. Every PR states source SHA and visual parity before/after, tests, known unknowns, rollback. Never claim 24/7 running unless heartbeat/worker read-back is recent. This document is a contract, not proof of execution.

### 13. Exact next executable engineering packet
Capture live Admin navigation and current deployment/SHA; reconcile active PRs and protected operations. Implement a durable mission intake and validator-backed receipts in branch/staging, leveraging existing X1 staging queue and ONE supervisor. Add first acceptance test proving a request survives browser closure. Do not start a second application or new heartbeat.
