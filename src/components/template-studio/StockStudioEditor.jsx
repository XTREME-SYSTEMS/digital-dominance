import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Globe, Loader2, CheckCircle2, AlertCircle, ExternalLink, Maximize2, RefreshCw } from 'lucide-react';
import BrandSetupWizard from '@/components/template-studio/brand/BrandSetupWizard';
import LogoGeneratorPanel from '@/components/template-studio/brand/LogoGeneratorPanel';
import BrandDiscoveryPanel from '@/components/template-studio/brand/BrandDiscoveryPanel';
import SitePagePackPanel from '@/components/template-studio/brand/SitePagePackPanel';
import StockTemplatePreview from '@/components/template-studio/StockTemplatePreview';
import StudioMediaActions from '@/components/template-studio/StudioMediaActions';
import GoogleReadinessPanel from '@/components/template-studio/GoogleReadinessPanel';
import { compileBuiltinStockVariation, isBuiltinStockTemplate } from '@/lib/stockCatalogFallback';

export default function StockStudioEditor({ template, onBack, onNext }) {
  const queryClient = useQueryClient();
  const [brand, setBrand] = useState(null);
  const [assets, setAssets] = useState({});
  const [mode, setMode] = useState('desktop');
  const [cycling, setCycling] = useState(false);
  const [cycleError, setCycleError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);

  const applyProfile = (record) => {
    setProfile(record);
    if (record.palette) setBrand({ id: record.palette_id, name: record.palette.name, accent: record.palette.accent, accentLight: record.palette.accentLight });
    if (record.logo_url) setAssets((prev) => ({ ...prev, logoUrl: record.logo_url }));
  };

  // Resume the most recent brand profile so the studio opens where the user left off.
  useEffect(() => {
    let live = true;
    base44.entities.BrandProfile.filter({}, { sort: '-created_date', limit: 1 })
      .then((page) => { if (live && page?.items?.[0]) applyProfile(page.items[0]); })
      .catch((e) => console.warn('Brand profile load failed:', e.message))
      .finally(() => { if (live) setProfileChecked(true); });
    return () => { live = false; };
  }, []);

  // Discovery runs in the background — refresh until it reports an outcome.
  useEffect(() => {
    if (!profile || ['ready', 'failed'].includes(profile.discovery_status)) return undefined;
    const timer = setInterval(async () => {
      try {
        setProfile(await base44.entities.BrandProfile.get(profile.id));
      } catch (e) {
        console.warn('Discovery poll failed:', e.message);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [profile?.id, profile?.discovery_status]);

  const openFullScreen = () => {
    const html = compiled.data?.html || template.content;
    if (!html) return;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const next = async () => {
    setCycling(true);
    setCycleError('');
    try { await onNext(); } catch (error) { setCycleError(error.message); } finally { setCycling(false); }
  };

  const manifest = template.sections?.find(s => s.section_type === 'manifest')?.config;
  const compiled = useQuery({
    queryKey: ['stock-variation', template.id, brand?.accent, assets],
    enabled: !!brand || !!assets.logoUrl || !!assets.videoUrl,
    queryFn: async () => {
      if (isBuiltinStockTemplate(template)) {
        return compileBuiltinStockVariation(template, { accent: brand?.accent, ...assets });
      }
      const res = await base44.functions.invoke('stockTemplateFactory', {
        action: 'compile',
        industryKey: manifest.industry_key,
        designKey: manifest.design_key,
        brand: { accent: brand?.accent, ...assets },
      });
      return res.data;
    },
  });

  const download = async () => {
    const html = compiled.data?.html || template.content || (await base44.entities.TemplateLibrary.get(template.id)).content;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.slug}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePublishLive = async () => {
    if (isBuiltinStockTemplate(template)) {
      setPublishResult(null);
      setPublishError('This bundled design is available for browsing, editing and download. Live publishing requires importing it into an authenticated deployment workspace.');
      return;
    }
    const slug = (template.slug || template.niche || 'site').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40);
    setPublishing(true);
    setPublishError(null);
    setPublishResult(null);
    try {
      const res = await base44.functions.invoke('publishTemplateLive', {
        templateId: template.id,
        appName: template.name,
        appSlug: slug,
        brand: { accent: brand?.accent, ...assets },
      });
      setPublishResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['inventory-template-deploys'] });
    } catch (e) {
      setPublishError(e.message || 'Failed to publish live');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onBack}>Back to templates</Button>
        <h2 className="font-heading text-lg font-bold">{template.name}</h2>
      </div>

      {profile ? (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: profile.palette?.gradient }} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{profile.business_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {profile.industry_label} · {profile.city}, {profile.state} · {profile.palette?.name}
              </p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setProfile(null); setBrand(null); }}>
              <RefreshCw className="h-3.5 w-3.5" /> Reconfigure brand
            </Button>
          </div>
          <LogoGeneratorPanel profile={profile} onSelectLogo={(url) => setAssets((prev) => ({ ...prev, logoUrl: url }))} />
          <BrandDiscoveryPanel profile={profile} />
          <SitePagePackPanel profile={profile} onBuilt={(pages) => setProfile((prev) => ({ ...prev, pages }))} />
        </>
      ) : profileChecked ? (
        <BrandSetupWizard onComplete={applyProfile} />
      ) : (
        <p role="status" className="text-sm text-muted-foreground">Loading your brand profile…</p>
      )}
      <StudioMediaActions industry={template.niche} onAssets={setAssets} />

      <div className="flex flex-wrap gap-2">
        <Button variant={mode === 'desktop' ? 'default' : 'outline'} onClick={() => setMode('desktop')}>Desktop</Button>
        <Button variant={mode === 'mobile' ? 'default' : 'outline'} onClick={() => setMode('mobile')}>Mobile</Button>
        <Button variant="outline" onClick={next} disabled={cycling}>{cycling ? 'Loading…' : 'Next stock design'}</Button>
        <Button variant="outline" onClick={download} disabled={compiled.isFetching}>Download preview HTML</Button>
        <Button variant="outline" onClick={openFullScreen}><Maximize2 className="h-4 w-4" /> Full screen</Button>
        <Button
          onClick={handlePublishLive}
          disabled={publishing || isBuiltinStockTemplate(template)}
          className="ml-auto"
          style={{ background: 'linear-gradient(135deg, #126fc8, #0d9488)', color: '#fff' }}
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          {publishing ? 'Publishing live...' : 'Publish Live to Web'}
        </Button>
      </div>

      {cycleError && <p role="alert" className="text-sm text-destructive">{cycleError}</p>}
      {publishError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4" /> {publishError}
        </div>
      )}
      {publishResult && (
        <div className="flex items-center gap-2 text-[#16a34a] text-sm bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4" /> Published live!
          {publishResult.url && (
            <a href={publishResult.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold text-[#126fc8] hover:underline ml-1">
              <ExternalLink className="w-3.5 h-3.5" /> {publishResult.url.replace('https://', '').slice(0, 40)}...
            </a>
          )}
          <span className="text-[#607790] ml-2">Google indexing submitted automatically.</span>
        </div>
      )}

      {compiled.isFetching && <p role="status" className="text-sm text-muted-foreground">Applying original brand assets…</p>}
      {compiled.error && <p role="alert" className="text-sm text-destructive">{compiled.error.message}</p>}

      <div className={mode === 'mobile' ? 'mx-auto h-[650px] w-full max-w-[390px] overflow-hidden rounded-xl border border-border' : 'h-[650px] overflow-hidden rounded-xl border border-border'}>
        <StockTemplatePreview template={template} overrideHtml={compiled.data?.html} />
      </div>

      <p className="text-sm text-muted-foreground">Bundled templates can be customized, previewed and downloaded even if the database is temporarily unavailable. Live publishing requires a verified, connected deployment record and separate release checks.</p>

      <GoogleReadinessPanel key={template.id} template={template} />
    </div>
  );
}