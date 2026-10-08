function pct(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function rate(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 10000) / 10000;
}

function moneyPer(num, den) {
  if (!den) return 0;
  return Math.round((num / den) * 100) / 100;
}

function dateOf(row, keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (!value) continue;
    const ms = Date.parse(value);
    if (Number.isFinite(ms)) return ms;
  }
  return 0;
}

export function compileDDV3LearningMetrics({
  leads = [],
  events = [],
  validationReceipts = [],
  periodDays = 30,
  qualifiedLeadThreshold = 60,
  now = new Date(),
} = {}) {
  const nowMs = now.getTime();
  const cutoffMs = nowMs - periodDays * 24 * 60 * 60 * 1000;

  const periodLeads = leads.filter((row) => {
    const ms = dateOf(row, ["created_date", "attribution_captured_at", "updated_date"]);
    return ms >= cutoffMs && ms <= nowMs;
  });
  const periodEvents = events.filter((row) => {
    const ms = dateOf(row, ["created_date", "updated_date"]);
    return ms >= cutoffMs && ms <= nowMs;
  });
  const periodReceipts = validationReceipts.filter((row) => {
    const ms = dateOf(row, ["timestamp", "created_date", "updated_date"]);
    return ms >= cutoffMs && ms <= nowMs;
  });

  const sessions = new Set(periodEvents.map((e) => e.session_id).filter(Boolean)).size;
  const linkedEvents = periodEvents.filter((e) => e.lead_id).length;
  const linkedLeads = periodLeads.filter((l) => l.session_id).length;
  const utmLeads = periodLeads.filter((l) =>
    l.first_utm_source || l.last_utm_source || l.utm_source ||
    l.first_utm_campaign || l.last_utm_campaign || l.utm_campaign
  ).length;
  const qualifiedLeads = periodLeads.filter((l) => Number(l.lead_score || 0) >= qualifiedLeadThreshold).length;
  const wonLeads = periodLeads.filter((l) => l.status === "WON" || Number(l.won_value || 0) > 0).length;

  const bookedClosedWonRevenue = periodLeads.reduce(
    (sum, l) => sum + Math.max(0, Number(l.won_value || 0)),
    0
  );
  const collectedRevenue = periodLeads.reduce(
    (sum, l) => sum + (
      l.revenue_evidence_class === "collected"
        ? Math.max(0, Number(l.actual_revenue || 0))
        : 0
    ),
    0
  );
  const verifiedGrossProfit = periodLeads.reduce(
    (sum, l) => sum + (
      l.margin_evidence_class === "verified"
        ? Number(l.actual_gross_profit || 0)
        : 0
    ),
    0
  );

  const passReceipts = periodReceipts.filter((r) => r.status === "PASS").length;
  const decisiveReceipts = periodReceipts.filter((r) =>
    ["PASS", "FAIL", "BLOCKED", "MISSING_EVIDENCE"].includes(r.status)
  ).length;

  const attributionCoverage = pct(linkedLeads, periodLeads.length);
  const eventLinkCoverage = pct(linkedEvents, periodEvents.length);
  const validationPassRate = pct(passReceipts, decisiveReceipts);

  let dataQualityState = "insufficient";
  if (
    sessions >= 30 &&
    periodLeads.length >= 5 &&
    attributionCoverage >= 50 &&
    eventLinkCoverage >= 50
  ) {
    dataQualityState = "partial";
  }
  if (
    sessions >= 100 &&
    periodLeads.length >= 15 &&
    attributionCoverage >= 90 &&
    eventLinkCoverage >= 90 &&
    decisiveReceipts >= 10 &&
    validationPassRate >= 90 &&
    wonLeads >= 1
  ) {
    dataQualityState = "decision_grade";
  }

  const recommendations = [];
  if (periodLeads.length && attributionCoverage < 90) {
    recommendations.push({
      code: "REPAIR_LEAD_ATTRIBUTION",
      priority: "high",
      reason: `Only ${attributionCoverage}% of leads are session-linked.`,
      risk_class: "BRANCH_WRITE",
      auto_execute: false,
    });
  }
  if (periodEvents.length && eventLinkCoverage < 90) {
    recommendations.push({
      code: "REPAIR_EVENT_LINKAGE",
      priority: "high",
      reason: `Only ${eventLinkCoverage}% of funnel events are linked to a lead.`,
      risk_class: "BRANCH_WRITE",
      auto_execute: false,
    });
  }
  if (wonLeads > 0 && collectedRevenue <= 0) {
    recommendations.push({
      code: "CONNECT_COLLECTED_REVENUE",
      priority: "high",
      reason: "Closed-won/booked value exists but verified collected revenue is absent.",
      risk_class: "DRAFT",
      auto_execute: false,
    });
  }
  if (collectedRevenue > 0 && verifiedGrossProfit === 0) {
    recommendations.push({
      code: "CONNECT_MARGIN_EVIDENCE",
      priority: "medium",
      reason: "Collected revenue exists but verified fulfillment cost/gross profit is absent.",
      risk_class: "DRAFT",
      auto_execute: false,
    });
  }
  if (decisiveReceipts > 0 && validationPassRate < 90) {
    recommendations.push({
      code: "IMPROVE_VALIDATION_RELIABILITY",
      priority: "high",
      reason: `Validation pass rate is ${validationPassRate}%.`,
      risk_class: "BRANCH_WRITE",
      auto_execute: false,
    });
  }
  if (sessions < 100) {
    recommendations.push({
      code: "INSUFFICIENT_SAMPLE_FOR_OPTIMIZATION",
      priority: "info",
      reason: `Only ${sessions} sessions are present in the selected window.`,
      risk_class: "READ",
      auto_execute: false,
    });
  }
  if (dataQualityState === "decision_grade") {
    recommendations.push({
      code: "ELIGIBLE_FOR_CONTROLLED_EXPERIMENT",
      priority: "medium",
      reason: "First-party attribution and validation coverage are decision-grade. Controlled experiments may be proposed.",
      risk_class: "DRAFT",
      auto_execute: false,
    });
  }

  return {
    period_days: periodDays,
    window_start: new Date(cutoffMs).toISOString(),
    window_end: now.toISOString(),
    source_class: "FIRST_PARTY",
    sessions,
    funnel_events: periodEvents.length,
    linked_funnel_events: linkedEvents,
    leads: periodLeads.length,
    session_linked_leads: linkedLeads,
    utm_attributed_leads: utmLeads,
    qualified_leads: qualifiedLeads,
    qualified_lead_threshold: qualifiedLeadThreshold,
    won_leads: wonLeads,
    booked_closed_won_revenue: Math.round(bookedClosedWonRevenue * 100) / 100,
    collected_revenue: Math.round(collectedRevenue * 100) / 100,
    verified_gross_profit: Math.round(verifiedGrossProfit * 100) / 100,
    lead_conversion_rate: rate(periodLeads.length, sessions),
    qualified_lead_rate: rate(qualifiedLeads, sessions),
    attribution_coverage_pct: attributionCoverage,
    event_link_coverage_pct: eventLinkCoverage,
    booked_revenue_per_session: moneyPer(bookedClosedWonRevenue, sessions),
    collected_revenue_per_session: moneyPer(collectedRevenue, sessions),
    gross_profit_per_session: moneyPer(verifiedGrossProfit, sessions),
    validation_receipts: decisiveReceipts,
    validation_pass_rate: validationPassRate,
    data_quality_state: dataQualityState,
    recommendations,
  };
}
