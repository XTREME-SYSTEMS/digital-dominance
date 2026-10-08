import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";

// DDV3 single-heartbeat dispatcher.
// Legacy cron task names are deliberately retired from this dispatch surface.
const CRON_KEY = () => secrets.get("RAILWAY_CRON_KEY") || secrets.get("ENGINE_API_KEY");

const TASK_REGISTRY = {
  ddv3_heartbeat: {
    function: "ddv3Heartbeat",
    description: "DDV3 5-minute queue/lease/learning supervisor",
  },
};

const RETIRED_LEGACY_TASKS = new Set([
  "alpha_prime_heartbeat","fleet_heartbeat","daily_lead_engine","weekly_opportunity_scanner",
  "competitor_scanner","seo_optimizer","sitemap_update","social_autopilot",
  "social_autopilot_independent","swarm_autopilot","autonomous_sprint","autonomous_refactor",
  "autonomous_seo","digital_dominance","x1_company_cycle","universal_generator_sync",
  "review_request","lead_follow_up","skip_trace","autocomplete","coding_pipeline",
  "process_entity_events"
]);

export default async function(req: Request): Promise<Response> {
  try {
    const cronKey = req.headers.get("x-cron-key");
    const expected = CRON_KEY();
    if (!expected || cronKey !== expected) {
      return Response.json({ error: "Invalid cron key" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const task = String(body?.task || "");

    if (!task) {
      return Response.json({
        ok: true,
        tasks: Object.keys(TASK_REGISTRY),
        retired_legacy_tasks: RETIRED_LEGACY_TASKS.size,
        note: "DDV3 permits one scheduled dispatcher task: ddv3_heartbeat.",
      });
    }

    if (RETIRED_LEGACY_TASKS.has(task)) {
      return Response.json({
        ok: false,
        blocked: true,
        code: "DDV3_SINGLE_HEARTBEAT_REQUIRED",
        task,
        error: "Legacy independent cron task retired from dispatcher. Route work through WorkPacket eligibility under ddv3_heartbeat.",
      }, { status: 409 });
    }

    const taskConfig = TASK_REGISTRY[task];
    if (!taskConfig) {
      return Response.json({ error: "Unknown task", available: Object.keys(TASK_REGISTRY) }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const startTime = Date.now();
    const result = await base44.asServiceRole.functions.invoke(taskConfig.function, {
      trigger: "railway_cron",
      task,
      timestamp: new Date().toISOString(),
      internal_cron_key: expected,
    });

    return Response.json({
      ok: true,
      task,
      function: taskConfig.function,
      duration_ms: Date.now() - startTime,
      result: result?.data || result,
      runtime: "ddv3_single_heartbeat",
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
