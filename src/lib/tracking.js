import { base44 } from "@/api/base44Client";

export function getSessionId() {
  let id = localStorage.getItem("gf_session");
  if (!id) {
    id = globalThis.crypto?.randomUUID?.() || (Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem("gf_session", id);
  }
  return id;
}

export function getDeviceType() {
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export function trackEvent(event, meta = {}) {
  const payload = { event, session_id: getSessionId(), meta: JSON.stringify(meta) };
  if (meta.lead_id) payload.lead_id = meta.lead_id;
  base44.analytics.track({ eventName: event, properties: meta });
  return base44.entities.FunnelEvent.create(payload).catch(() => null);
}

export async function linkLeadAttribution(leadId, meta = {}) {
  if (!leadId) return { ok: false, error: "lead_id required" };
  const session_id = getSessionId();

  await trackEvent("lead_created", { ...meta, lead_id: leadId });

  try {
    const res = await base44.functions.invoke("bindFunnelSessionToLead", {
      lead_id: leadId,
      session_id,
    });
    return res?.data || res || { ok: true };
  } catch {
    // Attribution repair must never block the customer funnel.
    return { ok: false, session_id };
  }
}
