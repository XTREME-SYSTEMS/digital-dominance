# Website Launch Engine | Autonomous Recovery Handoff (2026-10-11)
## Verified authority
Public visual lock: https://website-launch-engine-xps.vercel.app/
Original donor/launch code: XTREME-SYSTEMS/digital-dominance feature/website-launch-engine-debase-v1, most recent inspected SHA 327c6a060d65b479347b2f3370339b351faaa14b.
ACTUAL production Railway worker source: Strategic-Minds-AI/x1-ai-hub-swarm-runtime main at 3ee70d1e75ce4935e8072d1dcdbfe5c8ef6bd894; project X1 AI Hub Production and service x1-swarm-production. Source verified by Railway describe-service.
## Actual repair
Draft PR #7: https://github.com/Strategic-Minds-AI/x1-ai-hub-swarm-runtime/pull/7
Branch feature/x1-autonomy-auth-failclosed-20261011, SHA 7a6d1fc0a22b39be8481680c2dde701ea9a0f493. Independently executed GitHub CI succeeded: https://github.com/Strategic-Minds-AI/x1-ai-hub-swarm-runtime/actions/runs/38110763723
Production worker formerly treated CONTROL_PLANE_AUTHORIZATION_FAILED as FAILED and queued tasks could be retried until dead letter. Patch classifies authorization/credential failures as BLOCKED, preventing unsafe retries; five regression tests committed. NOT deployed/merged.
## Live findings
X1 Production Supabase vgsmyhqqtkkluhypxyua: 3 completed, 1 dead-letter job; dead-letter cause CONTROL_PLANE_AUTHORIZATION_FAILED. No x1_worker_heartbeats table observed. Railway single replica Docker worker sourced from x1-ai-hub-swarm-runtime and /healthz, but no end-to-end uptime evidence.
X1 Staging uvdkzsbjackpjvpoxtyk: 36 completed, 16 blocked, 20 dead letters. 16 auth failures in dead letter. project-zero-worker-bind staging endpoint is deliberately CLOSED, returns HTTP 410 to non-GET. project-zero-authorize uses token/hash registration + capability checks; DO NOT bypass.
AUTO_BUILDER_2 universal dry run returned manual_receipt fallback, no provider-specific X1 adapter implemented. This is planning only.
Railway sandbox-code source Strategic-Minds-AI/super-agents /local-worker; prior deploy logs included Caddy server startup. Not proven website compiler.
Strategic Intelligence jadlpbokfdkonvnfxjzs: 10 exposed public tables without RLS, including agent_secret and onboarding_clients, with SQL anon SELECT grant. Universal Property Intelligence fwtchbsebygwifmmqhur: 1 exposed distressed_properties table without RLS and anon SELECT grant. Security remediation is production protected.
## Autonomous operating doctrine
ONE authoritative heartbeat/queue only. Deterministic planner and typed bounded work packets, leased transactions, idempotency, independent validation and verified receipts. No repeat retries on auth/security/config errors. Read/draft and approved reversible staging work may progress automatically. Protected writes require scoped immutable authorization. Default budget $0 until separately approved; no master tokens in frontend or AI prompts.
## Next eligible steps
1. Inspect X1 worker env variable NAMES and endpoint URI destinations (never secret values). Verify gateway target matches its own production Supabase ref and caller principal. Observe a synthetic denied response without disclosing credentials.
2. Run branch CI/review and a staging integration canary for draft PR #7. Production deployment remains gated.
3. Fix 11 RLS exposures through separately approved migration with negative tenant/grant tests and rollback. Do not toggle policies blindly.
4. Connect the existing X1 backend and factory/validator in one reversible staging lane. Test real source commit + Vercel preview + mobile/desktop + form and repair receipts. Unattended proof requires observed worker restart/lease recovery and extended independent health.
5. Only after all gates, promote one authorized preview batch; never merge/deploy/publish/pay/notify externally without scoped approval.
## Artifact
Local container test module: safe-supervisor.mjs with 22 local passing tests. DRY RUN ONLY; never claimed deployed into worker.
