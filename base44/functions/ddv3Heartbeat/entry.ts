import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";
import { createDDV3LearningSnapshot } from "../../shared/ddv3LearningSnapshot.ts";

const SAFE_RISKS = new Set(["READ", "DRAFT", "BRANCH_WRITE"]);
const DONE_STATUSES = new Set(["PASSED", "COMPLETE"]);

function bucket5(now: Date) {
  const d = new Date(now);
  d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 5) * 5, 0, 0);
  return d;
}

async function authorized(req: Request, base44: any, body: any) {
  const expected = secrets.get("RAILWAY_CRON_KEY") || secrets.get("ENGINE_API_KEY") || "";
  const supplied = req.headers.get("x-cron-key") || body?.internal_cron_key || "";
  if (expected && supplied && expected === supplied) return true;
  try {
    const user = await base44.auth.me();
    return user?.role === "admin";
  } catch {
    return false;
  }
}

function rowsOf(result: any) {
  return result?.items || result || [];
}

export default async function(req: Request): Promise<Response> {
  const started = new Date();
  const startedMs = Date.now();

  try {
    if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    if (!(await authorized(req, base44, body))) {
      return Response.json({ error: "Authorized heartbeat/admin required" }, { status: 401 });
    }

    const svc = base44.asServiceRole;
    const bucket = bucket5(started);
    const cycleId = "ddv3-heartbeat-" + bucket.toISOString().replace(/[-:]/g, "").slice(0, 13) + "Z";

    const existing = await svc.entities.DDV3RuntimeCycle.filter({ cycle_id: cycleId }, "-created_date", 1);
    const existingRows = rowsOf(existing);
    if (existingRows[0]) {
      return Response.json({
        ok: true,
        cycle_id: cycleId,
        status: "skipped_duplicate",
        existing_cycle_id: existingRows[0].id,
      });
    }

    // Reconcile only objectively expired leases. Never steal a healthy lease.
    const leases = rowsOf(await svc.entities.ControlLease.list("-created_date", 500));
    let staleLeasesReconciled = 0;
    const nowMs = started.getTime();
    for (const lease of leases) {
      if (lease.status !== "held" || !lease.lease_expires_at) continue;
      const expires = Date.parse(lease.lease_expires_at);
      if (!Number.isFinite(expires) || expires >= nowMs) continue;
      await svc.entities.ControlLease.update(lease.id, {
        status: "expired",
        released_at: started.toISOString(),
        heartbeat_at: started.toISOString(),
      });
      staleLeasesReconciled++;
    }

    const packets = rowsOf(await svc.entities.WorkPacket.list("-created_date", 500));
    const byPacketId = new Map(packets.map((p: any) => [p.packet_id, p]));

    const dependenciesSatisfied = (packet: any) => {
      const deps = Array.isArray(packet.dependencies) ? packet.dependencies : [];
      return deps.every((id: string) => {
        const dep = byPacketId.get(id);
        return dep && DONE_STATUSES.has(dep.status);
      });
    };

    const eligible = packets.filter((packet: any) =>
      packet.status === "READY" &&
      SAFE_RISKS.has(packet.risk_class) &&
      dependenciesSatisfied(packet)
    );

    const protectedPackets = packets.filter((packet: any) =>
      packet.risk_class === "PROTECTED" &&
      ["READY", "QUEUED", "WAITING_APPROVAL"].includes(packet.status)
    );
    const blocked = packets.filter((packet: any) =>
      ["BLOCKED", "WAITING_DEPENDENCY", "FAILED", "REPAIR_REQUIRED"].includes(packet.status)
    );

    // First-party learning is deterministic and bounded. At most one snapshot/hour.
    let learningSnapshot: any = null;
    const latestSnapshots = rowsOf(await svc.entities.DDV3LearningSnapshot.list("-created_date", 1));
    const latestSnapshot = latestSnapshots[0];
    const latestMs = Date.parse(latestSnapshot?.created_at || latestSnapshot?.created_date || "");
    if (!Number.isFinite(latestMs) || nowMs - latestMs >= 60 * 60 * 1000) {
      learningSnapshot = await createDDV3LearningSnapshot(svc, {
        periodDays: 30,
        qualifiedLeadThreshold: 60,
        now: started,
      });
    } else {
      learningSnapshot = latestSnapshot;
    }

    const completed = new Date();
    const cycle = await svc.entities.DDV3RuntimeCycle.create({
      cycle_id: cycleId,
      started_at: started.toISOString(),
      completed_at: completed.toISOString(),
      duration_ms: Date.now() - startedMs,
      cadence: "5min",
      status: "completed",
      safe_ready_count: eligible.length,
      protected_waiting_count: protectedPackets.length,
      blocked_count: blocked.length,
      stale_leases_reconciled: staleLeasesReconciled,
      eligible_packet_ids: eligible.slice(0, 50).map((p: any) => p.packet_id),
      protected_packet_ids: protectedPackets.slice(0, 50).map((p: any) => p.packet_id),
      learning_snapshot_id: learningSnapshot?.snapshot_id || "",
      legacy_scheduled_workflows_manifest_count: 22,
      legacy_railway_crons_manifest_count: 16,
      cutover_state: "shadow",
      notes:
        "Shadow-mode DDV3 supervisor. It reconciles stale leases and surfaces safe/protected work; " +
        "it does not execute arbitrary WorkPackets or protected actions.",
    });

    return Response.json({
      ok: true,
      cycle_id: cycle.cycle_id,
      status: cycle.status,
      cutover_state: cycle.cutover_state,
      safe_ready_count: eligible.length,
      protected_waiting_count: protectedPackets.length,
      blocked_count: blocked.length,
      stale_leases_reconciled: staleLeasesReconciled,
      eligible_packet_ids: cycle.eligible_packet_ids,
      protected_packet_ids: cycle.protected_packet_ids,
      learning_snapshot_id: cycle.learning_snapshot_id,
      legacy_runtime_manifest: {
        base44_scheduled_workflows: 22,
        railway_crons: 16,
        desired_railway_crons: 1,
      },
      note:
        "Shadow mode only. No customer messaging, spend, publish, deploy, domain/DNS, secret, or arbitrary packet execution occurred.",
    });
  } catch (error: any) {
    return Response.json({
      error: error?.message || String(error),
      status: "failed",
      started_at: started.toISOString(),
      duration_ms: Date.now() - startedMs,
    }, { status: 500 });
  }
}
