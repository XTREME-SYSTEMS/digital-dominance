# UnlimitedWebsites.net Vercel Activation / Factory Tenant Policy

State: DEVELOPMENT BRANCH ONLY. This document contains no DNS changes, secrets, production release, or authorized public publishing.

## Verified provider facts (2026-10-13, authenticated Vercel API)

- Root domain: `unlimitedwebsites.net`, registered under Strategic Minds Advisory Vercel team `team_aFdds8lsbHMwe2ip4aQdbQ3d`.
- Domain record is verified, auto-renew enabled, registrant contact verified.
- Nameservers: `ns1.vercel-dns.com` and `ns2.vercel-dns.com`.
- Hosting project: `digital-dominance` (`prj_mgySytKyeK5i9DwnQDRGHVjyenrz`).
- Git source association: `XTREME-SYSTEMS/digital-dominance` confirmed through Vercel's project repo search and preview deployment commit metadata.
- Associated domains: apex and `www.unlimitedwebsites.net`. The apex currently redirects to www with HTTP 308.
- Vercel domain-config API reports `misconfigured: true`. Observed apex A record: `216.24.57.1`; provider returned a configuration action to replace this record. Do not edit DNS until record provenance, linked services and Vercel's current project-specific recommendation are independently verified and operator approval is recorded.
- Recent development branch deployments have state `READY` but are not proof that the custom domain resolves correctly or that the site works in production.
- Wildcard `*.unlimitedwebsites.net` has not been observed as an associated Vercel project domain. A wildcard route must only be enabled after validated hostname-to-tenant isolation.
- The repository contains no root `vercel.json` and source search did not surface `/api/cron/auto-builder`; this does not prove that no cron exists in other connected runtimes.

## Chosen architecture

1. `www.unlimitedwebsites.net` - public platform marketing.
2. `app.unlimitedwebsites.net` - authenticated admin/customer interface, not a wildcard tenant.
3. `demo.unlimitedwebsites.net` - demonstrations / preview gallery.
4. `{approved-tenant}.unlimitedwebsites.net` - registered, tenant-isolated, noindex preview or starter site.
5. Independent client domains - only after ownership and explicit deployment approvals.
6. `nearme.com/{service}/{state}/{city}` - CONDITIONAL directory architecture, never activate until NearMe.com ownership and authorization are verified.

The new pure module `src/lib/factoryDomainPolicy.mjs` keeps unknown wildcard hosts denied and preview tenants non-indexable. The module is not yet attached to a production middleware/router; no live wildcard routing is claimed.

## Completion checks

- Domain owner, registrar, DNS, certificate and project association agree.
- Safely resolve misconfigured apex A only after operator-reviewed DNS change.
- Check `https://www.unlimitedwebsites.net/` and root redirect with independent browser, SSL, mobile/desktop, routes, console, forms and accessibility checks.
- Add wildcard to correct Vercel project only after verified tenant registry, isolated auth, explicit 404 for unknown hosts, safe preview noindex.
- Use one singleton queue + Railway worker already authorized by X1; do not create another scheduler.
- If using five-minute Vercel cron, prove team plan supports sub-daily interval, ensure `CRON_SECRET` and singleton lease; stage on a separate branch and validate.
- Disable or quarantine auto cross-link networks designed to manufacture ranking signals; earn relevant independent links with real evidence and human review.
- Run one noindex synthetic site -> independent Guardian PASS -> explicitly approved indexable publication, then scale based on qualified leads and gross profit.
- Relevant current docs: https://vercel.com/docs/cron-jobs/usage-and-pricing ; https://vercel.com/docs/limits ; https://developers.google.com/search/docs/essentials/spam-policies

## Receipt

TEST: `node --test scripts/factory-domain-policy.test.mjs` passed 19/19 locally on isolated extracted source.
SOURCE: development GitHub PR to be created.
UNKNOWN: live domain HTTP behavior; Vercel hosting plan; wildcard certificate; public production readiness; first-party Google Search Console traffic; independently earned backlinks.
PROTECTED: DNS, production release, customer communications, billing, secrets and changes to root/main.
