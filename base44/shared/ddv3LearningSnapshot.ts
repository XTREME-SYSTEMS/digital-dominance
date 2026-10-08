import { compileDDV3LearningMetrics } from "./ddv3LearningMetrics.js";

async function listRecent(entity: any, limit = 500) {
  const rows = await entity.list("-created_date", limit);
  return rows?.items || rows || [];
}

export async function createDDV3LearningSnapshot(
  svc: any,
  { periodDays = 30, qualifiedLeadThreshold = 60, now = new Date() } = {}
) {
  const [leads, events, receipts] = await Promise.all([
    listRecent(svc.entities.Lead, 500),
    listRecent(svc.entities.FunnelEvent, 1000),
    listRecent(svc.entities.ValidationReceipt, 1000),
  ]);

  const metrics = compileDDV3LearningMetrics({
    leads,
    events,
    validationReceipts: receipts,
    periodDays,
    qualifiedLeadThreshold,
    now,
  });

  const sampleCapped =
    leads.length >= 500 ||
    events.length >= 1000 ||
    receipts.length >= 1000;

  const bucket = now.toISOString().slice(0, 13).replace(/[-T:]/g, "");
  const snapshotId = `ddv3_learning_${periodDays}d_${bucket}`;

  const existing = await svc.entities.DDV3LearningSnapshot.filter(
    { snapshot_id: snapshotId },
    "-created_date",
    1
  );
  const rows = existing?.items || existing || [];
  if (rows[0]) return rows[0];

  return svc.entities.DDV3LearningSnapshot.create({
    snapshot_id: snapshotId,
    ...metrics,
    recommendations_json: JSON.stringify(metrics.recommendations).slice(0, 10000),
    sample_capped: sampleCapped,
    created_at: now.toISOString(),
  });
}
