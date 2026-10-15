# X1 / Digital Dominance Situational Prompt Router

## Status
Nonproduction branch implementation only. No Base44 main edit, queue activation, production deploy, or paid API invocation has occurred.

- Primary app: DIGITAL DOMINANCE V.1 (Base44 app `6a77f4491f0bf92de9a3ed8b`).
- Generator donor: UNIVERSAL TEMPLATE FACTORY (Base44 app `6abf13c20bc3a71463a296e8`).
- Existing Digital Dominance prompt sources: `engineeringPromptLibrary.ts` and `pipelinePromptLibrary.ts`.
- Existing task owner: `base44/functions/metaAgent/entry.ts` with `WorkPacket`.
- Existing persistence: `AgentIntelligence` entity, category must be `custom`, tags include `prompt_registry`.
- Existing execution authority: verified X1 queue/worker only; this change does not introduce one.

## Files
- `base44/shared/situationalPromptRouter.mjs`: pure deterministic selector and bounded context composer.
- `base44/functions/metaAgent/entry.ts`: per-WorkPacket routing in the existing Meta Agent, without the previous hard-coded prompt ID filter.
- `base44/functions/importPromptRegistry/entry.ts`: admin-only staging, approval and status actions against the existing AgentIntelligence entity.
- `base44/tests/situationalPromptRouter.test.mjs`: Node regression tests.

## Full 160-prompt source (NOT committed to repo)
Original package: `DIGITAL_DOMINANCE_160_PROMPT_IMPORT_PACK_20261013.zip`, SHA-256 `53ac05726b29f4eb90f25d9ca0fb25d718c0d8aed2804c6acf421a859986e5e6`.
JSON artifact: `PROMPT_REGISTRY_160.json`, SHA-256 `4d5ebf56111eab67b7657a55ecad79ec8fa41927eee2bb55f1c32ea206997990`.
Payload integrity: 160 unique versioned records in 16 categories, each with a verified SHA-256 of its unmodified `prompt_text`.
These bytes are not available to Base44 automatically from a ChatGPT sandbox URL. The user or an authenticated file transfer must supply the original JSON to the existing app. Do not claim imported until provider readback shows 160 versioned records.

## Import contract
Use an authenticated admin session to call `importPromptRegistry` with batches of at most 20 entries from `BATCH_01_...json` through `BATCH_08_...json`.
1. `{action:'preview',prompts:[...]}` validates IDs, SHA-256 and payload size without changes.
2. `{action:'stage',prompts:[...],confirm_staging_only:true}` writes owner-only, inactive, `PENDING_REVIEW` AgentIntelligence records. Idempotent duplicates return in `duplicates`; conflicts do not overwrite.
3. `{action:'status'}` read-backs count, prompt IDs and active status.
4. After operator review, `{action:'approve',prompt_ids:['PB-001@1.0.0'],approval_reference:'...',confirm_approval:true}` enables selected prompts. This is a separate explicit administrative decision.
5. An approved prompt only becomes eligible for selection. No agent job is invoked by import or approval.

**Important:** Because the original 160 source records do not encode individual intent, role, phase and capability arrays, their initial routing precision is limited to mapped category/phase and task keywords. Reviewers should enrich these fields before approving them for production use.

## Development validation
- `node --test base44/tests/situationalPromptRouter.test.mjs`
- Inspect real Base44 branch build/preview once available and independently verify one synthetic metaAgent goal: discover → design → code → validate.
- Check that an unapproved PB prompt is never selected, a cross-tenant prompt is rejected, and a protected release prompt is excluded from compiled executable instructions.
- Check no duplicate cron/queue/worker was created.

## Release gates
Do not merge or deploy until an independent validator binds a real source SHA, confirms working imports and metaAgent selection, and the operator approves the exact target. The editor currently exposes only Base44 main branches for both apps; this GitHub feature branch is the isolated handoff surface.
