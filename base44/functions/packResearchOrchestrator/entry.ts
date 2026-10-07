import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import { generateText } from "../../shared/aiGateway.ts";
import { PACK_DESIGN_CONSTITUTION, researchGateFailures } from "../../shared/packDesignConstitution.ts";

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function uniqueStrings(values: any[]): string[] {
  return [...new Set((values || []).filter((v) => typeof v === "string" && v.trim()).map((v) => v.trim()))];
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin required" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || "research";
    if (action === "constitution") return Response.json({ ok: true, constitution: PACK_DESIGN_CONSTITUTION });
    if (action !== "research") return Response.json({ error: "Unknown action" }, { status: 400 });

    const projectName = String(body.project_name || body.projectName || "").trim();
    const requestText = String(body.request || body.vision || body.prompt || "").trim();
    const industry = String(body.industry || "").trim();
    const subIndustry = String(body.sub_industry || body.subIndustry || "").trim();
    const geography = String(body.geography || "United States").trim();
    const requestedPackTypes = Array.isArray(body.requested_pack_types) ? body.requested_pack_types : ["logo_pack","brand_pack","web_pack"];
    const appRequested = requestedPackTypes.includes("app_pack");
    if (!projectName || !industry || !requestText) return Response.json({ error: "project_name, industry, and request are required" }, { status: 400 });

    const svc = base44.asServiceRole;
    const dossierId = "prd_" + crypto.randomUUID();
    const bundleId = "pgb_" + crypto.randomUUID();
    const startedAt = new Date();

    const draft = await svc.entities.PackResearchDossier.create({
      owner_id: user.id || user.email || "admin",
      dossier_id: dossierId,
      request_id: body.request_id || "",
      project_name: projectName,
      requested_pack_types: requestedPackTypes,
      industry,
      sub_industry: subIndustry,
      geography,
      browser_executor: "shadowBrowse/cloudBrowser",
      research_started_at: startedAt.toISOString(),
      research_status: "researching",
      source_count: 0,
      source_urls: [],
      benchmark_competitors: [],
      competitor_research: [],
      niche_research: [],
      trend_research: [],
      keyword_research: [],
      retail_pricing: [],
      top_products_services: [],
      design_patterns: [],
      funnel_patterns: [],
      verified_claims: [],
      unknowns: [],
      blockers: [],
      freshness_hours: Number(body.freshness_hours || 24),
      notes: "Mandatory pre-design research gate"
    });

    const discoveryPrompt =
      "You are the research director for a world-class product and conversion design team.\n" +
      "PROJECT: " + projectName + "\nREQUEST: " + requestText + "\nINDUSTRY: " + industry + "\nSUB-INDUSTRY: " + (subIndustry || "not specified") + "\nGEOGRAPHY: " + geography + "\n\n" +
      "Find the THREE strongest current benchmark websites/apps/systems for this exact request. Prefer category leaders with strong reputation, market presence, conversion UX, product quality, or user ratings where verifiable. Never fabricate ratings. If a numeric rating is not verified, return UNKNOWN. " +
      "For each benchmark return name, url, why_benchmark, rating_or_reputation, rating_source, business_model, target_market, primary_offer, likely_conversion_goal. " +
      "Also return authoritative source URLs useful for industry financials, pricing, trends, products/services, and search demand.";

    const { parsed: discovery } = await generateText({
      model: "gemini_3_flash",
      add_context_from_internet: true,
      prompt: discoveryPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          benchmarks: { type: "array", items: { type: "object", properties: {
            name:{type:"string"},url:{type:"string"},why_benchmark:{type:"string"},
            rating_or_reputation:{type:"string"},rating_source:{type:"string"},
            business_model:{type:"string"},target_market:{type:"string"},
            primary_offer:{type:"string"},likely_conversion_goal:{type:"string"}
          }}},
          source_urls: { type:"array", items:{type:"string"} }
        }
      }
    });

    const benchmarks = Array.isArray(discovery?.benchmarks) ? discovery.benchmarks.filter((x:any) => x?.url).slice(0,3) : [];
    const reverseEngineered:any[] = [];
    const browseBlockers:string[] = [];

    for (const benchmark of benchmarks) {
      try {
        const prompt = "Reverse-engineer this benchmark for an ORIGINAL high-end design system. Extract information architecture, hero and CTA, navigation, typography hierarchy, color/contrast, grid/spacing, card/form/button patterns, trust modules, funnel sequence, pricing/offer presentation, product merchandising, mobile/responsive clues, interaction/motion clues, strengths, weaknesses, and adaptable ideas. Do not copy protected creative assets.";
        const browseRes:any = await base44.functions.invoke("shadowBrowse", { action:"extract", url:benchmark.url, stealth:true, prompt });
        const data = browseRes?.data || browseRes || {};
        if (data.blocked || data.error) browseBlockers.push(benchmark.url + ": " + (data.error || "browser blocked"));
        reverseEngineered.push({ ...benchmark, browser_result:data.result || data.text || "", browser_meta:{ textChars:data.textChars || 0, blocked:!!data.blocked, method:data.method || "cloudBrowser" } });
      } catch (e:any) {
        browseBlockers.push(benchmark.url + ": " + e.message);
        reverseEngineered.push({ ...benchmark, browser_error:e.message });
      }
    }

    const synthesisPrompt =
      "Compile a mandatory pre-design research dossier. NEVER invent numeric market sizes, search volumes, ratings, or prices. If not verifiable from fresh web evidence, use null and status UNKNOWN.\n" +
      "PROJECT: " + projectName + "\nREQUEST: " + requestText + "\nINDUSTRY: " + industry + "\nSUB-INDUSTRY: " + (subIndustry || "not specified") + "\nGEOGRAPHY: " + geography + "\n\n" +
      "TOP 3 BENCHMARKS:\n" + JSON.stringify(benchmarks) + "\n\nBROWSER REVERSE ENGINEERING:\n" + JSON.stringify(reverseEngineered).slice(0,40000) + "\n\n" +
      "Return industry_research; financial_research with sourced market/revenue signals, unit economics, cost drivers and spend patterns; business_model_research; at least 5 niche_research rows; at least 5 current trend_research rows; at least 10 high-intent keyword_research rows with intent, source, volume if sourced and volume_status VERIFIED or UNKNOWN; target_market; at least 3 retail_pricing rows with sources; at least 5 top_products_services; at least 5 design_patterns; at least 3 funnel_patterns; seo_aeo_geo_findings including what NOT to do; verified_claims with sources; unknowns; and all source_urls.";

    const { parsed: synthesis } = await generateText({
      model:"gemini_3_flash",
      add_context_from_internet:true,
      prompt:synthesisPrompt,
      response_json_schema:{
        type:"object",
        properties:{
          industry_research:{type:"object"}, financial_research:{type:"object"}, business_model_research:{type:"object"},
          niche_research:{type:"array",items:{type:"object"}}, trend_research:{type:"array",items:{type:"object"}},
          keyword_research:{type:"array",items:{type:"object"}}, target_market:{type:"object"},
          retail_pricing:{type:"array",items:{type:"object"}}, top_products_services:{type:"array",items:{type:"object"}},
          design_patterns:{type:"array",items:{type:"object"}}, funnel_patterns:{type:"array",items:{type:"object"}},
          seo_aeo_geo_findings:{type:"object"}, verified_claims:{type:"array",items:{type:"object"}},
          unknowns:{type:"array",items:{type:"string"}}, source_urls:{type:"array",items:{type:"string"}}
        }
      }
    });

    const sourceUrls = uniqueStrings([...(discovery?.source_urls || []), ...(synthesis?.source_urls || []), ...benchmarks.map((b:any) => b.url)]);
    const completedAt = new Date();
    const freshnessHours = Number(body.freshness_hours || 24);
    const expiresAt = new Date(completedAt.getTime() + freshnessHours * 3600000);
    const evidenceHash = await sha256(JSON.stringify({ benchmarks, reverseEngineered, synthesis, sourceUrls }));

    const dossier:any = {
      owner_id:user.id || user.email || "admin",
      dossier_id:dossierId, project_name:projectName, requested_pack_types:requestedPackTypes,
      industry, sub_industry:subIndustry, geography, browser_executor:"shadowBrowse/cloudBrowser",
      research_started_at:startedAt.toISOString(), research_completed_at:completedAt.toISOString(),
      research_status:"researching", source_count:sourceUrls.length, source_urls:sourceUrls,
      benchmark_competitors:benchmarks, competitor_research:reverseEngineered,
      industry_research:synthesis?.industry_research || {}, financial_research:synthesis?.financial_research || {},
      business_model_research:synthesis?.business_model_research || {}, niche_research:synthesis?.niche_research || [],
      trend_research:synthesis?.trend_research || [], keyword_research:synthesis?.keyword_research || [],
      target_market:synthesis?.target_market || {}, retail_pricing:synthesis?.retail_pricing || [],
      top_products_services:synthesis?.top_products_services || [], design_patterns:synthesis?.design_patterns || [],
      funnel_patterns:synthesis?.funnel_patterns || [], seo_aeo_geo_findings:synthesis?.seo_aeo_geo_findings || {},
      verified_claims:synthesis?.verified_claims || [], unknowns:synthesis?.unknowns || [],
      blockers:browseBlockers, evidence_sha256:evidenceHash, freshness_hours:freshnessHours,
      expires_at:expiresAt.toISOString(), notes:"Pack Design Constitution " + PACK_DESIGN_CONSTITUTION.constitution_version
    };

    const failures = researchGateFailures(dossier);
    const finalStatus = failures.length ? "blocked" : "ready";
    const qualityScore = Math.max(0, Math.round(100 - failures.length * 10));
    await svc.entities.PackResearchDossier.update(draft.id, {
      ...dossier,
      research_status:finalStatus,
      quality_score:qualityScore,
      blockers:uniqueStrings([...(dossier.blockers || []), ...failures])
    });

    await svc.entities.PackGenerationBundle.create({
      owner_id:user.id || user.email || "admin",
      bundle_id:bundleId, dossier_id:dossierId, project_name:projectName,
      status:finalStatus === "ready" ? "research_ready" : "blocked",
      logo_required:10, brand_required:10, web_required:10, app_required:appRequested ? 10 : 0,
      logo_generated:0, brand_generated:0, web_generated:0, app_generated:0,
      research_gate_passed:finalStatus === "ready", visual_quality_floor:99, operational_quality_floor:100,
      created_at_iso:completedAt.toISOString(), updated_at_iso:completedAt.toISOString(),
      notes: failures.length ? "Research gate blocked: " + failures.join(", ") : "Research gate PASS. Generate 10 logos, 10 brand packs, 10 web packs, and 10 app packs when requested."
    });

    return Response.json({
      ok:true, dossier_id:dossierId, bundle_id:bundleId, research_status:finalStatus,
      research_gate_passed:finalStatus === "ready", quality_score:qualityScore, failures,
      browser_blockers:browseBlockers, benchmarks, source_count:sourceUrls.length,
      generation_requirements:{ logo_pack:10, brand_pack:10, web_pack:10, app_pack:appRequested ? 10 : 0 },
      constitution_version:PACK_DESIGN_CONSTITUTION.constitution_version,
      next_state: finalStatus === "ready" ? "GENERATE_10_VARIANTS_PER_REQUIRED_PACK_TYPE" : "REPAIR_RESEARCH_GAPS"
    });
  } catch (e:any) {
    console.error("[packResearchOrchestrator]", e);
    return Response.json({ error:e.message || "Research orchestration failed" }, { status:500 });
  }
}
