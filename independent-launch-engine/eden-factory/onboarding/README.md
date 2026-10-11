# Eden V2 | Eight-Step Progressive Onboarding
Status: **Working local preview + source/CI tests; NOT live customer portal**.

## What was reused from autobuilder.zip
- `BusinessProfile.jsx`: guided onboarding, stage-specific branching, industry fact gathering, financial research as an optional later stage.
- `WizardUI.jsx`: consistent progress header, answer chips, Back/Continue navigation, coherent visual hierarchy.
- `ClientOnboarding.jsx` / `AiOnboardingChat.jsx`: conversational framing and structured profile output.
- `base44/shared/cloudBrowserScrape.ts`: proof an in-house browser adapter exists, but **new code DOES NOT depend on Base44 or copy its cookie-based auth capabilities**.

## Eight-step questions
1. Your identity and contact preference
2. Where you're starting, business presence, and **early opt-in to public business research**
3. Vision and measure of success
4. Audience and problem being solved
5. Solution type, required functionality, integrations and data sensitivity
6. Stated creative voice, colors, disliked styling and references
7. Budget, timeline, support and hard constraints
8. Review, independent research scopes, follow-up choice and optional marketing consent

The system has conditional hints for new ideas, established businesses, website/app projects and optional research. Users can download a local project brief even if they decline research and follow-up contact.

## Running the private workstation preview
On the approved JARVIS workstation, open a terminal:
```
cd "C:\_Strategic_Minds_AI_OS\49_WEBSITE LAUNCH EGINE\AUTONOMOUS_EXECUTION_V1\08_Sandbox\EDEN_V2_PORTAL"
node serve.mjs
```
Then open **http://127.0.0.1:8179/** in that computer's browser. This server binds only to `127.0.0.1` and supports no network submissions. Close the terminal or Ctrl+C when finished. In this task the preview was temporarily launched, HTTP 200 verified, and stopped.

## Existing Cloud Browser target
`business-research-policy.mjs` returns **planned** jobs for named/consented official business URLs and aggregate market research. `browser-worker-bridge.mjs` is a server-only guard taking a trusted `dispatcher` function for the existing Xtreme Cloud Browser.
Neither file executes remote jobs in the demo. The real adapter must validate consent, tenant identity, browser API credentials, robots, DNS/IP, quotas, expiry, per-target terms and data minimization before running. Never pass client name, phone or email to crawler jobs.
No private social data, individual skip tracing, identity resolution, psychological trait inferences or hidden-account crawling.

## QA
```
node --test onboarding/tests/intake.test.mjs
node --test onboarding/tests/browser-bridge.test.mjs
node --test tests/quote-engine.test.mjs
```
GitHub Actions runs these on the exact source SHA. Successful local HTTP response is **not** screenshot/route/form/browser approval.

## Deployment status
- Branch: `feature/eden-consented-discovery-v2`.
- Draft PR: https://github.com/XTREME-SYSTEMS/digital-dominance/pull/19
- Public Website Launch Engine visual lock untouched.
- Not integrated with real client email/contact, authentication, billing, live scraping, voice, or production; all remain gated.
- Exact next action: staging server consent ledger, provider binding to existing X1 worker, synthetic client and research QA, visual desktop/mobile comparison and approval.
