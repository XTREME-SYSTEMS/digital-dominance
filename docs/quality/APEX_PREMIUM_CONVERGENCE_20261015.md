# APEX Premium Convergence | branch-only evidence packet

Date: 2026-10-15 UTC. Current source branch: `feature/apex-premium-proof-convergence-20261015`.

- Base: `ff4850cb6af5c2c1ed9d346664a8d52f8076a4bc` (current main at branch creation); no main/prod modification.
- Premium master source: PR #42 `827eebc6f9c665cf2df42ed965d36dec5fdd35a9`. Preserve all 20 designs, 17 generated industry experiences, 3 V2 signatures, composer, accessibility and business-brand tools.
- Screenshot source: PR #51 `0c9e0b0dd7e8c70b98729cad8338c4e05ac4f81a`; reuse existing 17 GitHub JPEG blobs without re-encoding.
- Screenshot provenance: `public/premium/collection/SCREENSHOT_PROOF.json` retains its original Chrome-capture source `7311c9f12ad1c2581033462fcb203c35ee0b91b4`. These hashes establish recorded byte lineage, **not** current visual approval or live capture of this new branch.
- Integration: merge exactly four screenshot-related gallery-builder lines onto latest PR #42 builder. Preserve PR #42 remaining 146 lines exactly. Keep Chrome-screenshot validation, noindex HTTP headers, no live contact submission, and SitePack approval-first flow.
- Existing Google OAuth, production domains, Base44 app records, X1 leases/heartbeat, and Supabase credentials untouched.
- QA: source SHA verify; `npm ci`, `npm run test:premium-20`, `npm run test:premium-sitepack`, `node scripts/verify-premium-chrome-thumbnails.mjs`, `npm run build`; real browser desktop/mobile; audit errors and noindex. **Do not merge/release** until independent pixel review and authorization checks.
- Rollback: close the draft PR; source is isolated from main. No public website publishing authorized.
