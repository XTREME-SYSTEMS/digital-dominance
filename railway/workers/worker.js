// ═══════════════════════════════════════════════════════════════════════════
// Railway Worker — Background job runner for the Xtreme Polishing dominance engine.
//
// This runs on Railway (not Base44), so it does NOT consume Base44 credits.
// It calls Base44 backend functions via the public API.
//
// Usage:
//   node worker.js <task_name>
//
// Deployed via Railway cron (see railway.json).
// ═══════════════════════════════════════════════════════════════════════════

const BASE44_APP_URL = process.env.BASE44_APP_URL || 'https://epoxyquotenearme.base44.app';
const CRON_KEY = process.env.RAILWAY_CRON_KEY || process.env.ENGINE_API_KEY;
const SUPABASE_URL = process.env.SMAI_SUPABASE_URL;
const SUPABASE_KEY = process.env.SMAI_SUPABASE_ANON_KEY;

// Task registry — same as railwayCronDispatcher backend function
const TASKS = {
  alpha_prime_heartbeat: 'alphaPrimeHeartbeat',
  fleet_heartbeat: 'fleetAlphaPrime',
  daily_lead_engine: 'dailyLeadEngine',
  weekly_opportunity_scanner: 'opportunityIntelligenceEngine',
  competitor_scanner: 'scanCompetitors',
  seo_optimizer: 'optimizeSeo',
  sitemap_update: 'generateSitemap',
  social_autopilot: 'independentSocialGenerator',
  social_autopilot_independent: 'independentSocialGenerator',
  swarm_autopilot: 'swarmOrchestrator',
  autonomous_sprint: 'autonomousSprint',
  autonomous_refactor: 'autonomousRefactorEngine',
  autonomous_seo: 'autonomousSeoDominance',
  digital_dominance: 'digitalDominanceCompiler',
  x1_company_cycle: 'companyOrchestrator',
  universal_generator_sync: 'xtremeUniversalGeneratorBridge',
  review_request: 'sendReviewRequest',
  lead_follow_up: 'sendFollowUpEmail',
  skip_trace: 'skipTrace',
  autocomplete: 'autoComplete',
  coding_pipeline: 'autonomousCodingEngine',
  process_entity_events: null, // Special: processes Supabase entity event queue
};

async function dispatchTask(taskName) {
  const fnName = TASKS[taskName];
  if (!fnName) {
    if (taskName === 'process_entity_events') {
      return processEntityEvents();
    }
    console.error(`Unknown task: ${taskName}`);
    console.log(`Available tasks: ${Object.keys(TASKS).join(', ')}`);
    process.exit(1);
  }

  const url = `${BASE44_APP_URL}/functions/railwayCronDispatcher`;
  console.log(`[${new Date().toISOString()}] Dispatching task: ${taskName} → ${fnName}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-key': CRON_KEY,
      },
      body: JSON.stringify({ task: taskName }),
    });

    const data = await res.json();
    if (data.ok) {
      console.log(`✓ ${taskName} completed in ${data.duration_ms}ms`);
    } else {
      console.error(`✗ ${taskName} failed: ${data.error}`);
    }
    return data;
  } catch (err) {
    console.error(`✗ ${taskName} fetch error: ${err.message}`);
    throw err;
  }
}

// Process Supabase entity event queue (fallback for triggers)
async function processEntityEvents() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('Supabase not configured — skipping entity event processing');
    return;
  }

  console.log(`[${new Date().toISOString()}] Processing entity event queue...`);

  try {
    // Call the process_event_queue function
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/process_event_queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ batch_size: 50 }),
    });

    const data = await res.json();
    console.log(`✓ Processed ${data[0]?.processed || 0} events, ${data[0]?.failed || 0} failed`);
  } catch (err) {
    console.error(`✗ Entity event processing failed: ${err.message}`);
  }
}

// Main
const task = process.argv[2];
if (!task) {
  console.log('Usage: node worker.js <task_name>');
  console.log(`Available tasks: ${Object.keys(TASKS).join(', ')}`);
  process.exit(0);
}

dispatchTask(task).catch((err) => {
  console.error('Worker fatal error:', err.message);
  process.exit(1);
});