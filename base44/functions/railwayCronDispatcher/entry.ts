import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';

// ═══════════════════════════════════════════════════════════════════════════
// railwayCronDispatcher — Replaces Base44 scheduled workflow triggers.
//
// Railway cron calls this function on a schedule. It then dispatches to the
// appropriate backend function, bypassing Base44's credit-blocked workflow engine.
//
// Railway cron config (in railway.json or Railway dashboard):
//   */5 * * * * → curl -X POST $DEPLOY_URL -H "x-cron-key: $CRON_KEY" -d '{"task":"alpha_prime_heartbeat"}'
//   0 * * * *   → curl -X POST $DEPLOY_URL -H "x-cron-key: $CRON_KEY" -d '{"task":"daily_lead_engine"}'
//   0 9 * * 1   → curl -X POST $DEPLOY_URL -H "x-cron-key: $CRON_KEY" -d '{"task":"weekly_opportunity_scanner"}'
// ═══════════════════════════════════════════════════════════════════════════

const CRON_KEY = () => secrets.get('RAILWAY_CRON_KEY') || secrets.get('ENGINE_API_KEY');

// Task registry — maps cron task names to backend functions
const TASK_REGISTRY: Record<string, { function: string; description: string }> = {
  alpha_prime_heartbeat: { function: 'alphaPrimeHeartbeat', description: '5-min Alpha Prime governance cycle' },
  fleet_heartbeat: { function: 'fleetAlphaPrime', description: 'Fleet health check' },
  daily_lead_engine: { function: 'dailyLeadEngine', description: 'Daily lead processing' },
  weekly_opportunity_scanner: { function: 'opportunityIntelligenceEngine', description: 'Weekly opportunity scan' },
  competitor_scanner: { function: 'scanCompetitors', description: 'Competitor monitoring' },
  seo_optimizer: { function: 'optimizeSeo', description: 'SEO content optimization' },
  sitemap_update: { function: 'generateSitemap', description: 'Sitemap auto-update' },
  social_autopilot: { function: 'independentSocialGenerator', description: 'Social media autopilot (Vercel AI Gateway — NOT Base44 credits)' },
  social_autopilot_independent: { function: 'independentSocialGenerator', description: 'Independent social media generation via Vercel AI Gateway' },
  swarm_autopilot: { function: 'swarmOrchestrator', description: 'Swarm task dispatch' },
  autonomous_sprint: { function: 'autonomousSprint', description: 'Autonomous sprint supervisor' },
  autonomous_refactor: { function: 'autonomousRefactorEngine', description: 'Autonomous code refactoring' },
  autonomous_seo: { function: 'autonomousSeoDominance', description: 'Autonomous SEO dominance' },
  digital_dominance: { function: 'digitalDominanceCompiler', description: 'Digital dominance compilation' },
  x1_company_cycle: { function: 'companyOrchestrator', description: 'X1 company autonomous cycle' },
  universal_generator_sync: { function: 'xtremeUniversalGeneratorBridge', description: 'Universal generator sync' },
  review_request: { function: 'sendReviewRequest', description: 'Send review requests to customers' },
  lead_follow_up: { function: 'sendFollowUpEmail', description: 'Lead follow-up emails' },
  skip_trace: { function: 'skipTrace', description: 'Autonomous skip trace' },
  autocomplete: { function: 'autoComplete', description: 'Autonomous autocomplete' },
  coding_pipeline: { function: 'autonomousCodingEngine', description: 'Autonomous coding pipeline' },
  idea_proving_machine: { function: 'ideaProvingMachine', description: 'Autonomous idea-proving machine — scans Google/GitHub trends and generates actionable opportunities' },
};

export default async function(req: Request): Promise<Response> {
  try {
    // Verify cron key (Railway cron passes this header)
    const cronKey = req.headers.get('x-cron-key');
    if (cronKey !== CRON_KEY()) {
      return Response.json({ error: 'Invalid cron key' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { task } = body;

    if (!task) {
      return Response.json({
        ok: true,
        tasks: Object.keys(TASK_REGISTRY),
        note: 'Pass { task: "<task_name>" } to dispatch. This replaces Base44 scheduled workflows.',
      });
    }

    const taskConfig = TASK_REGISTRY[task];
    if (!taskConfig) {
      return Response.json({ error: `Unknown task: ${task}`, available: Object.keys(TASK_REGISTRY) }, { status: 400 });
    }

    // Dispatch to the backend function — runs WITHOUT Base44 workflow credits
    const base44 = createClientFromRequest(req);
    const startTime = Date.now();

    try {
      const result = await base44.asServiceRole.functions.invoke(taskConfig.function, {
        trigger: 'railway_cron',
        task,
        timestamp: new Date().toISOString(),
        ...body.args,
      });

      const durationMs = Date.now() - startTime;

      return Response.json({
        ok: true,
        task,
        function: taskConfig.function,
        duration_ms: durationMs,
        result: result.data || result,
        independent: true, // did NOT use Base44 workflow credits
      });
    } catch (fnErr) {
      const durationMs = Date.now() - startTime;
      return Response.json({
        ok: false,
        task,
        function: taskConfig.function,
        duration_ms: durationMs,
        error: fnErr.message,
        independent: true,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[railwayCronDispatcher] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}