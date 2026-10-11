# SwarmNexus V3 MAX -> Digital Dominance / Manus-OpenClaw capability convergence
Date 2026-10-11 | PHASE: SOURCE AUDIT / BRANCH-ONLY COMPATIBILITY | **NOT A LIVE SWARM INSTALL**
Exact local donor: `C:\_Strategic_Minds_AI_OS\34_SWARM_SYSTEM\98_IMPORTED_DOWNLOADS\2026-10-10` (9 text files, SHA-256 checked in JARVIS).

## Grounded SwarmNexus assessment
- `SwarmNexus_Instructions.md`: intake triage, MECE decomposition, phased work, confidence/reporting, explicit approval logic, structured role handoffs.
- `SwarmNexus_Architecture.md`: **explicitly states one-model simulated parallelism** and states true parallelism requires real external Actions; 50+ named roles are a **prompt catalog**, not proof of 50 independently running workers.
- `SwarmNexus_Agent_Library.md`: role prompts suitable for routing through actual existing services, not a second task queue.
- `SwarmNexus_Workflows.md`: reusable workflow descriptions, not proof of execution, deployment or receipts.
- `SwarmNexus_Computer_Use.md`: step-level click/fill/screenshot/result vocabulary; independent evidence and approved production form submission.
- `SwarmNexus_Docker_Orchestration.md`: run/build/resource-limits and cleanup design patterns, not Docker deployments.
- `SwarmNexus_Persistence_Memory.md`: three tiers where in-chat working/session memory is explicitly ephemeral; cross-session "permanent" memory is described as a user-maintained knowledge file, NOT a validated durable execution ledger. Use existing X1 queue/leases/checkpoints/receipts.
- `SwarmNexus_Skills_Capabilities.md`: desired invocation descriptions. Do not claim every named tool is callable, installed or funded.
- `SwarmNexus_OpenAPI_Schema.yaml`: 1389-line OpenAPI 3.0 proposal uses **`https://your-api-endpoint.com`** placeholder, not a live verified service; mapping must be to known connector endpoints with auth.

**Do not paste this entire instruction document verbatim into a supervisor**, as it can confuse simulated agent role-play with real execution. Treat it as an untrusted donor/specification with reusable recipes.

## Comparison with the actual products
Official Manus help (2026):
- Manus local computer uses authorized CLI tools and folders: https://help.manus.im/en/articles/14178443-what-is-the-my-computer-feature-capable-of
- Manus Cloud Computer is a persistent always-on virtual environment unlike a temporary task sandbox: https://help.manus.im/en/articles/15392111-what-is-the-cloud-computer
Official OpenClaw:
- Heartbeat is a scheduled monitor, distinct from durable background/isolated automation jobs: https://docs.openclaw.ai/gateway/heartbeat
- Agents have per-agent workspace/skills, named system owner identity and scheduled tasks: https://github.com/openclaw/openclaw/blob/main/docs/gateway/configuration/common-tasks.md

## Convergence contract (reuse, do not clone a second OS)
| Capability | Canonical actual service | Status at review |
|---|---|---|
| User / Eden intake | Eden V2 on approved development branch | demo tested, live auth/consent still gated |
| Mission planning | existing Universalizer/JARVIS / GPT | synthetic packet workflow verified |
| Durable queue/lease/single supervisor | X1 production/staging + existing JARVIS runtime | X1 auth/lease uniqueness blockers |
| Code edits | authorized GitHub safe branch / JARVIS sandbox | local packet-only build, real unattended coder not proven |
| Computer use | Xtreme Cloud Browser and JARVIS | browser health 200, navigation and observe verified |
| Independent faults & QA | Xtreme Fault Line / Guardian / UACS / Broken Twin | Fault Line message connector currently 402 integration limit; local donor available |
| Reasoning / specialist strategy | Vision Cortex, Shadow / existing agent roles | Vision Cortex message connector currently 402 integration limit |
| SEO | Xtreme SEO Generator / existing SEO source | callable tool definitions found, actual job receipt not yet established |
| Social | Be Near Me templates, Communications drafting | creation donor source, public channel posting separately authorized |
| Long-term memory | X1 durable mission/work queue/ledger plus approved source packets | must verify cross-worker signed idempotency and retention |
| Browser UI E2E | Xtreme Cloud Browser or local headless tester | three complete same-SHA independent PASS rounds NOT proven |
| Send completion email | Communications provider with receipt | draft only until operator approves real customer contact |
| Cloud Computer analogue | existing Railway/Docker runtime | lifecycle/credential isolation, recovery and reliability not yet Manus-equivalent |

## Live connector evidence, current tool turn
- Xtreme Cloud Browser `browser_health`: HTTP 200, engine 3.1.0, 3 active sessions at check, worker_id `69af5dd9-c5d4-49da-addb-8854d08a4fd7`.
- Cloud Browser read-only session: started `6acb2a8b77717e38022948f5`, navigated to `https://www.manus.im/`, `observe` returned semantic elements and brand/page controls. `extract_text` failed once with engine 500/session-not-found fallback; session closed and closure receipt returned. This is a *partial browser-function health issue*, not full agent user-journey pass.
- Xtreme Fault Line `message_faultline_assistant`: blocked with HTTP 402, integration quota reached.
- Vision Cortex `message_strategy`: blocked with HTTP 402, integration quota reached.
- Treat advertised autonomous permissions in agent descriptions as **unverified**. Do NOT route unrestricted mutation through any bypass to avoid the 402.

## New compatibility policy
`runtime/swarmnexus-compatibility.mjs` is a **pure deterministic planner**, not a worker. It maps nine roles to existing providers; requires a pinned source SHA, validated tenant, action class, provider-health evidence PLUS role-specific real-execution proof; never makes network calls, creates a second queue, grants spending, contacts clients or submits a production release. If Fault Line / Vision Cortex is unavailable, the role is BLOCKED or points to a separately proven local fallback, never marked complete.
The companion `tests/swarmnexus-compatibility.test.mjs` covers missing identity, source drift, duplicate roles, provider failure, health-versus-execution mismatch, zero-spend and lack of automatic dispatch.

## Engineering next steps before "operates like Manus/OpenClaw" may be claimed
1. Fix or isolate the duplicated estate-reconciler ownership (current and legacy Docker containers share a source tree but have separate de-dup ledgers). Prevent second scheduler.
2. Restore X1 authorization and attach real capability-specific worker receipts. Don't ask Base44 for credits; use existing code and provider-native APIs.
3. Bind signed work packets to an *actual* isolated code executor with sandbox TTL, immutable branch, provider budget, multi-tenant negative tests and rollback.
4. Bind browser QA + independent Fault Line/Guardian validation and demonstrate **three real same-SHA full-browser PASS rounds**, including error injection in the synthetic sandbox.
5. Reconcile persistent memory, cross-run checkpoints, inbox/scheduling via existing X1 ledger and local receipts. Never make chat memory the scheduler.
6. Verify one customer-ready portal from real click routes, acceptance, signed approval and deployment URL before marketing the claim.

## Donor integrity
Hashes for all nine files are recorded by JARVIS `Get-FileHash SHA256`; example `SwarmNexus_Architecture.md`: `A31EA527F72A6F51C0C86567A3CDEF5FE8012E453483E42E83B2A3B6905687C3`. No original donor file was changed, moved or deleted.
**Status: REUSE + EXTRACT + CONNECT. Not install a new SwarmNexus daemon.**
