import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { invokeLLM } from "@/lib/gateway";
import {
  Eye, Target, LayoutTemplate, Palette, Share2, Rocket, Globe,
  Search, ScanLine, CheckCircle2, Loader2, ChevronRight, RotateCcw,
  Sparkles, AlertCircle, ExternalLink,
} from "lucide-react";

// ── Stage definitions ──────────────────────────────────────────────────────
const STAGES = [
  { key: "vision",    label: "Vision",      icon: Eye,           desc: "Articulate the concept" },
  { key: "strategy",  label: "Strategy",    icon: Target,        desc: "Generate & pick a strategy" },
  { key: "template",  label: "Template",    icon: LayoutTemplate,desc: "Match an industry template" },
  { key: "branding",  label: "Branding",    icon: Palette,       desc: "Brand, colors, domain" },
  { key: "social",    label: "Social Media",icon: Share2,        desc: "Automated content calendar" },
  { key: "provision", label: "Provision",   icon: Rocket,        desc: "Build & deploy the site" },
  { key: "domain",    label: "Purchase URL", icon: Globe,         desc: "Buy the domain" },
  { key: "gsc",       label: "Google Console",icon: Search,      desc: "Add & sync Search Console" },
  { key: "scan",      label: "Scan Complete",icon: ScanLine,     desc: "Competitor + health scan" },
  { key: "done",      label: "Done",         icon: CheckCircle2, desc: "Launch summary" },
];

const EMPTY = {
  vision: "", visionResult: null, strategyResult: null, pickedStrategy: null,
  industry: "", templateResult: null, brandResult: null, domain: "",
  socialResult: null, provisionResult: null, purchaseResult: null,
  gscResult: null, scanResult: null,
  contacts: { name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", country: "US" },
};

export default function ConceptToCompletion() {
  const [stage, setStage] = useState(0);
  const [data, setData] = useState(EMPTY);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const set = (patch) => setData((d) => ({ ...d, ...patch }));

  const runStage = async (key, fn) => {
    setRunning(true); setError(null);
    try { await fn(); }
    catch (e) { setError(e.message || String(e)); }
    finally { setRunning(false); }
  };

  // ── Stage runners ────────────────────────────────────────────────────────
  const runVision = () => runStage("vision", async () => {
    const res = await base44.functions.invoke("visionEngine", { action: "assist", raw_idea: data.vision });
    set({ visionResult: res.data });
  });

  const runStrategy = () => runStage("strategy", async () => {
    const vision = data.visionResult?.refined_vision || data.vision;
    const res = await base44.functions.invoke("visionEngine", { action: "strategies", vision });
    set({ strategyResult: res.data });
  });

  const runTemplate = () => runStage("template", async () => {
    const industry = data.industry || data.pickedStrategy?.recommended_niche || "general contractor";
    const parsed = await invokeLLM({
      prompt: `You are a website template architect. Design a complete homepage section layout for a ${industry} business website.
Return JSON with: template_name, industry, sections (array of {type, name, heading, body, required}).
Section types: hero, text, gallery, cta, faq, testimonials, html, form, spacer.
Include 6-8 sections that convert for this industry. Make headings and body copy specific to ${industry}.`,
      response_json_schema: { type: "object", properties: {
        template_name: { type: "string" }, industry: { type: "string" },
        sections: { type: "array", items: { type: "object", properties: {
          type: { type: "string" }, name: { type: "string" },
          heading: { type: "string" }, body: { type: "string" }, required: { type: "boolean" } } } } } },
    });
    const rec = await base44.entities.UniversalIndustryTemplate.create({
      industry_id: industry.toLowerCase().replace(/\s+/g, "_"),
      name: parsed.template_name || `${industry} Template`,
      parent_industry: industry, template_status: "configured",
      website_sections: (parsed.sections || []).map((s, i) => ({ section_type: s.type, name: s.name, required: s.required !== false })),
    });
    set({ templateResult: { ...parsed, id: rec.id } });
  });

  const runBranding = () => runStage("branding", async () => {
    const industry = data.industry || data.pickedStrategy?.recommended_niche || "general contractor";
    const vision = data.visionResult?.refined_vision || data.vision;
    const parsed = await invokeLLM({
      prompt: `You are a brand identity designer. Create a complete brand for a ${industry} business based on this vision: "${vision}".
Return JSON: { brand_name, tagline, primary_color (hex), secondary_color (hex), accent_color (hex), font_heading, font_body, logo_concept (1 sentence), domain_suggestion (full .com domain, available-sounding) }`,
      response_json_schema: { type: "object", properties: {
        brand_name: { type: "string" }, tagline: { type: "string" },
        primary_color: { type: "string" }, secondary_color: { type: "string" }, accent_color: { type: "string" },
        font_heading: { type: "string" }, font_body: { type: "string" },
        logo_concept: { type: "string" }, domain_suggestion: { type: "string" } } },
    });
    const rec = await base44.entities.BrandTemplate.create({
      brand_name: parsed.brand_name, tagline: parsed.tagline,
      primary_color: parsed.primary_color, secondary_color: parsed.secondary_color, accent_color: parsed.accent_color,
      font_heading: parsed.font_heading, font_body: parsed.font_body,
      logo_concept: parsed.logo_concept, domain: parsed.domain_suggestion,
    });
    set({ brandResult: { ...parsed, id: rec.id }, domain: parsed.domain_suggestion || data.domain });
  });

  const runSocial = () => runStage("social", async () => {
    const brand = data.brandResult?.brand_name || "Your Business";
    const industry = data.industry || data.pickedStrategy?.recommended_niche || "general contractor";
    const parsed = await invokeLLM({
      prompt: `You are a social media strategist. Build a 14-day automated content calendar for "${brand}", a ${industry} business.
Return JSON: { posts: [{day, platform (facebook|instagram|google_business), post_type (text|image|video), content_text, hashtags[]}] }`,
      response_json_schema: { type: "object", properties: {
        posts: { type: "array", items: { type: "object", properties: {
          day: { type: "number" }, platform: { type: "string" }, post_type: { type: "string" },
          content_text: { type: "string" }, hashtags: { type: "array", items: { type: "string" } } } } } } },
    });
    const posts = parsed.posts || [];
    const created = await base44.entities.SocialSchedule.bulkCreate(
      posts.map((p, i) => ({
        schedule_id: `${Date.now()}-${i}`, platform: p.platform || "facebook",
        post_type: p.post_type || "text", content_text: p.content_text,
        hashtags: p.hashtags || [], status: "draft", auto_generated: true,
      }))
    );
    set({ socialResult: { count: created?.length || posts.length, posts } });
  });

  const runProvision = () => runStage("provision", async () => {
    const brand = data.brandResult || {};
    const tpl = data.templateResult || {};
    const sections = (tpl.sections || []).map((s, i) => ({
      id: `sec-${i}`, type: s.type, props: { heading: s.heading, body: s.body },
    }));
    const slug = (brand.brand_name || "new-site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const page = await base44.entities.DynamicPage.create({
      title: brand.brand_name || "New Site", slug,
      description: brand.tagline || "", sections, status: "published", is_public: true,
      seo_title: `${brand.brand_name || "Site"} — ${brand.tagline || ""}`,
    });
    const deploy = await base44.functions.invoke("vercelDeploy", {});
    set({ provisionResult: { pageId: page.id, slug, deploy: deploy.data } });
  });

  const runDomain = () => runStage("domain", async () => {
    if (!data.domain) { setError("Set a domain in the Branding step first."); return; }
    const c = data.contacts;
    const contact = { nameFirst: c.name?.split(" ")[0] || "Owner", nameLast: c.name?.split(" ")[1] || "",
      email: c.email, phone: c.phone, address1: c.address, city: c.city, state: c.state, postalCode: c.zip, country: c.country };
    const res = await base44.functions.invoke("godaddyApi", {
      action: "purchaseDomain", domain: data.domain, period: 1,
      contacts: { registrant: contact, tech: contact, admin: contact, billing: contact },
    });
    set({ purchaseResult: res.data });
  });

  const runGsc = () => runStage("gsc", async () => {
    const siteUrl = `https://${data.domain}/`;
    const add = await base44.functions.invoke("addSearchConsoleProperty", { siteUrl });
    let verify = null;
    try { verify = await base44.functions.invoke("verifySearchConsole", { siteUrl }); } catch (e) { verify = { error: e.message }; }
    set({ gscResult: { add: add.data, verify: verify?.data || verify } });
  });

  const runScan = () => runStage("scan", async () => {
    const niche = data.industry || data.pickedStrategy?.recommended_niche || "garage floor epoxy coating";
    const location = data.pickedStrategy?.target_cities?.[0] || "Pompano Beach, FL";
    const comp = await base44.functions.invoke("scanCompetitors", { mode: "full", niche, location });
    let health = null;
    if (data.domain) {
      try { health = await base44.functions.invoke("siteHealthChecker", { action: "checkAll" }); }
      catch (e) { health = { error: e.message }; }
    }
    set({ scanResult: { competitors: comp.data, health: health?.data || health } });
  });

  const runners = [runVision, runStrategy, runTemplate, runBranding, runSocial, runProvision, runDomain, runGsc, runScan, () => {}];
  const stageDone = [
    !!data.visionResult, !!data.strategyResult && !!data.pickedStrategy, !!data.templateResult,
    !!data.brandResult, !!data.socialResult, !!data.provisionResult, !!data.purchaseResult,
    !!data.gscResult, !!data.scanResult, true,
  ];

  const next = () => setStage((s) => Math.min(s + 1, STAGES.length - 1));
  const prev = () => setStage((s) => Math.max(s - 1, 0));
  const reset = () => { setStage(0); setData(EMPTY); setError(null); };

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <div className="bg-stone-950 text-white px-6 py-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shrink-0">
          <Sparkles className="h-5 w-5 text-stone-950" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight">Concept → Completion</h1>
          <p className="text-xs text-stone-400">One guided pipeline: Vision → Strategy → Template → Branding → Social → Provision → URL → Google Console → Scan → Done</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-amber-400 px-3 py-2 rounded-lg border border-stone-700 hover:border-amber-500 transition">
          <RotateCcw className="h-3.5 w-3.5" /> Restart
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Stepper rail */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-white rounded-2xl border border-stone-200 p-3">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const active = i === stage, done = stageDone[i] && i < stage;
              return (
                <button key={s.key} onClick={() => setStage(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition mb-1 ${
                    active ? "bg-amber-500/15 border border-amber-500/40" : "border border-transparent hover:bg-stone-50"
                  }`}>
                  <div className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 text-xs font-bold ${
                    done ? "bg-emerald-500 text-white" : active ? "bg-amber-500 text-stone-950" : "bg-stone-100 text-stone-400"
                  }`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold truncate ${active ? "text-stone-900" : "text-stone-600"}`}>{s.label}</div>
                    <div className="text-[10px] text-stone-400 truncate">{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage panel */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 min-h-[420px] flex flex-col">
          <StagePanel stage={stage} data={data} set={set} running={running} error={error} runners={runners} stageDone={stageDone} />
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-100">
            <button onClick={prev} disabled={stage === 0} className="px-4 py-2 rounded-lg text-sm font-semibold text-stone-500 hover:text-stone-900 disabled:opacity-30">← Back</button>
            {stage < STAGES.length - 1 ? (
              <button onClick={next} disabled={!stageDone[stage]} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold bg-stone-900 text-white hover:bg-amber-500 hover:text-stone-950 transition disabled:opacity-30 disabled:hover:bg-stone-900 disabled:hover:text-white">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={reset} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition">
                <CheckCircle2 className="h-4 w-4" /> Start New
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Per-stage content ──────────────────────────────────────────────────────
function StagePanel({ stage, data, set, running, error, runners, stageDone }) {
  const run = runners[stage];
  const RunBtn = ({ label }) => (
    <button onClick={run} disabled={running} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition disabled:opacity-50">
      {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {label}
    </button>
  );
  const ErrBox = () => error ? (
    <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> <span className="break-words">{error}</span>
    </div>
  ) : null;

  if (stage === 0) return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Vision</h2>
      <p className="text-sm text-stone-500 mt-1">Describe your concept in plain language. The AI refines it into a CEO-grade vision.</p>
      <textarea value={data.vision} onChange={(e) => set({ vision: e.target.value })} rows={5}
        placeholder="e.g. A network of epoxy garage floor sites that rank #1 in every US city and auto-generate leads..."
        className="mt-4 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-amber-500 outline-none resize-none" />
      <div className="mt-4"><RunBtn label="Generate Vision" /></div>
      {data.visionResult && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">Refined Vision</div>
          <p className="text-sm text-stone-800">{data.visionResult.refined_vision}</p>
          {data.visionResult.target_market && <p className="text-xs text-stone-500 mt-2"><b>Target:</b> {data.visionResult.target_market}</p>}
          {data.visionResult.core_capabilities && (
            <ul className="mt-2 text-xs text-stone-600 list-disc pl-5 space-y-0.5">
              {data.visionResult.core_capabilities.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          )}
        </div>
      )}
      <ErrBox />
    </div>
  );

  if (stage === 1) return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Strategy</h2>
      <p className="text-sm text-stone-500 mt-1">Generate 10 distinct strategies from your vision, then pick one to execute.</p>
      <div className="mt-4"><RunBtn label="Generate Strategies" /></div>
      {data.strategyResult?.strategies?.length > 0 && (
        <div className="mt-5 space-y-2 max-h-80 overflow-y-auto">
          {data.strategyResult.strategies.map((s, i) => (
            <button key={i} onClick={() => set({ pickedStrategy: s, industry: s.recommended_niche || data.industry, domain: s.domain_suggestions?.[0] || data.domain })}
              className={`w-full text-left rounded-xl border p-3 transition ${data.pickedStrategy === s ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-900">{s.strategy_name}</span>
                {data.pickedStrategy === s && <CheckCircle2 className="h-4 w-4 text-amber-500" />}
              </div>
              <p className="text-xs text-stone-500 mt-1">{s.summary}</p>
              <div className="text-[10px] text-stone-400 mt-1.5">{s.recommended_niche} · {s.business_name} · {s.estimated_monthly_revenue}</div>
            </button>
          ))}
        </div>
      )}
      <ErrBox />
    </div>
  );

  if (stage === 2) return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Template</h2>
      <p className="text-sm text-stone-500 mt-1">Match an industry template with converting homepage sections.</p>
      <label className="text-xs font-semibold text-stone-500 mt-4 block">Industry</label>
      <input value={data.industry} onChange={(e) => set({ industry: e.target.value })}
        placeholder="e.g. epoxy garage floors, hvac repair, med spa"
        className="mt-1 w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
      <div className="mt-4"><RunBtn label="Match Template" /></div>
      {data.templateResult && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-bold text-stone-900">{data.templateResult.template_name}</div>
          <div className="text-xs text-stone-500 mt-1">{data.templateResult.sections?.length} sections</div>
          <ul className="mt-2 text-xs text-stone-600 space-y-1">
            {data.templateResult.sections?.map((s, i) => <li key={i}><b className="text-stone-800">{s.type}:</b> {s.name} — {s.heading}</li>)}
          </ul>
        </div>
      )}
      <ErrBox />
    </div>
  );

  if (stage === 3) return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Branding</h2>
      <p className="text-sm text-stone-500 mt-1">Generate brand identity, colors, fonts, and a domain suggestion.</p>
      <div className="mt-4"><RunBtn label="Generate Brand" /></div>
      {data.brandResult && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[data.brandResult.primary_color, data.brandResult.secondary_color, data.brandResult.accent_color].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-lg border border-stone-200" style={{ background: c }} title={c} />
              ))}
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900">{data.brandResult.brand_name}</div>
              <div className="text-xs text-stone-500">{data.brandResult.tagline}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-600">
            <div><b>Fonts:</b> {data.brandResult.font_heading} / {data.brandResult.font_body}</div>
            <div><b>Logo:</b> {data.brandResult.logo_concept}</div>
          </div>
          <label className="text-xs font-semibold text-stone-500 mt-3 block">Domain to purchase</label>
          <input value={data.domain} onChange={(e) => set({ domain: e.target.value })}
            className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 outline-none" />
        </div>
      )}
      <ErrBox />
    </div>
  );

  if (stage === 4) return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Automated Social Media</h2>
      <p className="text-sm text-stone-500 mt-1">Generate a 14-day automated content calendar across Facebook, Instagram & Google Business.</p>
      <div className="mt-4"><RunBtn label="Generate Social Calendar" /></div>
      {data.socialResult && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-bold text-stone-900">{data.socialResult.count} posts scheduled as drafts</div>
          <div className="mt-2 max-h-64 overflow-y-auto space-y-1.5">
            {data.socialResult.posts?.map((p, i) => (
              <div key={i} className="text-xs text-stone-600 border-l-2 border-amber-400 pl-2">
                <b>Day {p.day} · {p.platform} ({p.post_type})</b> — {p.content_text?.slice(0, 100)}...
              </div>
            ))}
          </div>
        </div>
      )}
      <ErrBox />
    </div>
  );

  if (stage === 5) return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Provision</h2>
      <p className="text-sm text-stone-500 mt-1">Build the site from your template + brand, publish it, and deploy to Vercel.</p>
      <div className="mt-4"><RunBtn label="Build & Deploy Site" /></div>
      {data.provisionResult && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1.5">
          <div className="text-sm font-bold text-stone-900">Site deployed ✓</div>
          <div className="text-xs text-stone-600">Page: <code>/p/{data.provisionResult.slug}</code></div>
          {data.provisionResult.deploy?.url && (
            <a href={data.provisionResult.deploy.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline">
              <ExternalLink className="h-3 w-3" /> {data.provisionResult.deploy.url}
            </a>
          )}
        </div>
      )}
      <ErrBox />
    </div>
  );

  if (stage === 6) return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Purchase URL</h2>
      <p className="text-sm text-stone-500 mt-1">Buy <code className="text-amber-600">{data.domain || "your domain"}</code> via GoDaddy. Enter registrant contacts.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[["name","Full name"],["email","Email"],["phone","Phone"],["address","Street address"],
          ["city","City"],["state","State"],["zip","ZIP"]].map(([k,l]) => (
          <div key={k}>
            <label className="text-xs font-semibold text-stone-500">{l}</label>
            <input value={data.contacts[k] || ""} onChange={(e) => set({ contacts: { ...data.contacts, [k]: e.target.value } })}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 outline-none" />
          </div>
        ))}
      </div>
      <div className="mt-4"><RunBtn label="Purchase Domain" /></div>
      {data.purchaseResult && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-bold text-stone-900">Domain purchased ✓</div>
          <pre className="mt-2 text-[10px] text-stone-500 overflow-x-auto">{JSON.stringify(data.purchaseResult, null, 2).slice(0, 400)}</pre>
        </div>
      )}
      <ErrBox />
    </div>
  );

  if (stage === 7) return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Sync Google Search Console</h2>
      <p className="text-sm text-stone-500 mt-1">Add <code className="text-amber-600">https://{data.domain}/</code> as a Search Console property and verify it.</p>
      <div className="mt-4"><RunBtn label="Add & Verify Property" /></div>
      {data.gscResult && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1.5">
          <div className="text-sm font-bold text-stone-900">Property added ✓</div>
          <div className="text-xs text-stone-600">Add: {JSON.stringify(data.gscResult.add)}</div>
          <div className="text-xs text-stone-600">Verify: {JSON.stringify(data.gscResult.verify)}</div>
        </div>
      )}
      <ErrBox />
    </div>
  );

  if (stage === 8) return (
    <div>
      <h2 className="text-xl font-bold text-stone-900">Scan Complete</h2>
      <p className="text-sm text-stone-500 mt-1">Run a competitor scan and site health check to confirm everything is live.</p>
      <div className="mt-4"><RunBtn label="Run Full Scan" /></div>
      {data.scanResult && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
          <div className="text-sm font-bold text-stone-900">Scan complete ✓</div>
          <div className="text-xs text-stone-600">Competitors: {JSON.stringify(data.scanResult.competitors)?.slice(0, 300)}</div>
          <div className="text-xs text-stone-600">Health: {JSON.stringify(data.scanResult.health)?.slice(0, 300)}</div>
        </div>
      )}
      <ErrBox />
    </div>
  );

  // Done
  const d = data;
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500 grid place-items-center mb-4">
        <CheckCircle2 className="h-9 w-9 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-stone-900">Pipeline Complete</h2>
      <p className="text-sm text-stone-500 mt-2 max-w-md">
        {d.brandResult?.brand_name || "Your site"} is built, deployed, and synced. Domain purchased, Google Console connected, scan complete.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 text-left max-w-md w-full">
        {[
          ["Brand", d.brandResult?.brand_name], ["Domain", d.domain],
          ["Template", d.templateResult?.template_name], ["Social posts", d.socialResult?.count],
          ["Site slug", d.provisionResult?.slug], ["GSC", d.gscResult ? "Synced" : "—"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-stone-200 px-3 py-2">
            <div className="text-[10px] font-bold text-stone-400 uppercase">{k}</div>
            <div className="text-sm font-semibold text-stone-800 truncate">{v || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}