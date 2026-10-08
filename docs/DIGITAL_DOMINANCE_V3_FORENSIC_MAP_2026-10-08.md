# DIGITAL DOMINANCE V3 FORENSIC SOURCE-TRUTH MAP

**Mission:** DIGITAL DOMINANCE V3 -> AUTONOMOUS DEMAND-TO-REVENUE ENGINE  
**Discovery date:** 2026-10-08  
**Canonical repository:** `XTREME-SYSTEMS/digital-dominance`  
**Audited main SHA:** `b3945f1da25df59ff0147bfd4c7356c24bd73523`  
**Live Base44 donor/runtime:** `epoxyquotenearme.com` app `6a77f4491f0bf92de9a3ed8b`  
**Mode:** READ / CLASSIFY / BRANCH-SAFE DOCUMENTATION ONLY

## Executive conclusion

Digital Dominance already contains most of the primitives required for V3. The correct strategy is **converge, classify, harden, and reconnect the evidence loop**, not rewrite from zero.

The strongest reusable chain is:

```
verified market signal
 -> opportunity score
 -> search / competitor evidence
 -> URL / offer decision
 -> website factory
 -> independent validation
 -> approved release
 -> Search Console / Analytics
 -> session + lead attribution
 -> closed-won revenue + margin
 -> learning loop
```

The main architectural problem is that verified first-party and authoritative data are mixed with model estimates, hard-coded benchmark values, simulated deploys, generic mass page generation, fabricated backlink candidates, and overlapping schedulers. V3 must make source class and confidence first-class data.

## Current source-truth evidence

### GitHub / Base44 parity

The following core live Base44 files were byte-for-byte identical to GitHub `main` during this discovery:

- `opportunityIntelligenceEngine`
- `domainGoldRush`
- `scanCompetitors`
- `pullSearchConsoleData`
- `autonomousSeoDominance`
- `dominanceEngine`
- `seoGenerator`
- `dailyLeadEngine`

This establishes GitHub `main` at SHA `b3945f1...` as the current code source truth for the inspected Digital Dominance core.

### Live data-plane condition

Live Base44 state shows:

- `CanonicalSiteRegistry.data_quarantine = true`
- canonical domain = `epoxyquotenearme.com`
- current health score = **15**
- GSC property = `BLOCKED_NOT_FOUND`
- last Google sync = null
- approved location count = **343**
- all 343 sampled canonical locations are marked published
- **0 / 343** are validated
- **0 / 343** have positive `local_value_score`
- **0 / 343** have a known Google indexing state
- all 343 are in the sitemap
- `Opportunity` entity currently contains **0** records
- sampled 200 leads: **0** contain UTM attribution, only **3** have landing-page attribution
- sampled 500 FunnelEvents: **233** unique sessions, **0** events linked to a `lead_id`
- sampled leads: **0 WON**, **$0 won_value**
- sampled 6 DominanceCampaign records: **4 completed, 2 failed, 288 pages generated**
- all 6 campaigns had `auto_deploy_vercel = true`; 2 had `auto_purchase_domain = true`

The system therefore has significant generation capacity but an incomplete evidence-to-revenue feedback loop.

---

# KEEP / UPGRADE / WRAP / RETIRE MAP

## 1. Opportunity Engine

### KEEP
- `base44/functions/opportunityIntelligenceEngine/entry.ts`
- broad scanner taxonomy: Google Trends, GitHub, social conversations, industry pain points, local demand, business AI demand
- independent web-search pattern
- explicit buyer/problem/solution framing
- Google Calendar discovery as a separate useful operator-intelligence input

### UPGRADE
- Persist every accepted opportunity into `Opportunity`.
- Require source URL, observed date, freshness, geography, buyer archetype, commercial intent, confidence, source class, and verifier.
- Replace generic 0-10 model score with deterministic V3 score:
  - demand evidence
  - urgency
  - buyer value
  - buyer density
  - repeat demand
  - CPC/CPL proxy
  - compliance ease
  - fulfillment capacity
  - first-party conversion/revenue evidence when available
- Add deduplication and evidence expiry.

### WRAP
Treat LLM/web-search results as **candidate hypotheses**, not business facts. A verifier must promote candidates into the scored opportunity ledger.

### RETIRE
- Model-estimated budgets/willingness-to-pay presented as verified economics.
- Scanner output that is returned transiently but never becomes durable evidence.
- Any opportunity score without source/freshness/confidence provenance.

**V3 target:** `Opportunity Engine` = durable evidence queue + deterministic scoring.

---

## 2. Market Intelligence

### KEEP
- `tradeCrystalBall`: real BLS CES API, explicit proxy labeling, deterministic calculations.
- `companyIntel`
- `intelligenceSync`
- authoritative/public-source ingestion patterns.

### UPGRADE
- Normalize BLS, Census/NAICS, public procurement, Google Trends, first-party CRM, Search Console, Analytics, call/form data into a common `MarketSignal` contract.
- Store source type: `FIRST_PARTY | AUTHORITATIVE_PUBLIC | VERIFIED_THIRD_PARTY | MODEL_ESTIMATE | OPERATOR_ASSUMPTION`.
- Separate market size from actual buyer intent.

### WRAP
Web-search intelligence and industry narratives remain useful as context, but cannot outrank authoritative or first-party evidence.

### RETIRE
- Any fabricated market-size/revenue number.
- Any unlabelled estimate being used as a release trigger.

**V3 target:** `Market Intelligence` = source-ranked market signal fabric.

---

## 3. Keyword / Search Engine

### KEEP
- `pullSearchConsoleData`: page + query dimensions together, impressions, clicks, CTR, position, URL inspection.
- `SeoContent.performance_snapshot`
- `CanonicalSiteRegistry.google_search_console_property`
- `seoGenerator` source-state model that distinguishes VERIFIED/BLOCKED.
- Search Console query-to-page attribution concept.

### UPGRADE
- Restore exact GSC property binding. Current registry is `BLOCKED_NOT_FOUND`.
- Create one canonical keyword/query evidence table with:
  - query
  - page
  - geography where known
  - impressions
  - clicks
  - CTR
  - position
  - first/last observed
  - intent
  - source
  - confidence
  - associated leads/revenue.
- Pull authorized Ads/Keyword Planner or equivalent third-party metrics only as labelled benchmark evidence.

### WRAP
- `seoAeoSimulator` is useful for hypotheses and what-if modeling, but must never certify rank probability or actual demand.
- Search-volume estimates from LLM/web research remain hypothesis-only.

### RETIRE
- `src/pages/admin/UrlStrategy.jsx` hard-coded monthly searches/CPC/lead values as decision evidence.
- Hard-coded keyword volumes in `gapFillerEngine`.
- Any claim that NearMe/NearYou naming itself guarantees ranking.

**V3 target:** `Keyword/Search Engine` = first-party query evidence + labelled research proxies.

---

## 4. Competitor Engine

### KEEP
- `scanCompetitors`
- `CompetitorInsight`
- `topSitesBenchmarkScanner`
- competitor/content-gap concept
- backlink opportunity research when evidence-backed.

### UPGRADE
- Require every competitor fact to include source URL, observation timestamp, metric provider, and confidence.
- Capture SERP position, visible offer, funnel structure, page type, structured data, review footprint, page speed, content gap, and link evidence separately.
- Add independent browser verification for release-critical conclusions.

### WRAP
LLM summaries should sit above raw evidence as interpretation, not source truth.

### RETIRE
- Fabricated DA/PA/relevance scores.
- Generated `example.com` backlink candidates.
- Any competitor traffic/ranking number without an explicit source.

**V3 target:** `Competitor Engine` = evidence-backed SERP/funnel benchmark system.

---

## 5. URL / Domain Engine

### KEEP
- `domainGoldRush` deterministic candidate generation.
- real RDAP availability checks.
- keyword/TLD/intent/length/city/cleanliness scoring primitives.
- `DomainStrategy` registry.
- `UrlFinder` workflow UX.

### UPGRADE
Add:
- trademark/licensing checks
- fulfillment/serviceability
- actual query evidence
- CPC/CPL benchmarks with source class
- buyer density
- existing authority/backlink profile
- cannibalization check
- brand memorability
- domain acquisition cost
- client/territory conflict checks.

### WRAP
The current domain score becomes a **brand/intent score**, not an SEO-ranking score.

### RETIRE
- automatic domain purchasing as a default behavior
- hard-coded search-volume/CPC/lead-value metrics
- auto-purchase flags as autonomous production authority
- any `NearMe`/`NearYou` ranking guarantee.

**V3 target:** `URL/Domain Engine` = evidence-informed naming/distribution asset selector with approval-gated purchase.

---

## 6. Website Factory

### KEEP
- Universal Site Builder onboarding sequence.
- Industry -> branding -> content -> URL -> pipeline UX.
- `WebsiteQueue`
- `WebsiteTemplate`
- `UniversalIndustryTemplate`
- generated bundle / template registry concepts.
- preview-first idea.
- Website Empire overview concepts.

### UPGRADE
Replace the current shell with the canonical governed Website Factory:
- verified business brief
- SiteGenome / template genome
- deterministic page architecture
- conversion funnel selection
- Next.js output
- Supabase lead capture
- GitHub branch
- Vercel preview
- independent browser + SEO + accessibility validation
- visual approval
- exact-SHA release.

### WRAP
- `universalDominanceEngine` as a donor/orchestration adapter.
- existing Base44 templates and admin UI as migration donors.
- generated content calls behind the Vercel AI Gateway/model router.

### RETIRE
- `WebsiteFactory.jsx` simulated deployment as a deployment mechanism.
- PipelineLauncher defaults that enable domain purchase, production deploy, 500+ SEO pages and full dominance automatically.
- `gapFillerEngine.run_programmatic_seo` in its current form.
- generic thin pages such as “Expert [industry] services. Get a free quote today.”
- unsupported “Top-rated”, “satisfaction guaranteed”, fake/local placeholder proof.
- `address: "TBD"` citation generation.
- automatic content publishing before independent validation.

**V3 target:** `Website Factory` = governed manufacturing line, not a page spammer.

---

## 7. Search Feedback Engine

### KEEP
This is one of the highest-value assets.

Preserve:
- `pullSearchConsoleData`
- `autonomousSeoDominance` opportunity discovery logic
- page/query attribution
- Search Console inspections
- Core Web Vitals
- Analytics
- `LocationPerformance`
- technical SEO validators
- status/canonical/robots/sitemap checks.

### UPGRADE
- Repair the current GSC binding before expansion.
- Bind each indexed URL to:
  - site
  - client
  - service
  - geography
  - query set
  - experiment/version
  - leads
  - revenue.
- Require a validator before any optimization becomes publishable.
- Add statistical experiment state so changes can be measured rather than merely regenerated.

### WRAP
`autonomousSeoDominance` becomes a **recommend/queue/repair engine**, not an unrestricted publisher.

### RETIRE
- IndexNow treated as a Google indexing substitute.
- automatic page generation because a query merely exists.
- rank promises / “first-page acceleration” claims.
- `estimated_time_to_first_page: "30-90 days"` as a deterministic outcome claim.

**V3 target:** `Search Feedback` = query -> page -> experiment -> outcome loop.

---

## 8. Lead Attribution Engine

### KEEP
- `Lead` entity.
- UTM fields.
- landing page and referrer capture.
- `FunnelEvent`.
- `LocationPerformance`.
- HubSpot connector.
- lead source routing.
- estimator/funnel event concepts.

### UPGRADE
Current live evidence shows attribution is not closed:
- 0 / 200 sampled leads contain UTM attribution.
- only 3 / 200 sampled leads have landing-page attribution.
- 0 / 500 sampled FunnelEvents contain `lead_id`.

V3 must persist:
```
visitor/session
 -> page/version
 -> query/campaign/referrer
 -> form/call/chat event
 -> Lead
 -> CRM contact/deal
```

Add:
- session_id on Lead
- first-touch + last-touch
- page/version/build SHA
- site/client/location
- call tracking IDs
- campaign/UTM
- consent where needed
- dedupe and identity stitching.

### WRAP
- `dailyLeadEngine` discovery/import functions.
- `pushLeadToHubspot`.

### RETIRE
The current combined pattern where `dailyLeadEngine` can scrape -> create Lead -> send email -> SMS -> voice in one autonomous execution. Discovery/data ingestion and customer/prospect outreach must be separate governed actions.

**V3 target:** `Lead Attribution` = deterministic first-touch/last-touch identity chain.

---

## 9. Revenue Attribution Engine

### KEEP
- `Lead.won_value`
- `Lead.estimate_mid`
- Results dashboard
- Location Performance revenue rollups
- HubSpot deal creation primitive.

### UPGRADE
Current live sample:
- 0 WON leads
- $0 `won_value`

The current dashboards can compute revenue, but the data plane is not yet feeding closed-won economics.

Add:
- CRM deal/contact IDs on Lead
- closed-won timestamp
- actual collected revenue
- gross margin / fulfillment cost
- service type
- buyer/client
- refund/cancellation state
- source session/page/query/campaign
- lead acquisition cost
- profit per qualified lead
- profit per indexed page / market / client.

Never substitute `estimate_mid` for realized revenue.

### WRAP
Existing Results/Analytics pages can remain visualization surfaces while the underlying economics are replaced with verified records.

### RETIRE
- estimated pipeline value labelled or interpreted as revenue.
- model-generated ROI as first-party evidence.

**V3 target:** `Revenue Attribution` = closed-won + margin ledger joined back to acquisition source.

---

## 10. Learning Engine

### KEEP
- Alpha Prime heartbeat pattern.
- `closedLoopTester`
- `postconditionValidator`
- `regressionTestSuite`
- validation receipts
- evidence receipts
- repair jobs
- failure patterns
- experiment / A-B primitives.
- one durable queue/lease/receipt architecture.

### UPGRADE
Learning objective must optimize:
1. qualified lead value
2. conversion rate
3. closed-won revenue
4. gross profit
5. time-to-qualified-lead
6. cost per qualified lead
7. useful organic visibility
8. validation reliability.

Every learned rule must include:
- input evidence
- experiment identity
- before/after metrics
- confidence
- applicable segment
- expiry/revalidation condition.

### WRAP
Self-reflection and swarm systems may propose work, but Apex / Agent Zero and the single authoritative runtime remain command authority.

### RETIRE
The current scheduler forest.

Current code contains overlapping Base44 scheduled workflows and Railway cron schedules for many of the same functions:
- Alpha Prime heartbeat
- Fleet heartbeat
- Daily Lead Engine
- Weekly Opportunity Scanner
- Competitor Scanner
- SEO Optimizer
- Autonomous SEO
- Swarm Autopilot
- Digital Dominance compiler
- additional hourly reflection/coding/refactor cycles.

V3 should have one authoritative heartbeat:

```
heartbeat
 -> queue
 -> lease
 -> worker
 -> independent validator
 -> receipt
 -> next eligible work
```

Specialist cadence becomes queue eligibility metadata, not a forest of independent commanders.

**V3 target:** `Learning Engine` = revenue-aware experiment/repair system under one runtime.

---

# HARD QUARANTINE / RETIRE LIST

These items must not be promoted into V3 source truth:

1. `gapFillerEngine` hard-coded keyword volume/difficulty values.
2. Generic mass pages automatically marked `published`.
3. Fake `example.com` backlink opportunities.
4. Randomly generated domain/page authority values.
5. Placeholder NAP/citation values such as `address: "TBD"`.
6. Unsupported claims such as “Top-rated” or “satisfaction guaranteed” without verified proof.
7. “First-page acceleration” outcome framing and deterministic ranking time claims.
8. Simulated deployment state presented as actual deployment.
9. Automatic domain purchase / production deploy as default pipeline behavior.
10. Model-estimated traffic/search/revenue values treated as factual.
11. 343 currently published canonical location records being treated as validated local pages; live registry shows all 343 unvalidated with local value score 0.
12. Duplicate Base44 + Railway schedules as independent control authority.
13. Automatic outbound email/SMS/voice bundled into data discovery/lead ingestion.

---

# V3 TARGET OPERATING MODEL

```
Opportunity Engine
  ↓
Market Intelligence
  ↓
Keyword/Search Engine
  ↓
Competitor Engine
  ↓
URL/Domain Engine
  ↓
Offer + Funnel Compiler
  ↓
Website Factory
  ↓
Independent Release Certifier
  ↓
Search Feedback
  ↓
Lead Attribution
  ↓
Revenue Attribution
  ↓
Learning Engine
  ↺
```

All ten engines share:

- `tenant_id`
- `client_id`
- `market_id`
- `site_id`
- `experiment_id`
- `source_evidence_id`
- `build_sha`
- `deployment_id`
- `session_id`
- `lead_id`
- `deal_id`
- `receipt_id`

That identity chain is the core V3 moat.

---

# RECOMMENDED EXECUTION WAVES

## Wave 0 — Freeze and evidence
No new mass generation.
- preserve GitHub `main` as source truth
- maintain current production quarantine
- classify existing pages/data as verified/inferred/simulated
- keep current release gates.

## Wave 1 — Repair measurement
1. Restore GSC exact property binding.
2. Revalidate canonical/robots/sitemap/status-code behavior.
3. Join FunnelEvent session -> Lead.
4. Persist UTM/landing-page/version attribution on every new lead.
5. Connect HubSpot deal outcome -> Lead.won_value / actual revenue.
6. Establish first-party revenue receipts.

## Wave 2 — Build evidence engine
- Opportunity ledger
- MarketSignal ledger
- QueryEvidence ledger
- CompetitorEvidence ledger
- deterministic opportunity scoring
- freshness/confidence/source-class rules.

## Wave 3 — Converge factory
- preserve AutoBuilder-style onboarding
- compile verified business brief
- SiteGenome/template genome
- preview-only generation
- independent validation
- human visual approval
- protected production release.

## Wave 4 — Safe programmatic SEO
Only generate an indexable page when:
- verified demand exists
- service can actually be fulfilled
- location is genuinely served
- page has differentiated local/service value
- canonical/status/robots/sitemap are valid
- duplication/content-quality gate passes
- independent validator certifies release.

## Wave 5 — Learning loop
- experiment registry
- traffic/query evidence
- lead attribution
- closed-won/margin evidence
- bounded automatic recommendations/repairs
- one heartbeat and durable receipts.

---

# DECISION

**Do not rewrite Digital Dominance.**

Use the existing system as the donor/control-plane foundation, but enforce a hard boundary:

> **Verified evidence may drive automation. Simulated/model-estimated evidence may only generate hypotheses.**

That single rule converts the current powerful but mixed system into a trustworthy Demand-to-Revenue Engine.
