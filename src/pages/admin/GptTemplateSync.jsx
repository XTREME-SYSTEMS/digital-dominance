import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, CheckCircle2, XCircle, Clock, Zap, FileCode } from "lucide-react";
import AdminSystemPage from "@/components/launch-engine-admin/AdminSystemPage";

const SUPPORTED_NICHES = [
  "epoxy", "water_damage", "roofing", "hvac", "plumbing", "electrician",
  "pest_control", "landscaping", "mold_remediation", "fire_damage",
  "garage_door", "legal", "real_estate", "remodeling", "med_spa",
  "dental", "chiropractic", "solar", "automotive", "cleaning", "identity",
];

const NICHE_LABELS = {
  epoxy: "Epoxy Flooring", water_damage: "Water Damage", roofing: "Roofing",
  hvac: "HVAC", plumbing: "Plumbing", electrician: "Electrical",
  pest_control: "Pest Control", landscaping: "Landscaping",
  mold_remediation: "Mold Remediation", fire_damage: "Fire Damage",
  garage_door: "Garage Door", legal: "Legal", real_estate: "Real Estate",
  remodeling: "Remodeling", med_spa: "Med Spa", dental: "Dental",
  chiropractic: "Chiropractic", solar: "Solar", automotive: "Auto Repair",
  cleaning: "Cleaning", identity: "Brand & Web",
};

export default function GptTemplateSync() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedNiche, setSelectedNiche] = useState(null);

  const { data: gptTemplates, isLoading } = useQuery({
    queryKey: ["gpt-templates"],
    queryFn: async () => {
      const res = await base44.entities.TemplateLibrary.filter(
        { tags: { $all: ["gpt-generated"] }, is_active: true },
        { sort: "-created_date", limit: 100, fields: ["name", "niche", "created_date", "description", "slug"] }
      );
      return res;
    },
  });

  const nicheCounts = {};
  (gptTemplates?.items || []).forEach((t) => {
    const n = t.niche || "unknown";
    nicheCounts[n] = (nicheCounts[n] || 0) + 1;
  });

  const handleGenerate = useCallback(async (niche) => {
    setGenerating(true);
    setResults([]);
    try {
      const payload = niche
        ? { action: "generate", niche }
        : { action: "generate_batch", niches: SUPPORTED_NICHES };

      const response = await base44.functions.invoke("gptTemplateIngestor", payload);
      const data = response?.data || response;
      setResults(data?.results || [data]);
      queryClient.invalidateQueries({ queryKey: ["gpt-templates"] });
    } catch (err) {
      setResults([{ status: "failed", error: err.message }]);
    } finally {
      setGenerating(false);
    }
  }, [queryClient]);

  const totalGpt = gptTemplates?.items?.length || 0;
  const nichesCovered = Object.keys(nicheCounts).length;

  return (
    <AdminSystemPage
      title="GPT Template Sync"
      eyebrow="AI-Powered Template Generation"
      description="ChatGPT generates fresh, industry-specific website templates and syncs them into the Template Library. A workflow runs every 6 hours to keep the library stocked."
      badge="AI Sync"
      stats={[
        { label: "GPT Templates", value: totalGpt },
        { label: "Niches Covered", value: `${nichesCovered}/${SUPPORTED_NICHES.length}` },
        { label: "Sync Schedule", value: "6h" },
        { label: "Status", value: "Active" },
      ]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to have ChatGPT generate fresh website templates for all {SUPPORTED_NICHES.length} supported niches.
              Each template is a complete, production-ready HTML page with industry-specific copy and design.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => handleGenerate()} disabled={generating} className="gap-2">
                {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {generating ? "Generating..." : "Generate All Niches"}
              </Button>
              {selectedNiche && (
                <Button
                  variant="outline"
                  onClick={() => handleGenerate(selectedNiche)}
                  disabled={generating}
                  className="gap-2"
                >
                  <FileCode className="h-4 w-4" />
                  Generate: {NICHE_LABELS[selectedNiche]}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Supported Niches</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {SUPPORTED_NICHES.map((niche) => (
                <button
                  key={niche}
                  onClick={() => setSelectedNiche(selectedNiche === niche ? null : niche)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                    selectedNiche === niche ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-sm font-semibold">{NICHE_LABELS[niche]}</span>
                  <Badge variant={nicheCounts[niche] ? "default" : "secondary"} className="text-xs">
                    {nicheCounts[niche] || 0} templates
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Generation Results</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      r.status === "success" ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    {r.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{NICHE_LABELS[r.niche] || r.niche || "Unknown"}</div>
                      {r.status === "success" ? (
                        <div className="text-xs text-muted-foreground">
                          {r.template_name} · {r.html_length?.toLocaleString()} chars
                        </div>
                      ) : (
                        <div className="text-xs text-red-500">{r.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>GPT-Generated Templates</span>
              <Badge variant="secondary">{totalGpt} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : totalGpt === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No GPT templates yet. Generate some above or wait for the next scheduled sync.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(gptTemplates?.items || []).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{t.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {NICHE_LABELS[t.niche] || t.niche} · {new Date(t.created_date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">GPT</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminSystemPage>
  );
}