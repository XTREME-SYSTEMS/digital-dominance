import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { patchCore } from "../../shared/aiGateway.ts";
import { secrets } from "base44:runtime";

// ═══════════════════════════════════════════════════════════════════════════
// universalDominanceEngine — Master orchestrator for the full autonomous
// digital dominance system. Runs the 8-step autonomous loop end-to-end.
//
// Actions:
//   run_autonomous_cycle  — full 8-step loop
//   sense_demand          — L1: pull analytics + trends → identify demand
//   match_template        — L2: match demand to industry template
//   generate_site         — L3: GPT generates a full site from template
//   provision_site        — L4: deploy to Vercel + Supabase + domain
//   schedule_social       — L5: create 30-60 day social calendar
//   sync_gpt              — bi-directional GPT sync
//   sync_local            — sync with Dell Ryzen local machine
//   get_status            — full system status across all 7 layers
//   queue_batch           — queue batch of websites for an industry
// ═══════════════════════════════════════════════════════════════════════════

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

    const svc = base44.asServiceRole;
    patchCore(base44);
    patchCore(svc);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "get_status";

    // DDV3 hard gate: these legacy actions bypass the governed
    // BuildPacket -> preview -> validate -> approval release flow.
    // They are retired as direct execution paths rather than protected by
    // a caller-supplied boolean/token that an old agent could accidentally set.
    const retiredDirectActions = new Set([
      "provision_site",
      "schedule_social",
      "queue_batch",
      "run_autonomous_cycle",
    ]);
    if (retiredDirectActions.has(action)) {
      return Response.json({
        ok: false,
        blocked: true,
        code: "DDV3_GOVERNED_FACTORY_REQUIRED",
        error: "Legacy direct action retired. Use compileWebsiteBuildPacket and the governed preview/validation/approval workflow.",
        action,
      }, { status: 403 });
    }

    switch (action) {
      // ═══════════════════════════════════════════════════════════════════
      // GET STATUS
      // ═══════════════════════════════════════════════════════════════════
      case "get_status": {
        const [templates, queueItems, socialPosts, sites] = await Promise.all([
          svc.entities.UniversalIndustryTemplate.list("-created_date", 100).catch(() => []),
          svc.entities.WebsiteQueue.list("-created_date", 50).catch(() => []),
          svc.entities.SocialPost.list("-created_date", 50).catch(() => []),
          svc.entities.WebsiteTemplate.list("-created_date", 50).catch(() => []),
        ]);

        const activeTemplates = templates.filter((t: any) => t.template_status === "active");
        const queuedSites = queueItems.filter((q: any) => ["queued", "building", "deploying"].includes(q.status));
        const scheduledPosts = socialPosts.filter((p: any) => p.status === "scheduled");
        const liveSites = sites.filter((s: any) => s.status === "live");

        return Response.json({
          ok: true,
          layers: {
            L1_INTELLIGENCE: { status: "active", demand_signals: 0 },
            L2_TEMPLATES: { status: "active", total: templates.length, active: activeTemplates.length },
            L3_GENERATION: { status: "active", gateway: "vercel_ai_gateway" },
            L4_PROVISIONING: { status: "active", queued: queuedSites.length, live: liveSites.length },
            L5_SOCIAL: { status: "active", scheduled_posts: scheduledPosts.length },
            L6_ANALYTICS: { status: "active", feedback_loop: "connected" },
            L7_ORCHESTRATION: { status: "active", orchestrator: "alpha_prime" },
          },
          totals: {
            templates: templates.length,
            queued_sites: queuedSites.length,
            live_sites: liveSites.length,
            scheduled_posts: scheduledPosts.length,
          },
        });
      }

      // ═══════════════════════════════════════════════════════════════════
      // SENSE DEMAND — L1
      // ═══════════════════════════════════════════════════════════════════
      case "sense_demand": {
        let searchConsoleData: any = null;
        try {
          const scRes = await base44.functions.invoke("pullSearchConsoleData", { action: "query_performance", days: 30 });
          searchConsoleData = scRes.data || scRes;
        } catch (e) { searchConsoleData = { error: e.message }; }

        const demandAnalysis = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a demand intelligence analyst. Analyze these search performance metrics and identify underserved demand.

Search Console Data: ${JSON.stringify(searchConsoleData).slice(0, 3000)}

Identify:
1. TOP_OPPORTUNITIES: 10 queries with high impressions but low CTR
2. EMERGING_TRENDS: 5 rising topics that need new content
3. DEMAND_GAPS: 5 industries or sub-niches where demand exists but supply is thin
4. RECOMMENDED_BUILDS: 5 specific sites/pages that should be built

Return JSON with each section as an array of objects.`,
          response_json_schema: {
            type: "object",
            properties: {
              top_opportunities: { type: "array", items: { type: "object", properties: {
                query: { type: "string" }, impressions: { type: "number" }, ctr: { type: "number" }, opportunity_score: { type: "number" }, recommended_action: { type: "string" }
              } } },
              emerging_trends: { type: "array", items: { type: "object", properties: {
                topic: { type: "string" }, trend_direction: { type: "string" }, opportunity_score: { type: "number" }, recommended_action: { type: "string" }
              } } },
              demand_gaps: { type: "array", items: { type: "object", properties: {
                industry: { type: "string" }, sub_niche: { type: "string" }, demand_level: { type: "string" }, supply_level: { type: "string" }, opportunity_score: { type: "number" }
              } } },
              recommended_builds: { type: "array", items: { type: "object", properties: {
                type: { type: "string" }, industry: { type: "string" }, target_keyword: { type: "string" }, estimated_traffic: { type: "number" }, priority: { type: "string" }
              } } },
            },
          },
        });

        return Response.json({ ok: true, search_console_summary: searchConsoleData, demand_analysis: demandAnalysis });
      }

      // ═══════════════════════════════════════════════════════════════════
      // MATCH TEMPLATE — L2
      // ═══════════════════════════════════════════════════════════════════
      case "match_template": {
        const { industry, sub_niche, keyword } = body;
        if (!industry) return Response.json({ error: "industry required" }, { status: 400 });

        const templates = await svc.entities.UniversalIndustryTemplate.list("-created_date", 100);
        const match = templates.find((t: any) =>
          t.industry_id === industry.toLowerCase().replace(/\s+/g, "_") ||
          t.name.toLowerCase() === industry.toLowerCase() ||
          (t.sub_industries || []).some((s: string) => s.toLowerCase() === (sub_niche || "").toLowerCase())
        );

        if (match) {
          return Response.json({ ok: true, matched: true, template: match });
        }

        const newTemplate = await base44.integrations.Core.InvokeLLM({
          prompt: `Create a universal industry template for:
Industry: ${industry}
Sub-niche: ${sub_niche || "general"}
Target keyword: ${keyword || ""}

Generate a complete template config with brand config, website sections, Google requirements, social config, video config, and funnel config. Return as JSON.`,
          response_json_schema: {
            type: "object",
            properties: {
              brand_config: { type: "object" },
              website_sections: { type: "array" },
              google_requirements: { type: "object" },
              social_config: { type: "object" },
              video_config: { type: "object" },
              funnel_config: { type: "object" },
              niche_keywords: { type: "array", items: { type: "string" } },
              target_audience: { type: "string" },
              competition_level: { type: "string" },
            },
          },
        });

        const created = await svc.entities.UniversalIndustryTemplate.create({
          industry_id: industry.toLowerCase().replace(/\s+/g, "_"),
          name: industry,
          parent_industry: body.parent_industry || "General",
          sub_industries: sub_niche ? [sub_niche] : [],
          niche_keywords: newTemplate.niche_keywords || [],
          target_audience: newTemplate.target_audience || "",
          competition_level: newTemplate.competition_level || "medium",
          brand_config: newTemplate.brand_config || {},
          website_sections: newTemplate.website_sections || [],
          google_requirements: newTemplate.google_requirements || {},
          social_config: newTemplate.social_config || {},
          video_config: newTemplate.video_config || {},
          funnel_config: newTemplate.funnel_config || {},
          template_status: "configured",
        });

        return Response.json({ ok: true, matched: false, created: true, template: created });
      }

      // ═══════════════════════════════════════════════════════════════════
      // GENERATE SITE — L3
      // ═══════════════════════════════════════════════════════════════════
      case "generate_site": {
        const { template_id, city, state, business_name, domain } = body;
        if (!template_id) return Response.json({ error: "template_id required" }, { status: 400 });

        const templates = await svc.entities.UniversalIndustryTemplate.filter({ industry_id: template_id }, "-created_date", 1);
        const template = templates[0] || await svc.entities.UniversalIndustryTemplate.get(template_id);
        if (!template) return Response.json({ error: "Template not found" }, { status: 404 });

        const siteContent = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate a complete Google-compliant website for:
Industry: ${template.name}
Business: ${business_name || (city || "National") + " " + template.name}
Location: ${city || "National"}, ${state || "US"}
Brand: ${JSON.stringify(template.brand_config)}
Google Requirements: ${JSON.stringify(template.google_requirements)}

Generate full page content (2000+ words), meta tags, schema.org JSON-LD, FAQ section, all section content, CTA text, and internal linking structure. Return as JSON.`,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              meta_description: { type: "string" },
              h1: { type: "string" },
              content: { type: "string" },
              schema_markup: { type: "string" },
              faq: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
              sections: { type: "array" },
              cta_text: { type: "string" },
              internal_links: { type: "array", items: { type: "string" } },
            },
          },
        });

        const queueItem = await svc.entities.WebsiteQueue.create({
          template_id: template.industry_id,
          business_name: business_name || (city || "National") + " " + template.name,
          domain: domain || "",
          city: city || null,
          state: state || null,
          status: "queued",
          generated_content: JSON.stringify(siteContent),
          created_at: new Date().toISOString(),
        });

        return Response.json({ ok: true, template: template.name, site_content: siteContent, queue_item: queueItem.id, status: "queued_for_provisioning" });
      }

      // ═══════════════════════════════════════════════════════════════════
      // PROVISION SITE — L4
      // ═══════════════════════════════════════════════════════════════════
      case "provision_site": {
        const { queue_item_id } = body;
        if (!queue_item_id) return Response.json({ error: "queue_item_id required" }, { status: 400 });

        const queueItem = await svc.entities.WebsiteQueue.get(queue_item_id);
        if (!queueItem) return Response.json({ error: "Queue item not found" }, { status: 404 });

        await svc.entities.WebsiteQueue.update(queueItem.id, { status: "building" });
        const steps: any[] = [];

        // Domain
        if (!queueItem.domain) {
          try {
            const domainRes = await base44.functions.invoke("godaddyApi", { action: "check_and_register", keyword: queueItem.business_name, city: queueItem.city });
            steps.push({ step: "domain", status: "success", result: domainRes.data });
            queueItem.domain = domainRes.data?.domain || "";
          } catch (e) { steps.push({ step: "domain", status: "failed", error: e.message }); }
        }

        // Vercel
        try {
          const deployRes = await base44.functions.invoke("vercelDeploy", { action: "deploy", domain: queueItem.domain, content: queueItem.generated_content, business_name: queueItem.business_name });
          steps.push({ step: "vercel", status: "success", result: deployRes.data });
        } catch (e) { steps.push({ step: "vercel", status: "failed", error: e.message }); }

        steps.push({ step: "supabase", status: "skipped", note: "Using shared DB with RLS" });

        // Indexing
        try {
          await base44.functions.invoke("submitToIndexers", { url: "https://" + queueItem.domain });
          steps.push({ step: "indexing", status: "success" });
        } catch (e) { steps.push({ step: "indexing", status: "failed", error: e.message }); }

        const allSuccess = steps.every((s) => s.status === "success" || s.status === "skipped");
        await svc.entities.WebsiteQueue.update(queueItem.id, { status: allSuccess ? "deployed" : "failed", deploy_log: JSON.stringify(steps), deployed_url: "https://" + queueItem.domain });

        return Response.json({ ok: true, queue_item_id, steps, final_status: allSuccess ? "deployed" : "failed" });
      }

      // ═══════════════════════════════════════════════════════════════════
      // SCHEDULE SOCIAL — L5
      // ═══════════════════════════════════════════════════════════════════
      case "schedule_social": {
        const { template_id, business_name, domain, days = 30 } = body;
        if (!template_id) return Response.json({ error: "template_id required" }, { status: 400 });

        const templates = await svc.entities.UniversalIndustryTemplate.filter({ industry_id: template_id }, "-created_date", 1);
        const template = templates[0];
        if (!template) return Response.json({ error: "Template not found" }, { status: 404 });

        const socialConfig = template.social_config || {};
        const postsPerDay = socialConfig.posts_per_day || 3;
        const platforms = socialConfig.platforms || ["facebook", "instagram", "tiktok", "youtube"];
        const platformList = platforms.join(" | ");
        const totalPosts = postsPerDay * days;

        const calendar = await base44.integrations.Core.InvokeLLM({
          prompt: `Create a ${days}-day social media content calendar for:
Business: ${business_name}
Industry: ${template.name}
Domain: ${domain}
Posts per day: ${postsPerDay}
Platforms: ${platformList}
Hashtag strategy: ${socialConfig.hashtag_strategy || "industry-relevant + location-based"}

For each day generate ${postsPerDay} posts with platform, content_type, caption, hashtags, best_time, media_type, and CTA. Return JSON array of ${totalPosts} posts.`,
          response_json_schema: {
            type: "object",
            properties: {
              posts: { type: "array", items: { type: "object", properties: {
                day: { type: "number" },
                post_number: { type: "number" },
                platform: { type: "string" },
                content_type: { type: "string" },
                caption: { type: "string" },
                hashtags: { type: "array", items: { type: "string" } },
                best_time: { type: "string" },
                media_type: { type: "string" },
                cta: { type: "string" },
              } } },
            },
          },
        });

        const created = await svc.entities.SocialPost.bulkCreate(
          (calendar.posts || []).map((p: any) => ({
            business_name,
            platform: p.platform,
            content_type: p.content_type,
            caption: p.caption,
            hashtags: p.hashtags || [],
            scheduled_at: new Date(Date.now() + p.day * 86400000 + p.post_number * 7200000).toISOString(),
            status: "scheduled",
            media_type: p.media_type,
            cta: p.cta,
            template_id,
          }))
        );

        return Response.json({ ok: true, calendar_days: days, total_posts: created.length, platforms, preview: created.slice(0, 10) });
      }

      // ═══════════════════════════════════════════════════════════════════
      // QUEUE BATCH
      // ═══════════════════════════════════════════════════════════════════
      case "queue_batch": {
        const { template_id, cities, count, niche } = body;
        if (!template_id) return Response.json({ error: "template_id required" }, { status: 400 });

        const cityList = cities || [];
        const total = count || cityList.length || 10;
        const queued: any[] = [];

        for (let i = 0; i < total; i++) {
          const city = cityList[i] || null;
          const businessName = city ? city + " " + (niche || "Pro") : (niche || "National") + " Pro";
          const queueItem = await svc.entities.WebsiteQueue.create({
            template_id,
            business_name: businessName,
            city,
            state: null,
            domain: "",
            status: "queued",
            created_at: new Date().toISOString(),
          });
          queued.push({ id: queueItem.id, business_name: businessName, city });
        }

        return Response.json({ ok: true, queued: queued.length, items: queued });
      }

      // ═══════════════════════════════════════════════════════════════════
      // SYNC GPT
      // ═══════════════════════════════════════════════════════════════════
      case "sync_gpt": {
        const { direction = "both" } = body;
        let result: any = { direction };

        if (direction === "push" || direction === "both") {
          try {
            const templates = await svc.entities.UniversalIndustryTemplate.list("-created_date", 50);
            const packRes = await base44.functions.invoke("packSync", { action: "push_pack", pack_type: "universal_templates", data: { templates } });
            result.push = { status: "success", templates_pushed: templates.length, pack: packRes.data };
          } catch (e) { result.push = { status: "failed", error: e.message }; }
        }

        if (direction === "pull" || direction === "both") {
          try {
            const packRes = await base44.functions.invoke("packSync", { action: "pull_pack", pack_type: "gpt_generated" });
            result.pull = { status: "success", data: packRes.data };
          } catch (e) { result.pull = { status: "failed", error: e.message }; }
        }

        return Response.json({ ok: true, ...result });
      }

      // ═══════════════════════════════════════════════════════════════════
      // SYNC LOCAL
      // ═══════════════════════════════════════════════════════════════════
      case "sync_local": {
        const localBridgeUrl = secrets.get("LOCAL_BRIDGE_URL") || "http://localhost:8787";
        let bridgeStatus = "unknown";
        try {
          const res = await fetch(localBridgeUrl + "/health", { signal: AbortSignal.timeout(5000) });
          bridgeStatus = res.ok ? "online" : "offline";
        } catch { bridgeStatus = "offline"; }

        const pendingJobs = await svc.entities.WebsiteQueue.filter({ status: "queued" }, "-created_date", 10);
        return Response.json({
          ok: true,
          local_bridge_url: localBridgeUrl,
          bridge_status: bridgeStatus,
          pending_jobs: pendingJobs.length,
          jobs: pendingJobs.map((j: any) => ({ id: j.id, business_name: j.business_name, city: j.city })),
        });
      }

      // ═══════════════════════════════════════════════════════════════════
      // RUN AUTONOMOUS CYCLE
      // ═══════════════════════════════════════════════════════════════════
      case "run_autonomous_cycle": {
        const cycleLog: any[] = [];

        // Step 1: SENSE
        cycleLog.push({ step: "SENSE", status: "running" });
        let demandData: any;
        try {
          const senseRes = await base44.functions.invoke("universalDominanceEngine", { action: "sense_demand" });
          demandData = senseRes.data;
          cycleLog[0].status = "success";
        } catch (e) { cycleLog[0].status = "failed"; cycleLog[0].error = e.message; }

        // Step 2: PLAN
        cycleLog.push({ step: "PLAN", status: "running" });
        try {
          const planRes = await base44.functions.invoke("alphaPrimeOptimizationCycle", { action: "run_cycle" });
          cycleLog[1].status = "success";
          cycleLog[1].result = planRes.data;
        } catch (e) { cycleLog[1].status = "skipped"; cycleLog[1].error = e.message; }

        // Step 3-6: Execute builds
        const builds = demandData?.demand_analysis?.recommended_builds || [];
        cycleLog.push({ step: "EXECUTE", builds: builds.length, status: "running" });

        for (const build of builds.slice(0, 3)) {
          try {
            const templateRes = await base44.functions.invoke("universalDominanceEngine", { action: "match_template", industry: build.industry, keyword: build.target_keyword });
            const genRes = await base44.functions.invoke("universalDominanceEngine", { action: "generate_site", template_id: templateRes.data?.template?.industry_id || build.industry });
            if (genRes.data?.queue_item) {
              await base44.functions.invoke("universalDominanceEngine", { action: "provision_site", queue_item_id: genRes.data.queue_item });
            }
            await base44.functions.invoke("universalDominanceEngine", { action: "schedule_social", template_id: templateRes.data?.template?.industry_id || build.industry, business_name: build.industry, days: 30 });
          } catch (e) { /* continue */ }
        }
        cycleLog[2].status = "success";

        // Step 7: MONITOR
        cycleLog.push({ step: "MONITOR", status: "running" });
        try {
          await base44.functions.invoke("googleAnalytics", { action: "sync" });
          cycleLog[3].status = "success";
        } catch (e) { cycleLog[3].status = "skipped"; cycleLog[3].error = e.message; }

        // Step 8: OPTIMIZE
        cycleLog.push({ step: "OPTIMIZE", status: "running" });
        try {
          await base44.functions.invoke("optimizeSeo", { action: "auto_optimize" });
          cycleLog[4].status = "success";
        } catch (e) { cycleLog[4].status = "skipped"; cycleLog[4].error = e.message; }

        return Response.json({ ok: true, cycle_completed_at: new Date().toISOString(), steps: cycleLog, builds_processed: builds.length });
      }

      default:
        return Response.json({ error: "Unknown action: " + action }, { status: 400 });
    }
  } catch (error) {
    console.error("[universalDominanceEngine] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}