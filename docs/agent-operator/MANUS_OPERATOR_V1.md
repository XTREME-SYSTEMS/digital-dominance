# STRATEGIC MINDS AI OPERATOR — Manus-style V1 Foundation
Date: 2026-10-10
Status: BRANCH PROTOTYPE ONLY. NOT deployed, NOT connected to the job queue, NOT approved for production.
Branch parent: XTREME-SYSTEMS/digital-dominance main @ 2fc8bbe580b7f6436d32096f977f102cc9e7efd6

## Product direction
Reuse the existing Digital Dominance Admin instead of creating another builder.
Selected product direction is Brand B / Design 2 / Workflow C. Preserve the established visual source truth.

## Verified source-to-capability map
- Operator UI: src/pages/admin/GptSyncPipeline.jsx and src/components/gpt-pipeline/PipelineRunner.jsx (REUSE / REFACTOR)
- General chat UI: src/pages/admin/SystemOperator.jsx (REUSE; Base44 coupling)
- Existing AI loop: base44/shared/operatorLoop.js (REFACTOR)
- Existing hosted dispatch: base44/shared/operatorHosted.js (QUARANTINE until policy hardening)
- Existing backend gateway: base44/functions/vercelAiGateway/entry.ts (MIGRATE off Base44)
- Agent Builder, Agent Master, Swarm Command, Website Factory, Code Studio, Social Studio, Pack Sync, Google Command Center, and browser assets (CONNECT behind scoped adapters).
- Existing shared X1 queue / Supabase leases and Vercel reconciliation (VERIFY exact identity before wiring).

## Critical current gaps
1. Current operatorChat executes inside Base44 and uses a bounded seven-round / three-minute loop, not durable run suspension or resumed checkpoints.
2. A generic model tool offers broad entity create/update/delete and invoke_function authority, including service-role CRUD. The hosted adapter has only partial function-specific blocks. Never grant this to an autonomous agent without a server-side scoped approval policy.
3. Current chat memory uses Base44 AgentMemory; persistence and tenant isolation must be proven independently.
4. Manus-parity cloud browser, file sandbox, subagent delegation, background schedules and computer use exist as donor patterns, but no end-to-end validated unified runtime has been proven here.
5. Independent validation, RLS isolation, receipt correctness and full-stack build/deploy tests are pending.

## V1 operator contract
Goal -> bound tenant/actor -> mission record -> source truth -> research -> plan -> bounded work packet -> human approval for protected changes -> staging execution -> independent QA -> artifact/receipt -> release gate.
Every job has: mission_id, tenant_id, actor_id, parent_sha, tool capability, risk class, idempotency_key, input hash, step index, step timeout, lease owner, lease expiry, cost ceiling, external effect, event log, receipt, artifact hash, rollback reference.
No tools are enabled because their names sound safe. The server must authorize each exact tenant, resource, scope and call.
Generic mission approvals never authorize payment, DNS, production deployment, protected merge, destructive writes, secrets, publishing or messaging. These use separate approval surfaces.

## Intended UI
At /admin/gpt-pipeline: a single goal input, Project memory selector, plan card with editable steps, live job timeline, browser/computer observation panel, artifact gallery, budget meter, approval queue, intervention controls (pause/resume/cancel), and independent QA report. On mobile show Goal -> Plan -> Runs -> Files -> Approvals.

## Existing infrastructure mapping
- GitHub source of truth; branch source-first, no automatic main merge.
- Vercel UI, API mediation, AI Gateway, workflow control; one existing heartbeat only.
- Supabase authoritative mission/work steps/leases/receipts/RLS after STAGING migration review.
- Railway worker/sandbox only for durable code/browser tasks that exceed serverless execution.
- Xtreme Cloud Browser as an adapter with explicit session provenance; no bypass of authorization.
- Google Drive scoped artifacts; OAuth connector operations only with correct account and action scopes.
- Base44 code preserved as donor, not the target runtime.
- External GPT sync via authenticated scoped server bridge and asynchronous mission API; ChatGPT itself is not a guaranteed 24/7 worker.

## First vertical slice acceptance criteria
1. Create mission in nonproduction, reload it from durable storage; tenant boundary enforcement PASS.
2. Produce source-backed plan with explicit risk and cost; no fabricated task completion.
3. Execute one benign read/browser research task with real evidence and bounded timeout.
4. Suspend for an approval-required action; resume only after a matching server-issued receipt.
5. Generate an inspectable artifact, persist hash and lineage; independent validator checks it.
6. Pause/resume/retry safely with idempotency; no duplicate messages, publishing or site provision.
7. Mobile UI correctly shows status across refresh and a completed run only after QA.
8. Vercel preview build, protected routes, baseline SEO/direct-route regressions, Playwright and security gates pass.
9. Production operations remain disabled pending scoped approval.

## Next safe work sequence
A. Independently audit generic operator invocation paths and authenticated source.
B. Bind current X1 staging queue/lease schema, never create a second scheduler.
C. Wire missionContract.mjs into a SERVER adapter, not the browser, with actual signed server-verified approvals.
D. Create private Admin Mission UI and first read-only browser research worker in staging.
E. Run synthetic tenant isolation, idempotency, escalation, state-recovery and QA tests.
F. Request operator approval for any production data migration, public publishing or deployment.

## Module present in this branch
src/lib/mission-control/missionContract.mjs is a pure V1 policy/state machine prototype with test cases. It is not a security boundary until integrated and independently tested on the server.
