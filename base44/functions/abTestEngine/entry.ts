import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";

// Deterministic hash for consistent visitor bucketing
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Normal CDF approximation (Abramowitz & Stegun 26.2.17)
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

// Two-proportion z-test
function zTest(convA: number, impA: number, convB: number, impB: number) {
  if (impA < 1 || impB < 1) return { z: 0, pValue: 1, significant: false };
  const pA = convA / impA;
  const pB = convB / impB;
  const pPooled = (convA + convB) / (impA + impB);
  if (pPooled === 0 || pPooled === 1) return { z: 0, pValue: 1, significant: false };
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / impA + 1 / impB));
  if (se === 0) return { z: 0, pValue: 1, significant: false };
  const z = (pB - pA) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  return { z, pValue, significant: pValue < 0.05 };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ── ASSIGN: Get variant assignments for a visitor (public) ──
    if (action === "assign") {
      const { page_path, visitor_id } = body;
      if (!page_path) return Response.json({ error: "page_path required" }, { status: 400 });

      const db = base44.asServiceRole;
      const page = await db.entities.ABTest.filter(
        { status: "running", page_path },
        { limit: 10 }
      );
      const tests = page.items || page;

      const assignments = [];
      for (const test of tests) {
        const bucket = hash((visitor_id || "anon") + test.id) % 100;
        const variant = bucket < (test.traffic_split || 50) ? "a" : "b";
        assignments.push({
          test_id: test.id,
          test_name: test.name,
          variant,
          config: variant === "a" ? {
            headline: test.variant_a_headline,
            subheadline: test.variant_a_subheadline,
            cta_text: test.variant_a_cta_text,
            cta_color: test.variant_a_cta_color,
          } : {
            headline: test.variant_b_headline,
            subheadline: test.variant_b_subheadline,
            cta_text: test.variant_b_cta_text,
            cta_color: test.variant_b_cta_color,
          },
          conversion_event: test.conversion_event,
        });
      }

      return Response.json({ ok: true, assignments });
    }

    // ── TRACK: Record impression or conversion (public) ──
    if (action === "track") {
      const { test_id, variant, event_type } = body;
      if (!test_id || !variant || !event_type) {
        return Response.json({ error: "test_id, variant, event_type required" }, { status: 400 });
      }

      const db = base44.asServiceRole;
      const test = await db.entities.ABTest.get(test_id);
      if (!test) return Response.json({ error: "Test not found" }, { status: 404 });

      const field =
        event_type === "conversion"
          ? (variant === "a" ? "conversions_a" : "conversions_b")
          : (variant === "a" ? "impressions_a" : "impressions_b");

      await db.entities.ABTest.update(test_id, { [field]: (test[field] || 0) + 1 });
      return Response.json({ ok: true });
    }

    // ── Admin actions (require auth) ──
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (action === "list") {
      const page = await base44.entities.ABTest.filter({}, { sort: "-created_date", limit: 100 });
      return Response.json({ ok: true, tests: page.items || page });
    }

    if (action === "create") {
      const test = await base44.entities.ABTest.create({
        name: body.name,
        description: body.description || "",
        page_path: body.page_path,
        status: body.status || "draft",
        traffic_split: body.traffic_split || 50,
        variant_a_label: body.variant_a_label || "Control (A)",
        variant_b_label: body.variant_b_label || "Variant (B)",
        variant_a_headline: body.variant_a_headline || "",
        variant_a_subheadline: body.variant_a_subheadline || "",
        variant_a_cta_text: body.variant_a_cta_text || "",
        variant_a_cta_color: body.variant_a_cta_color || "",
        variant_b_headline: body.variant_b_headline || "",
        variant_b_subheadline: body.variant_b_subheadline || "",
        variant_b_cta_text: body.variant_b_cta_text || "",
        variant_b_cta_color: body.variant_b_cta_color || "",
        conversion_event: body.conversion_event || "funnel_started",
        impressions_a: 0,
        conversions_a: 0,
        impressions_b: 0,
        conversions_b: 0,
        winner: "none",
      });
      return Response.json({ ok: true, test });
    }

    if (action === "update") {
      const { test_id, ...updates } = body;
      if (!test_id) return Response.json({ error: "test_id required" }, { status: 400 });

      if (updates.status === "running" && !updates.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (updates.status === "completed" && !updates.ended_at) {
        updates.ended_at = new Date().toISOString();
      }

      const test = await base44.entities.ABTest.update(test_id, updates);
      return Response.json({ ok: true, test });
    }

    if (action === "delete") {
      const { test_id } = body;
      if (!test_id) return Response.json({ error: "test_id required" }, { status: 400 });
      await base44.entities.ABTest.delete(test_id);
      return Response.json({ ok: true });
    }

    if (action === "results") {
      const { test_id } = body;
      if (!test_id) return Response.json({ error: "test_id required" }, { status: 400 });

      const test = await base44.entities.ABTest.get(test_id);
      if (!test) return Response.json({ error: "Test not found" }, { status: 404 });

      const crA = test.impressions_a > 0 ? (test.conversions_a / test.impressions_a * 100) : 0;
      const crB = test.impressions_b > 0 ? (test.conversions_b / test.impressions_b * 100) : 0;
      const lift = crA > 0 ? ((crB - crA) / crA * 100) : 0;
      const stats = zTest(test.conversions_a, test.impressions_a, test.conversions_b, test.impressions_b);

      let winner = test.winner;
      if (test.status === "running" && stats.significant) {
        winner = crB > crA ? "b" : "a";
      }

      return Response.json({
        ok: true,
        test,
        metrics: { cr_a: crA, cr_b: crB, lift, z_score: stats.z, p_value: stats.pValue, significant: stats.significant, winner },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("[abTestEngine] error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}