# X1 AUTHORIZATION FORENSICS AND SENSOR FENCE
Date: 2026-10-14. Scope: staging READ + branch-only documentation. No queues replayed, no secrets changed, no production operations.

## Fresh authoritative readback
X1 staging Supabase `uvdkzsbjackpjvpoxtyk`:
- 54 COMPLETED; 20 DEAD_LETTER; 17 BLOCKED; 0 PENDING; 0 LEASED = 91 total.
- 16 dead letters labeled CONTROL_PLANE_AUTHORIZATION_FAILED. Five latest samples dated between September 29 and October 3; not evidence of a new October 14 outage.
- Other dead letters: 3 `fetch failed`, 1 `LOCAL_BRIDGE_TASK_TIMEOUT`.
- Latest `jarvis-local-power-grid-1` heartbeat 2026-10-15T02:41:13.4831Z; `ONLINE`, `SENSOR_ONLY`, `lease_requested:false`, local control plane address `http://control-plane:4311`. This sensor intentionally does NOT ask for task leases.
- Latest X1 worker ledger completion: task `dd.x1.railway.connection-probe.20261014`, worker `x1-swarm-preview-1`, receipt `worker:5153313d-8835-4eec-8f75-29befb35250e:1`, completed at 2026-10-14T07:49:41.797929Z.
- Historical successful completion is real but not today's fresh active lease proof.

## Root-cause classification
`CONTROL_PLANE_AUTHORIZATION_FAILED` = auth failure **symptom**, root cause UNKNOWN. Do not infer missing secrets, wrong token, or token expiry from label alone. Older records must not be bulk requeued. `SENSOR_ONLY` = intended telemetry mode until supervisor registry and task-lease bindings are verified. Never elevate a sensor to an executor by changing health flags.

## Bounded existing-system engineering packet
1. Inspect existing Railway `x1-swarm-preview` auth decision path, service-to-tenant mapping, audience/scope, connector identity, and last failure trace using redacted metadata only.
2. Independently inspect X1 staging bootstrap authorization records for the failing task classes, with no secret-value reads. Compare earliest denied and most recent completed control-plane probe before proposing a repair.
3. Confirm the one authoritative supervisor/queue lease owner. Avoid adding cron, queue, worker, replica, or competing supervisor.
4. Prepare ONE nonproduction READ_ONLY synthetic fixture for the existing worker only after auth preflight passes; check identity + lease + ledger + validation receipt + replay rejection using immutable SHA.
5. Keep old authorization dead letters quarantined and document case-by-case recovery, no automatic replay.

## QA acceptance gates
- Every output includes worker identity, environment, tenant ID, task ID, lease ID, provider action, source SHA, authorization decision, validator identity, receipt ID.
- No credential values in artifacts. Current state evidence must be timestamped.
- Fail closed on no valid lease, unauthorized identity, absent source SHA, stale receipt, replayed idempotency key, or user action requiring protected approvals.
- Run offline snapshot regression from branch (`node scripts/test-x1-snapshot.mjs`) and independently attest its actual result. Prior separate local assertions are not repository CI.
- No production release or Be Near Me modifications.

## Truth and next action
VERIFIED: Current statuses and sensor-only heartbeat; historical X1 worker receipt; 16 legacy authorization-labeled dead letters.
INFERRED: Auth handshake mismatch is worth targeted investigation, not proven.
COULD NOT VERIFY: Live new mission claim/ack, current auth root cause, end-to-end preview canary.
BLOCKERS: No current lease test; GitHub X1 repository write permission not yet verified; provider action constraints.
WORKAROUNDS: Read existing X1 logs and staging records, run isolated fixture on existing worker, capture immutable receipt and independent validator.
NEXT: Investigate scoped auth decision evidence, then bounded lease/receipt canary. Do not replay legacy dead letters.
