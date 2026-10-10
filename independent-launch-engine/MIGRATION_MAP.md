# Migration map: Digital Dominance -> Website Launch Engine
Status: DEV BRANCH ONLY. Existing main and epoxyquotenearme.com must not be changed.
Owner-approved direction: Preserve working launch logic and 350-site legacy records. Simplify admin and remove Base44 from the replacement runtime, with approval-first releases.

## Canonical source
Original donor: XTREME-SYSTEMS/digital-dominance (private).
Independent UI pilot: independent-launch-engine/index.html
Branch: feature/website-launch-engine-debase-v1
This is a standalone visual admin scaffold. It is NOT wired to launch APIs, client auth, or real proof records.

## Preserve / Extract / Replace
- PRESERVE source and legacy data: WebsiteTemplate, LaunchCampaign, city URL structures, DynamicPage records and existing public URLs.
- EXTRACT logic: base44/functions/rebrandStudio/entry.ts massProduce; src/pages/admin/RebrandStudio.jsx approval flow; src/pages/seo/LocationSeoPage.jsx; base44/functions/vercelDeploy/entry.ts.
- REPLACE: base44.entities calls with authenticated, tenant-isolated Supabase Postgres records and strict RLS.
- REPLACE: Base44 function invoke with protected HTTP APIs and durable background queue; never expose service-role credentials to browsers.
- KEEP verified current production serving path until side-by-side parity achieved.
- REFACTOR admin to: Templates -> Quantity -> Markets -> Approval -> Preview -> QA receipts -> Release.
- PLACEHOLDER: New standalone HTML offers manifest export, not website provisioning. Deliberately reports NOT CONNECTED rather than fake deployment success.

## Safety and acceptance
1. Backup/export existing source and data and capture current route inventory before migration.
2. Verify at least a representative sample of the reported 350 URLs, associated template IDs, campaign IDs and real HTTP status. Do not automatically label configured records as deployed.
3. Bind real GPT pack ingestion to a new secured, idempotent approval API; verify existing endpoint before retirement.
4. Implement Supabase tenant-scoped schema, row-level security policies and denied cross-tenant tests in non-production.
5. Implement one preview site end to end using existing renderer semantics. Per-site receipt: pack_hash, job_id, content_hash, preview_url, status_code, validator_id and timestamp.
6. Then ten market-differentiated sites; simulate 100 with workload budgets and independent validations. Prevent SEO doorway pages.
7. Implement social campaign once-approval policy with immutable manifest, channel scope, time window, revocation, and idempotency; live posting remains separately protected.
8. Only after all gates pass, request explicit approval for DNS, production merge/deploy, payment activation or customer/social actions.

## Crosswalk / truthfulness rules
WebsiteTemplate status='live' is not sufficient proof of deployment.
LaunchCampaign.metrics.sites_deployed is a saved metric, not independent HTTP proof.
The legacy massProduce function creates WebsiteTemplate records with status configured and LaunchCampaign with auto_deploy false, sites_deployed 0.
The legacy independent Vercel deploy function uses DynamicPage / CodeBlock and must be made preview-first.
Legacy auth and owner permissions cannot be reused blindly across tenants.

## Visual lock
Dark navy (#041329), electric blue (#0878ff), large 20px navigation, large readable headings, two wide templates per row, image-fit: contain / no unintended crop, responsive mobile.
Source design reference: user-approved Website Launch Engine v2.2 prototype. Match after preview browser test.

## Rollback
Original production branch remains main and is untouched; deleting this branch / preview restores prior state. Do not remove legacy code, assets or routes yet.
