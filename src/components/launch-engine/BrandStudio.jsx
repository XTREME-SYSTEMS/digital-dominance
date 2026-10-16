import React, { useState, useCallback } from 'react';
import { Building2, Globe, Loader2, Check, X, Search, Sparkles, Palette } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const COLOR_SCHEMES = [
  { id: 'midnight', name: 'Midnight Blue', accent: '#1e3a8a', accentLight: '#3b82f6', bg: '#0a1220', surface: '#111c26' },
  { id: 'gold', name: 'Sunset Gold', accent: '#D4AF37', accentLight: '#E6C84E', bg: '#1a1410', surface: '#252010' },
  { id: 'forest', name: 'Forest Green', accent: '#16a34a', accentLight: '#22c55e', bg: '#0a1a10', surface: '#102015' },
  { id: 'crimson', name: 'Crimson Red', accent: '#dc2626', accentLight: '#ef4444', bg: '#1a0a0a', surface: '#251010' },
  { id: 'royal', name: 'Royal Purple', accent: '#7c3aed', accentLight: '#a855f7', bg: '#0f0a1a', surface: '#151025' },
  { id: 'teal', name: 'Ocean Teal', accent: '#0d9488', accentLight: '#14b8a6', bg: '#0a1a18', surface: '#102522' },
  { id: 'orange', name: 'Sunset Orange', accent: '#ea580c', accentLight: '#f97316', bg: '#1a0f08', surface: '#251810' },
  { id: 'steel', name: 'Steel Blue', accent: '#0284c7', accentLight: '#0ea5e9', bg: '#08121a', surface: '#0e1c28' },
];

export default function BrandStudio({ selected, onSelect, industry }) {
  const [businessName, setBusinessName] = useState(selected?.businessName || '');
  const [logos, setLogos] = useState(selected?.logos || []);
  const [domains, setDomains] = useState(selected?.domains || []);
  const [generating, setGenerating] = useState(false);
  const [checkingDomains, setCheckingDomains] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');
  const [selectedLogo, setSelectedLogo] = useState(selected?.logo || null);
  const [colorScheme, setColorScheme] = useState(selected?.colorScheme || COLOR_SCHEMES[0]);
  const [selectedDomain, setSelectedDomain] = useState(selected?.domain || null);

  const generateLogos = useCallback(async () => {
    if (!businessName.trim()) return;
    setGenerating(true);
    setLogos([]);
    try {
      const res = await base44.functions.invoke('generateBrandIdentity', {
        action: 'generate_logos',
        businessName: businessName.trim(),
        industry: industry || 'general',
      });
      setLogos(res.data?.logos || []);
    } catch (err) {
      console.error('Logo generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [businessName, industry]);

  const checkDomains = useCallback(async () => {
    if (!businessName.trim()) return;
    setCheckingDomains(true);
    setDomains([]);
    try {
      const res = await base44.functions.invoke('generateBrandIdentity', {
        action: 'check_domains',
        businessName: businessName.trim(),
      });
      setDomains(res.data?.domains || []);
    } catch (err) {
      console.error('Domain check failed:', err);
    } finally {
      setCheckingDomains(false);
    }
  }, [businessName]);

  const commitBrand = useCallback(() => {
    onSelect({
      businessName: businessName.trim(),
      logo: selectedLogo,
      colorScheme,
      domain: selectedDomain,
      logos,
      domains,
    });
  }, [businessName, selectedLogo, colorScheme, selectedDomain, logos, domains, onSelect]);

  return (
    <div className="space-y-3">
      {/* Business Name Input */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" /> Business / Website Name
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Apex Electric, Blue Sky Plumbing..."
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#00a2ff]"
            onKeyDown={(e) => e.key === 'Enter' && generateLogos()}
          />
          <button
            onClick={() => { generateLogos(); checkDomains(); }}
            disabled={!businessName.trim() || generating}
            className="flex items-center gap-1.5 rounded-xl bg-[#00a2ff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0090e0] disabled:opacity-40"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {[
          { id: 'identity', label: 'Logos', icon: Sparkles },
          { id: 'domains', label: 'Domains', icon: Globe },
          { id: 'colors', label: 'Colors', icon: Palette },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition ${activeTab === tab.id ? 'text-[#00a2ff] border-b-2 border-[#00a2ff]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Logo Tab */}
      {activeTab === 'identity' && (
        <div className="min-h-[120px]">
          {generating && (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Generating 10 logo options...
            </div>
          )}
          {!generating && logos.length === 0 && (
            <p className="py-6 text-center text-xs text-gray-400">Enter your business name and click Generate to create 10 logo options.</p>
          )}
          {!generating && logos.length > 0 && (
            <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
              {logos.map((logo, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedLogo(logo); commitBrand(); }}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-white transition ${selectedLogo?.style === logo.style ? 'border-[#00a2ff] ring-2 ring-[#00a2ff]/30' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <img src={logo.url} alt={logo.style} className="h-full w-full object-contain p-1" />
                  {selectedLogo?.style === logo.style && (
                    <div className="absolute top-0.5 right-0.5 rounded-full bg-[#00a2ff] p-0.5">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-0.5 py-0.5 text-[7px] font-bold text-white text-center truncate">{logo.style}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <div className="min-h-[120px]">
          {checkingDomains && (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Checking domain availability...
            </div>
          )}
          {!checkingDomains && domains.length === 0 && (
            <p className="py-6 text-center text-xs text-gray-400">Enter your business name and click Generate to check domain availability.</p>
          )}
          {!checkingDomains && domains.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {domains.map((d) => (
                <button
                  key={d.domain}
                  onClick={() => { setSelectedDomain(d); commitBrand(); }}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${selectedDomain?.domain === d.domain ? 'border-[#00a2ff] bg-[#00a2ff]/5' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="font-mono font-bold text-gray-800">{d.domain}</span>
                  <span className="flex items-center gap-1.5">
                    {d.available === true && <span className="flex items-center gap-1 text-xs font-bold text-green-600"><Check className="h-3.5 w-3.5" /> Available</span>}
                    {d.available === false && <span className="flex items-center gap-1 text-xs font-bold text-red-500"><X className="h-3.5 w-3.5" /> Taken</span>}
                    {d.available === null && <span className="text-xs text-gray-400">Unknown</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {COLOR_SCHEMES.map((cs) => (
              <button
                key={cs.id}
                onClick={() => { setColorScheme(cs); commitBrand(); }}
                className={`rounded-xl border-2 p-2 text-center transition ${colorScheme.id === cs.id ? 'border-[#00a2ff] ring-2 ring-[#00a2ff]/30' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="mx-auto mb-1.5 h-10 w-full rounded-lg" style={{ background: `linear-gradient(135deg, ${cs.accent}, ${cs.accentLight})` }} />
                <div className="text-[10px] font-bold text-gray-800">{cs.name}</div>
                {colorScheme.id === cs.id && <Check className="mx-auto mt-0.5 h-3 w-3 text-[#00a2ff]" />}
              </button>
            ))}
          </div>
          {/* Live preview swatch */}
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 p-2">
            <div className="h-8 w-8 rounded-lg" style={{ background: colorScheme.accent }} />
            <div className="h-8 w-8 rounded-lg" style={{ background: colorScheme.accentLight }} />
            <div className="h-8 w-8 rounded-lg border border-gray-200" style={{ background: colorScheme.surface }} />
            <span className="text-xs text-gray-500">Preview colors apply to the website on the right</span>
          </div>
        </div>
      )}
    </div>
  );
}