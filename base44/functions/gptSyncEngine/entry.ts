import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { completeGateway } from '../../shared/openRouterGateway.ts';
import { executeHostedTool } from '../../shared/operatorHosted.js';
import {
  captureSnapshot,
  logSyncEvent,
  getPendingEvents,
  runSyncCycle,
  runTakeover,
} from '../../shared/gptSyncCore.ts';
import { operatorEntities, operatorFunctions, operatorInstructions } from '../../shared/operatorCatalog.js';
import { operatorTools } from '../../shared/operatorLoop.js';

// ─────────────────────────────────────────────────────────────────────────────
// gptSyncEngine — Bi-directional sync between the admin and GPT. v2
//
// Actions:
//   logEvent     — Log an admin state change (Admin → GPT direction)
//   getPending   — Get pending events GPT hasn't seen yet
//   snapshot     — Capture current admin state snapshot
//   sync         — Run a bi-directional sync cycle (events → GPT → commands)
//   takeOver     — GPT takes over with full context + operator loop
//   stats        — Sync statistics (pending, synced, total, last sync)
//   listEvents   — List recent sync events
// ─────────────────────────────────────────────────────────────────────────────

export default async function(req: Request): Promise<Response> {
  try {
    const { secrets } = await import('base44:runtime');
    const base44 = createClientFromRequest(req);

    // ── Auth: API key (external GPT) OR admin session (dashboard) ──
    const authHeader = req.headers.get('authorization') || '';
    const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const body = await req.json().catch(() => ({}));
    const apiKey = bearerKey || body.api_key || '';
    const syncKey = secrets.get('GPT_SYNC_API_KEY') || '';
    const isApiKeyAuth = syncKey && apiKey && apiKey === syncKey;

    let svc;
    if (isApiKeyAuth) {
      // External GPT authenticated via API key — use service role directly
      svc = base44.asServiceRole;
    } else {
      // Dashboard path — require admin session
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
      svc = base44.asServiceRole;
    }
    const action = body.action || 'stats';

    // ── getConfig: Return full sync config JSON for external GPT ──
    if (action === 'getConfig') {
      const githubRepo = secrets.get('GITHUB_REPO') || 'XTREME-SYSTEMS/digital-dominance';
      const config = {
        system_name: 'Unlimited Websites — Autonomous AI Website Launch Engine',
        version: '4.0',
        brand_identity: {
          name: 'Unlimited Websites',
          tagline: 'The AI-powered launch engine that builds, scales, and manages unlimited high-performance websites on autopilot.',
          logo_url: 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/ceeb745d3_generated_image.png',
          published_url: 'https://unlimitedwebsites.base44.app',
          custom_domain: 'https://unlimitedwebsites.net',
          theme: 'Dark space-inspired (#050508 background, blue glows, metallic gold accents)',
          operating_model: 'Type-only interaction — users type natural language commands to build, scale, and manage automated websites. All UI buttons hidden behind advanced toggles.',
        },

        // ── END-TO-END SYSTEM ARCHITECTURE ──
        system_architecture: {
          overview: 'Unlimited Websites is a full-stack autonomous AI orchestration engine built on Base44 (React + Tailwind + Vite frontend, serverless backend functions, MongoDB entities, workflows, agents). It mass-scales programmatic websites using Vercel subdomains, GPT-driven bi-directional sync, and a fleet of 29 AI agents that run 36 automated workflows.',
          frontend: {
            framework: 'React 18 + Tailwind CSS + Vite',
            pages: 191,
            components: 463,
            router: 'src/App.jsx (React Router v6)',
            public_pages: 'LaunchEngine (home), TemplatesGallery, Pricing, Tech, Portal, SEO pages, Estimator funnel, ContractorApp, SMAI portal, DynamicPageView',
            admin_shell: 'AdminLayout wraps all /admin/* routes with ReferenceAdminSidebar + ReferenceAdminHeader, enforces mandatory branding via CSS variables',
            auth: 'Built-in Base44 auth (email/password, Google OAuth, OTP, reset) — Login, Register, ForgotPassword, ResetPassword pages',
            design_system: 'Token-based (src/index.css → tailwind.config.js), dark space theme, metallic gold accents, electric blue glows, glassmorphism',
          },
          backend: {
            platform: 'Base44 serverless functions (TypeScript, Deno runtime)',
            functions: 171,
            shared_modules: 66,
            entities: 158,
            sdk: 'base44.entities.<Name>.<operation> for CRUD, base44.functions.invoke for function calls, base44.integrations.Core for built-in (InvokeLLM, SendEmail, GenerateImage, UploadPrivateFile, etc.)',
            auth_model: 'API-key auth (Bearer token) for external GPT/cron access, admin session for dashboard. publishTemplateLive, bulkLaunchEngine, backlinkSheetsLogger all support API-key auth for cron triggers.',
          },
          data_layer: {
            database: 'Base44-managed MongoDB (entities with JSON schemas, RLS per entity)',
            storage: 'UploadPrivateFile (private, signed URLs) / UploadPublicFile (public, permanent URLs)',
            key_entities: 'SiteBank (site inventory), TemplateLibrary (website templates), WebsiteQueue (launch queue), MassLaunchBatch (bulk deployments), DeploymentRecord (Vercel deployments), SyncEvent (GPT sync log), Lead, ClientProject, MandatoryBranding, PromptLibrary, IndustryBenchmark, ProgrammaticTarget, FaultLineFinding, PortfolioSimulation, StrategyTournament, HighLeverageCapability',
            rls: 'Most entities admin-only (read/create/update/delete). TemplateLibrary and PromptLibrary have open read. Lead has open create (public forms).',
          },
          automation: {
            workflows: 36,
            agents: 29,
            connectors: 18,
            workflow_engine: 'Base44 workflows (.jsonc in base44/workflows/) — scheduled, entity-triggered, connector-triggered, webhook-triggered',
            agent_engine: 'Base44 agents (.jsonc in base44/agents/) — in-app AI agents with entity/function permissions, channels (WhatsApp/Telegram), conversation UI',
            cron_workflows: 'Bulk Launch Engine (every 3h), Backlink Sheets Sync (every 30min), Site Bank Automation (every 6h), Alpha Prime Heartbeat, Autonomous Dominance 24-7 Cycle, Background Operations Manager, Daily Lead Engine, Daily Site Validation, Social Media Autopilot, Swarm Autopilot',
          },
          infrastructure: {
            hosting: 'Base44 (frontend + functions + database), Vercel (deployed template sites via subdomains), Railway (24/7 workers + cron dispatchers)',
            deployment: 'publishTemplateLive → Vercel deploy → DeploymentRecord → Google Search Console registration → sitemap generation',
            scaling: 'SiteBank + bulkLaunchEngine for credit-free bulk site creation, ProgrammaticTarget for geo-targeting, MassLaunchBatch for batch tracking',
            github: `https://github.com/${githubRepo}.git — bi-directional sync via githubSync function (push DynamicPages, CodeBlocks to repo)`,
            supabase: 'Connected for client infrastructure provisioning (SMAI staging + production)',
            google_ecosystem: 'Search Console, Analytics, Sheets, Drive, Docs, Calendar, Gmail, Tasks, Forms, Slides, BigQuery, Photos, Meet, Contacts — all via OAuth connectors',
          },
          ai_layer: {
            primary_llm: 'Vercel AI Gateway (vercelAiGateway function) — generateText, generateImage, editImage, operatorChat. NEVER use Base44 Core InvokeLLM for operator tasks.',
            fallback_llm: 'Groq (llama-3.3-70b-versatile) via openRouterGateway, with OpenRouter fallback for takeOver/sync operator loop',
            image_generation: 'GenerateImage (Core integration) + vercelAiGateway for advanced requests, PromptLibrary for ultra-lifelike 8K prompts',
            video_generation: 'GenerateVideo (Veo 3.x) for hero videos and content',
            speech: 'GenerateSpeech (TTS) for voice agents, TranscribeAudio (Whisper) for STT',
            agent_loop: 'operatorLoop.js — 7-step tool-calling loop with 4 tools (get_capabilities, read_entities, write_entity, invoke_function), 3-minute deadline',
          },
          bi_directional_sync: {
            concept: 'Admin state changes are logged as SyncEvents (direction: to_gpt). GPT reads pending events, processes them, and sends commands back (direction: from_gpt). The external GPT authenticates via API key and gets service-role access.',
            sync_engine: 'gptSyncEngine function — logEvent, getPending, snapshot, sync, takeOver, execute, stats, listEvents, getConfig',
            operator_loop: 'runTakeover/runSyncCycle in gptSyncCore.ts — feeds full admin state + pending events as context, GPT executes via tool calls',
            external_access: 'POST to /functions/gptSyncEngine with Authorization: Bearer <GPT_SYNC_API_KEY> — no admin session needed',
          },
        },

        // ── REPO STRUCTURE ──
        repo_structure: {
          github_repo: `https://github.com/${githubRepo}.git`,
          root_files: 'package.json, vite.config.js, tailwind.config.js, postcss.config.js, index.html, jsconfig.json, eslint.config.js, components.json, README.md, CLAUDE.md, AGENTS.md',
          directories: {
            'src/pages/': '191 React page components (public + admin + SEO + SMAI)',
            'src/components/': '463 React components (ui/, admin/, launch-engine/, template-studio/, vision-cortex-v2/, etc.)',
            'src/lib/': '49 utility modules (AuthContext, query-client, usCities, ultraLifelikePrompts, pwa-factory configs)',
            'src/data/': '15 data files (topIndustries, expandedIndustries, aiTerminology, templateLayouts)',
            'src/api/': 'base44Client (pre-initialized SDK)',
            'base44/entities/': '158 entity schemas (.jsonc) — JSON schemas defining all stored data',
            'base44/functions/': '171 backend functions (entry.ts each) — HTTP handlers for external APIs, cron jobs, AI operations',
            'base44/shared/': '66 shared modules — operatorLoop, operatorCatalog, gptSyncCore, aiGateway, cloudBrowser, benchmarkCapture, operatorHosted, openRouterGateway, and more',
            'base44/workflows/': '36 workflow definitions (.jsonc) — scheduled, entity-triggered, connector-triggered automations',
            'base44/agents/': '29 agent configs (.jsonc) — in-app AI agents with permissions and channels',
            'base44/connectors/': '18 connector configs (.jsonc) — OAuth integrations (Google ecosystem, HubSpot, Supabase, Facebook)',
            'base44/emails/': '1 email template (CRMFollowUp.html)',
            'base44/mcp/': 'MCP server config (app data exposed to AI clients)',
            'public/': 'Static assets — manifest.json, robots.txt, sitemap.xml, sw.js, llms.txt, Google verification files',
            'railway/': 'Railway deployment config — Dockerfile, railway.json, workers/worker.js for 24/7 hosting',
            'smai-vercel/': 'Standalone SMAI Vercel deployment (separate React app)',
            'supabase/': 'Supabase migration SQL',
            'docs/receipts/': 'Validation receipts and audit proofs',
          },
          key_files: {
            'src/App.jsx': 'Main router — all 191+ routes, auth wrapper, ProtectedRoute, ErrorBoundary, CodeInjector',
            'src/index.css': 'Design tokens (CSS variables for light/dark), component classes, animations',
            'tailwind.config.js': 'Tailwind theme mapping (colors, fonts, animations)',
            'src/components/Logo.jsx': 'Brand logo component (LOGO_URL export used app-wide)',
            'src/components/admin/AdminLayout.jsx': 'Admin shell — branding injection, sidebar, header, AI assist bubble',
            'src/components/launch-engine-admin/ReferenceAdminSidebar.jsx': 'Admin navigation sidebar (canonical nav structure)',
            'base44/shared/operatorCatalog.js': 'Entity list, function catalog, operator instructions for GPT',
            'base44/shared/operatorLoop.js': 'Tool-calling agent loop (7 steps, 4 tools, 3-min deadline)',
            'base44/shared/gptSyncCore.ts': 'Sync engine core — snapshot, logEvent, getPending, runSyncCycle, runTakeover',
            'base44/shared/operatorHosted.js': 'Hosted tool execution (get_capabilities, read_entities, write_entity, invoke_function)',
            'base44/shared/aiGateway.ts': 'Vercel AI Gateway client (primary LLM interface)',
            'base44/shared/openRouterGateway.ts': 'OpenRouter/Groq fallback gateway',
            'base44/functions/gptSyncEngine/entry.ts': 'Bi-directional sync endpoint (this function)',
            'base44/functions/publishTemplateLive/entry.ts': 'Template → Vercel deployment pipeline',
            'base44/functions/bulkLaunchEngine/entry.ts': 'Bulk site launch from SiteBank (cron-driven)',
            'base44/functions/siteBankOrchestrator/entry.ts': 'Deterministic credit-free site creation + backlink network',
            'base44/functions/backlinkSheetsLogger/entry.ts': 'Sync backlink opportunities to Google Sheets',
          },
        },

        // ── WORKFLOW CATALOG (36 automated workflows) ──
        workflow_catalog: [
          'Alpha Prime Completion Sprint', 'Alpha Prime Heartbeat', 'Automated Prompt Tester',
          'Autonomous AutoComplete', 'Autonomous Coding Pipeline', 'Autonomous Dominance 24-7 Cycle',
          'Autonomous Refactor Cycle', 'Autonomous SEO Dominance', 'Autonomous Skip Trace',
          'Autonomous Sprint Supervisor', 'Autonomous Visual Orchestrator', 'Background Operations Manager',
          'Backlink Sheets Sync', 'Bulk Launch Engine', 'CRM Follow-Up Sequence', 'Competitor Scanner',
          'Daily Lead Engine', 'Daily Site Validation', 'Fleet Alpha Prime Heartbeat',
          'Immediate Lead Follow-Up', 'Lead Follow-Up', 'Questionnaire Enforcement',
          'Recursive Production Readiness Engine', 'Review Request', 'SEO Optimizer',
          'SEO Update Notifier', 'Site Bank Automation', 'Sitemap Auto-Update',
          'Social Media Autopilot', 'Swarm Autopilot', 'Template Image Mandate',
          'Unified Site Generator', 'Weekly Opportunity Scanner', 'X1 Autonomous Company Cycle',
          'XTREME Digital Dominance Compiler', 'XTREME Universal Generator Sync Supervisor',
        ],

        // ── AGENT CATALOG (29 in-app AI agents) ──
        agent_catalog: [
          'alpha_prime_orchestrator', 'apex_orchestrator', 'autonomous_orchestrator',
          'benchmark_scout', 'bottleneck_hunter', 'brand_compliance_guardian',
          'build_factory', 'code_engineer', 'comms_manager', 'eden_skye',
          'email_manager', 'lead_orchestrator', 'passive_learner', 'provider_adapters',
          'reputation_manager', 'scale_fleet', 'self_reflection_engine', 'seo_manager',
          'shadow', 'site_factory_manager', 'social_manager', 'social_media_manager',
          'swarm_orchestrator', 'sync_guardian', 'system_monitor', 'system_operator',
          'validation_guardian', 'vision_cortex', 'visual_factory',
        ],

        // ── CONNECTOR CATALOG (18 OAuth integrations) ──
        connector_catalog: [
          'facebook_pages', 'gmail', 'google_analytics', 'google_classroom',
          'google_contacts', 'google_photos', 'google_search_console', 'googlebigquery',
          'googlecalendar', 'googledocs', 'googledrive', 'googleforms',
          'googlemeet', 'googlesheets', 'googleslides', 'googletasks',
          'hubspot', 'supabase',
        ],

        // ── END-TO-END PIPELINE (website factory lifecycle) ──
        pipeline: {
          lifecycle: 'PLAN → DISCOVERY → BRAND OPTIONS → APPROVAL → BUILDER DOCS → BUILD → VALIDATION → RELEASE → OPERATE',
          stages: [
            '1. VISION → visionEngine (assist) — articulate vision, onboarding questions',
            '2. STRATEGIES → visionEngine (strategies) — 10 strategies with names, domains, cities',
            '3. RESEARCH → scanCompetitors — competitors, pricing, gaps, backlinks',
            '4. TEMPLATE → rebrandStudio (generate_brand_pack) — match from 20 top industry templates',
            '5. BRAND → rebrandStudio (generate_logo_pack) — 10 logos, brand pack (colors, fonts, tagline, domain)',
            '6. WEBSITE → rebrandStudio (generate_website_packs) + visualEditorBuild — 10 layouts, build best',
            '7. SOCIAL → independentSocialGenerator (generate_calendar) — 30-day calendar, 30 videos, images, hashtags',
            '8. ASSETS → rebrandStudio — digital business cards, brochures, logos, social kit, email signature',
            '9. PROVISION → vercelDeploy + godaddyApi (domain needs human approval) + githubSync + supabaseMigrationDeploy',
            '10. GOOGLE SYNC → googleEcosystemSync — Search Console, Analytics, sitemap, full compliance',
            '11. DOMINANCE → universalDominanceEngine (launch) — programmatic sites by state/city, SEO/AEO/GEO',
            '12. VALIDATE → autoComplete (full_cycle) + closedLoopTester (run_test) + postconditionValidator (validate) — 3x pass at 100%',
          ],
          scale_mode: 'SiteBank + bulkLaunchEngine for credit-free bulk creation. ProgrammaticTarget for geo-targeting. MassLaunchBatch for batch tracking. Backlink network built deterministically (no AI credits).',
        },

        sync_endpoint: 'gptSyncEngine',
        endpoint_url: 'https://unlimitedwebsites.base44.app/functions/gptSyncEngine',
        execution_model: 'Base44 SDK (server-side, authenticated as admin or API key)',
        authentication: {
          method: 'Bearer token (API key)',
          header: 'Authorization: Bearer <GPT_SYNC_API_KEY>',
          alternative: 'Pass api_key in the JSON body. The key is the b44u_... value set in the Secrets dashboard as GPT_SYNC_API_KEY.',
          note: 'With the API key, no admin session is required — the external GPT authenticates directly and gets service-role access to all entities and functions.',
        },
        sdk_instructions: 'The Base44 SDK is initialized server-side inside the gptSyncEngine function. The external GPT does NOT install the SDK directly. Instead, it calls the execute action below with the API key in the Authorization header. The function authenticates via the SDK and runs typed entity operations and backend function invocations on the GPT\'s behalf.',
        sync_actions: {
          execute: 'POST { action: "execute", tool: "<tool_name>", args: { entity, operation, data, function_name, payload, query, id, count_only, cursor } } — Execute a hosted tool via the Base44 SDK. This is the primary execution path. Available tools: get_capabilities, read_entities, write_entity, invoke_function.',
          takeOver: 'POST { action: "takeOver", command: "<your command>" } — GPT executes with full admin context via the internal operator loop',
          sync: 'POST { action: "sync", command: "<optional>" } — Bi-directional sync cycle',
          getPending: 'POST { action: "getPending" } — Get pending admin events for GPT context (auto-seeds a snapshot if empty)',
          snapshot: 'POST { action: "snapshot" } — Capture current admin state',
          logEvent: 'POST { action: "logEvent", event_type, entity_name, data_summary, direction } — Log a state change',
          stats: 'POST { action: "stats" } — Sync statistics',
          listEvents: 'POST { action: "listEvents", status?, direction?, limit? } — List recent sync events',
        },
        operator_instructions: operatorInstructions,
        operator_entities: operatorEntities,
        operator_functions: operatorFunctions,
        operator_tools: operatorTools,
        execution_protocol: {
          step_1: 'Call getPending to read any pending admin events (live context).',
          step_2: 'Call execute with a tool name and args to run any entity operation or backend function. The Base44 SDK authenticates as admin and returns typed results.',
          step_3: 'Call logEvent to record what you did (direction: "from_gpt") so the admin dashboard sees your actions.',
          step_4: 'Repeat until the command is complete. Every action must produce a tool receipt.',
        },
        runtime: 'base44-sdk (authenticated server-side)',
        llm_gateway: 'groq (llama-3.3-70b-versatile) with openrouter fallback — used only for internal takeOver/sync operator loop. External GPTs use their own LLM and call execute for tool operations.',
      };
      return Response.json({ ok: true, config });
    }

    // ── execute: External GPT calls a hosted tool via the Base44 SDK ──
    if (action === 'execute') {
      const { tool, args } = body;
      if (!tool) return Response.json({ error: 'tool required' }, { status: 400 });
      const result = await executeHostedTool(base44, tool, args || {});
      return Response.json({ ok: true, tool, result });
    }

    // ── logEvent: Log an admin state change ──
    if (action === 'logEvent') {
      const event = await logSyncEvent(svc, {
        event_type: body.event_type || 'entity_update',
        entity_name: body.entity_name || '',
        record_id: body.record_id || '',
        action: body.action_name || '',
        data_summary: body.data_summary || '',
        source: body.source || 'admin_ui',
        direction: body.direction || 'to_gpt',
        status: 'pending',
        gpt_context: body.gpt_context || '',
      });
      return Response.json({ ok: true, event });
    }

    // ── getPending: Get pending events for GPT ──
    if (action === 'getPending') {
      const events = await getPendingEvents(svc);
      return Response.json({ ok: true, count: events.length, events });
    }

    // ── snapshot: Capture current admin state ──
    if (action === 'snapshot') {
      const snapshot = await captureSnapshot(svc);
      await logSyncEvent(svc, {
        event_type: 'state_snapshot',
        action: 'snapshot',
        data_summary: JSON.stringify(snapshot).slice(0, 2000),
        source: 'sync_engine',
        direction: 'to_gpt',
        status: 'pending',
      });
      return Response.json({ ok: true, snapshot });
    }

    // ── sync: Run a bi-directional sync cycle ──
    if (action === 'sync') {
      const result = await runSyncCycle(svc,
        payload => completeGateway({ model: 'anthropic/claude-opus-4.7', ...payload }),
        (name, args) => executeHostedTool(base44, name, args),
        { command: body.command, history: body.history || [] }
      );
      return Response.json(result);
    }

    // ── takeOver: GPT takes over with full context ──
    if (action === 'takeOver') {
      if (!body.command) return Response.json({ error: 'command required' }, { status: 400 });
      const result = await runTakeover(svc,
        payload => completeGateway({ model: 'anthropic/claude-opus-4.7', ...payload }),
        (name, args) => executeHostedTool(base44, name, args),
        body.command,
        body.history || []
      );
      return Response.json(result);
    }

    // ── stats: Sync statistics ──
    if (action === 'stats') {
      const allEvents = await svc.entities.SyncEvent.filter({}, '-created_date', 100);
      const pending = allEvents.filter(e => e.status === 'pending').length;
      const synced = allEvents.filter(e => e.status === 'synced').length;
      const total = allEvents.length;
      const lastSynced = allEvents.find(e => e.status === 'synced');
      return Response.json({
        ok: true,
        stats: {
          pending,
          synced,
          total,
          last_sync: lastSynced?.synced_at || null,
        },
        recent: allEvents.slice(0, 10),
      });
    }

    // ── listEvents: List recent sync events ──
    if (action === 'listEvents') {
      const { status, direction, limit = 50 } = body;
      const filter: any = {};
      if (status) filter.status = status;
      if (direction) filter.direction = direction;
      const events = await svc.entities.SyncEvent.filter(filter, '-created_date', limit);
      return Response.json({ ok: true, count: events.length, events });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('[gptSyncEngine] Error:', error.message);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}