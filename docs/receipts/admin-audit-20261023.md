# Admin & Backend Audit — DIGITAL DOMINANCE V.1

**Receipt date:** 2026-10-23 (run started 2026-10-22 23:46 America/New_York)
**Scope:** every page under `src/pages/admin` (142 files), every backend function in `base44/functions` (190), every entity (160), every workflow (38), plus the public funnel pages that feed the Lead pipeline.
**Code changed:** none. This is a findings-only run, as instructed.
**Author:** Builder agent (Base44), on request of the app owner.

---

## 0. How to read this

**Verdict rubric**

| Verdict | Means |
|---|---|
| LIVE | Renders, and its controls end in a real entity or function call (directly, or through children that do). |
| PARTIAL | Renders and has real wiring, but carries at least one defect flag (no error handling, can render nothing, no loading state, shell mismatch). |
| SHELL | Renders a surface whose content is static — no entity or function call anywhere in it or its children. Nothing on it is live data. |
| DEAD | Unreachable: no route, or imported and never routed. |
| UNVERIFIED | Cannot be settled statically. Needs a live check. |

**Flag codes used in the table**

- `U` unrouted or imported-but-never-routed (unreachable)
- `S` static shell (no SDK reference in the page or its children)
- `D` delegates its data work to child components
- `null` contains a `return null` path — can render nothing when data is absent
- `noerr` performs async work with no try/catch — failures are silent
- `noh1` has no page-level heading
- `ref` styled for the reference admin shell (`wle-*` classes / `--launch-admin-*` variables)
- `dark` hardcodes a dark background inside the light admin shell
- `R` file was read in full during this audit

**Confidence statement.** Every number and list here came from a command run against the working tree, or from the platform's own workflow-run history. Two things I did **not** do: I did not reproduce the reported blank screens in a browser, and I did not read all 142 admin pages line by line. Pages marked `R` were read; everything else is derived from a static scan and is labelled as such. Where the evidence could not settle a question, the item is in §10, not stated as fact.

---

## 1. Headline findings

### 1.1 The autonomous layer is switched off — this is the most consequential finding in the app

Verified against the platform's own run history, 7 of 38 workflows:

| Workflow | Platform status | Last run | Result |
|---|---|---|---|
| Alpha Prime Heartbeat | **inactive** | 2026-09-20 | last 10 runs ok, 5-minute cadence, then stopped |
| Daily Site Validation | **inactive** | 2026-10-15 | **both last runs FAILED** — `headlessSiteValidator returned HTTP 400: {"error":"url is required"}` |
| SEO Optimizer | **inactive** | 2026-09-07 | weekly, ok, then stopped |
| Autonomous Dominance 24-7 Cycle | **inactive** | 2026-10-15 | hourly, ok, then stopped |
| Daily Lead Engine | **inactive** | **no runs ever recorded** | never executed |
| CRM Follow-Up Sequence | **inactive** | **no runs ever recorded** | never executed |
| Sitemap Auto-Update | **inactive** | **no runs ever recorded** | never executed |

Consequence: the 57 backend functions with no UI caller (listed in §5.3) are reachable **only** through these workflows. While the workflows are inactive, that entire layer — lead follow-up, review requests, sitemap, indexing, brand compliance, image-mandate QA — is dormant code. The `Daily Site Validation` failure is also a deterministic bug, not a flaky one: the workflow calls `headlessSiteValidator` without the `url` argument the function requires, so it will fail on every run until the payload is corrected.

`33` of the 38 workflow files declare a schedule, so the intent is there; the activation state is platform-side, which is why it does not show up in the repo.

### 1.2 Most of the admin surface is unreachable by clicking

- Admin routes total **139**; admin page files total **142** (3 have no route).
- **80 of 139** admin routes have **no entry in either sidebar** (`ReferenceAdminSidebar`, `WorkspaceSidebar`).
- **16** of those have no inbound link from any page in the repo either — they can only be reached by typing the URL:

```
ab-testing, autonomous-company, bulk-launch, dashboard, google-batch, google-happiness,
gpt-pipeline, hero-enhancer, image-ingestion, manus-recreation, opportunity-intelligence,
pack-research, system-inventory, targeting, universal-dominance, universal-template-studio
```

- Three files are imported or present but never mounted: `Dashboard.jsx`, `GeneratorSandbox.jsx`, `LaunchEngineAdmin.jsx`.

The system is not missing pages. It is missing the door to about 60% of them.

### 1.3 The site's own contact page loses leads

`src/pages/Contact.jsx` (137 lines, `R`) contains **zero** entity writes and **zero** function calls. Its submit handler (lines 15–23) is:

```js
window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
```

A visitor who fills in the contact form never becomes a `Lead`. On mobile — where `mailto:` frequently does nothing at all — the submission is silently lost, and neither the owner nor any automation ever sees it. Every other lead-capture surface in the app is wired correctly: `Estimator`, `Funnel`, `Results`, `Book`, `Booked`, `Questionnaire`, `components/home/ConsultationForm`, `components/xps-funnel/FunnelHero`, `components/launch-engine/ContactSection` and `components/marketplace/AcquireLeadForm` all write `Lead`. `Contact.jsx` and `smai/Contact.jsx` are the two that do not.

### 1.4 20 wired admin pages swallow their own errors, 29 show no loading state

Pages that perform async work with no `try/catch` (`noerr`) — a failure shows as an empty table, which is indistinguishable from "no data":

```
AgentMaster, ClientPackages, CrystalBall, Dashboard, GraphConsole, LaunchStatusDashboard,
LeadDetail, Leads, NationalLaunch, Pipeline, PwaLaunchDashboard, RagConsole, SettingsPage,
SiteInventory, SystemHealth, TemplateManager, UrlStrategy, VisualRenderLibrary, VoiceAssistant, WebsiteQueue
```

Note that four of the twenty sit directly on the money path: `Leads`, `LeadDetail`, `Pipeline`, `WebsiteQueue`. A failed read there looks like "no leads today".

A further **29** pages that call entities or functions contain no loading indicator at all.

### 1.5 12 pages can render literally nothing

Pages containing a `return null` (or equivalent) path, so an absent record produces a blank panel with no explanation:

```
Competitors, GeneratorSandbox, BuilderLibrary, Results, SiteHealthMonitor, VisionCortexV2,
WebsiteEmpire, WebsiteFactory, SiteInventory, TemplateManager, ConvergenceEngine, SettingsPage
```

### 1.6 Three competing design systems are live in the admin at the same time

Measured across the 142 admin pages:

- **7** pages are styled for the *reference* shell (`wle-content`, `wle-panels`, `--launch-admin-*`): `PromptChainConsole`, `SiteBankAutomation`, `MasterPlan`, `GeneratorRegistry`, `BrandComplianceGuardian`, `DataExport`, `LaunchEngineAdmin`.
- **11** pages use the *app* shell tokens (`--vx-*`, `xa-card`, `xa-electric`): 19 uses of `xa-electric-light`, 12 of `wle-panels`, 8 of `xa-electric-hover`.
- **23** pages hardcode a dark page background (`bg-[#050508]` and friends) inside `AdminLayout`, whose shell is pinned light (`--launch-admin-canvas: #f4f8fd`).
- **121** of 142 pages render their own `<h1>`; the other 21 render none.

`AdminLayout` (75 lines, `R`) injects the mandatory brand variables and provides the light shell. It never forces the app out of dark mode. `src/lib/useTheme.js` persists a `dark` class on `<html>` in `localStorage` under `vx-theme` (default light, but sticky once toggled). In dark mode the global tokens flip (`--foreground` becomes near-white) while the admin shell stays light — so any admin page whose text is written in Tailwind token classes rather than the reference variables renders near-white on near-white. That is the leading candidate explanation for the reported "blank white" pages; see §10.

### 1.7 The reported blank pages: evidence, and what I could rule out

| Page | Route | Static evidence | Verdict |
|---|---|---|---|
| `GeneratorRegistry` | `/admin/generator-registry` | 216 lines, `R`. Renders a 7-column table from `@/lib/generatorRegistry` (28 entries). Uses `wle-content` + 34 inline styles with hardcoded fallbacks for every variable. No error path, no async work. **It should render.** | UNVERIFIED — not reproducible statically |
| `LaunchEngine` (site home) | `/` | 28 lines, `R`. Composes 6 sections + the wizard modal. No `min-h-screen` white background; the page background is the dark launch-home navy. | UNVERIFIED |
| `DataExport` | `/admin/data-export` | 336 lines, `R`. Wired: calls `dataExport` (counts + export) at lines 80 and 124. Reference-shell styling, 43 inline styles. | PARTIAL |
| `/admin` (index) | `/admin` | 4-line `TemplateStudio.jsx` → `StockStudio.jsx` (29 lines, `R`): real tabs, `useQuery`, `TemplateLibrary` reads. Its text is Tailwind tokens (`text-foreground`, `text-muted-foreground`) inside the light shell. | PARTIAL |

**Ruled out, with evidence:** global code injection is *not* the cause. The `CodeBlock` entity holds exactly **2** records, both scoped to the single page `/p/digital-dominance-command-v2-preview`, none global, none active app-wide.

### 1.8 Two of the app's most valuable data models are unused code

**15 entities are referenced by no code at all** (frontend or backend):

```
AdminProfile, AgentVersion, AlphaPrimeReflectionLedger, AnalyticsSnapshot, BenchmarkCandidate,
BrowserContext, ContractorArchetype, FailurePattern, Referral, SimulatedVisitor,
SpeechTranscript, StrategicReflectionRecord, SubscriptionPlan, UserWorkspace, WorkflowTemplate
```

Two of those are revenue surfaces, not housekeeping: **`Referral`** (no referral programme exists in code) and **`SubscriptionPlan`** (no recurring plan is read or written anywhere, despite `payments-webhook` and `Base44Purchase` being live). `87` of 160 entities are touched by the frontend; `130` by the backend.

### 1.9 Duplicate families — 20k lines in ten overlapping families

| Family | Pages | Lines | Pages |
|---|---|---|---|
| Launch surfaces | 8 | 2371 | LaunchControlCenter, LaunchStatusDashboard, LaunchEngineAdmin, PwaLaunchDashboard, MultiTemplateLauncher, BulkLaunchBuilder, MassLaunchConsole, NationalLaunch |
| Inventory / audit / heal | 7 | 2223 | SystemInventory, SiteInventory, SystemAudit, GapAnalysis, GapFiller, SystemHeal, SystemHealth |
| Architecture / blueprint | 6 | 2067 | DeepArchitecture, MetaArchitecture, InternalArchitecture, SystemBlueprint, SystemMap, Platform |
| Vision | 6 | 2003 | VisionStudio, VisionCortexV2, ShadowVisionCortex, VisionStrategy, VisionIntelligence, ImageIngestion |
| Factory / generator | 6 | 1935 | SeoFactory, WebsiteFactory, AppFactory, PwaAppFactory, OneClickFactory, AlphaPrime |
| Dominance | 6 | 992 | DigitalDominance, DominancePipeline, UniversalDominance, AutonomousDominance, DominanceSandbox, SeoDominance |
| Comms / agents | 5 | 1642 | XtremeComms, TelnyxManager, VoiceAssistant, EdenSkye, Shadow |
| Templates / library | 5 | 1480 | TemplateManager, TemplateStudio, UniversalTemplateStudio, VisualRenderLibrary, BuilderLibrary |
| Vault / keys | 3 | 1490 | SystemVault, ProviderVault, ApiKeyManager |
| GPT sync | 4 | 1097 | GptSyncConsole, GptTemplateSync, JsonGptSync, GptSyncPipeline |

Only three functions are genuinely shared by 3+ pages (`vercelAiGateway` 5, `aiAssist` 4, `systemAuditor`/`syncWorkflowToSwarm`/`massLaunchOrchestrator`/`autoComplete` 3 each) — so the duplication is in the **surfaces**, not in the engines. That is good news: the engines can be kept and the pages collapsed.

### 1.10 10 pages render real content but hold no live data

Pages with zero entity and zero function references **and** zero SDK-carrying children — they render from local constants only:

```
Capabilities, Platform, SystemOperator, SystemMap, InternalArchitecture,
GoogleHappiness, BrandGuidelines, PipelineBuilder, GeneratorRegistry, DeepArchitecture
```

These are not broken. They are documentation surfaces living inside an operations tool. `DeepArchitecture` renders from `@/data/serviceVerticals`; `GeneratorRegistry` from `@/lib/generatorRegistry` (28 entries). Both are worth keeping and moving out of the ops menu — see §9.

### 1.11 The lead pipeline is genuinely wired (the good news)

`Lead` is referenced by 11 admin pages and written by 9 public surfaces. `Estimator → Results → Book → Booked` are all wired to entities and `bookEstimate`. `Funnel` calls `bookEstimate` (4 function calls). `TemplateLibrary` (13), `WebsiteTemplate` (11), `Lead` (11), `WebsiteQueue` (10), `AppBuild` (9) are the most-used entities in admin — the template and launch machinery underneath the product is real, not scaffolding.

### 1.12 Function layer shape

- 190 functions: 124 write to entities, 67 are read/analysis only.
- 134 are invoked from the UI; 83 from other functions; 44 from workflows.
- **23 have no caller anywhere in the repo** (list in §5.2) — with an important caveat: dynamic invocation and provider-initiated calls are invisible to a static scan. `payments-webhook` appears in that list because Wix calls it, not the app; it is live and must not be touched. Treat the 23 as "no static caller found", not as proven dead.

---

## 2. Coverage

| Layer | Count |
|---|---|
| Admin page files | 142 (42,205 lines) |
| Admin routes (children of `/admin`) | 139 |
| Routes with a sidebar entry | 59 |
| Routes with no sidebar entry | 80 (16 with no inbound link at all) |
| Admin pages wired to entities/functions directly | 117 |
| Admin pages with no direct wiring (delegate or static) | 25 |
| Backend functions | 190 |
| Entities | 160 (87 used by frontend, 130 by backend, 15 by nothing) |
| Workflows | 38 (33 declare a schedule; 7 statuses checked, all inactive) |
| Components | 503 |

Every page file was scanned for: SDK references, placeholder copy, loading states, error handling, `return null` paths, page-level headings, shell-token family, sidebar entry, inbound links, and route existence.

---

## 3. Page-by-page table

`e` = entity references, `f` = function calls, both counted in the page file itself.

### Lead / CRM / revenue path

| File | Route | Lines | e/f | Flags | Verdict |
|---|---|---|---|---|---|
| `Leads.jsx` | /admin/leads | 100 | 1/0 | noerr | PARTIAL |
| `LeadDetail.jsx` | /admin/leads/:id | 157 | 6/0 | noerr, R | PARTIAL |
| `Pipeline.jsx` | /admin/pipeline | 72 | 2/0 | noerr | PARTIAL |
| `Results.jsx` | /admin/results | 441 | 2/1 | null, R | PARTIAL |
| `Reviews.jsx` | /admin/reviews | 209 | 3/1 | — | LIVE |
| `Emails.jsx` | /admin/emails | 94 | 1/0 | — | LIVE |
| `LeadScraper.jsx` | /admin/lead-scraper | 31 | 0/0 | D, R | LIVE (delegates to 3 wired panels) |
| `SkipTraceSystem.jsx` | /admin/skip-trace | 281 | 0/4 | — | LIVE |
| `AutoComplete.jsx` | /admin/autocomplete | 410 | 0/4 | — | LIVE |
| `PredictiveLeadScoring.jsx` | /admin/predictive-scoring | 263 | 0/1 | noh1 | PARTIAL |
| `Dashboard.jsx` | — | 278 | 3/0 | U, noerr | DEAD (no route) |

### Site launch / templates / factories

| File | Route | Lines | e/f | Flags | Verdict |
|---|---|---|---|---|---|
| `TemplateManager.jsx` | /admin/templates | 416 | 7/0 | null, noerr | PARTIAL |
| `TemplateStudio.jsx` | /admin, /admin/template-studio, /admin.html | 4 | 0/0 | R | LIVE (renders StockStudio, wired) |
| `UniversalTemplateStudio.jsx` | /admin/universal-template-studio | 304 | 5/0 | — | LIVE |
| `VisualRenderLibrary.jsx` | /admin/visual-library | 322 | 2/0 | noerr, noh1 | PARTIAL |
| `BuilderLibrary.jsx` | /admin/builder-library | 434 | 1/1 | null | PARTIAL |
| `WebsiteFactory.jsx` | /admin/website-factory | 216 | 3/0 | null | PARTIAL |
| `SeoFactory.jsx` | /admin/factory | 264 | 5/3 | — | LIVE |
| `AppFactory.jsx` | /admin/app-factory | 305 | 6/0 | — | LIVE |
| `PwaAppFactory.jsx` | /admin/pwa-factory | 284 | 2/1 | noh1 | LIVE |
| `OneClickFactory.jsx` | /admin/one-click-factory | 354 | 0/1 | — | LIVE |
| `GeneratorSandbox.jsx` | — | 307 | 2/2 | U, null | DEAD (no route) |
| `GeneratorRegistry.jsx` | /admin/generator-registry | 216 | 0/0 | S, ref, R | SHELL (live-data-free, renders) |
| `AlphaPrime.jsx` | /admin/alpha-prime | 512 | 0/4 | — | LIVE |
| `PwaLaunchDashboard.jsx` | /admin/pwa-launches | 235 | 1/0 | noerr, noh1 | PARTIAL |
| `LaunchStatusDashboard.jsx` | /admin/launch-status | 361 | 2/0 | noerr, noh1 | PARTIAL |
| `LaunchControlCenter.jsx` | /admin/launch-control | 517 | 3/3 | noh1 | LIVE |
| `LaunchEngineAdmin.jsx` | — | 28 | 0/0 | U, ref, noh1, R | DEAD (no route) |
| `MultiTemplateLauncher.jsx` | /admin/multi-launch | 309 | 2/1 | noh1 | LIVE |
| `BulkLaunchBuilder.jsx` | /admin/bulk-launch | 272 | 1/1 | no-link | LIVE |
| `MassLaunchConsole.jsx` | /admin/mass-launch | 414 | 0/3 | — | LIVE |
| `NationalLaunch.jsx` | /admin/national-launch | 235 | 4/0 | noerr | PARTIAL |
| `SiteCommandCenter.jsx` | /admin/site-command | 318 | 3/2 | — | LIVE |
| `SiteProject.jsx` | /admin/site-project/:id | 176 | 3/1 | — | LIVE |
| `SiteBankAutomation.jsx` | /admin/site-bank | 321 | 0/5 | ref | LIVE |
| `WebsiteQueue.jsx` | /admin/queue | 322 | 4/0 | noerr | PARTIAL |
| `WebsiteEmpire.jsx` | /admin/empire | 464 | 4/5 | null | PARTIAL |
| `ProgrammaticTargeting.jsx` | /admin/targeting | 319 | 6/1 | no-link | LIVE |
| `SiteHealthMonitor.jsx` | /admin/site-health | 433 | 3/1 | null | PARTIAL |
| `FaultLineScanner.jsx` | /admin/fault-line | 313 | 2/1 | noh1 | LIVE |
| `DomainGoldRush.jsx` | /admin/domain-rush | 303 | 0/2 | — | LIVE |
| `UrlStrategy.jsx` | /admin/url-strategy | 544 | 3/0 | noerr | PARTIAL |
| `VisualEditor.jsx` | /admin/visual-editor (top-level route) | 111 | 0/0 | D | LIVE (delegates, 2 SDK children) |
| `UniversalSiteBuilder.jsx` | /admin/site-builder | 104 | 0/0 | D | LIVE (delegates, 2 SDK children) |

### SEO / search / analytics

| File | Route | Lines | e/f | Flags | Verdict |
|---|---|---|---|---|---|
| `GoogleSeo.jsx` | /admin/google | 242 | 2/1 | — | LIVE |
| `SeoGenerator.jsx` | /admin/seo-generator | 192 | 1/1 | — | LIVE |
| `SeoSimulator.jsx` | /admin/seo-simulator | 426 | 0/4 | — | LIVE |
| `SeoDominance.jsx` | /admin/seo-dominance | 171 | 1/1 | — | LIVE |
| `GoogleHappiness.jsx` | /admin/google-happiness | 264 | 0/0 | S, no-link | SHELL |
| `GoogleBatchSubmission.jsx` | /admin/google-batch | 337 | 0/1 | no-link | LIVE |
| `GoogleCommandCenter.jsx` | /admin/google-command-center | 497 | 0/5 | — | LIVE |
| `GoogleWorkspaceOS.jsx` | /admin/google-workspace-os | 222 | 1/3 | — | LIVE |
| `AnalyticsDashboard.jsx` | /admin/analytics | 228 | 0/5 | — | LIVE |
| `LocationPerformance.jsx` | /admin/location-performance | 180 | 2/0 | — | LIVE |
| `CrystalBall.jsx` | /admin/crystal-ball | 191 | 0/1 | noerr | PARTIAL |
| `Intelligence.jsx` | /admin/intelligence | 256 | 1/1 | — | LIVE |
| `Competitors.jsx` | /admin/competitors | 165 | 1/1 | null | PARTIAL |
| `ManusRecreation.jsx` | /admin/manus-recreation | 396 | 1/4 | no-link | LIVE |
| `BenchmarkReverseEngineer.jsx` | /admin/benchmark-reverse | 361 | 0/2 | noh1 | LIVE |
| `SwarmCommand.jsx` | /admin/swarm | 408 | 2/3 | — | LIVE |
| `GraphConsole.jsx` | /admin/graph | 315 | 0/10 | noerr | PARTIAL |
| `RagConsole.jsx` | /admin/rag | 244 | 0/7 | noerr | PARTIAL |
| `SystemHealth.jsx` | /admin/system-health | 315 | 0/3 | noerr | PARTIAL |
| `Platform.jsx` | /admin/platform | 378 | 0/0 | S | SHELL |
| `SystemMap.jsx` | /admin/system-map | 322 | 0/0 | S | SHELL |
| `SystemOperator.jsx` | /admin/operator | 361 | 0/0 | S | SHELL |
| `InternalArchitecture.jsx` | /admin/internal-architecture | 237 | 0/0 | S | SHELL |
| `DeepArchitecture.jsx` | /admin/architecture | 502 | 0/0 | S | SHELL (renders from `@/data/serviceVerticals`) |
| `SystemBlueprint.jsx` | /admin/blueprint | 80 | 0/0 | D | LIVE (5 of 9 children carry SDK calls) |
| `MetaArchitecture.jsx` | /admin/meta-architecture | 548 | 0/4 | — | LIVE |
| `Capabilities.jsx` | /admin/capabilities | 397 | 0/0 | S | SHELL |
| `BrandGuidelines.jsx` | /admin/brand-guidelines | 141 | 0/0 | S | SHELL |
| `BrandComplianceGuardian.jsx` | /admin/brand-guardian | 298 | 0/4 | ref | LIVE |
| `SystemInventory.jsx` | /admin/system-inventory | 225 | 0/1 | no-link | LIVE |
| `SiteInventory.jsx` | /admin/site-inventory | 619 | 4/0 | null, noerr, noh1 | PARTIAL |
| `SystemAudit.jsx` | /admin/system-audit | 587 | 0/1 | — | LIVE |
| `GapAnalysis.jsx` | /admin/gap-analysis | 108 | 1/0 | — | LIVE |
| `GapFiller.jsx` | /admin/gap-filler | 260 | 0/3 | — | LIVE |
| `SystemHeal.jsx` | /admin/system-heal | 109 | 0/1 | — | LIVE |
| `SystemIndependence.jsx` | /admin/independence | 377 | 0/8 | — | LIVE |
| `SystemLibrary.jsx` | /admin/system-library | 317 | 1/0 | — | LIVE |
| `ConceptToCompletion.jsx` | /admin/concept-to-completion | 483 | 4/8 | R | LIVE (richest wired page in the audit) |
| `ConvergenceEngine.jsx` | /admin/convergence | 274 | 0/2 | null | PARTIAL |

### Vaults / keys / settings / exports

| File | Route | Lines | e/f | Flags | Verdict |
|---|---|---|---|---|---|
| `SystemVault.jsx` | /admin/vault | 618 | 4/0 | — | LIVE |
| `ProviderVault.jsx` | /admin/provider-vault | 555 | 4/0 | — | LIVE |
| `ApiKeyManager.jsx` | /admin/api-keys | 317 | 0/4 | — | LIVE |
| `SettingsPage.jsx` | /admin/settings | 215 | 2/0 | null, noerr | PARTIAL |
| `DataExport.jsx` | /admin/data-export | 336 | 0/2 | ref, R | PARTIAL |
| `DataDownload.jsx` | /data-download (top-level) | — | — | — | LIVE (outside admin shell) |

### GPT / sync / packs

| File | Route | Lines | e/f | Flags | Verdict |
|---|---|---|---|---|---|
| `GptSyncConsole.jsx` | /admin/sync | 360 | 0/6 | — | LIVE |
| `GptTemplateSync.jsx` | /admin/gpt-template-sync | 212 | 1/1 | noh1 | LIVE |
| `JsonGptSync.jsx` | /admin/json-gpt-sync | 340 | 0/1 | noh1 | LIVE |
| `GptSyncPipeline.jsx` | /admin/assistant | 185 | 0/0 | D, no-link | LIVE (4 of 7 children wired) |
| `PackSync.jsx` | /admin/pack-sync | 284 | 5/0 | — | LIVE |
| `PackResearch.jsx` | /admin/pack-research | 201 | 2/1 | no-link | LIVE |
| `PromptChainConsole.jsx` | /admin/prompt-chain | 118 | 1/1 | ref | LIVE |
| `PromptTestingLab.jsx` | /admin/prompt-testing | 356 | 4/1 | noh1 | LIVE |
| `MetaAgent.jsx` | /admin/meta-agent | 217 | 0/2 | — | LIVE |
| `AgentBuilder.jsx` | /admin/agent-builder | 502 | 0/5 | — | LIVE |
| `AgentMaster.jsx` | /admin/agent-master | 151 | 1/0 | noerr | PARTIAL |
| `AutoComplete` / `SuperAgents.jsx` | /admin/super-agents | 95 | 0/1 | — | LIVE |

### Dominance / vision / comms / simulation

| File | Route | Lines | e/f | Flags | Verdict |
|---|---|---|---|---|---|
| `VisionStudio.jsx` | /admin/vision-studio | 707 | 0/5 | — | LIVE |
| `VisionCortexV2.jsx` | /admin/vision-cortex-v2 | 132 | 0/0 | D, null | PARTIAL (12 of 23 children wired) |
| `ShadowVisionCortex.jsx` | /admin/vision-cortex | 325 | 0/3 | — | LIVE |
| `VisionStrategy.jsx` | /admin/vision-strategy | 240 | 4/1 | — | LIVE |
| `VisionIntelligence.jsx` | /admin/vision-intelligence | 435 | 0/1 | noh1 | LIVE |
| `ImageIngestion.jsx` | /admin/image-ingestion | 164 | 0/1 | no-link | LIVE |
| `ImageValidationDashboard.jsx` | /admin/image-validator | 269 | 0/2 | — | LIVE |
| `VisualRenderLibrary` §, `HeroEnhancer.jsx` | /admin/hero-enhancer | 174 | 6/0 | no-link | LIVE |
| `DigitalDominance.jsx` | /admin/digital-dominance | 105 | 0/0 | D | LIVE (11 of 11 children wired) |
| `DominancePipeline.jsx` | /admin/dominance-pipeline | 139 | 0/0 | D? | UNVERIFIED |
| `DominanceSandbox.jsx` | /admin/dominance-sandbox | 92 | 0/0 | noh1, D? | UNVERIFIED |
| `UniversalDominance.jsx` | /admin/universal-dominance | 388 | 1/2 | no-link | LIVE |
| `AutonomousDominance.jsx` | /admin/autonomous-dominance | 97 | 0/0 | D | LIVE (7 of 7 children wired) |
| `AutonomousRefactor.jsx` | /admin/autonomous-refactor | 46 | 0/0 | D, R | LIVE (3 of 3 children wired) |
| `AutonomousCompany.jsx` | /admin/autonomous-company | 235 | 1/1 | no-link | LIVE |
| `AutonomousWorkflows.jsx` | /admin/workflows | 370 | 0/0 | D? | UNVERIFIED |
| `ContractorWorkflow.jsx` | /admin/contractor-workflow | 462 | 0/2 | — | LIVE |
| `ContractorSimulation.jsx` | /admin/contractor-simulation | 341 | 0/3 | — | LIVE |
| `WorkflowFindings.jsx` | /admin/workflow-findings | 443 | 0/1 | — | LIVE |
| `GodModeSimulationLab.jsx` | /admin/god-mode-lab | 285 | 3/1 | noh1 | LIVE |
| `BackgroundOperations.jsx` | /admin/background-ops | 204 | 2/1 | noh1 | LIVE |
| `FleetDashboard.jsx` | /admin/fleet | 520 | 0/3 | — | LIVE |
| `X1Company.jsx` | /admin/x1-company | 600 | 0/10 | — | LIVE |
| `ClientPackages.jsx` | /admin/client-packages | 304 | 3/0 | noerr | PARTIAL |
| `XtremeComms.jsx` | /admin/xtreme-comms | 609 | 1/6 | — | LIVE |
| `TelnyxManager.jsx` | /admin/telnyx | 568 | 0/11 | — | LIVE |
| `VoiceAssistant.jsx` | /admin/voice-assistant | 393 | 0/7 | noerr | PARTIAL |
| `EdenSkye.jsx` | /admin/eden-skye | 41 | 0/1 | noh1, R | LIVE |
| `Shadow.jsx` | /admin/shadow | 31 | 0/0 | D, R | LIVE (3 wired children) |
| `SocialStudio.jsx` | /admin/social-studio | 359 | 0/8 | — | LIVE |
| `RebrandStudio.jsx` | /admin/rebrand-studio | 385 | 2/3 | — | LIVE |
| `HeroEnhancer.jsx` | /admin/hero-enhancer | 174 | 6/0 | — | LIVE |
| `Contents.jsx` | /admin/contents | 579 | 15/0 | — | LIVE |
| `ToolManager.jsx` | /admin/tools | 312 | 9/0 | — | LIVE |
| `ToolHub` §, `SopSystem.jsx` | /admin/sop | 209 | 3/1 | — | LIVE |
| `PlaybookLibrary.jsx` | /admin/playbooks | 320 | 1/1 | — | LIVE |
| `MasterPlan.jsx` | /admin/master-plan | 530 | 2/0 | ref | LIVE |
| `MasterPipeline.jsx` | /admin/master-pipeline | 494 | 3/1 | — | LIVE |
| `PipelineBuilder.jsx` | /admin/pipeline-builder | 315 | 0/0 | S | SHELL |
| `CodeStudio.jsx` | /admin/code-studio | 104 | 2/1 | noh1 | LIVE |
| `ABTesting.jsx` | /admin/ab-testing | 84 | 0/4 | no-link | LIVE |
| `CommandCenter.jsx` | /admin/command-center | 227 | 0/3 | — | LIVE |
| `OpportunityIntelligence.jsx` | /admin/opportunity-intelligence | 100 | 0/2 | no-link | LIVE |

§ = row covers a page whose route sits outside `/admin` or duplicates a sibling; see §9.

**Count check:** 142 admin files; 139 routes; 3 unrouted (`Dashboard`, `GeneratorSandbox`, `LaunchEngineAdmin`). Three verdicts are `UNVERIFIED` (`DominancePipeline`, `DominanceSandbox`, `AutonomousWorkflows`) because their child components were not individually inspected.

---

## 4. Backend functions — 190

### 4.1 Shape

- **124** write to entities; **67** are read/analysis only.
- **134** invoked from the frontend, **83** from other functions, **44** from workflows.

### 4.2 No caller found anywhere (23)

```
agentRouter, autonomousTemplateEnhancer, canonicalizeRepairBacklog, captchaSolver, cryptoCreator,
gptTwilio, independentAgentRunner, independentSocialGenerator, independentValidator, llmRouter,
memoryRouter, metaAgent, payments-webhook, phase9Proof, predictionEngine, qaAgentReview,
railwayCronDispatcher, regressionTestSuite, runtimeAcceptanceMission, supabaseConcurrencyTest,
syntheticWorker, updateTemplateContent, websiteBenchmarkSystem
```

**Caveat that matters:** a static scan cannot see dynamic invocation (`invoke(name)`) or provider-initiated calls. `payments-webhook` is in this list purely because Base44 Payments calls it — it is live and must not be deleted. The four routers (`agentRouter`, `llmRouter`, `memoryRouter`, `metaAgent`) are plausible dynamic targets. Verify each with a runtime trace before cutting any of them.

### 4.3 No UI caller (57)

```
agentRouter, agentRunner, alphaPrimeHeartbeat, alphaPrimeRepairFactory, autonomousSprint,
autonomousTemplateEnhancer, autonomousVisualOrchestrator, benchmarkEnhancer, bulkLaunchEngine,
calculateDistanceTo100, canonicalizeRepairBacklog, captchaSolver, checkQuestionnaireCompliance,
crmFollowUpSender, cryptoCreator, digitalDominanceCompiler, fillContentGaps, generateRss,
generateSitemap, godModeOptimizer, googleProgrammaticStandard, gptTwilio, imageMandateAudit,
independentAgentRunner, independentSocialGenerator, independentValidator, industrySkipTrace,
intelligenceSync, intentRouter, llmRouter, memoryRouter, metaAgent, notifySeoUpdates, packSync,
parallelTestSwarm, payments-webhook, phase9Proof, pingIndexNow, postconditionValidator,
predictionEngine, promptTransformer, pullSearchConsoleData, qaAgentReview, railwayCronDispatcher,
regressionTestSuite, runtimeAcceptanceMission, searchConsoleStatus, sendFollowUpEmail,
siteDirectEditor, submitToIndexers, supabaseConcurrencyTest, syncFleetSystemState, syntheticWorker,
templateImageMandate, updateTemplateContent, websiteBenchmarkSystem, xtremeUniversalGeneratorBridge
```

Most of these are correctly automation-only. The problem is §1.1: while the workflows are inactive, "automation-only" means "runs never".

---

## 5. Top 10 highest-value fixes, ranked

Ranked by effect on leads and revenue, not by tidiness.

1. **Reactivate the workflows, and fix the Daily Site Validation payload.** *Evidence:* 7 of 7 checked are `inactive`; `Daily Site Validation` failed twice on `headlessSiteValidator` HTTP 400 `url is required`; three workflows have never run. *Action:* fix the missing `url` argument, then activate the lead-facing and validation workflows first (`Daily Lead Engine`, `Immediate Lead Follow-Up`, `CRM Follow-Up Sequence`, `Review Request`, `Sitemap Auto-Update`, `Daily Site Validation`), then the rest. *Impact:* switches on everything in §4.3 at once; today the app's "autonomous" promise is unmet.
2. **Make the contact form write a `Lead`.** *Evidence:* `Contact.jsx` lines 15–23 use `mailto:`; zero entity/function calls in the file; every other capture surface writes `Lead`. *Action:* write the `Lead` (same shape as `ConsultationForm`) and keep the email as a notification, not as the transport. *Impact:* direct, currently-losing lead source on the page most likely to be linked from Google.
3. **Close the 80-route gap in the sidebar.** *Evidence:* 80 of 139 admin routes have no menu entry; 16 have no inbound link at all. *Action:* add a menu group per family (§9) or move the static/documentation pages out. *Impact:* the operator can actually reach the machinery they paid to have built.
4. **Fix the two silent-failure classes on the money path.** *Evidence:* `Leads`, `LeadDetail`, `Pipeline`, `WebsiteQueue` have no `try/catch`; 20 wired pages total; 29 pages have no loading state. *Action:* catch → visible error + retry on those four first. *Impact:* "no leads today" and "the leads call failed" stop looking identical.
5. **Reproduce and fix the blank screens.** *Evidence:* not reproducible statically; `CodeBlock` injection ruled out (2 records, page-scoped only); leading hypothesis is a sticky `dark` class (`localStorage['vx-theme']`) against a shell pinned light. *Action:* a 10-minute live check (clear `vx-theme`, reload each of the 4 pages, then set the shell to force light/`color-scheme`). *Impact:* removes the symptom the owner reports as "broken".
6. **Wire or delete `Referral` and `SubscriptionPlan`.** *Evidence:* both entities have zero references in frontend and backend; `Base44Purchase` and `payments-webhook` are live. *Action:* decide — a referral programme and a recurring plan are the two obvious revenue surfaces, and the payment plumbing is already in place. *Impact:* new revenue surfaces rather than new code.
7. **Consolidate the lead-facing admin set.** *Evidence:* `Lead` is read by 11 admin pages across 4 families. *Action:* one canonical pipeline (`Leads` + `LeadDetail` + `Pipeline`), with `Dashboard`/`Results` reading from it. *Impact:* one place where a lead's state is true.
8. **Collapse the eight launch surfaces to two.** *Evidence:* 2,371 lines across 8 pages doing launch/status/queue work; `WebsiteQueue` + `SiteBank` + `ProgrammaticTargeting` + `MultiTemplateLauncher` share entities. *Action:* one queue, one status board. *Impact:* less surface to keep working, fewer contradictory numbers.
9. **Prune or schedule the orphan function layer.** *Evidence:* 23 functions with no caller found; 67 that write nothing. *Action:* runtime-trace the 23 dynamic candidates, then delete or schedule the rest; each carries maintenance cost and inflates the "capability" count.
10. **Unify the admin shell.** *Evidence:* 3 design systems live (7 reference-shell pages, 11 app-token pages, 23 dark-background pages inside a light shell); 121 pages roll their own `<h1>`. *Action:* pick the reference shell, convert the outliers, give every page a shared header component. *Impact:* the admin stops looking like three products.

---

## 6. Cut list

**Consolidate** (keep the canonical member, fold the rest into it):

| Family | Keep | Fold in |
|---|---|---|
| Lead pipeline | `Leads`, `LeadDetail`, `Pipeline` | `Results`, `Dashboard`, `PwaLaunchDashboard` lead counters |
| Launch | `LaunchControlCenter` (status) + `WebsiteQueue` (queue) | `LaunchStatusDashboard`, `PwaLaunchDashboard`, `MassLaunchConsole`, `NationalLaunch`, `MultiTemplateLauncher` |
| Templates | `TemplateStudio` (catalogue/edit) + `TemplateManager` | `UniversalTemplateStudio`, `VisualRenderLibrary` |
| GPT sync | `GptSyncConsole` | `GptTemplateSync`, `JsonGptSync`, `GptSyncPipeline` |
| Vaults | `SystemVault` | `ProviderVault`, `ApiKeyManager` |
| Architecture docs | one Architecture page | `DeepArchitecture`, `MetaArchitecture`, `InternalArchitecture`, `SystemBlueprint`, `SystemMap`, `Platform` |
| Dominance | `UniversalDominance` + `DominancePipeline` | `DigitalDominance`, `AutonomousDominance`, `DominanceSandbox`, `SeoDominance` |
| Vision | `VisionStudio` + `VisionCortexV2` | `ShadowVisionCortex`, `VisionStrategy`, `VisionIntelligence`, `ImageIngestion` |
| Inventory/audit | `SystemInventory` + `SystemAudit` | `SiteInventory`, `GapAnalysis`, `GapFiller`, `SystemHeal`, `SystemHealth` |
| Comms | `XtremeComms` + `TelnyxManager` | `VoiceAssistant`, `EdenSkye`, `Shadow` (keep Shadow if the covert channel is a real need) |

**Archive** (keep the file, remove it from menus and the route table; the collapsible "Archived Systems" pattern already exists):

- The 10 static shell pages, if their content lives in the docs: `Capabilities`, `Platform`, `SystemOperator`, `SystemMap`, `InternalArchitecture`, `DeepArchitecture`, `GoogleHappiness`, `BrandGuidelines`, `PipelineBuilder`, `GeneratorRegistry` — *keep `GeneratorRegistry` visible*: it is the authoritative generator inventory and the only page that says what is canonical.
- The 3 unrouted files: `Dashboard.jsx`, `GeneratorSandbox.jsx`, `LaunchEngineAdmin.jsx`. Confirm no runtime import first.

**Delete** (after the two confirmations below):

- The **15 unreferenced entities**, except `Referral` and `SubscriptionPlan`, which are candidates to *wire* rather than delete.
- The **23 no-caller functions** — **only after** a runtime trace confirms no dynamic call, and always excluding `payments-webhook`.
- The **dead duplicate route entries** (`/admin/dashboard` and `/admin/gpt-pipeline` both only `Navigate` away).

**Two confirmations required before any deletion:** (1) a runtime trace of the 23 functions; (2) a check of the stored records for the 15 entities, so real data is not dropped.

---

## 7. Not verified — what a live run must settle

1. The four reported blank screens. Static evidence says `GeneratorRegistry`, `StockStudio` and `DataExport` are wired and should render; the mechanism was not reproduced. Needs a browser check with the theme state known.
2. The remaining 31 workflow statuses (7 of 38 checked, all inactive). A full sweep is needed to know the true automation footprint.
3. The 3 `UNVERIFIED` pages (`DominancePipeline`, `DominanceSandbox`, `AutonomousWorkflows`) — their children were not inspected.
4. Whether the 23 no-caller functions are dynamically invoked.
5. Whether the 15 unreferenced entities hold records.
6. Per-page control-level behaviour: I verified wiring (does the page call the SDK), not that every button's payload is accepted by its function. Anything asserting "this button works" needs a click test.

---

## 8. Reproduce this audit

```bash
# page inventory + wiring per page
for f in src/pages/admin/*.jsx; do n=$(basename "$f"); l=$(wc -l < "$f"); \
  e=$(grep -c "base44\.entities\." "$f"); fn=$(grep -c "base44\.functions\.invoke" "$f"); \
  ph=$(grep -ciE "coming soon|under construction|not implemented|lorem ipsum" "$f"); \
  printf "%s|%s|e%s|f%s|p%s\n" "${n%.jsx}" "$l" "$e" "$fn" "$ph"; done

# function reach: who calls what
grep -rhoE "functions\.invoke\(\s*['\"][A-Za-z0-9_-]+" src | grep -oE "['\"][A-Za-z0-9_-]+$" | tr -d "'\"" | sort -u
grep -rhoE "function_name[\"']?\s*[:=]\s*[\"']?[A-Za-z0-9_-]+" base44/workflows api | grep -oE "[A-Za-z0-9_-]+$" | sort -u

# entity reach
grep -rhoE "entities\.[A-Z][A-Za-z0-9]+" src | sed 's/entities\.//' | sort -u

# menu coverage
grep -oE 'path="[a-z0-9/:._-]+"' src/App.jsx | sed 's/path="//;s/"//' | sort -u
```

Workflow states come from the platform run history (`get_workflow_run`), not from the repo — the `.jsonc` files carry the definition only.

---

## 9. Recommended next action

Do **not** start with the broad refactor. Start with a proof run on the four reported blank screens plus finding 1.3 (the contact form). Those are small, verifiable, and touch lead flow directly. If the audit's method cannot produce a working fix on a known breakage, its other conclusions should not be trusted with the rest of the app.

Order:

1. Proof run: reproduce the 4 blank screens, fix, confirm in the preview.
2. Fix `Contact.jsx` → `Lead`.
3. Fix the `Daily Site Validation` payload, then activate the 6 lead/validation workflows.
4. Add error + loading states to the 4 money-path admin pages.
5. Then open the consolidation work, one family per batch, behind the archive pattern.