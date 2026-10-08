// DDV3 Railway worker: one scheduled heartbeat, no cron forest.
const BASE44_APP_URL = process.env.BASE44_APP_URL || "https://epoxyquotenearme.base44.app";
const CRON_KEY = process.env.RAILWAY_CRON_KEY || process.env.ENGINE_API_KEY;
const SUPABASE_URL = process.env.SMAI_SUPABASE_URL;
const SUPABASE_KEY = process.env.SMAI_SUPABASE_ANON_KEY;

const TASKS = {
  ddv3_heartbeat: "ddv3Heartbeat",
};

async function processEntityEvents() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { skipped: true, reason: "supabase_not_configured" };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/process_event_queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ batch_size: 50 }),
    });
    const data = await res.json().catch(() => []);
    return {
      ok: res.ok,
      processed: data?.[0]?.processed || 0,
      failed: data?.[0]?.failed || 0,
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function dispatchTask(taskName) {
  if (!TASKS[taskName]) {
    throw new Error(`DDV3 single-heartbeat runtime does not schedule task: ${taskName}`);
  }
  if (!CRON_KEY) {
    throw new Error("Missing RAILWAY_CRON_KEY/ENGINE_API_KEY");
  }

  // Fold entity queue reconciliation into the same scheduled tick.
  const entityEvents = await processEntityEvents();

  const url = `${BASE44_APP_URL}/functions/railwayCronDispatcher`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-key": CRON_KEY,
    },
    body: JSON.stringify({ task: taskName }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Heartbeat HTTP ${res.status}`);
  }

  console.log(JSON.stringify({
    at: new Date().toISOString(),
    task: taskName,
    entity_events: entityEvents,
    heartbeat: data.result || data,
  }));
  return data;
}

const task = process.argv[2] || "ddv3_heartbeat";
dispatchTask(task).catch((error) => {
  console.error("DDV3 worker fatal:", error.message);
  process.exit(1);
});
