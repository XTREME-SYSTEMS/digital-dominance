import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Rocket, Loader2, CheckCircle2, AlertCircle, Search, Layers,
  ExternalLink, Link2, FileText, Zap, Globe, RefreshCw, Filter,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";
import TemplatePreviewCard from "@/components/multi-launch/TemplatePreviewCard";

export default function MultiTemplateLauncher() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Load all active templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["multi-launch-templates"],
    queryFn: async () => {
      const page = await base44.entities.TemplateLibrary.filter(
        { is_active: true, status: "active" },
        { sort: "sort_order", limit: 200 }
      );
      return page.items || [];
    },
  });

  // Normalize niches — group case-variant duplicates (e.g. "Epoxy Flooring" and "epoxy")
  // into a single canonical display label so the filter dropdown is clean.
  const nicheMap = {};
  for (const t of templates) {
    if (!t.niche) continue;
    const key = t.niche.toLowerCase().replace(/ /g, "_");
    if (!nicheMap[key]) {
      nicheMap[key] = { key, display: t.niche, count: 0 };
    }
    nicheMap[key].count++;
    // Prefer Title Case display over lowercase
    if (t.niche[0] === t.niche[0]?.toUpperCase() && nicheMap[key].display[0] === nicheMap[key].display[0]?.toLowerCase()) {
      nicheMap[key].display = t.niche;
    }
  }
  const niches = Object.values(nicheMap).sort((a, b) => a.display.localeCompare(b.display));

  const filtered = templates.filter((t) => {
    if (nicheFilter !== "all") {
      const tKey = (t.niche || "").toLowerCase().replace(/ /g, "_");
      if (tKey !== nicheFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return t.name?.toLowerCase().includes(q) || t.slug?.toLowerCase().includes(q) || t.niche?.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.id)));
    }
  };

  const publishAll = async () => {
    if (selected.size === 0) return;
    setPublishing(true);
    setError(null);
    setResults(null);

    const selectedTemplates = templates.filter((t) => selected.has(t.id));
    const publishResults = [];

    for (const tpl of selectedTemplates) {
      const slug = tpl.slug || tpl.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `site-${tpl.id.slice(6)}`;
      const appName = tpl.name || slug;

      try {
        const res = await base44.functions.invoke("publishTemplateLive", {
          templateId: tpl.id,
          appName,
          appSlug: slug,
          brand: {
            accent: tpl.color_scheme || "#126fc8",
          },
        });

        const deployData = res.data;

        // Create a ClientProject linking to this deployment
        let projectRecord = null;
        try {
          projectRecord = await base44.entities.ClientProject.create({
            title: appName,
            client_id: `template-${tpl.id}`,
            status: "In progress",
            description: `Auto-created from template: ${tpl.name}. Deployed to ${deployData.url || "Vercel"}.`,
            progress_note: `Deployment: ${deployData.url || "pending"} | Record: ${deployData.deployment_record_id || "—"}`,
          });
        } catch (e) {
          // ClientProject creation may fail if client_id doesn't reference a real client
        }

        publishResults.push({
          templateId: tpl.id,
          templateName: appName,
          slug,
          success: true,
          url: deployData.url,
          deploymentId: deployData.deployment_id,
          deploymentRecordId: deployData.deployment_record_id,
          projectId: projectRecord?.id || null,
        });
      } catch (err) {
        publishResults.push({
          templateId: tpl.id,
          templateName: appName,
          slug,
          success: false,
          error: err.message || "Publish failed",
        });
      }
    }

    setResults({
      total: publishResults.length,
      succeeded: publishResults.filter((r) => r.success).length,
      failed: publishResults.filter((r) => !r.success).length,
      sites: publishResults,
    });

    queryClient.invalidateQueries({ queryKey: ["multi-launch-templates"] });
    setPublishing(false);
  };

  return (
    <AdminSystemPage
      eyebrow="BULK PUBLISH · MULTI-TEMPLATE"
      title="Multi-Template Launcher"
      description="Select multiple templates from the Template Library and publish them all at once. Each deployed site is automatically linked to its own project page for tracking."
      badge="◈ BULK PUBLISH"
      stats={[
        ["Available templates", String(templates.length)],
        ["Selected", String(selected.size)],
        ["Niches", String(niches.length)],
        ["Ready to publish", selected.size > 0 ? "YES" : "—"],
      ]}
    >
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#8faec9] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates by name, slug, or niche..."
            className="flex-1 h-9 px-3 rounded-lg border border-[#dce6f1] text-sm text-[#112940] focus:border-[#126fc8] outline-none"
          />
        </div>
        <select
          value={nicheFilter}
          onChange={(e) => setNicheFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-[#dce6f1] text-sm text-[#112940] focus:border-[#126fc8] outline-none bg-white"
        >
          <option value="all">All Niches ({templates.length})</option>
          {niches.map((n) => (
            <option key={n.key} value={n.key}>{n.display} ({n.count})</option>
          ))}
        </select>
        <button
          onClick={selectAll}
          className="h-9 px-3 rounded-lg border border-[#e4e4e7] text-xs font-bold text-[#607790] bg-white hover:border-[#126fc8]/40"
        >
          {selected.size === filtered.length ? "Deselect All" : `Select All (${filtered.length})`}
        </button>
        <button
          onClick={publishAll}
          disabled={selected.size === 0 || publishing}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#126fc8] text-white text-xs font-bold hover:bg-[#0d58a8] disabled:opacity-40 transition"
        >
          {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
          {publishing ? "Publishing..." : `Publish ${selected.size} Template${selected.size !== 1 ? "s" : ""}`}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Results panel */}
      {results && (
        <div className="rounded-lg border border-[#dce6f1] bg-white p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            {results.failed === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#d97706]" />
            )}
            <h3 className="text-sm font-bold text-[#112940]">
              Bulk Publish Complete — {results.succeeded} succeeded, {results.failed} failed
            </h3>
          </div>
          <div className="space-y-2">
            {results.sites.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                  r.success ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
                }`}
              >
                {r.success ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#112940] truncate">{r.templateName}</p>
                  {r.success ? (
                    <div className="flex items-center gap-3 text-[10px] text-[#607790]">
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#126fc8] font-bold hover:underline">
                          <ExternalLink className="w-3 h-3" /> {r.url}
                        </a>
                      )}
                      {r.deploymentRecordId && (
                        <Link to={`/admin/site-project/${r.deploymentRecordId}`} className="flex items-center gap-1 text-[#126fc8] font-bold hover:underline">
                          <Link2 className="w-3 h-3" /> Project Page
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-red-500">{r.error}</p>
                  )}
                </div>
                {r.success && r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 px-2.5 rounded-lg bg-[#126fc8]/10 text-[#126fc8] text-xs font-bold hover:bg-[#126fc8]/20 flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#126fc8]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#607790]">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No templates found. Create templates in the Template Studio first.</p>
          <Link to="/admin" className="inline-flex items-center gap-1.5 mt-3 text-[#126fc8] font-bold text-sm hover:underline">
            <Layers className="w-4 h-4" /> Go to Template Studio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((tpl) => (
            <TemplatePreviewCard
              key={tpl.id}
              template={tpl}
              isSelected={selected.has(tpl.id)}
              onToggle={() => toggleSelect(tpl.id)}
            />
          ))}
        </div>
      )}

      {/* Info footer */}
      <div className="mt-4 rounded-lg border border-[#dce6f1] bg-[#f8fbfe] p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-[#126fc8] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#112940]">How Multi-Template Launch Works</p>
            <p className="text-xs text-[#607790] mt-1">
              Each selected template is deployed to Vercel as a standalone site with its own URL. After deployment,
              a project page is automatically created for each site at <code className="text-[#126fc8]">/admin/site-project/&lt;id&gt;</code> where you can
              track validation, compliance, and live status. Google Search Console registration and sitemap generation
              fire automatically after each publish.
            </p>
          </div>
        </div>
      </div>
    </AdminSystemPage>
  );
}