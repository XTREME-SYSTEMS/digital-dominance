# Synthetic CRM canary prerequisite — 2026-10-13

Status: draft code repair, not a live X1/form/CRM completion receipt.

Official source: XTREME-SYSTEMS/digital-dominance, base 9bc65fefffffe9a244b1390b975d3cae42b1529f.
Guard PR: https://github.com/XTREME-SYSTEMS/digital-dominance/pull/23
Original Base44 app: DIGITAL DOMINANCE V.1 / 6a77f4491f0bf92de9a3ed8b.
Frontend and ongoing refactor were not edited.

## Finding and repair

Lead creation schedules promotional emails without test exclusions. Immediate Lead Follow-Up, Lead Follow-Up, CRM Follow-Up Sequence, and Review Request now exclude test_confirmed and test_likely in their existing trigger predicates. Their four senders re-read the current lead and suppress those classifications before provider access, send, email logs, or updates. The shared helper also blocks reserved invalid domains in ordinary, display-name, and recipient-list inputs, including recipient overrides. Render-only estimate previews remain available.

41 actual-handler regression tests pass with mocked SDK/provider dependencies. Real-lead tests verify retained mocked sending; no real email was sent. Workflow checks parse JSON and inspect exclusions; hosted DSL execution is UNKNOWN. Independent review and file hashes are recorded in the adjacent Guardian receipt.

## Deployment boundary

No Lead was created. No source was merged into main or deployed into the original Base44 app. Existing live senders therefore must still be treated as unguarded. No website intake backend was added; the existing static noindex preview remains a template canary, not an X1 worker execution.

Protected action requested separately: deploy only this reviewed guard change to the original app, preserving unrelated refactor changes. Verify that both workflows and sender functions use the reviewed revisions before any synthetic submission. Do not treat a GitHub merge or sandbox source read as proof of hosted function deployment.

Rollback: restore only the affected four sender files and four workflow trigger predicates from the pinned source base, then remove the helper if no import remains. Stop canary submissions before rollback. Leave unrelated frontend, entity schema, RLS, credentials, provider project settings and deployment aliases untouched.

## Subsequent live validation

After deployment verification, connect the existing preview/launcher to the original CRM through the supported existing intake contract. Use exactly one clearly classified test_confirmed record, reserved invalid email, synthetic-only form, fixed run identity, no invented business claims or prices, and bounded retries. First verify existing records/idempotency keys so retries cannot create duplicates.

Independently verify rendered noindex preview, mobile and desktop interaction, submission failure behavior, persisted Lead ID and classification in the admin CRM, and no corresponding outbound EmailLog/provider sends. Record source SHA, deployment ID, queue/worker/lease identity and Guardian receipt separately. Missing worker identity, durable deduplication, DSL runtime validation, mobile testing and live CRM evidence remain UNKNOWN; do not expand to batches or duplicate infrastructure on this receipt.
