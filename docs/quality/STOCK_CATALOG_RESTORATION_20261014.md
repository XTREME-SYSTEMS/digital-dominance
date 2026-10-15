# Digital Dominance template catalog repair | 2026-10-14

## Root cause (verified)
The Vercel-hosted frontend displays the homepage and industry cards, but the
existing stock-template data hooks depend on Base44 TemplateLibrary. The Vite
preview has no VITE_BASE44_APP_BASE_URL, causing empty cards, an unusable wizard,
and unavailable full-page template previews. The link to /admin/template-studio
also requires authentication, blocking ordinary visitors.

## Actual source repaired
The repository already contains a 20-industry stock catalog and 10 structurally
distinct page-design recipes, with a deterministic full HTML compiler. This work
reuses those canonical sources instead of inventing data or a duplicate generator.

- src/lib/localStockCatalog.js exports 200 actual compiled full-page HTML concepts.
- useStockTemplates transparently uses these concepts when Base44 is missing or unseeded.
- StockTemplatePreview, template cards and homepage showcase render actual srcDoc
  website HTML, not unrelated generic photos masquerading as designs.
- Homepage exposes six cross-industry, structurally different concepts.
- /templates provides search, industry filters, 200 records and load-more paging.
- /preview-template/:slug is public and provides full-page scrollable previews,
  brand-color choices, desktop/mobile view and an HTML download.
- Preview-only concepts cannot execute the live publishing adapter.
- Industry images reuse the existing hash-audited /images/ source assets.
- Approved existing Digital Dominance homepage layout is unchanged.

## Quality receipts
- Local Vite build: PASS.
- Changed-file ESLint: PASS.
- Chrome independent browser test: PASS, home desktop/mobile, dialog selection,
  wizard handoff, catalog first 20/40 pagination, public preview page and guarded
  preview-only download flow.
- Test source: scripts/independent-template-gallery-qa.cjs
- Local receipt: docs/receipts/TEMPLATE_GALLERY_QA_20261014.json
- CI workflow: .github/workflows/independent-template-gallery-qa.yml

## Remaining production gates
- These are 200 distinct *concepts*, not 200 deployed live websites.
- No Base44/Supabase backend, production lead capture, tenant RLS or CRM verified.
- Independent semantic image review and commercial rights remain unapproved.
- Full repository type-check debt and baseline lint errors remain for later remediation.
- Human design-quality review, approved visual parity, accessibility,
  authenticated user flow and independently validated release remain required.
- No production merge, DNS change, publishing or customer message is authorized.

## Rollback
Changes isolated to feature/god-mode-independent-quality-gates-20261014.
Do not merge PR #50 until the independent Guardian release approval is obtained.