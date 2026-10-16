# Pompano Beach Premium Epoxy Instant Estimate | Preview QA Contract

Project: `digital-dominance-pompano-epoxy-instant-estimate-preview`
Repository: `XTREME-SYSTEMS/digital-dominance`
Branch: `feat/pompano-epoxy-instant-estimate-preview-20261015`
Base SHA: `b774332c5aab2d9461fb76a9d8793d1a0d79256d`
Target Vercel project: `dd-epoxy-edge-preview` (`prj_SgLyIKqNo2wW0IGKQQxywL1rFlKA`)
Target page: `/preview/pompano-epoxy/`
Approved style family: premium Instant Estimate, dark/charcoal with high-contrast yellow CTA, editorial garage imagery, hero-side lead form, color system, local preparation guidance.
Exact approved screenshot variant: **NOT YET IDENTIFIED**. Three different earlier "National Epoxy Pros" mockup PNGs were recovered, but a definitive approved asset identifier was not located. No 99% pixel parity PASS may be claimed until a specific asset and matched mobile/tablet/desktop references are bound.
Source of visual options: Library files "Premium Epoxy Flooring Website Showcase.png", "National Epoxy Pros Landing Page(1).png", and "National Epoxy Pros Flooring Landing Page(1).png".

## Preview-only safety lock
- Root production homepage and all existing Base44/CRM integrations are untouched.
- This is **an isolated static demonstration**, not a customer acquisition endpoint.
- The hero and estimate controls use non-submitting buttons, not HTML forms. They never transmit contact data to a server, storage, analytics, CRM, email or SMS.
- Photos are inspected for count and type by the browser only. No upload happens. Avoid test inputs containing real customer PII.
- Example range uses unverified internal test assumptions from existing source settings: minimum 1800, base rates per square foot flake 7, solid 6, metallic 12; quartz 9 is an explicit demonstration assumption. Condition and existing coating adjustment percentages are test-only. These are not local pricing claims or a live quote.
- National Epoxy Pros remains a **visual brand concept**. Contact number displayed is for Xtreme Polishing Systems products/training; no representation that National Epoxy Pros is a verified installer.
- No fabricated warranty, completed projects, years in business, ratings, or local installations. Illustrative imagery is labelled.
- Meta robots `noindex,nofollow,noarchive,nosnippet` on the preview HTML. Public production SEO/canonical rules remain unchanged.
- No domain, DNS, default branch, production database, secret, payment, live outreach or publishing changes are authorized.

## Acceptance tests
1. Open `/preview/pompano-epoxy/` on the exact deployed SHA. Verify HTTP status 200, title, noindex, assets, no JS console errors, no network requests containing contact data.
2. Test desktop 1440x900, tablet 768x1024, mobile 390x844. Capture complete page and hero/form view at matched viewport, font loading and consistent scale.
3. Test intro with blank/invalid name, phone/email/ZIP. Verify no navigation and no HTTP submission. Valid fields should scroll to the sample estimator, not create a CRM lead.
4. Test empty and invalid area (negative, noninteger, <80, >10000, NaN), valid sample area 440. Select each finish and condition. Verify range monotonicity, bounded calculations, no customer-facing pricing claims.
5. Test 0, 1, 10, 11 photos; invalid MIME and >10 MB files; verify local-only status and no upload.
6. Test navigation, mobile menu, Escape, in-page CTAs, keyboard focus, overflow, reduced motion, contrast and readable labels.
7. Inspect real screenshot against approved reference and document alignments, typography, sections and imagery differences. Quantitative parity target >=99% requires a reproducible paired screenshot metric; it is UNKNOWN until exact reference and matching viewports are bound.
8. Independent review must be done by someone other than the author of this draft. Max 3 bounded repairs, recheck final SHA after modifications.
9. Run existing repository lint/typecheck/build/SEO checks and source/deployment identity verification before release candidacy.

## Known gaps
- Live lead capture, CRM routing, customer notifications and appointment booking are deliberately disabled pending exact authorized staging integration plus suppression/consent tests.
- Visual brand identity, rights to the exact National Epoxy Pros name/logo, serviceability, and exact approved mockup selection require source-truth confirmation.
- Representative images currently load from existing third-party public hosts and are not proven licensed for customer publication. Secure verified final originals or approved assets before release.
- No production publish or merge may be inferred from a READY Vercel Preview.

## Status
Branch-safe preview work in progress. Independent visual and functional PASS claims prohibited without screenshots/test receipts bound to the final SHA. Release decision requires a separate scoped operator approval.
