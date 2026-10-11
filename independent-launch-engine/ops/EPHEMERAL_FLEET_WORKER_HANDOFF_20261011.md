# WEBSITE LAUNCH ENGINE | Ephemeral Sandbox Fleet V1 Integration Handoff
Date: 2026-10-11
Authoritative Website Factory source: XTREME-SYSTEMS/digital-dominance, preserve `main` and the approved public https://website-launch-engine-xps.vercel.app/.
Shared worker/control-plane implementation: `Strategic-Minds-AI/x1-ai-hub-swarm-runtime`, branch `feature/ephemeral-sandbox-fleet-v1`, SHA `a274a6a20046f1b0bd5b38ab291b1d2a3a4f4034`.
Draft review: https://github.com/Strategic-Minds-AI/x1-ai-hub-swarm-runtime/pull/8
CI (source SHA): https://github.com/Strategic-Minds-AI/x1-ai-hub-swarm-runtime/actions/runs/38111459850 — SUCCESS.
X1 staging schema: `uvdkzsbjackpjvpoxtyk` -> `sandbox_fleet` (3 private metadata tables). Migration `ephemeral_sandbox_fleet_registry_staging_v1` applied and independently read back. RLS on all; anon and authenticated read denied; no queue/cron duplicated.
Existing X1 staging mission: `DD-WLE-BOOTSTRAP-20261010`, validation_contract.sandbox_fleet, DRAFT/PENDING, $0.
Documentation: https://docs.google.com/document/d/1z0Nq0xneuvrQzE5DuZtR5SWcu7AqZ3BUKVaSETKXOJI/edit

## Contract for Website Launch Engine wizard
1. Capture client tenant and approved industry, versioned premium template and quantity; do not pass real client data to arbitrary sandbox.
2. Create immutable work packet with tenantId, missionId, deterministic idempotencyKey, approved sourceSHA, synthetic fixture IDs, TTL 30m default / 120m max, approved budget reference, owning worker and provider-scoped resource prefix.
3. Claim existing X1 lease/supervisor, then use scoped sandbox worker to write generated code and preview. Do not provision permanent GitHub/Supabase/Vercel/Railway project per job.
4. Request independent validator for desktop 1440x900, mobile 390x844, routes, accessibility, security, synthetic lead. Bounded repair max3.
5. Verify source and archive hash, keep proof/rollback; only owned ephemeral resources are scheduled for post-TTL cleanup; unowned/missing proof quarantined.
6. Wizard proof dashboard shows PREVIEW_READY only after real preview URL and independent PASS receipt. Release must be separate operator-approved action.
7. Never modify locked public Website Launch Engine visual because of backend sandbox refactor.

## Current gate
PR #8 and migration are real and CI-tested. No cloud sandbox VM/actual preview build was created by this step; real provider adapters are not yet bound to the worker. Local cleanup canary was blocked by safety checks, so remote automatic cleanup is not proven.
Protect all production branches, database/RLS, secrets, DNS, spend outside approved envelope, real client outreach and public publishing. Use one authoritative existing heartbeat and X1 queue only. Supabase preview branches incur usage charges and are not covered by Spend Cap; require budget policies before scaling.

## Exact next eligible work
- Independent verification of X1 authorization paths and existing worker identity.
- Scoped server adapter for current Vercel sandbox project and GitHub branch, then one billable-free or approved-cap synthetic preview canary.
- Bind file ownership receipts to private staging registry, independently verify real cleanup and restart/lease recovery.
- Request specific production promotion only after whole canary chain independently passes.
