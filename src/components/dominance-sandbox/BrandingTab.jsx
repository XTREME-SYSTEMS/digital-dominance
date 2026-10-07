import React, { useState } from "react";
import { Sparkles, Globe, CheckCircle2, Loader2, User, Image as ImageIcon, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { invokeLLM, generateImage } from "@/lib/gateway";
import { useSandbox } from "./SandboxContext";
import SandboxCard, { StatusBadge } from "./SandboxCard";

export default function BrandingTab() {
  const { campaign, updateCampaign, markTabComplete, setActiveTab } = useSandbox();
  const [names, setNames] = useState([]);
  const [genNames, setGenNames] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [genLogo, setGenLogo] = useState(false);
  const [genPersona, setGenPersona] = useState(false);
  const [domainStatus, setDomainStatus] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  const generateNames = async () => {
    setGenNames(true);
    try {
      const res = await base44.functions.invoke("domainGoldRush", {
        action: "generateBusinessNames",
        keyword: campaign.keyword,
        city: campaign.city,
        state: campaign.state,
        tlds: ["com", "net", "co"],
        count: 12,
        checkBusinessNames: true,
      });
      setNames(res?.data?.results || []);
    } catch {
      setNames([]);
    } finally {
      setGenNames(false);
    }
  };

  const generateLogo = async () => {
    if (!selectedName) return;
    setGenLogo(true);
    try {
      const res = await generateImage({
        prompt: `Professional minimalist logo for "${selectedName}", a ${campaign.keyword} company. Bold, modern, construction/trade industry aesthetic. Colors: amber/gold and dark charcoal. Clean vector style, transparent background.`,
      });
      updateCampaign({ logo: res?.url });
    } catch {
      // fallback
    } finally {
      setGenLogo(false);
    }
  };

  const generatePersona = async () => {
    if (!selectedName) return;
    setGenPersona(true);
    try {
      const res = await invokeLLM({
        prompt: `Create a founder persona for "${selectedName}", a ${campaign.keyword} business in ${campaign.city || "the US"}. Generate: persona_name, persona_bio (2 paragraphs establishing authority), persona_credentials (array). Return JSON.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            persona_name: { type: "string" },
            persona_bio: { type: "string" },
            persona_credentials: { type: "array", items: { type: "string" } },
          },
        },
      });
      updateCampaign({ persona: res });
    } catch {
      // fallback
    } finally {
      setGenPersona(false);
    }
  };

  const checkDomain = async (domain) => {
    setDomainStatus(null);
    try {
      const res = await base44.functions.invoke("godaddyApi", { action: "checkAvailability", domain });
      setDomainStatus(res?.data?.available ? "available" : "taken");
    } catch {
      setDomainStatus("error");
    }
  };

  const selectName = (name, domain) => {
    setSelectedName(name);
    updateCampaign({ businessName: name, domain });
    checkDomain(domain);
  };

  const purchaseDomain = async () => {
    setPurchasing(true);
    try {
      const res = await base44.functions.invoke("godaddyApi", {
        action: "purchaseDomain",
        domain: campaign.domain,
        period: 1,
        renewAuto: true,
        privacy: true,
      });
      if (!res?.data?.error) {
        updateCampaign({ domainPurchased: true, autoPurchase: true });
      }
    } catch {
      // error
    } finally {
      setPurchasing(false);
    }
  };

  const advance = () => {
    markTabComplete("branding");
    setActiveTab("funnel");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Business names */}
        <SandboxCard title="Business Name Generator" icon={Sparkles} subtitle="AI-generated names with domain check">
          <button onClick={generateNames} disabled={genNames || !campaign.niche} className="ds-btn-primary mb-3">
            {genNames ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {genNames ? "Generating..." : "Generate Names"}
          </button>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {names.map((n, i) => (
              <button
                key={i}
                onClick={() => selectName(n.business_name, n.best_available_domain)}
                className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                  selectedName === n.business_name ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-900">{n.business_name}</span>
                  {n.best_available_domain && <span className="ds-font-mono text-xs text-green-600">{n.best_available_domain}</span>}
                </div>
              </button>
            ))}
          </div>
        </SandboxCard>

        {/* Logo + Persona */}
        <SandboxCard title="Brand Identity" icon={ImageIcon} subtitle="Logo, colors, and founder persona">
          {selectedName ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="ds-label text-stone-500">Selected</span>
                <span className="text-sm font-semibold text-stone-900">{selectedName}</span>
              </div>
              <button onClick={generateLogo} disabled={genLogo} className="ds-btn-ghost w-full justify-center">
                {genLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                {genLogo ? "Generating Logo..." : "Generate Logo"}
              </button>
              {campaign.logo && (
                <div className="border border-stone-200 rounded p-3 flex items-center justify-center bg-stone-50">
                  <img src={campaign.logo} alt="Logo" className="max-h-24 object-contain" />
                </div>
              )}
              <button onClick={generatePersona} disabled={genPersona} className="ds-btn-ghost w-full justify-center">
                {genPersona ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
                {genPersona ? "Generating Persona..." : "Generate Founder Persona"}
              </button>
              {campaign.persona && (
                <div className="border border-stone-200 rounded p-3 bg-stone-50">
                  <div className="text-sm font-semibold text-stone-900">{campaign.persona.persona_name}</div>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-3">{campaign.persona.persona_bio}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-stone-400 text-center py-8">Select a business name first</div>
          )}
        </SandboxCard>
      </div>

      {/* Domain */}
      <SandboxCard title="Domain Registration" icon={Globe} subtitle="Real-time availability + purchase">
        {campaign.domain ? (
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="ds-label text-stone-500 mb-1">Domain</div>
              <div className="ds-font-mono text-lg font-bold text-stone-900">{campaign.domain}</div>
            </div>
            <div>
              <div className="ds-label text-stone-500 mb-1">Status</div>
              {domainStatus && <StatusBadge status={domainStatus === "available" ? "passed" : "failed"} label={domainStatus.toUpperCase()} />}
            </div>
            {domainStatus === "available" && !campaign.domainPurchased && (
              <button onClick={purchaseDomain} disabled={purchasing} className="ds-btn-primary">
                {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {purchasing ? "Purchasing..." : "Purchase Domain"}
              </button>
            )}
            {campaign.domainPurchased && <StatusBadge status="passed" label="PURCHASED" />}
          </div>
        ) : (
          <div className="text-sm text-stone-400 text-center py-4">Select a business name to check domain</div>
        )}
      </SandboxCard>

      <div className="flex justify-end">
        <button onClick={advance} disabled={!selectedName} className="ds-btn-primary">
          <CheckCircle2 className="h-4 w-4" /> Save Brand & Advance to Funnel
        </button>
      </div>
    </div>
  );
}