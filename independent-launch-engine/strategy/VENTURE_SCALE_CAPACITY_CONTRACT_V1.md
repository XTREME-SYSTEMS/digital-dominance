# Digital Dominance | Venture-Scale Technical Capacity Contract V1
Date: 2026-10-11 | Status: **PLANNING/ARCHITECTURE, NOT VERIFIED PROVIDER CAPACITY OR LIVE AUTONOMY**
Companion source: `independent-launch-engine/strategy/VENTURE_SCALE_OPERATING_DIRECTIVE_20261011.md` and `venture_scale_scenarios_v1.json`.
This contract preserves existing source truth, approved premium visual design, multi-tenant security, and the stage gates below.

## Separate five dimensions of scale
1. **Accounts:** count of tenant-owned businesses and operator roles.
2. **Sites:** count of published, independently reachable customer sites with distinct useful content.
3. **Jobs:** total queued build/test/repair tasks, not equal to concurrent running VMs.
4. **Compute:** simultaneous isolated temporary sandboxes, bounded by budget, quotas and observed latency.
5. **Commerce:** paid clients, realized revenue, retention, contribution margin and attributable leads. Do not substitute site or lead counts for revenue.

## Fleet capacity planning, NOT configured quotas
| Readiness gate | Tenant capacity goal | Concurrent build-slot goal | Needed proof |
| --- | ---: | ---: | --- |
| Synthetic/initial | 1–10 tenants | 3/tenant, 20 global baseline | One real build, isolation, cleanup |
| First commercial cohort | 10–100 tenants | up to 100 global after tests | Multiple customer previews, cost and worker stability |
| Multi-vertical scaling | 100–1,000 tenants | up to 500 global after tests | Load test and queue fairness, 99.9% availability objective |
| Enterprise growth | 1,000–10,000 tenants | up to 2,000 global after tests | Regional capacity, compliance, disaster recovery |
| Larger enterprise | 10,000+ tenants | demand-metered, provider-driven | Independent stress/load simulation; no hardcoded promises |

Capacity planning rule: `required_concurrency = ceil(incoming_jobs_per_hour * avg_job_minutes / 60 / target_utilization)`; target utilization initially <= 0.70 (assumption). Example 30 jobs/hour * 20-minute compute duration / (60 * .70) => >=15 concurrently active slots. Quotas, price, network policy and actual vendor availability must be verified before setting limits.
Thousands of *queued* customer tasks do not imply thousands of permanent provisioned Supabase projects or Railway workers.

## Dedicated authority vs reusable fleet
- **X1 Production**: authoritative control plane candidate, requires worker auth/heartbeat and lease proof. Queue, durable state, idempotent dispatcher and receipts reside here ONCE.
- **X1 Staging**: privately scoped sandbox metadata, synthetic fixtures, cross-tenant negative tests. Persistent environments are not an excuse to expose production PII.
- **Strat Intelligence and Property Intelligence**: domain specialists with server-mediated, tenant-scoped data adapters. Repair the identified RLS/grant issues first.
- **GitHub**: shared template/repo packages, isolated branches/worktrees per mission, SHA manifests and CI; avoid creating hundreds of permanent repos without a tenant-isolation need.
- **Vercel**: public approved marketing app and customer previews; per-job sandbox only when permitted and cost-accounted; preserve fully distinct deploy identities.
- **Railway**: existing singleton supervisor / horizontally scaled *workers*, not duplicate schedulers; workers process bounded tasks and publish receipts.
- **Google Workspace**: approved verified deliverables, customer source packets and evidence; don't use Drive as queue, lock manager or billable execution runtime.
- **AI model gateway**: provider-neutral through existing verified gateway, route per task/class under approved cost caps. No naked client-side secrets.

## Required platform contracts
- Tenant identifier on every record, object key, work packet, observation and receipt. Enforce RLS and negative cross-tenant tests on each client-facing action.
- State machine `REQUESTED -> ELIGIBLE -> LEASED -> BUILDING -> VALIDATING -> REPAIRING -> PREVIEW_READY -> OWNER_APPROVAL -> LIVE`; errors `BLOCKED, FAILED, DEAD_LETTER, QUARANTINED`. Preserve immutable transition receipts and don't promote `UNKNOWN`.
- Lease acquire/renew/expire with compare-and-swap revisions, singleton schedule election and requeue only known transient errors with bounded backoff.
- Sandbox owner-tag, signed standing authorization envelope, per-tenant namespace and TTL before any edit, delete or asset cleanup. User-approved standing *safe* scopes avoid routine permission prompts, but never imply permission to spend, send customer messages or alter production controls.
- Independent validator must refetch exact source/deployment SHA and test browser at 1440x900 / 390x844, functional routes, form/call CTA, accessibility, RLS, synthetic leads, SEO helpful content, supply chain and cost.
- Structured, redacted events: `tenant_id,mission_id,work_id,operation_id,idempotency_key,source_sha,provider_ref,receipt_sha,approval_ref,created_at`.
- Use unique business identities, avoid thin/duplicative mass-produced location landing pages and hard promises of rank or lead volume.

## Commercial and security gates
- Build revenue intelligence off signed contracts + payment settlement + invoices rather than marketing impressions. Separate annualized exit run rate from recognized 12-month revenue.
- Dashboard metrics: ARR/MRR, new signed customers, cohort churn, gross margin, cost per verified build, QA rate, launch time P50/P95, deployment health, dollars per acquired lead and conversion to booked opportunity.
- Implement a monthly billings-versus-provider-spend reconciliation and budget alerts before auto-scaling. No production paid service or credits activated by a planning document.
- Declare staged multi-region/read replica plans only when real traffic and tested DR objectives justify them.
- For acquisition-readiness: IP ownership, portable code and provider contracts, customer data lineage, audit-ready revenue reporting, privacy and licensing rights, clean tenant offboarding, retention evidence and measured cost structure.
- Owner/user external approval remains required for domain purchase, production deployment/schema/RLS/secrets, billing permissions, customer emails/SMS, outbound social campaigns, destructive legacy data operations and non-budgeted spend.

## Promotion checklist
No scale tier is marked ACTIVE without (1) signed scope/budget policy, (2) synthetic load/tenant test, (3) real browser build/validator receipt, (4) worker restart/lease recovery test, (5) cleanup test without foreign resource deletion, (6) verified cloud cost telemetry, and (7) rollback path. An accepted ticket, green CI, or Vercel READY alone cannot satisfy this list.

## Near-term blocker truth
X1 auth failures and restricted worker identity have been observed. The private staging sandbox registry and 40 synthetic tests exist; real provider adapters/unattended cleanup are NOT activated. 11 flagged exposed-schema RLS tables await scoped remediation. No claim of live federation or sales proof without provider evidence.
