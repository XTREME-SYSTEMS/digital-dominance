# APEX Universal Creative Library V1

This is a **working, preview-only creative library** inside the authoritative Digital Dominance source repository. It is not a second website factory, worker, database, or scheduler.

## Design goal

One source-aware catalog for a complete professional creative workflow: **research → brand → logo → websites/apps → campaign → social/email/video → QA → approval → publish**. Every stage preserves asset provenance, rights review, tenant scope, version, reproducible hash, and release gates.

## Current executable deliverables

| Asset / capability | Actual generated artifact | Count | Validation state |
| --- | --- | ---: | --- |
| Original logo mark systems | Deterministic SVG geometry | 12 concepts | Generated / review pending |
| Logo lockup exports | icon, horizontal, stacked | 36 SVG | SHA-tested / review pending |
| Campaign creative systems | Eight different art directions | 8 | Draft only |
| Channel placements | 9 indicative formats | 72 SVG | SHA-tested; platform safe areas require confirmation |
| Brand token systems | Full JSON color and typography exports | 12 JSON | Draft only |
| Email layouts | Accessible preview-only HTML, no sends | 10 HTML | Draft only |
| Website type blueprints | SitePack recipe JSON | 61 JSON | Not 61 finished premium master designs |
| Video storyboards | Nonfunctional content recipes | 8 JSON | Needs media generation / QA |
| Motion patterns | Reduced-motion-aware pattern specs | 8 JSON | No rendered animation claimed |
| Website section recipes | Structural descriptions | 24 JSON | Not implemented components |
| Searchable, editable library | Premium responsive catalog with logo/SVG customization | 1 HTML + catalog | Browser QA required |
| Source ledger | 32 family definitions, four verified/declared source locations | 1 JSON | Reference only |

**Source truth:** Local Universal Master Factory declares **30 registry families / 486 entries**; local Visual Factory V3.1 declares **10 archetypes**; GitHub premium master branch contains **20 designs**; authenticated Base44 TemplateLibrary returned **458 rows as of October 15, 2026**. Do not add these heterogeneous counts together into a claim of production-ready designs. No Base44 records were modified or activated by this branch.

### Build and test
```bash
npm ci --no-audit --no-fund
npm run test:creative-library
npm run build
```

Build output: `public/premium/libraries/` (ignored generated files). Browse `/premium/libraries/index.html` on the connected Digital Dominance Vercel branch preview. The existing `vercel.json` applies **noindex, nofollow, noarchive** HTTP headers to the full `/premium/(.*)` route.

### Use

1. Open the logo library, select one of the **12 mark geometries** and download its three versions. The studio can change the brand name/accent on the downloaded SVG; these are fictional design concepts, not cleared registered trademarks.
2. Open social graphics, select one of **8 art directions** and **9 platform examples**, preview/edit its headline and download actual SVG creative. Validate current platform placement/safe areas before any posting.
3. Use a brand token JSON with typography/color definitions. Verify contrast and lock imagery before any client deliverables.
4. Filter the **61 website types** and download a versioned SitePack recipe with **pending approval**. Link to an already validated Monolith/Argent/Atelier master when provided. A recipe is **not** itself a working 61st premium template.
5. Use the email drafts as visual building blocks, never as live communications. Integrate existing Xtreme Communications only with scoped approvals and real customer consent.
6. Expand the 32 source families by adding versioned records and renderer plugins. Source registry entries discovered on JARVIS require individual ingestion, rights checks and quality tests.

### Local source references (reuse; do not replace)

- `C:\_Strategic_Minds_AI_OS\16_UNIVERSAL SYSTEMS\01_CANONICAL_SOURCE\UNIVERSAL_MASTER_FACTORY_PACKET\UNIVERSAL_MASTER_FACTORY_BASE44_v1` (30 registry families, 486 declared entries)
- `C:\_Strategic_Minds_AI_OS\16_UNIVERSAL SYSTEMS\13_VISUAL_TEMPLATE_ENGINE\DIGITAL_DOMINANCE_VISUAL_FACTORY_V3` (10 V3 art-directed archetypes)
- `C:\_Strategic_Minds_AI_OS\14_FINISHED_SYSTEMS\00_MASTER_ASSET_REGISTRY\MASTER_ASSET_REGISTRY.json` (many ZIP donor records, mostly unverified)
- `XTREME-SYSTEMS/digital-dominance` existing TemplateLibrary and premium branch, source of the preview and sitepack compiler.

### Future ingestion adapter contract (NOT YET IMPLEMENTED)

```json
{
  "asset_id": "library:logo:axis:v1",
  "family": "logos",
  "source_uri": "local-or-provider-authorized-source",
  "version": "1.0.0",
  "sha256": "hex-digest",
  "source_rights": "ORIGINAL_OR_APPROVED",
  "design_quality_gate": "PENDING_REVIEW",
  "business_facts_verified": false,
  "tenant_id": "TENANT_BOUND_ID",
  "production_approval_receipt": null,
  "release_state": "NOINDEX_PREVIEW"
}
```

Only an authenticated and reviewed importer may promote a source. No Base44 service-role bypass, no silent third-party logo/logo licensing assumptions, no public social auto-posting, no customer outreach, and no bulk doorway-page website publication.

**Roll back:** close the development PR and discard branch `feature/apex-universal-creative-library-20261015`. Existing `main` and premium PR #42 remain unchanged.
