# Launcher evidence repair — 2026-10-13

Authoritative repository: XTREME-SYSTEMS/digital-dominance.
Base commit: 4c269f620885aa7cb43c568595db2d1bac72c5c6.
Branch: fix/launcher-evidence-20261013.

changed_contracts: [massLaunchOrchestrator deployment accounting, vercelDeploy accepted-vs-ready response, per-site capability preflight, SiteValidationReceipt unknown evidence].
affected_repositories: [XTREME-SYSTEMS/digital-dominance].

The batch caller supplies city/template/content to vercelDeploy, but that function exports unrelated published Code Studio pages and unconditionally requests production. This patch exposes an authenticated read-only capabilities action and rejects batch-shaped payloads. The caller blocks before creating batches or calling paid models when per-site export is unsupported.

A provider exception, missing identity, non-READY acceptance, or non-provider URL can no longer increment deployed or set live. READY requires exact queue-site ID and actual deployment ID; it remains deploying pending independent QA. Failure archives the item rather than silently requeueing potentially deployed work. Reconciliation before retry is mandatory.

Builder-generated validation no longer invents HTTP 200, TLS/DNS, responsive, navigation, robots or visualizer results. Missing checks are omitted (UNKNOWN), overall_pass=false, and an explicit failure receipt links the actual Vercel deployment ID. No Google indexing, scoring, auto-heal or monitoring transition follows missing independent QA. Empty or failed batches are not marked complete merely because no queued records were returned. Auto continuation now uses the selected batch variables and supports SDK array responses.

Validation: node --test scripts/launcher-evidence.test.mjs, Node 24, 8/8 PASS. Tests execute the actual handlers with provider/entity mocks, covering blocked preflight, thrown deployment, QUEUED response, legacy URL-only success, cross-site mismatch, exact READY proof with missing independent QA, exporter contract, and URL injection. These are regression tests, not live browser QA or a production canary. Node's built-in stripTypeScriptTypes is used to load existing Deno handler syntax in tests.

Limits: the correct per-site exporter and independent validator are NOT implemented by this patch. Existing standalone Code Studio production export remains available for its original payload; its response now says accepted=true/success=false until readiness is observed. Full frontend build/lint/typecheck were not run because no frontend source changed and this isolated checkout has only changed backend files. Base44 runtime deployment and live branch binding remain unverified. The legacy live exporter may ignore capabilities and publish production; DO NOT invoke the preflight against an unpatched live function.

Canary: BLOCKED pending a verified isolated Base44/X1 runtime containing BOTH patched handlers, approved template identity, scoped provider deployment path and independent Guardian validator. The Digital Dominance connector returned HTTP 405 Method Not Allowed on current read queries; do not reinterpret stale quarantine as fresh evidence. No new site, infrastructure, credentials, RLS, scheduler or production release was made.

Rollback: close this draft PR. Nothing was merged/deployed. When later activated, reconcile any archived item with provider records before retry. Preserve ongoing frontend/refactor branches.
