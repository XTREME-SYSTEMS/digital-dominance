# Digital Dominance: Subdomains, NearMe Discovery, and Authority Growth v1

Status: PLAN / DISCOVERY; no live DNS, production database, backlink, publishing, or credential changes authorized by this document.
Date: 2026-10-13
Canonical operator-selected source: https://github.com/XTREME-SYSTEMS/digital-dominance

## Executive decision
One governed factory, not a private backlink network. Use UnlimitedWebsites.net for factory/product and customer preview subdomains. Use NearMe.com only after independent ownership/authorization proof, as a genuinely useful, browsable local-discovery product. Use customer-owned domains for distinct businesses when appropriate.

## Domain and URL roles
| URL / pattern | Role | Index treatment |
| --- | --- | --- |
| unlimitedwebsites.net | Public factory marketing/product | Indexable when independently verified |
| app.unlimitedwebsites.net | Authenticated admin and tenant portal | noindex, require auth |
| demo.unlimitedwebsites.net | Template showcase | Index only original useful showcase content |
| {tenant}.unlimitedwebsites.net | Tenant preview / low-cost starter site | noindex by default; allow indexed sites only with unique real-business value, approvals and valid tenancy |
| nearme.com/{service}/{state}/{city} | Proposed local search/directory pages, ONLY if domain ownership verified | Index only substantial verified local directories |
| {real-client-domain.com} | Client's distinctive business website | Index original site; avoid cross-domain duplication |

Do not make one city subdomain per keyword solely to acquire search placements. For genuine geographical content on a single property, favor browseable /service/state/city paths; reserve subdomains for distinct products, tenants, or independently valuable brands. Google treats near-me local results as relevance/distance/prominence-dependent; no URL guarantees first position.

## Ownership and operating cost gates
- UnlimitedWebsites.net: Vercel availability and 1-year price checked separately; purchase not executed.
- NearMe.com: registration unavailable and a public 'Coming Soon' site was observed; neither Vercel team inventory contained this name; user ownership/authorization could not be verified. Do not connect DNS, transfer, redirect, or publish under this name without proof.
- Wildcards such as *.unlimitedwebsites.net can route many subdomains under one Vercel project when ownership, DNS nameservers, and certificate prerequisites are satisfied.
- Domain registration may be one cost for many subdomains, but hosting, function requests, bandwidth, storage, AI, monitoring, and provider plans are NOT unlimited free.
- Keep one source repository and one authoritative worker/queue/receipt system; do not build duplicate infrastructure.

## Verified source-truth findings (main branch; must recheck SHA before implementation)
1. src/lib/subdomainRouter.js: city-only slugs risk collisions across states; dnsInstructions returns apex CNAME instructions unsuitable as a general Vercel apex configuration. REPAIR, avoid manual guessed DNS.
2. src/pages/admin/BulkLaunchBuilder.jsx and base44/functions/massLaunchOrchestrator/entry.ts expose subdomain/subfolder modes and default NearMe branding, while src/components/rebrand-studio/BulkPublishPanel.jsx and src/pages/admin/WebsiteFactory.jsx use path-only modes. RECONCILE one canonical SiteURLResolver and redirect/canonical contract.
3. base44/functions/massLaunchOrchestrator/entry.ts has a niche expression that maps all templates to 'epoxy_garage'. REPAIR before universal launches.
4. base44/functions/siteBankOrchestrator/entry.ts generates up to eight planned cross-links per site based on same niche/state and labels events 'synced'; that is not evidence of independent backlinks or a deployed site. The service-role path lacks an explicit user authorization check in the inspected source. QUARANTINE link auto-build and protected mutations pending review.
5. src/pages/admin/SiteBankAutomation.jsx displays 'Live / Synced' using synced counts, conflating sync metadata with deployment evidence. REPAIR metrics.
6. base44/functions/gptSyncEngine/entry.ts authenticates a single bearer/body API key into service role and exposes execute/takeOver/sync. base44/shared/operatorHosted.js exposes unrestricted catalog entity writes/deletes and invocable functions with limited action exclusions. This is HIGH RISK; do not configure a broadly privileged external GPT token before hardening.
7. Existing BacklinkOpportunity entity, Competitors page, and Site Bank are reusable donors for an ethical outreach/review ledger, not evidence of live inbound links.

## Canonical domain resolver and data model
Maintain DomainAsset(owner_verified, registrar, dns_owner, ssl_status, workspace, status), Site(site_id, tenant_id, canonical_host, template_key, industry, real_business_id, service_area, publication_status, content_evidence, approval), URLRoute(host, path, tenant_id, site_id, canonical_url, redirect_target), DeploymentReceipt(site_id, source_sha, vercel_project_id, deployment_id, http_checks, noindex_state, validator, timestamp), LinkObservation(source_url, target_url, observed_http_status, observed_rel, owned_network, independent_editorial, last_verified_at, opportunity_id), LocalProof(source_url, author, captured_at, verified_at). Enforce tenant scope + unique canonical target + hostname isolation.

Recommended state flow: IDEA -> VERIFIED_INPUT -> DRAFT -> NOINDEX_PREVIEW -> TECH_TEST -> INDEPENDENT_QA -> OPERATOR_APPROVAL -> LIVE -> INDEX_ELIGIBLE -> GOOGLE_INDEX_OBSERVED -> LEADS_ATTRIBUTED. No generated event can skip a gate or set 'indexed'/'live' without external evidence.

## Link and growth governance
- INTERNAL links: useful navigation between service/category/city pages on the same property; user intent and crawl discovery, not a ranking scheme.
- CLIENT/DIRECTORY links: disclose business relationship, make listing accurate, genuinely useful, and editable; do not auto-insert all-to-all footer links.
- EXTERNAL earned links: original calculators, verified regional cost studies, benchmark reports, industry guides, supplier/manufacturer resources, chamber/community resources, credible journalist references, and consented relevant listings.
- Maintain human-reviewed outreach drafts, uniqueness, suppression lists, relationship history and recipient consent; public/customer email sends require separate approval.
- Never run automated link swaps, exact-match anchor spam, private blog networks, fake review/local profiles, or site networks designed primarily to manipulate rankings.
- Mark paid placements rel=sponsored and user-generated links rel=ugc as appropriate. Do not count planned links, owned cross-links, or unobserved placements as independently earned backlinks.
- Verify each live source URL periodically and separate internal navigation / owned network / independent editorial observations in reporting.

## Safe GPT Sync bridge (NOT installed in an external GPT)
- Do NOT paste secret tokens or broad service-role credentials into system instructions, JSON manifests, chat or URLs.
- Keep the Base44 gptSyncEngine as a donor. Build a server-side authenticated, least-privilege adapter. Deny execute/write_entity/invoke_function/takeOver by default until per-action allowlist, tenant policy, role, resource ID and approval receipt pass.
- Phase 0 actions: read-only capabilities, status, approved portfolio registry, approved site metadata, preview QA receipts. Avoid returns containing PII or secrets.
- Writes require typed command envelopes, dry-run, explicit operator approval for protected operations, idempotency, audit receipts, and rollback refs.
- Rotate/restrict any previously circulated broad API key after administrator assessment; never print token values.

## Staged acceptance plan
1. READ-only audit against official repo and Vercel/Base44 runtime identity; verify NearMe ownership separately.
2. One isolated synthetic industry/city site at preview subdomain, noindex in HTML and headers as applicable, no public directory listing.
3. Assert host-to-tenant resolution, canonical, 404 unknown hosts, HTTPS, noindex, redirect rules, working form, source SHA, deployment ID, cost telemetry, independently recorded browser/security/SEO PASS.
4. Only after operator-approved production/publishing and independent QA, create one genuinely useful, distinct index-eligible production property.
5. Evaluate indexing, organic CTR, qualified leads, attribution, operating cost, and link quality before expanding to 10, 50, 100, 200+ sites.

## KPIs and receipts
sites_generated, previews_validated, approved_live_sites, independently_verified_domains, indexed_pages (Search Console evidence), GSC impressions/clicks/CTR, organic leads, qualified leads, appointments, sales, attributable gross profit, hosting cost, true independent referring domains, live on-page internal links, outreach conversions, policy violations and blocked releases. Always distinguish UNKNOWN from FAIL and PASS.

## Governing sources
- https://developers.google.com/search/docs/essentials/spam-policies
- https://support.google.com/business/answer/7091
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
- https://vercel.com/docs/domains/working-with-domains
- https://vercel.com/docs/limits

## Verification and blockers
VERIFIED: Repo components exist; Vercel wildcard capability documented; Google spam/local rules verified. INFERRED: Suggested URL ownership policy is an architectural recommendation. UNKNOWN: NearMe.com ownership, live backend/worker action health, DNS bindings, actual site count, real backlink observations and production SEO outcomes. BLOCKED: broad admin GPT bridge, link-spam architecture, domain ownership and protected release. WORKAROUND: branch-safe design with read-only GPT adapter and noindex synthetic preview. NEXT: implement tests and remediation only on a development branch; require independent validation for production.