# Strategic Minds AI V2: reuse the proven Digital Domination OS

## 2026-10-11 source-truth checkpoint

- Proven Admin donor: `XTREME-SYSTEMS/digital-dominance`, main `97cb8c6b78e876797e326bc4874893aa3066680f`. This branch is based on the **existing Manus-style Agent Workspace** at `c9be62d5b3c2b70a778a0ae4701bd6b9afa34f69` (PR #14).
- Integrated the existing Sandbox Mission 001 contract and tests from `feature/dd-sandbox-build-to-proof-001` (PR #16). Do not independently recreate the queue or runner.
- Reuse private X1 STAGING `uvdkzsbjackpjvpoxtyk` queue, leases, execution ledger and receipts; do not modify X1 production `vgsmyhqqtkkluhypxyua`.
- Client-facing visual source: `Strategic-Minds-AI/dominance-engine` with approved metallic-blue brand, giant S, INTELLIGENCE IN MOTION, vertical **electric-blue oval navigation on left**. Reuse approved appearance, not Base44 runtime.
- OAuth + credential broker donors: `Strategic-Minds-AI/strategic-minds-ai-corp` PR #17 (Supabase consent), PR #16 (capability broker), PR #15 (approved galleries). These remain separate draft changes until reconciled.
- Operator refers to **V12**, but no immutable V12 tag/build SHA has been identified in the checked canonical repo; require read-back before using V12 as a verified release ID.

## Implemented this branch

`independent-launch-engine/sandbox-v1/x1WorkPacketCompiler.mjs`: side-effect-free compiler for an already scope-approved `dd.mission.v1` mission. Produces strict X1 queue rows with tenant UUID, source SHA, plan hash, dependency manifest, scope approval, 64-character idempotency hashes, bounded retries and staging-only isolated-preview payloads. Explicitly refuses protected actions, spending, unknown tools, malformed tenant IDs, unapproved scopes, DAG cycles, and more than 40 tasks.

Synthetic X1 staging canary: verified queue schema and tenant FK. The first attempt with an unknown tenant failed closed (SQLSTATE 23503). A second canary inserted a temporary synthetic tenant and **11 preview queue records** in one transaction, passed checks, rolled back, and independently read back **zero queue and tenant records remaining**. No worker job was committed. This is compatibility evidence, not live sandbox execution.

## Required next engineering steps

1. Verify a real tenant-bound staging writer with RLS, worker safety filters, idempotency/lease enforcement and no duplicate scheduler. Do not enqueue an actual job before the worker rejects `execution_enabled:false` or equivalent non-executable draft packets.
2. Connect Manus Workspace actions to an authenticated mission submit/inspect/status/stop API; GPT OAuth credential scope and real connector readback first. Add actual isolated sandbox provision/terminate with quotas, persisted stdout/files/receipts and three-pass independent validation.
3. Integrate the approved Dominance Engine homepage/left-oval design with the V2 operator shell, preserving public, private and tenant-client security boundaries.
4. Run one synthetic preview end-to-end with rendered URL and independent screenshots, then 10 and 100 only after proven worker safety/cost budget.
5. Operator separately approves DNS, production credentials, production database changes, paid provisioning, real email/SMS, social publishing and public launch.

## Status rules

`VERIFIED`: source branches, compiler unit tests, staging transaction compatibility, rollback zero records. `UNKNOWN/BLOCKED`: real GPT OAuth installation, real V12 SHA, deployed sandbox worker, client tenant isolation, full V2 UI visual parity, live site launches. No implementation or staging proof is evidence of production readiness.
