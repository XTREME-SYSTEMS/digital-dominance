import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Factory, Plus, Rocket, Settings, Copy, Check, Loader2, Globe } from "lucide-react";

const PUBLISHED_URL = "https://epoxyquotenearme.com";
const slugify = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Every template maps to a real city page at /{state}/{city} on the primary
// domain — rendered by the full contractor template. No subdomains.
function liveUrlFor(t) {
  const city = t.config?.primary_city;
  const state = t.config?.primary_state;
  if (!city || !state) return null;
  return `${PUBLISHED_URL}/${slugify(state)}/${slugify(city)}`;
}

export default function WebsiteFactory() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deploying, setDeploying] = useState(null);
  const [deployError, setDeployError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    config: {
      company_name: "",
      phone: "",
      email: "",
      domain: "",
      service_area: "",
      primary_city: "",
      primary_state: "",
      color_scheme: "amber",
      pricing_tier: "standard",
    },
    launch_mode: "manual",
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["websiteTemplates"],
    queryFn: () => base44.entities.WebsiteTemplate.list("-created_date", 50),
  });

  const createTemplate = async () => {
    if (!form.name || !form.slug) return;
    const slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    await base44.entities.WebsiteTemplate.create({
      ...form,
      slug,
      status: "configured",
      pwa_enabled: true,
    });
    setForm({ name: "", slug: "", config: { company_name: "", phone: "", email: "", domain: "", service_area: "", primary_city: "", primary_state: "", color_scheme: "amber", pricing_tier: "standard" }, launch_mode: "manual" });
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ["websiteTemplates"] });
  };

  const deploy = async (template) => {
    setDeploying(template.id);
    setDeployError(null);
    try {
      // Fail closed: there is no verified deploy provider on this legacy screen.
      // Preserve the configured record and send operators to the governed launch
      // workflow instead of fabricating a URL, receipt, or LIVE status.
      throw new Error("Deployment unavailable in this legacy screen. Use Launch Control and require a verified provider deployment receipt.");
    } catch (e) {
      console.error("Deploy blocked:", e);
      setDeployError(e.message || "Deployment could not be verified.");
    }
    setDeploying(null);
  };

  const clone = async (template) => {
    const newName = `${template.name} (Copy)`;
    const newSlug = `${template.slug}-copy`;
    await base44.entities.WebsiteTemplate.create({
      ...template,
      id: undefined,
      created_date: undefined,
      updated_date: undefined,
      name: newName,
      slug: newSlug,
      status: "draft",
      generated_url: "",
    });
    queryClient.invalidateQueries({ queryKey: ["websiteTemplates"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Factory className="h-6 w-6 text-amber-500" /> Website Factory
          </h1>
          <p className="text-sm text-stone-500 mt-1">Create, configure, and deploy website variants from this template.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" /> New Template
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 mb-6">
          <h3 className="font-bold text-stone-900 mb-4">Configure New Website Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Template Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Epoxy Pro - Florida" className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="epoxy-pro-florida" className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Company Name</label>
              <input value={form.config.company_name} onChange={(e) => setForm({ ...form, config: { ...form.config, company_name: e.target.value } })} className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Phone</label>
              <input value={form.config.phone} onChange={(e) => setForm({ ...form, config: { ...form.config, phone: e.target.value } })} className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Domain</label>
              <input value={form.config.domain} onChange={(e) => setForm({ ...form, config: { ...form.config, domain: e.target.value } })} placeholder="epoxyproflorida.com" className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Primary City</label>
              <input value={form.config.primary_city} onChange={(e) => setForm({ ...form, config: { ...form.config, primary_city: e.target.value } })} className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Primary State</label>
              <input value={form.config.primary_state} onChange={(e) => setForm({ ...form, config: { ...form.config, primary_state: e.target.value } })} className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Launch Mode</label>
              <select value={form.launch_mode} onChange={(e) => setForm({ ...form, launch_mode: e.target.value })} className="mt-1 w-full h-10 px-3 rounded-lg border border-stone-200 focus:border-amber-500 outline-none">
                <option value="manual">Manual — I control every step</option>
                <option value="automated">Automated — Step-by-step with prompts</option>
                <option value="autonomous">Autonomous — Full auto-deploy</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createTemplate} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-stone-950 font-bold text-sm hover:bg-amber-400">
              <Check className="h-4 w-4" /> Create Template
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {deployError && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{deployError}</p>}
      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-stone-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(templates || []).map((t) => (
            <div key={t.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-stone-900">{t.name}</h3>
                  <p className="text-xs text-stone-400">{t.slug}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${t.status === "live" ? "bg-green-100 text-green-700" : t.status === "configured" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"}`}>
                  {t.status?.toUpperCase()}
                </span>
              </div>
              {t.config?.company_name && <p className="text-sm text-stone-600">{t.config.company_name}</p>}
              {t.config?.primary_city && <p className="text-xs text-stone-400 mt-1">{t.config.primary_city}, {t.config.primary_state}</p>}
              {(() => {
                const live = t.status === "live" && t.generated_url ? t.generated_url : null;
                return live ? (
                  <a href={live} target="_blank" rel="noopener" className="text-xs text-amber-600 hover:underline flex items-center gap-1 mt-2">
                    <Globe className="h-3 w-3" /> {live.replace(/^https?:\/\//, "")}
                  </a>
                ) : null;
              })()}
              <div className="flex gap-2 mt-4">
                {t.status !== "live" ? (
                  <button
                    onClick={() => deploy(t)}
                    disabled={deploying === t.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 disabled:opacity-60"
                  >
                    {deploying === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                    {deploying === t.id ? "Deploying..." : "Deploy"}
                  </button>
                ) : (
                  <a href={t.generated_url || "#"} target="_blank" rel="noopener" className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800">
                    <Globe className="h-3.5 w-3.5" /> Visit
                  </a>
                )}
                <button onClick={() => clone(t)} className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50" title="Clone">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 text-[10px] text-stone-400 font-semibold uppercase tracking-wide">{t.launch_mode} mode</div>
            </div>
          ))}
          {!isLoading && (!templates || templates.length === 0) && (
            <div className="col-span-full text-center py-12 text-stone-400">
              <Factory className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No templates yet. Create your first website template to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}