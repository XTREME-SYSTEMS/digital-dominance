// ─────────────────────────────────────────────────────────────────────────────
// pipelinePromptLibrary — 1,258 professional prompts across 52 categories.
// Extracted from the Strategic Minds Prompt OS. GPT uses these to ensure
// highest quality output at every pipeline stage.
// ─────────────────────────────────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  { id: 1, name: 'Vision', functions: ['visionEngine'], category: 'C001', promptId: 'C001-P001' },
  { id: 2, name: 'Strategy', functions: ['visionEngine'], category: 'C002', promptId: 'C002-P001' },
  { id: 3, name: 'Research', functions: ['scanCompetitors'], category: 'C037', promptId: 'C037-P001' },
  { id: 4, name: 'Template', functions: ['rebrandStudio'], category: 'C011', promptId: 'C011-P002' },
  { id: 5, name: 'Brand', functions: ['rebrandStudio'], category: 'C009', promptId: 'C009-P001' },
  { id: 6, name: 'Build', functions: ['rebrandStudio', 'visualEditorBuild'], category: 'C010', promptId: 'C010-P020' },
  { id: 7, name: 'Social', functions: ['independentSocialGenerator'], category: 'C008', promptId: 'C008-P001' },
  { id: 8, name: 'Assets', functions: ['rebrandStudio'], category: 'C035', promptId: 'C035-P015' },
  { id: 9, name: 'Deploy', functions: ['vercelDeploy', 'godaddyApi'], category: 'C034', promptId: 'C034-P024' },
  { id: 10, name: 'Google Sync', functions: ['googleEcosystemSync'], category: 'C006', promptId: 'C006-P001' },
  { id: 11, name: 'Dominance', functions: ['universalDominanceEngine'], category: 'C031', promptId: 'C031-P024' },
  { id: 12, name: 'Validate', functions: ['autoComplete', 'closedLoopTester', 'postconditionValidator'], category: 'C023', promptId: 'C023-P019' },
];

export const PROMPT_CATEGORIES = [
  { id: 'C001', name: 'Executive Strategy', count: 24 },
  { id: 'C002', name: 'Business Model & Commercialization', count: 24 },
  { id: 'C003', name: 'AI Consulting', count: 24 },
  { id: 'C004', name: 'Sales & CRM', count: 24 },
  { id: 'C005', name: 'Marketing Strategy', count: 24 },
  { id: 'C006', name: 'SEO / AEO / GEO', count: 24 },
  { id: 'C007', name: 'Content', count: 24 },
  { id: 'C008', name: 'Social Media', count: 24 },
  { id: 'C009', name: 'Brand & Positioning', count: 24 },
  { id: 'C010', name: 'Frontend / UX', count: 24 },
  { id: 'C011', name: 'Websites & Landing Pages', count: 24 },
  { id: 'C012', name: 'Product Management', count: 24 },
  { id: 'C013', name: 'SaaS', count: 24 },
  { id: 'C014', name: 'AI Agents', count: 24 },
  { id: 'C015', name: 'Knowledge & RAG', count: 24 },
  { id: 'C016', name: 'Automation & Workflows', count: 24 },
  { id: 'C017', name: 'Integrations & Connectors', count: 24 },
  { id: 'C018', name: 'Data & Analytics', count: 24 },
  { id: 'C019', name: 'Database & Data Architecture', count: 24 },
  { id: 'C020', name: 'Software Architecture', count: 24 },
  { id: 'C021', name: 'DevOps & Infrastructure', count: 24 },
  { id: 'C022', name: 'Security', count: 24 },
  { id: 'C023', name: 'QA & Validation', count: 24 },
  { id: 'C024', name: 'Customer Success', count: 24 },
  { id: 'C025', name: 'Customer Support', count: 24 },
  { id: 'C026', name: 'Operations', count: 24 },
  { id: 'C027', name: 'Project Management', count: 24 },
  { id: 'C028', name: 'Business Finance', count: 24 },
  { id: 'C029', name: 'Ecommerce', count: 24 },
  { id: 'C030', name: 'Marketplace', count: 24 },
  { id: 'C031', name: 'Local Services', count: 24 },
  { id: 'C032', name: 'Construction & Field Service', count: 24 },
  { id: 'C033', name: 'Real Estate & Property Intelligence', count: 24 },
  { id: 'C034', name: 'Provisioning', count: 24 },
  { id: 'C035', name: 'Commercialization', count: 24 },
  { id: 'C036', name: 'Research & Intelligence', count: 24 },
  { id: 'C037', name: 'Competitive Intelligence', count: 24 },
  { id: 'C038', name: 'Email & Lifecycle', count: 24 },
  { id: 'C039', name: 'Meetings & Communication', count: 24 },
  { id: 'C040', name: 'People Operations', count: 24 },
  { id: 'C041', name: 'Legal / Compliance Support', count: 24 },
  { id: 'C042', name: 'Privacy & Governance', count: 24 },
  { id: 'C043', name: 'Mobile / PWA', count: 24 },
  { id: 'C044', name: 'Search & Discovery', count: 24 },
  { id: 'C045', name: 'Communications Systems', count: 24 },
  { id: 'C046', name: 'Observability & SRE', count: 24 },
  { id: 'C047', name: 'Backup & Disaster Recovery', count: 24 },
  { id: 'C048', name: 'Migration & Convergence', count: 24 },
  { id: 'C049', name: 'Client Delivery', count: 24 },
  { id: 'C050', name: 'White Label & Replication', count: 24 },
  { id: 'C051', name: 'Prompt Engineering', count: 24 },
  { id: 'C052', name: 'Executive Assistant / Chief of Staff', count: 24 },
  { id: 'SMI', name: 'Strategic Minds Internal', count: 10 },
];

// Key prompt templates — one per pipeline stage, following the Prompt OS pattern.
// Variables: {{COMPANY}}, {{INDUSTRY}}, {{OBJECTIVE}}, {{CONTEXT}}, {{SOURCE_TRUTH}}, {{AUDIENCE}}, {{CONSTRAINTS}}
export const KEY_PROMPTS: Record<string, string> = {
  vision: `Act as a chief strategy officer. Produce a **90-Day Executive Priority Map** for **{{COMPANY}}** in the **{{INDUSTRY}}** context.
PRIMARY OBJECTIVE: {{OBJECTIVE}}
AVAILABLE CONTEXT: {{CONTEXT}}
SOURCE TRUTH / EVIDENCE: {{SOURCE_TRUTH}}
AUDIENCE: {{AUDIENCE}}
CONSTRAINTS: {{CONSTRAINTS}}
OPERATING RULES:
1. Separate VERIFIED facts, INFERRED conclusions, and UNVERIFIED information.
2. Do not ask for information already present in the supplied context.
3. Prefer specific decisions, workflows, examples, and acceptance criteria over generic advice.
4. Preserve existing approved work unless evidence shows it should change.
5. Use only facts supplied or verified. Mark unknowns explicitly; do not invent.
6. Separate READ/DRAFT actions from approval-gated production actions.
7. Make the result reusable: clear sections, named artifacts, owners, dependencies, next actions.
REQUIRED OUTPUT: Executive Summary, Current State, Key Decisions, Options, Recommendation Criteria, Risks, 30/60/90-Day Actions, Metrics.
QUALITY CHECK: Verify the response accomplishes the requested map, contains no unsupported claims, exposes blockers, and ends with the exact next action.`,

  strategy: `Act as a business model architect. Produce a **Business Model Canvas** for **{{COMPANY}}** in **{{INDUSTRY}}**.
PRIMARY OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
CONSTRAINTS: {{CONSTRAINTS}}
OPERATING RULES: Same as vision prompt.
REQUIRED OUTPUT: Value Propositions, Customer Segments, Channels, Revenue Streams, Cost Structure, Key Activities, Key Resources, Key Partnerships, Competitive Advantage.
QUALITY CHECK: Verify the canvas is specific, actionable, and ends with the next step.`,

  research: `Act as a competitive intelligence analyst. Produce a **Competitor Landscape** for **{{COMPANY}}** in **{{INDUSTRY}}**.
OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
REQUIRED OUTPUT: Top 5 Competitors (name, URL, strengths, weaknesses, pricing, positioning), Feature Comparison Matrix, Pricing Comparison, Market White Space, Differentiation Strategy, Battlecard.
QUALITY CHECK: Every claim must be sourced. No invented metrics. End with the next action.`,

  template: `Act as a website architect. Produce a **Service Website Blueprint** for **{{COMPANY}}** in **{{INDUSTRY}}**.
OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
REQUIRED OUTPUT: Site Architecture (pages, hierarchy), Homepage Layout, Service Pages, Location Pages, Lead Capture Funnel, Mobile PWA Plan, SEO Structure, Schema Markup Plan, Core Web Vitals Target.
QUALITY CHECK: Blueprint must meet Google standards, be mobile-first, and end with the next action.`,

  brand: `Act as a brand strategist. Produce a **Brand Positioning** for **{{COMPANY}}** in **{{INDUSTRY}}**.
OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
REQUIRED OUTPUT: Brand Archetype, Brand Promise, Brand Story, Naming Options (10), Tagline Options (10), Messaging Hierarchy, Voice and Tone, Visual Direction (colors, typography, imagery style), Logo Direction.
QUALITY CHECK: Brand must be memorable, viral-capable, Google-searchable, and end with the next action.`,

  website: `Act as a frontend architect. Produce a **Design Token Specification** and **Component Inventory** for **{{COMPANY}}** in **{{INDUSTRY}}**.
OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
REQUIRED OUTPUT: Design Tokens (colors, typography, spacing, radius, shadows), Component Inventory (buttons, cards, forms, navigation, hero, sections), Responsive Breakpoints, Accessibility Audit (WCAG 2.1), Interaction State Matrix, Visual QA Checklist.
QUALITY CHECK: Must follow top 20 AI/human developer preferred styles, be production-ready, and end with the next action.`,

  social: `Act as a social media strategist. Produce a **30-Day Social Calendar** for **{{COMPANY}}** in **{{INDUSTRY}}**.
OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
REQUIRED OUTPUT: 30-Day Content Calendar (platform, post type, content, hashtags, best post time), 30 Video Scripts (15-60 sec, hook, body, CTA), Image Post Concepts, Hashtag Strategy, YouTube Tagging Strategy, Engagement Plan.
QUALITY CHECK: Calendar must be production-ready, videos must be viral-optimized, and end with the next action.`,

  assets: `Act as a brand designer. Produce a **Digital Asset Pack** for **{{COMPANY}}** in **{{INDUSTRY}}**.
OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
REQUIRED OUTPUT: Digital Business Card Design, Digital Brochure Layout, Logo Variations (primary, secondary, icon, monochrome), Social Media Kit (profile pics, covers, story templates), Email Signature, Document Templates (letterhead, invoice, proposal).
QUALITY CHECK: All assets must be brand-consistent, production-ready, and end with the next action.`,

  provision: `Act as a DevOps engineer. Produce a **Provisioning Receipt** for **{{COMPANY}}** deployment.
OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
REQUIRED OUTPUT: Vercel Deployment (URL, project ID, status), Supabase Project (URL, ref, status), GitHub Repo (URL, status), Railway Worker (URL, status), Domain (registrar, DNS, SSL status), Google Analytics (property ID, status), Search Console (property, verification status).
QUALITY CHECK: Every service must be confirmed live. No claimed success without a URL or receipt. End with the next action.`,

  google: `Act as an SEO architect. Produce a **Technical SEO Audit** for **{{COMPANY}}** in **{{INDUSTRY}}**.
OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
REQUIRED OUTPUT: Technical SEO Audit (indexability, canonicals, schema, sitemap, robots), Core Web Vitals (LCP, FID, CLS), Local SEO Plan (Google Business Profile, citations, NAP), AEO Readiness (FAQ schema, entity authority), GEO Content Strategy, Backlink Opportunity Map.
QUALITY CHECK: Must meet Google standards. Every issue must have a fix. End with the next action.`,

  dominance: `Act as a programmatic SEO strategist. Produce a **Local Growth Playbook** for **{{COMPANY}}** in **{{INDUSTRY}}**.
OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
REQUIRED OUTPUT: Programmatic SEO Blueprint (template page, data source, URL structure, scaling plan), City/Location Page Strategy, Citation Building Plan, Local Competitor Audit, Local Reputation Strategy, Neighborhood Campaign Plan, Local KPI Dashboard.
QUALITY CHECK: Must be scalable to unlimited cities. Every page must meet Google standards. End with the next action.`,

  validate: `Act as a QA validator. Produce a **Release Validation Receipt** for **{{COMPANY}}** deployment.
OBJECTIVE: {{OBJECTIVE}}
CONTEXT: {{CONTEXT}}
REQUIRED OUTPUT: Frontend Validation (visual parity, responsive, accessibility, performance), Backend Validation (API health, database, auth, RLS), SEO Validation (schema, sitemap, indexing, Core Web Vitals), Security Validation (headers, secrets, RLS), 3x Pass Confirmation (pass 1, pass 2, pass 3 — each 100%).
QUALITY CHECK: Validator must independently verify — builders do not self-certify. All 3 passes must be 100%. End with the next action.`,
};

// Function-to-stage mapping for progress tracking
export const FUNCTION_STAGE_MAP: Record<string, number[]> = {
  visionEngine: [1, 2],
  scanCompetitors: [3],
  tradeCrystalBall: [3],
  rebrandStudio: [4, 5, 6, 8],
  visualEditorBuild: [6],
  siteDirectEditor: [6],
  independentSocialGenerator: [7],
  socialStudio: [7],
  vercelDeploy: [9],
  godaddyApi: [9],
  githubSync: [9],
  supabaseMigrationDeploy: [9],
  googleEcosystemSync: [10],
  googleAnalytics: [10],
  pullSearchConsoleData: [10],
  addSearchConsoleProperty: [10],
  universalDominanceEngine: [11],
  digitalDominanceCompiler: [11],
  dominanceEngine: [11],
  autoComplete: [12],
  closedLoopTester: [12],
  postconditionValidator: [12],
  siteHealthChecker: [12],
  independentEmail: [12],
  xtremeComms: [12],
};

// Checklist items mapped to functions
export const CHECKLIST_ITEMS = [
  { id: 'strategy', label: 'Business strategy defined', functions: ['visionEngine'] },
  { id: 'research', label: 'Competitor research complete', functions: ['scanCompetitors'] },
  { id: 'brand', label: 'Brand pack (logo, colors, fonts, tagline)', functions: ['rebrandStudio'] },
  { id: 'website', label: 'Website built (desktop + mobile PWA)', functions: ['visualEditorBuild', 'rebrandStudio'] },
  { id: 'social', label: '30-day social calendar + 30 videos', functions: ['independentSocialGenerator'] },
  { id: 'assets', label: 'Digital cards, brochures, logos', functions: ['rebrandStudio'] },
  { id: 'deploy', label: 'Deployed to Vercel', functions: ['vercelDeploy'] },
  { id: 'domain', label: 'Domain purchased & DNS configured', functions: ['godaddyApi'] },
  { id: 'google', label: 'Google Analytics + Search Console synced', functions: ['googleEcosystemSync'] },
  { id: 'dominance', label: 'Programmatic dominance launched', functions: ['universalDominanceEngine'] },
  { id: 'validate1', label: 'Validation pass 1 (100%)', functions: ['autoComplete'] },
  { id: 'validate2', label: 'Validation pass 2 (100%)', functions: ['closedLoopTester'] },
  { id: 'validate3', label: 'Validation pass 3 (100%)', functions: ['postconditionValidator'] },
  { id: 'email', label: 'Email sent to Jeremy with Vercel URL', functions: ['independentEmail', 'xtremeComms'] },
];