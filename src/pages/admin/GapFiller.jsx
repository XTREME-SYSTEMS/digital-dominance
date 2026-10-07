import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Crown, Zap, Layers, Search, Share2, Target, Rocket, Bot, Server,
  CheckCircle2, AlertCircle, Play, RefreshCw, Globe, Database, TrendingUp,
  Video, PhoneCall, MapPin, Calendar, Link2, Sparkles, ArrowRight, Activity,
} from "lucide-react";

const SYSTEMS = [
  { id: "1_template_gallery", name: "Template Gallery", icon: Layers, action: "generate_template_gallery", desc: "40 visual designs per industry (10 styles × 4 layouts)", entity: "TemplateDesign" },
  { id: "2_programmatic_seo", name: "Programmatic SEO", icon: Search, action: "run_programmatic_seo", desc: "GSC keyword gaps → mass page generation with AEO/GEO", entity: "ProgrammaticSeoJob", needs: ["domain", "industry_id"] },
  { id: "3_social_automation", name: "Social Automation", icon: Share2, action: "generate_social_content", desc: "7-day multi-platform scheduling with auto-generated content", entity: "SocialSchedule", needs: ["site_id", "site_domain", "industry_id"] },
  { id: "4_client_portal", name: "Client Portal Provisioning", icon: Target, action: "provision_client_portal", desc: "Auto-provision portal + assign agents on site deploy", entity: "ClientPortalConfig", needs: ["site_id", "site_domain", "client_name", "client_email"] },
  { id: "5_mass_citations", name: "Mass Citation Distribution", icon: Globe, action: "submit_mass_citations", desc: "NAP data to 35+ directories (GBP, Yelp, Bing, Apple Maps...)", entity: "CitationListing", needs: ["business_name", "address", "phone", "website", "category", "hours", "site_id"] },
  { id: "6_aeo_geo", name: "AEO/GEO Optimization", icon: Sparkles, action: "apply_aeo_geo", desc: "AI search schema, FAQ optimization, entity-based content", entity: null, needs: ["domain", "pages"] },
  { id: "7_first_page_acceleration", name: "First-Page Acceleration", icon: Rocket, action: "accelerate_first_page", desc: "Combined engine: pSEO + citations + backlinks + content + social", entity: null, needs: ["domain", "industry_id"] },
  { id: "8_video_generation", name: "Video Generation", icon: Video, action: "generate_social_video", desc: "Site content → short-form videos for Reels/TikTok/Shorts", entity: "SocialSchedule", needs: ["site_id", "site_domain", "industry_id"] },
  { id: "9_per_site_agents", name: "Per-Site Agent Assignment", icon: Bot, action: "assign_site_agents", desc: "Auto-assign SEO, content, social, health agents per site", entity: "AgentAssignment", needs: ["site_id", "site_domain"] },
  { id: "10_gbp_sync", name: "Google Business Profile", icon: MapPin, action: "sync_gbp", desc: "GBP API sync for business info, reviews, posts", entity: "CitationListing", needs: ["business_name", "address", "phone", "website", "category", "hours", "site_id"] },
  { id: "11_bing_submission", name: "Bing Webmaster", icon: TrendingUp, action: "submit_to_bing", desc: "Sitemap + URL submission to Bing", entity: "CitationListing", needs: ["domain"] },
  { id: "12_backlink_automation", name: "Backlink Automation", icon: Link2, action: "find_backlink_opportunities", desc: "Find opportunities + track outreach + monitor placed links", entity: "BacklinkOpportunity", needs: ["target_domain", "industry_id"] },
  { id: "13_content_velocity", name: "Content Velocity", icon: Calendar, action: "generate_content_calendar", desc: "Auto-publishing calendar: blog posts, service pages, guides", entity: "ContentCalendarItem", needs: ["site_id", "site_domain", "industry_id"] },
  { id: "14_apple_yelp", name: "Apple Maps / Yelp", icon: PhoneCall, action: "submit_apple_yelp", desc: "Citation sync to Apple Business Connect + Yelp", entity: "CitationListing", needs: ["business_name", "address", "phone", "website", "site_id"] },
];

export default function GapFiller() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(null);
  const [results, setResults] = useState({});
  const [showFullForm, setShowFullForm] = useState(false);
  const [formData, setFormData] = useState({
    domain: "", industry_id: "", business_name: "", address: "", phone: "", client_email: "",
  });

  const { data: status } = useQuery({
    queryKey: ["gap-filler-status"],
    queryFn: async () => {
      const res = await base44.functions.invoke("gapFillerEngine", { action: "status" });
      return res.data;
    },
    refetchInterval: 30000,
  });

  const runSystem = async (system) => {
    setRunning(system.id);
    try {
      let payload = { action: system.action };
      if (system.needs) {
        for (const field of system.needs) {
          if (formData[field]) payload[field] = formData[field];
          else if (field === "site_id" && formData.domain) payload[field] = formData.domain;
          else if (field === "site_domain" && formData.domain) payload[field] = formData.domain;
          else if (field === "target_domain" && formData.domain) payload[field] = formData.domain;
          else if (field === "industry_id" && formData.industry_id) payload[field] = formData.industry_id;
          else if (field === "website" && formData.domain) payload[field] = `https://${formData.domain}`;
          else if (field === "business_name" && formData.business_name) payload[field] = formData.business_name;
          else if (field === "address" && formData.address) payload[field] = formData.address;
          else if (field === "phone" && formData.phone) payload[field] = formData.phone;
          else if (field === "category" && formData.industry_id) payload[field] = formData.industry_id;
          else if (field === "hours") payload[field] = "Mon-Sat 8am-6pm";
          else if (field === "client_email" && formData.client_email) payload[field] = formData.client_email;
          else if (field === "pages") payload[field] = [];
        }
      }
      const res = await base44.functions.invoke("gapFillerEngine", payload);
      setResults({ ...results, [system.id]: res.data });
      queryClient.invalidateQueries({ queryKey: ["gap-filler-status"] });
    } catch (e) {
      setResults({ ...results, [system.id]: { success: false, error: e.message } });
    }
    setRunning(null);
  };

  const runFullGapFill = async () => {
    setRunning("full");
    try {
      const res = await base44.functions.invoke("gapFillerEngine", {
        action: "run_full_gap_fill",
        domain: formData.domain || "epoxyquotenearme.com",
        industry_id: formData.industry_id || "epoxy_garage",
        business_name: formData.business_name || "Epoxy Garage Floors",
        address: formData.address || "123 Main St, Pompano Beach, FL 33064",
        phone: formData.phone || "(954) 555-0100",
        client_email: formData.client_email || "client@example.com",
      });
      setResults({ full: res.data });
      queryClient.invalidateQueries({ queryKey: ["gap-filler-status"] });
    } catch (e) {
      setResults({ full: { success: false, error: e.message } });
    }
    setRunning(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Crown className="h-7 w-7 text-amber-500" /> Gap Filler Engine
        </h1>
        <p className="text-stone-500 mt-1">
          All 14 gap-filling systems in one control panel. Run individually or execute the full gap fill at once.
        </p>
      </div>

      {/* Full Gap Fill Form */}
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
        <h3 className="font-bold text-stone-900 flex items-center gap-2 mb-3">
          <Rocket className="h-5 w-5 text-amber-600" /> Full Gap Fill — Run All 14 Systems
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            placeholder="Domain (e.g. epoxyquotenearme.com)"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            className="h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
          />
          <input
            placeholder="Industry ID (e.g. epoxy_garage)"
            value={formData.industry_id}
            onChange={(e) => setFormData({ ...formData, industry_id: e.target.value })}
            className="h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
          />
          <input
            placeholder="Business Name"
            value={formData.business_name}
            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            className="h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
          />
          <input
            placeholder="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
          />
          <input
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
          />
          <input
            placeholder="Client Email"
            value={formData.client_email}
            onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
            className="h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none"
          />
        </div>
        <button
          onClick={runFullGapFill}
          disabled={running === "full"}
          className="h-11 px-6 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold flex items-center gap-2 hover:bg-amber-400 disabled:opacity-50"
        >
          {running === "full" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running === "full" ? "Running All 14 Systems..." : "Execute Full Gap Fill"}
        </button>
        {results.full && (
          <div className="mt-3 rounded-lg bg-white border border-amber-200 p-3 text-xs">
            {results.full.success ? (
              <div>
                <p className="font-bold text-green-700 mb-2">All 14 systems executed!</p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(results.full.results || {}).map(([key, val]) => (
                    <span key={key} className={val?.error ? "text-red-600" : "text-green-700"}>
                      {val?.error ? "✗" : "✓"} {key.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-red-600">Error: {results.full.error}</p>
            )}
          </div>
        )}
      </div>

      {/* System Status Summary */}
      {status?.systems && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(status.systems).map(([id, sys]) => (
            <div key={id} className="rounded-xl border border-stone-200 bg-white p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs font-bold text-stone-700">{id.split("_")[0]}</span>
              </div>
              <p className="text-[11px] text-stone-500">{id.split("_").slice(1).join(" ")}</p>
              {sys.designs_count !== undefined && <p className="text-xs font-bold text-green-700 mt-1">{sys.designs_count} designs</p>}
              {sys.jobs_count !== undefined && <p className="text-xs font-bold text-green-700 mt-1">{sys.jobs_count} jobs</p>}
              {sys.posts_count !== undefined && <p className="text-xs font-bold text-green-700 mt-1">{sys.posts_count} posts</p>}
              {sys.citations_count !== undefined && <p className="text-xs font-bold text-green-700 mt-1">{sys.citations_count} citations</p>}
              {sys.opportunities_count !== undefined && <p className="text-xs font-bold text-green-700 mt-1">{sys.opportunities_count} backlinks</p>}
              {sys.items_count !== undefined && <p className="text-xs font-bold text-green-700 mt-1">{sys.items_count} items</p>}
              {sys.assignments_count !== undefined && <p className="text-xs font-bold text-green-700 mt-1">{sys.assignments_count} agents</p>}
              {sys.portals_count !== undefined && <p className="text-xs font-bold text-green-700 mt-1">{sys.portals_count} portals</p>}
            </div>
          ))}
        </div>
      )}

      {/* Individual System Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYSTEMS.map((sys) => {
          const Icon = sys.icon;
          const isRunning = running === sys.id;
          const result = results[sys.id];
          return (
            <div key={sys.id} className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 grid place-items-center shrink-0">
                  <Icon className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-stone-900 text-sm">{sys.name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{sys.desc}</p>
                </div>
              </div>

              <button
                onClick={() => runSystem(sys)}
                disabled={isRunning}
                className="h-9 px-4 rounded-lg bg-stone-900 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-stone-950 transition disabled:opacity-50"
              >
                {isRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                {isRunning ? "Running..." : "Run System"}
              </button>

              {result && (
                <div className="mt-2 rounded-lg bg-stone-50 border border-stone-200 p-2 text-xs">
                  {result.success ? (
                    <div>
                      <p className="font-bold text-green-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Success
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {result.total_designs_created && <p className="text-stone-600">Designs created: {result.total_designs_created}</p>}
                        {result.pages_generated !== undefined && <p className="text-stone-600">Pages generated: {result.pages_generated}</p>}
                        {result.posts_scheduled && <p className="text-stone-600">Posts scheduled: {result.posts_scheduled}</p>}
                        {result.submitted !== undefined && <p className="text-stone-600">Citations submitted: {result.submitted}</p>}
                        {result.opportunities_found && <p className="text-stone-600">Opportunities found: {result.opportunities_found}</p>}
                        {result.items_planned && <p className="text-stone-600">Content items planned: {result.items_planned}</p>}
                        {result.videos_planned && <p className="text-stone-600">Videos planned: {result.videos_planned}</p>}
                        {result.agents_assigned && <p className="text-stone-600">Agents assigned: {result.agents_assigned}</p>}
                        {result.portal_url && <p className="text-stone-600 truncate">Portal: {result.portal_url}</p>}
                        {result.acceleration_steps && <p className="text-stone-600">Acceleration steps: {result.acceleration_steps.length}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {result.error || "Failed"}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}