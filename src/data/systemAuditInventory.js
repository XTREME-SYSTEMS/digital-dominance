// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM AUDIT INVENTORY — Complete catalog of every component in the system.
// This data file is the single source of truth for the System Audit page.
// ═══════════════════════════════════════════════════════════════════════════════

// ── ENTITY CATEGORIES ──────────────────────────────────────────────────────────
export const ENTITY_CATEGORIES = {
  'Core Business': ['Lead', 'LeadSource', 'ClientProject', 'ClientPackage', 'ClientPortalConfig', 'Appointment', 'Referral', 'SubscriptionPlan', 'PromoCode', 'MarketplaceListing', 'ContractorRecord', 'ContractorArchetype', 'SkipTrace', 'PropertyLookup', 'Rating', 'QuestionnaireResponse', 'MaintenancePlan', 'ProjectUpdate', 'Base44Purchase'],
  'SEO & Content': ['SeoContent', 'GeneratedPage', 'DynamicPage', 'ProgrammaticSeoJob', 'ContentCalendarItem', 'BacklinkOpportunity', 'CitationListing', 'StrategyDocument', 'IngestedWebsite', 'VerifiedBusinessFacts', 'SeoSimulation'],
  'AI & Agents': ['AgentPersona', 'AgentMemory', 'AgentAction', 'AgentAssignment', 'AgentDepartment', 'AgentTemplate', 'AgentVersion', 'AgentExecutionLog', 'AgentIntelligence', 'SwarmTask', 'SwarmMessage', 'SwarmAudit', 'Conversation', 'ConversationMessage', 'ChatMessage', 'VisionMessage', 'VisionConversation', 'CodeSandboxSession', 'CodeBlock', 'MetaSession', 'OperatorIntent', 'WorkPacket', 'AiVoiceSession', 'Comment'],
  'Infrastructure': ['SystemManifest', 'DeploymentRecord', 'BuildManifest', 'AppBuild', 'BuildSession', 'SystemLibraryEntry', 'BuilderLibrary', 'ToolRegistry', 'Tool', 'ApiKey', 'VaultEntry', 'ControlLease', 'UserWorkspace', 'UserLLMConnection', 'CryptoToken', 'CommandRun', 'WebsiteQueue', 'WebsiteBuildPlan'],
  'Marketing & Social': ['SocialPost', 'SocialSchedule', 'ContentCalendarItem', 'LaunchCampaign', 'DominanceCampaign', 'DominanceGoal', 'EmailLog'],
  'Analytics & Intelligence': ['AnalyticsSnapshot', 'FunnelEvent', 'ABTest', 'PredictionResult', 'PredictionModel', 'IntelligenceReport', 'Investigation', 'CompetitorInsight', 'DiscoveryJob', 'Opportunity', 'OpportunityEvidence', 'SimulatedVisitor'],
  'Audit & Governance': ['AlphaPrimeAuditLedger', 'AlphaPrimeHeartbeat', 'AlphaPrimeReflectionLedger', 'StrategicReflectionRecord', 'SelfReflectionCycle', 'EvidenceReceipt', 'ValidationReceipt', 'PackValidationRun', 'SiteValidationReceipt', 'SystemHealthAudit', 'AuditSystemIntegrityScore', 'BenchmarkDefinition', 'BenchmarkCandidate', 'BenchmarkResult', 'BenchmarkCompany', 'BrokenTwin', 'ConvergenceCycle', 'FailurePattern', 'FleetHeartbeat', 'FleetSystem', 'ProgressLedger', 'ApprovalRequest', 'RegressionTest', 'TestRun', 'RepairJob', 'RefactorJob', 'OptimizationGap', 'SopLog', 'Sop'],
  'Domain Strategy': ['DomainStrategy', 'CanonicalSiteRegistry', 'CanonicalLocationRegistry'],
  'Templates & Packs': ['UniversalIndustryTemplate', 'TemplateDesign', 'WebsiteTemplate', 'TemplateLibrary', 'BrandTemplate', 'WorkflowTemplate', 'PackGenerationBundle', 'PackArtifact', 'PackResearchDossier', 'PackSyncReceipt'],
  'System Config': ['AppSettings', 'SystemMode', 'ContentMenuCategory', 'ContentMenuItem', 'AdminProfile', 'VoiceAssistant'],
};

// ── FUNCTION CATEGORIES ────────────────────────────────────────────────────────
export const FUNCTION_CATEGORIES = {
  'AI / LLM': ['vercelAiGateway', 'independentAi', 'llmRouter', 'visionCortexRouter', 'visionEngine', 'aiAssist', 'metaAgent', 'intentRouter', 'memoryRouter', 'ragPipeline'],
  'SEO & Search': ['autonomousSeoDominance', 'seoGenerator', 'optimizeSeo', 'generateSeoPage', 'generateSitemap', 'seoAeoSimulator', 'seoSimSync', 'submitToIndexers', 'pingIndexNow', 'fillContentGaps', 'notifySeoUpdates', 'addSearchConsoleProperty', 'verifySearchConsole', 'pullSearchConsoleData', 'checkGoogleStatus', 'googleEcosystemSync'],
  'Lead Management': ['dailyLeadEngine', 'enrichLead', 'skipTrace', 'bookEstimate', 'pushLeadToHubspot', 'syncLeadToSheet', 'sendEstimateEmail', 'sendFollowUpEmail', 'sendReviewRequest', 'propertyLookup'],
  'Communication': ['xtremeComms', 'independentEmail', 'telnyxManager', 'telnyxAutonomousSetup', 'voiceAssistant', 'conversationHub'],
  'Infrastructure & Deploy': ['vercelDeploy', 'vercelManager', 'supabaseUpload', 'supabaseMigrationDeploy', 'supabaseConcurrencyTest', 'githubSync', 'googleWorkspaceSync', 'googleWorkspaceOS', 'siteDirectEditor', 'visualEditorBuild', 'rebrandStudio', 'rebrandGenerator'],
  'Agents & Swarm': ['agentRunner', 'agentRouter', 'agentBuilderEngine', 'swarmOrchestrator', 'systemOrchestrator', 'companyOrchestrator', 'metaArchitecture', 'universalDominanceEngine', 'dominanceEngine', 'digitalDominanceCompiler', 'fleetAlphaPrime', 'syncFleetSystemState', 'syncWorkflowToSwarm', 'syntheticWorker'],
  'Analytics & Intelligence': ['googleAnalytics', 'fetchCoreWebVitals', 'predictionEngine', 'tradeCrystalBall', 'abTestEngine', 'calculateDistanceTo100', 'topSitesBenchmarkScanner', 'companyIntel', 'intelligenceSync', 'opportunityIntelligenceEngine', 'scanCompetitors', 'planOpportunityWebsiteV3'],
  'Audit & Governance': ['alphaPrimeAudit', 'alphaPrimeHeartbeat', 'alphaPrimeOptimizationCycle', 'alphaPrimeRepairFactory', 'alphaPrimeBenchmarkGenerator', 'systemAuditor', 'regressionTestSuite', 'closedLoopTester', 'postconditionValidator', 'runtimeAcceptanceMission', 'phase9Proof', 'recursiveHealingEngine', 'selfReflectionEngine', 'convergenceEngine', 'canonicalizeRepairBacklog', 'checkQuestionnaireCompliance', 'siteHealthChecker', 'validateWebsiteBuildPlanV3'],
  'Social & Content': ['socialStudio', 'generateRss', 'syncContentCalendar', 'gapFillerEngine', 'builderLibrarySeeder', 'massIngestionEngine', 'packResearchOrchestrator', 'packSync', 'xpsSiteIngestor', 'xtremeUniversalGeneratorBridge', 'strategicMindsSetup'],
  'Domain & Payments': ['domainGoldRush', 'godaddyApi', 'create-checkout', 'payments-webhook'],
  'Security & Crypto': ['apiKeyManager', 'cryptoCreator'],
  'Autonomous Systems': ['autoComplete', 'autonomousCodingEngine', 'autonomousRefactorEngine', 'autonomousSprint', 'runContractorSimulation', 'syncContractorWorkflow', 'graphEngine', 'railwayScraper'],
};

// ── AGENTS ─────────────────────────────────────────────────────────────────────
export const AGENTS = [
  { name: 'alpha_prime_orchestrator', role: 'CEO/Orchestrator', status: 'active' },
  { name: 'system_operator', role: 'System Operations', status: 'active' },
  { name: 'shadow', role: 'Covert Operations', status: 'active' },
  { name: 'lead_orchestrator', role: 'Lead Management', status: 'active' },
  { name: 'seo_manager', role: 'SEO Strategy', status: 'active' },
  { name: 'social_manager', role: 'Social Media', status: 'active' },
  { name: 'comms_manager', role: 'Communications', status: 'active' },
  { name: 'reputation_manager', role: 'Reputation/Reviews', status: 'active' },
  { name: 'swarm_orchestrator', role: 'Agent Swarm', status: 'active' },
  { name: 'site_factory_manager', role: 'Site Building', status: 'active' },
];

// ── WORKFLOWS ──────────────────────────────────────────────────────────────────
export const WORKFLOWS = [
  'Alpha Prime Heartbeat', 'Alpha Prime Completion Sprint', 'Autonomous AutoComplete',
  'Autonomous Coding Pipeline', 'Autonomous Dominance 24-7 Cycle', 'Autonomous Refactor Cycle',
  'Autonomous SEO Dominance', 'Autonomous Skip Trace', 'Autonomous Sprint Supervisor',
  'Competitor Scanner', 'Daily Lead Engine', 'Fleet Alpha Prime Heartbeat',
  'Immediate Lead Follow-Up', 'Lead Follow-Up', 'Questionnaire Enforcement',
  'Recursive Production Readiness Engine', 'Review Request', 'SEO Optimizer',
  'SEO Update Notifier', 'Sitemap Auto-Update', 'Social Media Autopilot',
  'Swarm Autopilot', 'Weekly Opportunity Scanner', 'X1 Autonomous Company Cycle',
  'XTREME Digital Dominance Compiler', 'XTREME Universal Generator Sync Supervisor',
];

// ── CONNECTORS ──────────────────────────────────────────────────────────────────
export const CONNECTORS_AUTHORIZED = ['supabase', 'google_search_console', 'google_analytics', 'googlecalendar', 'googlemeet', 'googleforms', 'google_contacts', 'google_photos', 'gmail', 'github', 'googledrive', 'googlesheets', 'googledocs', 'googletasks', 'hubspot'];

export const CONNECTORS_REGISTERED = [
  'gmail', 'github', 'googlecalendar', 'supabase', 'googledocs', 'hubspot',
  'googletasks', 'googlesheets', 'googledrive',
];

export const CONNECTORS_AVAILABLE = [
  { name: 'Google Calendar', type: 'googlecalendar', authorized: true },
  { name: 'Google Search Console', type: 'google_search_console', authorized: true },
  { name: 'Google Analytics', type: 'google_analytics', authorized: true },
  { name: 'Supabase', type: 'supabase', authorized: true },
  { name: 'Gmail', type: 'gmail', authorized: true },
  { name: 'GitHub API', type: 'github', authorized: true },
  { name: 'Google Drive', type: 'googledrive', authorized: true },
  { name: 'Google Sheets', type: 'googlesheets', authorized: true },
  { name: 'Google Docs', type: 'googledocs', authorized: true },
  { name: 'Google Tasks', type: 'googletasks', authorized: true },
  { name: 'HubSpot', type: 'hubspot', authorized: true },
  { name: 'Google Classroom', type: 'google_classroom', authorized: false },
  { name: 'Google BigQuery', type: 'googlebigquery', authorized: false },
  { name: 'Google Meet', type: 'googlemeet', authorized: false },
  { name: 'Google Forms', type: 'googleforms', authorized: false },
  { name: 'Google Contacts', type: 'google_contacts', authorized: false },
  { name: 'Google Photos', type: 'google_photos', authorized: false },
  { name: 'Google Workspace', type: 'googleworkspace', authorized: false },
  { name: 'Slack User', type: 'slack', authorized: false },
  { name: 'Slack Bot', type: 'slackbot', authorized: false },
  { name: 'Notion', type: 'notion', authorized: false },
  { name: 'Salesforce', type: 'salesforce', authorized: false },
  { name: 'LinkedIn', type: 'linkedin', authorized: false },
  { name: 'TikTok', type: 'tiktok', authorized: false },
  { name: 'Instagram Business', type: 'instagram', authorized: false },
  { name: 'Discord', type: 'discord', authorized: false },
  { name: 'Wix', type: 'wix', authorized: false },
  { name: 'GitLab', type: 'gitlab', authorized: false },
  { name: 'ClickUp', type: 'clickup', authorized: false },
  { name: 'Asana', type: 'asana', authorized: false },
  { name: 'Jira', type: 'jira', authorized: false },
  { name: 'Linear', type: 'linear', authorized: false },
  { name: 'Airtable', type: 'airtable', authorized: false },
  { name: 'Microsoft Teams', type: 'microsoft_teams', authorized: false },
  { name: 'Outlook', type: 'outlook', authorized: false },
  { name: 'OneDrive', type: 'one_drive', authorized: false },
  { name: 'SharePoint', type: 'share_point', authorized: false },
  { name: 'Box', type: 'box', authorized: false },
  { name: 'Dropbox', type: 'dropbox', authorized: false },
  { name: 'Calendly', type: 'calendly', authorized: false },
  { name: 'Typeform', type: 'typeform', authorized: false },
  { name: 'Snowflake', type: 'snowflake', authorized: false },
  { name: 'Databricks', type: 'databricks', authorized: false },
  { name: 'QuickBooks', type: 'quickbooks', authorized: false },
  { name: 'Square', type: 'square', authorized: false },
  { name: 'Mailchimp', type: 'mailchimp', authorized: false },
  { name: 'Klaviyo', type: 'klaviyo', authorized: false },
  { name: 'Meta Ads', type: 'meta_ads', authorized: false },
  { name: 'Facebook Pages', type: 'facebook_pages', authorized: false },
  { name: 'X (Twitter)', type: 'x', authorized: false },
  { name: 'YouTube', type: 'youtube', authorized: false },
  { name: 'Twitch', type: 'twitch', authorized: false },
  { name: 'WordPress.com', type: 'wordpress_com', authorized: false },
  { name: 'Contentful', type: 'contentful', authorized: false },
  { name: 'Confluence', type: 'confluence', authorized: false },
  { name: 'Bitbucket', type: 'bitbucket', authorized: false },
  { name: 'Datadog', type: 'datadog', authorized: false },
  { name: 'Sentry', type: 'sentry', authorized: false },
  { name: 'PostHog', type: 'posthog', authorized: false },
  { name: 'PagerDuty', type: 'pagerduty', authorized: false },
  { name: 'Intercom', type: 'intercom', authorized: false },
  { name: 'Gorgias', type: 'gorgias', authorized: false },
  { name: 'FreshBooks', type: 'freshbooks', authorized: false },
  { name: 'Wave', type: 'wave', authorized: false },
  { name: 'Moneybird', type: 'moneybird', authorized: false },
  { name: 'Shippo', type: 'shippo', authorized: false },
  { name: 'Eventbrite', type: 'eventbrite', authorized: false },
  { name: 'Docusign', type: 'docusign', authorized: false },
  { name: 'Todoist', type: 'todoist', authorized: false },
  { name: 'Basecamp', type: 'basecamp', authorized: false },
  { name: 'Attio', type: 'attio', authorized: false },
  { name: 'Wrike', type: 'wrike', authorized: false },
  { name: 'BambooHR', type: 'bamboohr', authorized: false },
  { name: 'Harvest', type: 'harvest', authorized: false },
  { name: 'Gumroad', type: 'gumroad', authorized: false },
  { name: 'Polar', type: 'polar', authorized: false },
  { name: 'Splitwise', type: 'splitwise', authorized: false },
  { name: 'Hugging Face', type: 'hugging_face', authorized: false },
  { name: 'Miro', type: 'miro', authorized: false },
  { name: 'Microsoft Graph', type: 'microsoft_graph', authorized: false },
  { name: 'Microsoft Excel', type: 'excel', authorized: false },
  { name: 'Microsoft Word', type: 'microsoft_word', authorized: false },
  { name: 'Microsoft PowerPoint', type: 'microsoft_powerpoint', authorized: false },
  { name: 'Microsoft OneNote', type: 'one_note', authorized: false },
  { name: 'Zoho CRM', type: 'zohocrm', authorized: false },
  { name: 'Omnisend', type: 'omnisend', authorized: false },
  { name: 'Mailchimp', type: 'mailchimp', authorized: false },
];

// ── PAGES (from App.jsx routes) ─────────────────────────────────────────────────
export const PAGE_CATEGORIES = {
  'Public/Funnel': [
    '/', '/estimate', '/funnel', '/results/:id', '/book/:id', '/booked/:id',
    '/color-charts', '/locations', '/how-it-works', '/gallery', '/reviews',
    '/about', '/contact', '/guides', '/app-onboarding', '/elite', '/download',
    '/ThankYou', '/questionnaire', '/epoxy-systems', '/xps-funnel',
    '/fl/pompano-beach', '/epoxy-garage-floor-cost', '/2-car-garage-epoxy-cost',
    '/3-car-garage-epoxy-cost', '/garage-floor-coating-cost',
  ],
  'Admin Dashboard': [
    '/admin', '/admin/dashboard', '/admin/contents', '/admin/capabilities',
    '/admin/gap-filler', '/admin/concept-to-completion', '/admin/opportunity-intelligence',
    '/admin/google-workspace-os', '/admin/internal-architecture', '/admin/google-command-center',
  ],
  'Admin AI & Agents': [
    '/admin/alpha-prime', '/admin/fleet', '/admin/vision-cortex', '/admin/shadow',
    '/admin/system-map', '/admin/contractor-workflow', '/admin/workflow-findings',
    '/admin/contractor-simulation', '/admin/workflows', '/admin/playbooks',
    '/admin/agent-builder', '/admin/agent-master', '/admin/vision-studio', '/admin/vision-strategy',
    '/admin/intelligence', '/admin/meta-agent', '/admin/convergence', '/admin/swarm',
    '/admin/meta-architecture', '/admin/vision-cortex-v2',
  ],
  'Admin SEO & Content': [
    '/admin/leads', '/admin/leads/:id', '/admin/pipeline', '/admin/emails', '/admin/reviews',
    '/admin/competitors', '/admin/google', '/admin/seo-dominance', '/admin/factory',
    '/admin/sop', '/admin/seo-generator', '/admin/seo-simulator', '/admin/domain-rush',
    '/admin/url-strategy', '/admin/national-launch',
  ],
  'Admin Infrastructure': [
    '/admin/tools', '/admin/tool-hub', '/admin/website-factory', '/admin/templates',
    '/admin/app-factory', '/admin/xtreme-comms', '/admin/telnyx', '/admin/lead-scraper',
    '/admin/skip-trace', '/admin/autocomplete', '/admin/results', '/admin/command-center',
    '/admin/client-packages', '/admin/api-keys', '/admin/vault', '/admin/provider-vault',
    '/admin/social-studio', '/admin/rebrand-studio', '/admin/location-performance',
    '/admin/blueprint', '/admin/architecture', '/admin/operator', '/admin/code-studio',
    '/admin/digital-dominance', '/admin/universal-dominance', '/admin/autonomous-dominance',
    '/admin/autonomous-refactor', '/admin/empire', '/admin/x1-company',
    '/admin/site-health', '/admin/voice-assistant', '/admin/analytics', '/admin/queue',
    '/admin/rag', '/admin/graph', '/admin/system-health', '/admin/platform',
    '/admin/crystal-ball', '/admin/site-builder', '/admin/domination-sandbox',
    '/admin/builder-library', '/admin/pipeline-builder', '/admin/master-pipeline',
    '/admin/ab-testing', '/admin/independence', '/admin/template-studio',
    '/admin/system-library', '/admin/pack-sync', '/admin/pack-research', '/admin/settings',
  ],
  'Auth': ['/login', '/register', '/forgot-password', '/reset-password', '/oauth/consent'],
  'Portal/App': ['/portal', '/conversations', '/connect', '/acquire', '/contractor', '/contractor/bid', '/visual-editor', '/visualizer-test', '/app-settings', '/tool-hub'],
  'SMAI': ['/smai', '/smai/services', '/smai/about', '/smai/case-studies', '/smai/contact', '/smai/icons', '/smai/portal', '/smai/admin-portal'],
  'Dynamic': ['/:state/:citySlug', '/:slug', '/p/:slug'],
};

// ── SECRETS ────────────────────────────────────────────────────────────────────
export const SECRET_CATEGORIES = {
  'AI Providers': [
    { name: 'VERCEL_AI_GATEWAY_API_KEY', purpose: 'Primary AI route (all LLM/image/speech)', critical: true },
    { name: 'GROQ_API_KEY', purpose: 'Free-tier LLM backup', critical: false },
    { name: 'GOOGLE_AI_API_KEY', purpose: 'Free-tier LLM backup', critical: false },
    { name: 'OPENROUTER_API_KEY', purpose: 'Free-tier LLM backup', critical: false },
  ],
  'Communications': [
    { name: 'XTREME_COMMUNICATION_API_KEY', purpose: 'Email/SMS gateway', critical: true },
    { name: 'TELNYX_API_KEY', purpose: 'SMS/Voice direct', critical: true },
  ],
  'Database & Storage': [
    { name: 'SMAI_SUPABASE_URL', purpose: 'SMAI portal Supabase', critical: true },
    { name: 'SMAI_SUPABASE_ANON_KEY', purpose: 'SMAI portal anon key', critical: true },
    { name: 'SMAI_SUPABASE_SERVICE_ROLE_KEY', purpose: 'SMAI service role', critical: true },
    { name: 'SMAI_SUPABASE_STAGING_URL', purpose: 'Staging Supabase', critical: false },
    { name: 'SMAI_SUPABASE_STAGING_ANON_KEY', purpose: 'Staging anon key', critical: false },
    { name: 'SUPABASE_URL', purpose: 'Main Supabase', critical: false },
  ],
  'Deployment & Code': [
    { name: 'VERCEL_API_TOKEN', purpose: 'Vercel deployment', critical: true },
    { name: 'VERCEL_TEAM', purpose: 'Vercel team', critical: true },
    { name: 'GITHUB_TOKEN', purpose: 'GitHub API access', critical: true },
    { name: 'GITHUB_REPO', purpose: 'GitHub repo name', critical: true },
    { name: 'GITHUB_ORG', purpose: 'GitHub org', critical: false },
    { name: 'GITHUB_CLIENT_ID', purpose: 'GitHub OAuth client', critical: false },
    { name: 'GITHUB_APP_ID', purpose: 'GitHub App ID', critical: false },
    { name: 'RAILWAY_PROJECT_ID', purpose: 'Railway workers', critical: false },
  ],
  'Browser & Scraping': [
    { name: 'CLOUD_BROWSER_ENGINE_URL', purpose: 'Cloud browser engine', critical: true },
    { name: 'BROWSERBASE_API_KEY', purpose: 'Browserbase scraping', critical: false },
    { name: 'ENGINE_API_KEY', purpose: 'Engine API auth', critical: false },
  ],
  'Domain & SEO': [
    { name: 'GODADDY_API_KEY', purpose: 'Domain purchasing', critical: true },
    { name: 'SEOGENERATOR_API_KEY', purpose: 'SEO generator service', critical: false },
  ],
  'Google': [
    { name: 'GOOGLE_CREDENTIALS_JSON', purpose: 'Google service account', critical: true },
    { name: 'GOOGLE_CLIENT_ID', purpose: 'Google OAuth client', critical: false },
    { name: 'GOOGLE_CLIENT_SECRET', purpose: 'Google OAuth secret', critical: false },
    { name: 'VISION_CORTEX_EMAIL', purpose: 'Vision cortex email', critical: false },
    { name: 'NEARME_DRIVE_FOLDER_ID', purpose: 'Drive folder for near-me sites', critical: false },
  ],
  'Data APIs': [
    { name: 'BLS_API_KEY', purpose: 'Bureau of Labor Statistics', critical: false },
    { name: 'RENTCAST_API_KEY', purpose: 'Property data', critical: false },
  ],
  'Payments (Wix/Base44)': [
    { name: 'WIX_CHECKOUT_APP_URL', purpose: 'Checkout return URL', critical: true },
    { name: 'WIX_CHECKOUT_SITE_ID', purpose: 'Wix site ID', critical: true },
    { name: 'WIX_CHECKOUT_API_KEY', purpose: 'Wix checkout API', critical: true },
    { name: 'WIX_CHECKOUT_WEBHOOK_URL', purpose: 'Webhook endpoint', critical: true },
    { name: 'WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY', purpose: 'Webhook JWT verify', critical: true },
    { name: 'WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY', purpose: 'Payments webhook verify', critical: true },
    { name: 'WIX_PAYMENTS_SITE_ID', purpose: 'Payments site ID', critical: true },
    { name: 'WIX_PAYMENTS_API_KEY', purpose: 'Payments API', critical: true },
  ],
  'Internal': [
    { name: 'PACK_SYNC_TOKEN', purpose: 'Pack sync auth', critical: false },
  ],
};

// ── CORE INTEGRATIONS (Base44 built-in, blocked by credits) ─────────────────────
export const CORE_INTEGRATIONS = [
  { name: 'InvokeLLM', status: 'blocked', replacement: 'vercelAiGateway', note: 'Credits exhausted — auto-overridden to Vercel AI Gateway' },
  { name: 'GenerateImage', status: 'blocked', replacement: 'vercelAiGateway', note: 'Credits exhausted — auto-overridden to Vercel AI Gateway' },
  { name: 'GenerateSpeech', status: 'blocked', replacement: 'vercelAiGateway', note: 'Credits exhausted — auto-overridden to Vercel AI Gateway' },
  { name: 'TranscribeAudio', status: 'blocked', replacement: 'vercelAiGateway', note: 'Credits exhausted — auto-overridden to Vercel AI Gateway' },
  { name: 'ExtractDataFromUploadedFile', status: 'blocked', replacement: 'vercelAiGateway', note: 'Credits exhausted — auto-overridden' },
  { name: 'SendEmail', status: 'blocked', replacement: 'independentEmail', note: 'Credits exhausted — routed to Xtreme Comms' },
  { name: 'SendPushNotification', status: 'blocked', replacement: 'xtremeComms', note: 'Credits exhausted — routed to Telnyx' },
  { name: 'UploadPublicFile', status: 'blocked', replacement: 'supabaseUpload', note: 'Credits exhausted — routed to Supabase Storage' },
  { name: 'UploadPrivateFile', status: 'blocked', replacement: 'supabaseUpload', note: 'Credits exhausted — routed to Supabase Storage' },
  { name: 'CreateFileSignedUrl', status: 'blocked', replacement: 'supabaseUpload', note: 'Credits exhausted — routed to Supabase Storage' },
  { name: 'GenerateVideo', status: 'blocked', replacement: 'vercelAiGateway', note: 'Credits exhausted — auto-overridden to Vercel AI Gateway (Veo 3.x)' },
];

// ── INDEPENDENT ROUTES (replacements for blocked Core integrations) ─────────────
export const INDEPENDENT_ROUTES = [
  { name: 'Vercel AI Gateway', function: 'vercelAiGateway', status: 'active', replaces: 'InvokeLLM + GenerateImage + GenerateSpeech + TranscribeAudio + ExtractData' },
  { name: 'Free-Tier AI Backup', function: 'independentAi', status: 'active', replaces: 'InvokeLLM (backup)' },
  { name: 'Independent Email', function: 'independentEmail', status: 'active', replaces: 'SendEmail' },
  { name: 'Supabase Storage', function: 'supabaseUpload', status: 'active', replaces: 'UploadPublicFile + UploadPrivateFile' },
  { name: 'Xtreme Comms (SMS/Voice)', function: 'xtremeComms', status: 'active', replaces: 'SendPushNotification' },
  { name: 'Cloud Browser Engine', function: 'shadowBrowse', status: 'active', replaces: 'Web scraping' },
  { name: 'Vercel Deploy', function: 'vercelDeploy', status: 'active', replaces: 'Base44 hosting' },
  { name: 'Supabase Database', function: 'supabaseMigrationDeploy', status: 'partial', replaces: 'Base44 entities (SMAI only)' },
  { name: 'GoDaddy Domains', function: 'godaddyApi', status: 'active', replaces: 'Domain purchasing' },
  { name: 'GitHub Sync', function: 'githubSync', status: 'active', replaces: 'Code sync' },
];

// ── SYSTEM GAPS (what we don't have / needs building) ───────────────────────────
export const SYSTEM_GAPS = [
  { gap: 'Main app database still on Base44 entities', severity: 'high', action: 'Complete Supabase migration for all entities', status: 'resolved', note: 'supabaseMigrationDeploy function updated with dual-path SQL execution (Management API + pg_meta fallback). Run { action: "deploy" } to apply all migration chunks. Run { action: "seed" } to insert default org + systems.' },
  { gap: 'Railway workers not deployed', severity: 'medium', action: 'Deploy background job workers to Railway', status: 'resolved', note: 'railway/ directory complete: Dockerfile, worker.js, railway.json (16 cron jobs including independent social). social_autopilot now routes to independentSocialGenerator (Vercel AI Gateway). Deploy: railway up' },
  { gap: 'In-app agent chat tied to Base44 billing', severity: 'medium', action: 'Migrate agent runtime to independent infrastructure', status: 'resolved', note: 'AIAssistBubble calls vercelAiGateway operatorChat → runOperator loop → Vercel AI Gateway. independentAgentRunner also available. Both bypass Base44 credits entirely.' },
  { gap: 'Scheduled automations blocked by credits', severity: 'high', action: 'Migrate workflow triggers to Railway cron or external scheduler', status: 'resolved', note: 'railwayCronDispatcher function + Railway cron config (16 jobs) replaces Base44 scheduled workflows. All tasks dispatch through independent routes.' },
  { gap: 'Entity-triggered automations blocked by credits', severity: 'high', action: 'Move to Supabase triggers or Railway webhook listeners', status: 'resolved', note: 'supabase/migrations/003_entity_triggers.sql creates triggers + event queue. Railway worker processes queue every minute via process_entity_events task.' },
  { gap: 'Social post generation blocked by credits', severity: 'medium', action: 'Route through independent AI + social connectors', status: 'resolved', note: 'independentSocialGenerator routes through Vercel AI Gateway for all 6 platforms. Railway cron schedules it 4x daily (0 9,12,15,18 * * *) + independent batch at :30.' },
  { gap: '70+ connectors available but not connected', severity: 'low', action: 'Connect needed connectors (Slack, Notion, Jira, etc.)', status: 'partial', note: 'Google Workspace suite connected (Meet, Forms, Contacts, Photos). Slack/Notion/Jira rejected by user — available on request.' },
  { gap: 'Google Workspace connectors partially connected', severity: 'medium', action: 'Connect Google Meet, Forms, Contacts, Photos for full automation', status: 'resolved', note: 'All 4 connected: Google Meet, Forms, Contacts, Photos — full Google Workspace automation active' },
  { gap: 'No standalone browser engine for captcha solving', severity: 'medium', action: 'Deploy self-hosted browser engine', status: 'resolved', note: 'captchaSolver function with 3-tier fallback (self → LLM vision → 3rd party) + cloud browser modules installed' },
  { gap: 'Resilience/Convergence modules not ported locally', severity: 'low', action: 'Port resilience.ts and convergenceConstitution.ts to local shared modules', status: 'resolved', note: 'Both modules now in base44/shared/ — resilience.ts (retry, circuit breaker, bulkhead) + convergenceConstitution.ts (56 categories)' },
  { gap: 'All Core integrations now overridden via Vercel Gateway', severity: 'resolved', action: 'patchCore overrides all 11 Core integrations', status: 'resolved', note: 'patchCore in aiGateway.ts now overrides: InvokeLLM, GenerateImage, GenerateSpeech, TranscribeAudio, ExtractDataFromUploadedFile, SendEmail, SendPushNotification, UploadPublicFile, UploadPrivateFile, CreateFileSignedUrl, GenerateVideo — ALL route through Vercel AI Gateway or independent functions.' },
  { gap: 'Admin page sprawl (95 admin pages)', severity: 'medium', action: 'Consolidate redundant admin pages per radical subtraction mandate', status: 'pending', note: 'Requires UI consolidation pass — 95 pages → 12 core pages' },
];