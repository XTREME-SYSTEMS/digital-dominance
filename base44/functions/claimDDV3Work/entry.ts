import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";

const SAFE_RISKS = new Set(["READ", "DRAFT", "BRANCH_WRITE"]);
const DONE = new Set(["PASSED", "COMPLETE"]);

function rowsOf(result: any) {
  return result?.items || result || [];
}

function authorized(req: Request) {
  const expected = secrets.get("ENGINE_API_KEY") || secrets.get("RAILWAY_CRON_KEY") || "";
  const supplied = req.headers.get("x-worker-key") || "";
  return Boolean(expected && supplied && expected === supplied);
}

export default async function(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405 });
    if (!authorized(req)) return Response.json({ error: "Invalid worker key" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const workerId = String(body?.worker_id || "").trim();
    const requestedPacketId = String(body?.packet_id || "").trim();
    const leaseSeconds = Math.min(Math.max(Number(body?.lease_seconds) || 600, 120), 1800);

    if (!workerId) return Response.json({ error: "worker_id required" }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const packets = rowsOf(await svc.entities.WorkPacket.list("order", 500));
    const byId = new Map(packets.map((p: any) => [p.packet_id, p]));

    const depsDone = (packet: any) =>
      (Array.isArray(packet.dependencies) ? packet.dependencies : []).every((id: string) => {
        const dep = byId.get(id);
        return dep && DONE.has(dep.status);
      });

    const candidates = packets.filter((packet: any) =>
      packet.status === "READY" &&
      SAFE_RISKS.has(packet.risk_class) &&
      depsDone(packet) &&
      (!requestedPacketId || packet.packet_id === requestedPacketId)
    );

    if (!candidates.length) {
      return Response.json({ ok: true, claimed: false, reason: "no_eligible_safe_work" });
    }

    const packet = candidates[0];
    const lockKey = "ddv3-workpacket:" + packet.packet_id;
    const now = new Date();
    const activeLeases = rowsOf(await svc.entities.ControlLease.filter({ lock_key: lockKey, status: "held" }, "-created_date", 20));
    const active = activeLeases.find((lease: any) => {
      const expires = Date.parse(lease.lease_expires_at || "");
      return Number.isFinite(expires) && expires > now.getTime();
    });

    if (active) {
      return Response.json({
        ok: true,
        claimed: false,
        reason: "active_lease",
        packet_id: packet.packet_id,
      });
    }

    const expiresAt = new Date(now.getTime() + leaseSeconds * 1000).toISOString();
    const lease = await svc.entities.ControlLease.create({
      lock_key: lockKey,
      owner_id: workerId,
      cycle_id: String(body?.cycle_id || ""),
      acquired_at: now.toISOString(),
      lease_expires_at: expiresAt,
      heartbeat_at: now.toISOString(),
      status: "held",
      version: 1,
      idempotency_key: "claim:" + packet.packet_id + ":" + workerId,
    });

    await svc.entities.WorkPacket.update(packet.id, { status: "RUNNING" });

    return Response.json({
      ok: true,
      claimed: true,
      packet,
      lease: {
        id: lease.id,
        lock_key: lease.lock_key,
        owner_id: lease.owner_id,
        lease_expires_at: lease.lease_expires_at,
      },
      note: "Only READ/DRAFT/BRANCH_WRITE work can be claimed. Protected work is structurally excluded.",
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
