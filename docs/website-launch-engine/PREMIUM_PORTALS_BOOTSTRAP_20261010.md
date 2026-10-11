# Website Launch Engine: Premium Gallery + Portal Bootstrap
Date: 2026-10-10
State: PREVIEW_READY, NOT RELEASED

## Canonical source and deployment
- Production marketing site: https://website-launch-engine-xps.vercel.app/
- Production Vercel project ID: prj_70bwCwyXR7yqb0Yicku8rHzRVAZc
- Locked public visual identity: mountain-blue Florida Website Launch Engine, rocket logo, (772) 209-0266.
- Premium preview deployment: dpl_7LKDgSf1HnwR24HjLxQgWjKV1VjA
- Marketing preview: https://website-launch-engine-joj4ni51v-strategic-minds-advisory.vercel.app/
- Admin bootstrap: https://website-launch-engine-joj4ni51v-strategic-minds-advisory.vercel.app/admin.html
- Client bootstrap: https://website-launch-engine-joj4ni51v-strategic-minds-advisory.vercel.app/client.html
- Original donor: XTREME-SYSTEMS/digital-dominance, branch feature/website-launch-engine-debase-v1
- This branch: feature/wle-premium-portals-20261010
- Source deployment currently uses API-uploaded files, not a Git-linked reproducible build. Synchronization into canonical Git requires a dedicated extraction/migration review. Do not silently overwrite donor code.

## What the preview does
- Preserves existing hero, phone, industry discovery, six featured categories, twenty industry options, template filtering, full-page preview, location/quantity wizard, inquiry email draft and client-side proof plan.
- Makes industry cards about 220px high, four across at desktop, responsive three/two/one.
- Makes website showroom mockups about 302px high, three across on wide desktops with distinct category copy.
- Enlarges navigation, headlines, buttons, section descriptions and labels.
- Adds two separate, browser-navigable preview interfaces for admin and client, consistent with the approved brand.
- Portal tabs work and explicitly label all absent metrics or connections. Zero live tenant/client records are presented. No secrets, real auth, client data, billing, queue execution or public communication.
- Four original sector images were generated offsite as local WebP assets (legal, real estate, epoxy, roofing), NOT integrated into the Vercel preview. Other cards still use existing Unsplash photography. No claim of 20 original installed.

## QA evidence
- Desktop 1440x900 CloudBrowser: 20 industry tiles, six featured templates; first industry card bounding box 334x220 and first template card 448x371; no JS errors.
- Mobile 390x844 CloudBrowser: 20 industry tiles, six featured templates; first industry card 356x225 and first template card 356x389; Dental filtering returns Dental Growth; no JS errors.
- Template-to-wizard journey clicked: template -> choose -> quantity -> location approval -> prepare; browser reports success and proof downloadable action.
- Admin preview returns HTTP 200; seven navigation tabs, Launch Queue switching works; no reported JS errors.
- Client preview returns HTTP 200; six navigation tabs, Lead Inbox switching works; no reported JS errors.
- Actual website screenshots and quantitative pixel parity not available because CloudBrowser screenshot backend reports missing BLOB_READ_WRITE_TOKEN. Do not mark visual parity PASS.
- Production remains a different deployment; no production publish authorization in this mission.

## Integration gates and acceptance criteria
1. AUTH: Use verified Supabase project; tenant-scoped auth and profiles; MFA or equivalent for platform_admin; least privilege; session expiry, CSRF/XSS controls.
2. RLS: roles platform_admin, tenant_owner, editor, viewer. Tests prove tenant A cannot access B via any API; deny-by-default policies.
3. DATA: Clients, sites, versions, approvals, leads, content, jobs, receipts and audit events must have durable IDs, tenant IDs, timestamps and immutable SHA/hash where applicable.
4. JOBS: Reuse existing Supabase queue/leases and single reconcile heartbeat; do not build a duplicate worker/cron. Jobs idempotent and retry bounded.
5. APPROVAL: Versioned packs PENDING_REVIEW -> APPROVED -> PREVIEW_READY -> INDEPENDENTLY_VALIDATED -> RELEASE_APPROVED -> LIVE. No public release, DNS, paid provisioning, outbound messages or social posts without scoped operator consent.
6. LEADS: Real lead capture requires bot protection, consent notice, validated routing, encryption, rate limiting, delivery receipts and tenant access controls.
7. SEO: Distinct useful local business pages only, with real business facts, genuine service locations and no fake reviews/claims or doorway pages.
8. INDEPENDENT VALIDATION: Re-fetch precise URL/commit/deployment, test workflows, auth, APIs, accessibility, responsive layouts, failure states, and rollback before production approval.
9. VISUAL ASSETS: Generate remaining 16 original industry assets and six exportable premium template screenshots, store with manifests and license/provenance, optimize and bind to known asset paths, test all image requests.

## Release boundary
This work is a preview-only bootstrap, NOT authenticated or production-ready portals. Implementer cannot certify release-critical gates. Production release requires explicit scoped operator approval and independent evidence.
