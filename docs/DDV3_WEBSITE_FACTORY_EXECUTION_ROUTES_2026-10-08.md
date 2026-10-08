# DIGITAL DOMINANCE V3 — WEBSITE FACTORY EXECUTION ROUTES

**Date:** 2026-10-08  
**Status:** DESIGN GATE — NO IMPLEMENTATION  
**Base:** Wave 2 Evidence Engine  
**Operator direction already approved:** Digital Dominance V3, AutoBuilder-style onboarding, ChatGPT-like control surface, premium funnel-quality output, fast website generation, governed preview-first execution.

## Purpose

Wave 3 converts a verified opportunity into a production-grade website/funnel without allowing the existing legacy engines to auto-publish, auto-purchase domains, or flood thin pages.

The factory must consume a **BuildPacket**, not a loose prompt.

```
verified opportunity
  -> client/business brief
  -> offer + funnel architecture
  -> SiteGenome / BuildPacket
  -> code branch
  -> Vercel preview
  -> technical + browser + SEO + accessibility validation
  -> visual approval
  -> exact-SHA production release
```

The three execution routes below are the only routes under consideration.

---

# ROUTE 1 — BASE44 CONTROL SURFACE + PORTABLE FACTORY CORE

## Summary

Keep the existing Base44 Digital Dominance admin/onboarding experience as the operator-facing shell, but move website manufacturing into portable GitHub/Vercel/Supabase components.

Base44 becomes a **control surface and donor**, not the permanent website runtime.

## Flow

```
Digital Dominance Opportunity
 -> Base44 onboarding / GPT-style control surface
 -> BuildPacket compiler
 -> GitHub feature branch
 -> Next.js App Router site scaffold
 -> Supabase lead / estimate / analytics schema
 -> Vercel Preview
 -> independent validators
 -> Strategic Minds approval site
 -> protected production promotion
```

## KEEP
- Universal Site Builder onboarding sequence.
- Industry / Branding / Content / URL workflow concepts.
- Website Empire inventory concepts.
- Digital Dominance admin intelligence.
- Existing Base44 entities as migration donors.

## REPLACE
- simulated WebsiteFactory deployment.
- direct Base44-generated production sites.
- generic mass content.
- automatic domain purchase and default auto-deploy.

## New core contracts
- `BuildPacket`
- `WebsiteBuildJob`
- `ValidationReceipt`
- `ReleaseCandidate`
- `SiteGenome`
- `RouteManifest`

## Advantages
- fastest path using the UI Jeremy already prefers.
- de-risks Base44 lock-in progressively.
- GitHub becomes code source truth.
- Vercel Preview becomes release candidate surface.
- portable websites can later run without Base44.
- keeps current Digital Dominance intelligence connected to the factory.

## Costs / tradeoffs
- two layers exist during migration: Base44 control surface + portable build runtime.
- requires explicit contracts between Base44 and the factory.

## Recommendation
**RECOMMENDED.**

This route gives the fastest path to usable production websites while preserving a clean exit from Base44.

---

# ROUTE 2 — FULL DIRECT DIGITAL DOMINANCE FACTORY

## Summary

Move both the control plane and website manufacturing out of Base44 into a new Next.js/Supabase Digital Dominance application.

Base44 becomes temporary legacy/reference only.

## Flow

```
Digital Dominance Next.js control plane
 -> Opportunity Engine
 -> onboarding / GPT-style UI
 -> BuildPacket
 -> GitHub branch
 -> Next.js site
 -> Supabase
 -> Vercel Preview
 -> validators
 -> approval site
 -> protected production promotion
```

## Advantages
- cleanest long-term architecture.
- one portable application/control plane.
- no long-term Base44 dependency.
- easiest to version, test and extend deterministically.

## Costs / tradeoffs
- slower to commercialize because existing admin/onboarding surfaces must be rebuilt first.
- more migration risk before the factory delivers customer value.
- duplicates some useful Base44 UI in the short term.

## Recommendation
**BEST LONG-TERM END STATE, NOT BEST FIRST MOVE.**

Use this as the eventual convergence target after Route 1 proves the factory contracts.

---

# ROUTE 3 — BASE44-NATIVE WEBSITE FACTORY

## Summary

Keep the entire website factory inside Base44 and improve the existing WebsiteFactory / UniversalSiteBuilder / DominanceEngine stack.

## Flow

```
Base44 opportunity
 -> Base44 onboarding
 -> Base44 templates/functions
 -> Base44-generated website
 -> Base44 publish
```

## Advantages
- fastest apparent implementation.
- minimal migration work.
- existing screens and entities can be reused directly.

## Costs / tradeoffs
- highest platform lock-in.
- current code already mixes simulated deploy state and production behavior.
- harder to independently validate code before release.
- current DominanceEngine includes unsafe legacy patterns such as automatic deploy/purchase/social/content actions.
- does not meet the desired long-term “GPT directly operates the website factory” architecture as cleanly.

## Recommendation
**DO NOT USE AS THE V3 CORE.**

Keep Base44 as a governed operator UI/donor only.

---

# DECISION MATRIX

| Requirement | Route 1 | Route 2 | Route 3 |
|---|---:|---:|---:|
| Fastest safe commercialization | **5/5** | 3/5 | 4/5 |
| Portable production sites | **5/5** | **5/5** | 2/5 |
| Preserve preferred onboarding | **5/5** | 3/5 | **5/5** |
| Independent Git/Vercel validation | **5/5** | **5/5** | 2/5 |
| Progressive de-Base44 | **5/5** | **5/5** | 1/5 |
| Lowest migration risk | **5/5** | 2/5 | 4/5 |
| Long-term architecture ceiling | 4/5 | **5/5** | 2/5 |
| Recommended now | **YES** | Later | No |

## Recommended selection

**ROUTE 1 — Base44 Control Surface + Portable Factory Core**

Route 1 lets Digital Dominance start building high-quality websites quickly while every actual website build becomes portable, branch-safe, preview-first, independently validated, and releasable without tying the finished client site to Base44.

---

# ROUTE 1 BUILD PACKET CONTRACT

If Route 1 is selected, the next implementation should create:

```json
{
  "project_id": "",
  "client_id": "",
  "opportunity_id": "",
  "market_id": "",
  "site_id": "",
  "business": {
    "name": "",
    "industry": "",
    "services": [],
    "geography": [],
    "verified_claims": [],
    "prohibited_claims": []
  },
  "brand": {
    "approved_direction_id": "",
    "logo_asset": "",
    "tokens": {},
    "voice": ""
  },
  "offer": {
    "primary_offer": "",
    "primary_cta": "",
    "secondary_cta": "",
    "pricing_mode": ""
  },
  "funnel": {
    "architecture": "",
    "conversion_events": [],
    "required_forms": []
  },
  "content": {
    "service_pages": [],
    "local_pages": [],
    "faq_clusters": [],
    "proof_assets": []
  },
  "seo": {
    "query_evidence_ids": [],
    "canonical_policy": "",
    "schema_map": [],
    "index_eligibility": "preview_only"
  },
  "data": {
    "lead_schema": "",
    "estimate_schema": "",
    "analytics_schema": ""
  },
  "release": {
    "mode": "preview_only",
    "requires_visual_approval": true,
    "requires_independent_validation": true
  }
}
```

## Non-negotiable release gates

- no invented claims
- no fake reviews/addresses/licenses/metrics
- no thin location pages
- no service-role keys client-side
- successful build/lint/typecheck where applicable
- form persists
- session -> lead attribution
- metadata/canonical/robots/sitemap
- JSON-LD parses
- desktop + mobile browser validation
- no console/runtime overlay
- rollback target
- exact approved SHA

---

# SELECTION GATE

No factory implementation should begin until the execution route is selected.

**Recommended:** ROUTE 1.
