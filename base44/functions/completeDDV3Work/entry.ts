import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { secrets } from "base44:runtime";

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
    const packetId = String(body?.packet_id || "").trim();
    const workerId = String(body?.worker_id || "").trim();
    const outcome = String(body?.outcome || "").trim().toUpperCase();
    const receiptIds = Array.isArray(body?.validation_receipt_ids)
      ? body.validation_receipt_ids.map(String).filter(Boolean).slice(0, 50)
      : [];

    if (!packetId || !workerId || !["PASSED", "FAILED", "REPAIR_REQUIRED"].includes(outcome)) {
      return Response.json({ error: "packet_id, worker_id, and valid outcome required" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const packetRows = rowsOf(await svc.entities.WorkPacket.filter({ packet_id: packetId }, "-created_date", 1));
    const packet = packetRows[0];
    if (!packet) return Response.json({ error: "WorkPacket not found" }, { status: 404 });

    if (packet.risk_class === "PROTECTED") {
      return Response.json({
        error: "Protected WorkPackets cannot be completed through safe-worker endpoint.",
        code: "DDV3_PROTECTED_WORK_BLOCKED",
      }, { status: 403 });
    }

    const lockKey = "ddv3-workpacket:" + packetId;
    const leases = rowsOf(await svc.entities.ControlLease.filter({ lock_key: lockKey, status: "held" }, "-created_date", 20));
    const lease = leases.find((row: any) => row.owner_id === workerId);
    if (!lease) {
      return Response.json({ error: "Active worker lease required", code: "DDV3_LEASE_REQUIRED" }, { status: 409 });
    }
    const expires = Date.parse(lease.lease_expires_at || "");
    if (!Number.isFinite(expires) || expires <= Date.now()) {
      return Response.json({ error: "Worker lease expired", code: "DDV3_LEASE_EXPIRED" }, { status: 409 });
    }

    if (outcome === "PASSED" && String(packet.validation_requirements || "").trim()) {
      const receipts = [];
      for (const receiptId of receiptIds) {
        const rows = rowsOf(await svc.entities.ValidationReceipt.filter({ receipt_id: receiptId }, "-timestamp", 1));
        if (rows[0]) receipts.push(rows[0]);
      }

      const independentPass = receipts.some((receipt: any) =>
        receipt.work_packet_id === packetId &&
        receipt.status === "PASS" &&
        String(receipt.validator || "").trim() &&
        receipt.validator !== workerId
      );

      if (!independentPass) {
        return Response.json({
          error: "Independent PASS validation receipt required before marking packet PASSED.",
          code: "DDV3_INDEPENDENT_VALIDATION_REQUIRED",
        }, { status: 409 });
      }
    }

    await svc.entities.WorkPacket.update(packet.id, { status: outcome });
    await svc.entities.ControlLease.update(lease.id, {
      status: "released",
      released_at: new Date().toISOString(),
      heartbeat_at: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      packet_id: packetId,
      outcome,
      lease_released: true,
      independent_validation_required: Boolean(String(packet.validation_requirements || "").trim()),
    });
  } catch (error: any) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
