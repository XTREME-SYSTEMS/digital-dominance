# Four-project Supabase integration and security contract (2026-10-10)

Status: **DEVELOPMENT CODE REGISTERED; CROSS-PROJECT DATA INTEGRATION NOT DEPLOYED**.
Mission: DD-WLE-BOOTSTRAP-20261010. Do not create duplicate queues, crons, superagents or service-role identities.

## Verified projects
- X1 Production: vgsmyhqqtkkluhypxyua. Candidate authoritative live control plane. Existing X1 queues, leases, execution ledger, authorize/db-gateway Edge Functions. Work queue 3 COMPLETED, 1 DEAD_LETTER. No public.x1_worker_heartbeats table observed. Do not call this 24/7 validated.
- X1 Staging: uvdkzsbjackpjvpoxtyk. Existing mission, queue, leases, worker heartbeats and staging integration ledger. Queue 36 COMPLETED, 16 BLOCKED, 20 DEAD_LETTER. Synthetic and preview work only until authorization failure resolved.
- Strategic Intelligence: jadlpbokfdkonvnfxjzs. Business research, campaign, website and CRM datasets. 206 public tables, including dominance_campaigns, market_pricing, agent_tasks, and generation_jobs.
- Universal Property Intelligence: fwtchbsebygwifmmqhur. Approximately 791 property rows, 147 scores, 2,314 source records, 117 investor leads. Existing active universal-property-bridge Edge Function.

## Critical access controls
Strategic Intelligence: 10 public tables have RLS DISABLED with SELECT grants to anon and authenticated SQL roles. Includes agent_secret, onboarding_clients, operator_device, operator_task, swarm_runs, swarm_tasks, ideas, client_tasks, welcome_sequences, onboarding_checklist_items.
Property Intelligence: public.distressed_properties has RLS DISABLED and SELECT grants to anon and authenticated.
Do not read/export sensitive rows or make this data accessible to GPT, browsers or cross-project adapters until grants and RLS are independently remediated and tested.
Do not blindly enable RLS without policies because existing applications could lose access. Proposed staged policy/grant remediation requires scoped approval before any production database mutation. Official guide: https://supabase.com/docs/guides/database/postgres/row-level-security.

## Data-plane architecture
Four databases remain independent; use ONE existing, authenticated, server-side gateway with four project-specific least-privilege adapters. No universal service_role token, no direct client-to-four-project access, no assumed cross-project JWT equivalence, and no cross-database SQL joins.
Mission/queue and approval source truth: X1 Production *after* worker and auth proof; X1 Staging stays the sandbox; Strategic Intelligence and Property Intelligence retain ownership of domain records.
Read-only health/status routes can be prototyped after real scoped identity binding. Specialist market/property record routes are QUARANTINED until per-project security corrections; later expose only sanctioned aggregate views with consent, data minimization, lineage and tenant checks.
Event envelope: event_id, tenant_id, source_project_ref, mission_id, event_type, source_record_id, source_version, content_sha256, observed_at, approval_ref, idempotency_key, redaction_class. Use signed server event transport + replay checks; write resulting references and receipts into the canonical control plane only. Existing staging dominance_sync_events is a candidate, not a live transport proof.
The project-router.mjs module is a PURE POLICY gate. It has 12 synthetic tests passing locally; it has NO credentials and performs NO network requests. Backend identity verification and real project adapters remain required.

## Steps remaining
1. Reconcile production worker identity/heartbeat and denied/dead-letter jobs, including stage vs prod authority.
2. Review high-risk table grants, owner impact and tenant RLS policies, prepare independent negative security tests.
3. Scope and approve production security changes before executing them. Maintain rollback.
4. Bind secrets by provider-native references without exposing values, then execute per-project read-only health canary.
5. Validate a signed, sanitized Strategic Intelligence opportunity event and a property summary event in staging, with deduplication/receipts.
6. Require independent security test and operator approval for production federation enablement.
7. Attach approved data insight features to the GPT Mission API and Website Launch Engine dashboard; preserve locked public visual design.
