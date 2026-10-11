# Eden Skye | Universal AI Factory V1

**Developer-only prototype; no Base44 dependency and no external service calls.**

- 17 AI services, including custom invention intake, grouped across 8 families.
- Deterministic, cost-floor-based indicative quote engine. No competitor price claims. No automatic acceptance, billing or production action.
- Accessible responsive standalone onboarding concept at `demo/index.html`, preserving the public Website Launch Engine design lock.
- 26 passing regression tests for pricing, scope, restricted-work escalation, privacy and deterministic behavior.
- Data/voice/consent/production gates described in `contracts/EDEN_PIPELINE_CONTRACT.md`.

Run tests: `node --test tests/quote-engine.test.mjs`.
Run preview: from package root, `python3 -m http.server 8178` then open `http://127.0.0.1:8178/demo/`. This runs only on your own computer and does **not** send data or create a hosted website.

Integration target: existing `XTREME-SYSTEMS/digital-dominance` feature branch and existing X1 Staging `dominance_onboarding_sessions`, subject to provider-side credential/identity validation. In production, pricing is calculated and signed *server side*. The demo's fingerprint is **not** a cryptographic signature.