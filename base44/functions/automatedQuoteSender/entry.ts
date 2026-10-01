import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// ═══════════════════════════════════════════════════════════════════════════
// automatedQuoteSender — Automated Digital Quote Generator & Sender
//
// Finds leads that haven't received a quote email yet, calculates their
// estimate, and sends them a branded quote via Gmail — fully automated.
//
// Can be triggered by:
//   1. A workflow (entity trigger on Lead creation, or scheduled)
//   2. Manual call from admin UI
//
// Actions:
//   - processLead: Process a single lead by ID (calculate estimate + send email)
//   - processBatch: Find all leads needing quotes and process them
//   - status: Show how many leads are waiting for quotes
// ═══════════════════════════════════════════════════════════════════════════

// ── Server-side pricing calculation (mirrors src/lib/pricing.js) ───────────

function calcSquareFootage(settings: any, data: any): number {
  if (data.garage_size === "custom") {
    const l = Number(data.custom_length) || 0;
    const w = Number(data.custom_width) || 0;
    return Math.round(l * w);
  }
  const d = settings.size_defaults || {};
  return d[data.garage_size] || d.not_sure || 440;
}

function calcEstimate(settings: any, data: any) {
  const sqft = data.square_footage || calcSquareFootage(settings, data);
  const system = (settings.systems || []).find((s: any) => s.key === data.desired_system) || (settings.systems || [])[0];
  const base = sqft * (system?.price_per_sqft || 8);

  const selected = data.floor_condition || [];
  const adjPercent = (settings.condition_adjustments || [])
    .filter((c: any) => selected.includes(c.key))
    .reduce((sum: number, c: any) => sum + (Number(c.percent) || 0), 0);

  let mid = base * (1 + adjPercent / 100);
  mid = Math.max(mid, Number(settings.minimum_project_price) || 0);

  const low = Math.round((mid * (1 - (Number(settings.range_low_percent) || 0) / 100)) / 50) * 50;
  const high = Math.round((mid * (1 + (Number(settings.range_high_percent) || 0) / 100)) / 50) * 50;

  const packages = (settings.packages || []).map((p: any) => ({
    tier: p.tier,
    name: p.name,
    description: p.description,
    low: Math.round((low * (p.multiplier || 1)) / 50) * 50,
    high: Math.round((high * (p.multiplier || 1)) / 50) * 50,
  }));

  return { sqft, mid: Math.round(mid), low, high, packages, system };
}

// ── Check if a lead already has a sent estimate email ──────────────────────

async function hasExistingEmail(base44: any, leadId: string): Promise<boolean> {
  try {
    const logs = await base44.asServiceRole.entities.EmailLog.filter(
      { lead_id: leadId, type: "estimate", status: "sent" },
      { limit: 1 }
    );
    return (logs.items || logs || []).length > 0;
  } catch {
    return false;
  }
}

// ── Process a single lead: calculate estimate + send quote email ────────────

async function processLead(base44: any, leadId: string): Promise<any> {
  const lead = await base44.asServiceRole.entities.Lead.get(leadId);
  if (!lead) return { lead_id: leadId, status: "error", error: "Lead not found" };

  // Skip if already emailed
  if (await hasExistingEmail(base44, leadId)) {
    return { lead_id: leadId, status: "skipped", reason: "already_emailed" };
  }

  // Get settings
  const settingsList = await base44.asServiceRole.entities.AppSettings.list(1);
  const settings = settingsList[0] || {};

  // Calculate estimate if not already set
  let updateData: any = {};
  if (!lead.estimate_mid) {
    const est = calcEstimate(settings, {
      garage_size: lead.garage_size,
      square_footage: lead.square_footage,
      floor_condition: lead.floor_condition,
      desired_system: lead.desired_system || "flake",
    });
    updateData = {
      square_footage: est.sqft,
      estimate_mid: est.mid,
      estimate_low: est.low,
      estimate_high: est.high,
      package_options: est.packages,
    };
    await base44.asServiceRole.entities.Lead.update(leadId, updateData);
    Object.assign(lead, updateData);
  }

  // Send the quote email via the sendEstimateEmail function
  // We call it via HTTP since we're in a backend function
  const appUrl = secrets.get("WIX_CHECKOUT_APP_URL") || "https://epoxyquotenearme.base44.app";
  try {
    const res = await fetch(`${appUrl}/api/functions/sendEstimateEmail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: leadId,
        floor_image_url: (lead.photos || [])[0] || undefined,
        origin: appUrl,
      }),
    });
    const result = await res.json();
    if (res.ok && result.ok) {
      return { lead_id: leadId, status: "sent", message_id: result.messageId };
    }
    return { lead_id: leadId, status: "failed", error: result.error || `HTTP ${res.status}` };
  } catch (err: any) {
    return { lead_id: leadId, status: "failed", error: err.message };
  }
}

// ── Main handler ────────────────────────────────────────────────────────────

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    // ── STATUS: How many leads need quotes? ──
    if (action === "status") {
      const newLeads = await base44.asServiceRole.entities.Lead.count({ status: "NEW ESTIMATE" });
      return Response.json({
        ok: true,
        new_leads: newLeads,
        message: `${newLeads} leads awaiting quote emails`,
      });
    }

    // ── PROCESS SINGLE LEAD ──
    if (action === "processLead") {
      const leadId = body.lead_id;
      if (!leadId) return Response.json({ error: "lead_id required" }, { status: 400 });
      const result = await processLead(base44, leadId);
      return Response.json({ ok: true, ...result });
    }

    // ── PROCESS BATCH: Find leads needing quotes and send them ──
    if (action === "processBatch") {
      const limit = body.limit || 10;
      // Find leads with status "NEW ESTIMATE" that haven't been emailed yet
      const page = await base44.asServiceRole.entities.Lead.filter(
        { status: "NEW ESTIMATE" },
        { sort: "-created_date", limit }
      );

      const results: any[] = [];
      for (const lead of page.items || []) {
        const result = await processLead(base44, lead.id);
        results.push(result);
      }

      const sent = results.filter(r => r.status === "sent").length;
      const skipped = results.filter(r => r.status === "skipped").length;
      const failed = results.filter(r => r.status === "failed").length;

      return Response.json({
        ok: true,
        processed: results.length,
        sent,
        skipped,
        failed,
        results,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("[automatedQuoteSender] Fatal:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}