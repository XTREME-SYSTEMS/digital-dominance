# Strategic Minds AI V2 | V1-to-OS Convergence Gate (2026-10-11)

**Operator decision:** Digital Dominance **V1** is the code and working-business-system donor for the new **strategicmindsai.com V2**, a Manus-inspired autonomous AI operating system with GPT as the operator-facing orchestrator. Replace the current public website only after verified preview, authentication, DNS cutover and rollback. Do not rebuild V1 features from scratch.

## Evidence-backed source of truth

- V1 Base44 app: `DIGITAL DOMINANCE V.1`, `6a77f4491f0bf92de9a3ed8b`. Base44 source read-back matched V1 GitHub main `97cb8c6b78e876797e326bc4874893aa3066680f`.
- V1 code: `XTREME-SYSTEMS/digital-dominance`; safe website refactor branch `feature/website-launch-engine-debase-v1`, recently `f3e863a8aa6b0a0aad5056e92ce5a4433c14c56e`.
- PR #14: `feature/manus-agent-workspace-20261010` adds agent workspace shell, chat, swarm activity. Draft, not integrated into current main.
- PR #15: `docs/strategic-minds-manus-os-contract-20261010` specifies client journey, God Mode, sandbox and 3-pass release. Draft specifications, not functional client operations.
- PR #16: `feature/dd-sandbox-build-to-proof-001` already contains `missionContract.mjs`, 5 tests, Mission 001 failure/repair receipt and an *unreleased* demo. This branch extends that contract rather than duplicating it.
- `SmaiSandboxJob`, `CodeSandboxSession`, `smaiSandboxDispatcher`, `system_operator`, `SwarmTask`, `ManusRecreation` and `GeneratorSandbox` already exist in V1.
- Corporate auth & GPT integration donors: `Strategic-Minds-AI/strategic-minds-ai-corp` draft PRs #16 (credential capability broker) and #17 (Supabase OAuth consent). Do **not** merge corp pages wholesale into V1.

## Classify, do not replicate

| Component | Decision | Why |
|---|---|---|
| Digital Dominance V1 research, SEO, factory, agents and workflows | REUSE / EXTRACT | Existing source and provider integrations |
| V1 `smaiSandboxDispatcher` | REFACTOR | Creates AI plan and checklist, not verified sandbox execution; pack URL presence incorrectly implies approval |
| V1 `CodeSandboxSession`, `SmaiSandboxJob` | PRESERVE / COMPATIBILITY ADAPTER | Existing typed models. Do not trust ready/approved strings as independent validation |
| PR #14 Manus-style Agent Workspace | CONNECT AFTER REBASE | Existing responsive shell, not yet runtime E2E verified |
| PR #15 factory client operating journey | REUSE AS SPEC | Stripe, Eden, Google Drive, e-sign, tenant portal are proposed, not activated |
| PR #16 mission contract and repair proof | EXTEND | Immutable SHA, bounded repair, protected-action gate, negative tests |
| Railway Strategic Sandbox System `worker-sandbox-code` | PRESERVE / DO NOT USE AS CODE SANDBOX | Repo `Strategic-Minds-AI/super-agents/local-worker/worker.js` runs a general Base44 `runAgentLoop` via `APP_URL` and `WORKER_SECRET`, not isolated build execution. SUCCESS deployment 2026-10-01 does not prove safe V2 sandbox. |
| X1 AI Hub Staging `uvdkzsbjackpjvpoxtyk` | CONNECT WHEN VERIFIED | 72 queue rows: 36 completed, 20 dead-letter, 16 blocked. Historical `CONTROL_PLANE_AUTHORIZATION_FAILED` |
| Corporate Google/Supabase OAuth | CONNECT / VERIFY | OAuth discovery and preview consent proven; signed-in client canary, audience/tenant grants and apex-domain binding remain outstanding |
| Existing `strategicmindsai.com` live website | REPLACE WITH GATED CUTOVER | User permits redesign/replacement, not DNS or production mutation without exact approval |

## New V1 compatibility adapter delivered in this branch

- `v1SandboxBridge.mjs`: converts existing V1 job metadata to typed DAG mission input without the prompt plaintext, enforces V1 job/client identity and immutable source SHA, rejects inherited spend and credential-bearing prompts.
- V1 `pack_status` booleans, `validation_passed`, `status=approved`, sandbox URLs, and unverified receipt claims **never** confer release approval.
- `makeStagingPreflight` always refuses to write the queue. A caller cannot set a fake `VERIFIED` receipt: proof must be checked by a provider-native authorization verifier in a separate, tested adapter.
- `v1SandboxBridge.test.mjs`: 17 focused local Node cases pass (scope, auth-claim, tenant, SHA, idempotency, release). Vercel CI reports success for the branch; this is **not** proof of live worker execution.

## Target flow (reuse existing controllers, no duplicate scheduler)

`GPT/chat request -> authenticated, tenant-scoped MissionSpec -> one X1 canonical queue & lease -> **newly validated isolated sandbox executor** (reusing permitted Railway/control-plane infrastructure, not the legacy Base44 agent-loop worker) -> versioned source/artifact receipts -> independent three-pass QA -> preview/proof dashboard -> scoped operator approval -> Vercel/domain publication -> telemetry and rollback`

- **Pass A**: source build, unit/contract tests, functional route and API assertions.
- **Pass B**: independent headless desktop/mobile visual/interactions, authentication, accessibility, cross-tenant, content checks.
- **Pass C**: isolated synthetic external integrations, lead attribution, rollback rehearsal and release-eligibility receipt.
- No unsigned receipts, no agent self-approval, no account-wide permissions, no secret exposure, no unapproved messaging/publishing/spend.

## The next runnable mission and why it is blocked

`MISSION SMAI-V2-X1-CANARY-001`: take a synthetic internal V1 job, produce a typechecked manifest, perform provider-native authorization read-back in X1 staging, independently verify a genuinely isolated sandbox runner (network restrictions, resource limits, filesystem boundaries, no secrets inherited), then claim/lease/execute only through that verified runner and inspect receipts. Do not enqueue until the authorization failure is isolated and a scoped nonproduction safe-retry path is verified. Maintain original job IDs, one supervisor and a rollback pointer.

**First required action:** build and validate an isolated sandbox-runner specification and fail-closed canary, then diagnose X1 staging's `CONTROL_PLANE_AUTHORIZATION_FAILED` using read-only queue/lease evidence. Existing Railway `worker-sandbox-code` is a generic Base44 agent loop and must NOT receive untrusted code mission work. No new Supabase projects, cron activation, production DNS, secrets, customer messages or paid provisioning.

## First-party sandbox alternative identified (2026-10-11)

The connected Vercel account exposes named sandbox/session APIs with network policies and snapshots. A read-only inventory of corporate project `prj_eo48eFcDSIcAX71xbHWXNp8f49Ao` returned **0 named sandboxes and 0 sandbox sessions**. This is a real provider-managed isolation candidate but NOT yet provisioned, tested, or authorized for provider spend. Prefer one short-lived Vercel sandbox canary with deny-all outbound network, no inherited credentials, fixed limits and nonproduction artifacts over pretending the generic Railway Base44 loop is a code executor. Do not activate the Vercel sandbox or incur spend without separately scoped approval.

## Release truth

GitHub drafts, green Vercel build checks and a simulated mission are **not** proof of 24/7 autonomous completion. Only a real leased worker trace, inspected artifacts, independently passing validation receipts, preview URLs and rollback prove the V2 sandbox pipeline.
