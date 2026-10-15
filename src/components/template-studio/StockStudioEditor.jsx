import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Globe, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import BrandGenerator from '@/components/launch-engine/BrandGenerator';
import StockTemplatePreview from '@/components/template-studio/StockTemplatePreview';
import StudioMediaActions from '@/components/template-studio/StudioMediaActions';
import GoogleReadinessPanel from '@/components/template-studio/GoogleReadinessPanel';

export default function StockStudioEditor({ template, onBack, onNext }) {
  const localPreview = Boolean(template.is_local_preview);
  const queryClient = useQueryClient();
  const [brand, setBrand] = useState(null);
  const [assets, setAssets] = useState({});
  const [mode, setMode] = useState('desktop');
  const [cycling, setCycling] = useState(false);
  const [cycleError, setCycleError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [publishError, setPublishError] = useState(null);

  const next = async () => {
    setCycling(true);
    setCycleError('');
    try { await onNext(); } catch (error) { setCycleError(error.message); } finally { setCycling(false); }
  };

  const manifest = template.sections?.find(s => s.section_type === 'manifest')?.config;
  const compiled = useQuery({
    queryKey: ['stock-variation', template.id, brand?.accent, assets],
    enabled: !localPreview && (!!brand || !!assets.logoUrl || !!assets.videoUrl),
    queryFn: async () => {
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
    const html = compiled.data?.html || (localPreview ? template.content : (await base44.entities.TemplateLibrary.get(template.id)).content);
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.slug}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePublishLive = async () => {
    if (localPreview) { setPublishError('This design is preview-only. It cannot be published until authenticated provisioning and release approval are verified.'); return; }
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

      <BrandGenerator selected={brand} onSelect={setBrand} />
      {!localPreview && <StudioMediaActions industry={template.niche} onAssets={setAssets} />}
      {localPreview && <p role="status" className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">This complete website concept is compiled locally from your existing Stock Factory. You can change its brand color and download its HTML. Publishing, paid media and lead collection remain disabled until verified.</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant={mode === 'desktop' ? 'default' : 'outline'} onClick={() => setMode('desktop')}>Desktop</Button>
        <Button variant={mode === 'mobile' ? 'default' : 'outline'} onClick={() => setMode('mobile')}>Mobile</Button>
        <Button variant="outline" onClick={next} disabled={cycling}>{cycling ? 'Loading…' : 'Next stock design'}</Button>
        <Button variant="outline" onClick={download} disabled={compiled.isFetching}>Download preview HTML</Button>
        <Button
          onClick={handlePublishLive}
          disabled={publishing || localPreview}
          className="ml-auto"
          style={{ background: 'linear-gradient(135deg, #126fc8, #0d9488)', color: '#fff' }}
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          {localPreview ? 'Preview only: publishing gated' : publishing ? 'Publishing live...' : 'Publish Live to Web'}
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
        <StockTemplatePreview template={template} overrideHtml={compiled.data?.html} brand={brand} />
      </div>

      <p className="text-sm text-muted-foreground">{localPreview ? 'Preview-only website source. Download the concept, validate business details and receive approval before using any live launch adapter.' : 'Live publishing is a protected action: verify the deployment target, backend, security gates and operator approval before any release.'}</p>

      {!localPreview && <GoogleReadinessPanel key={template.id} template={template} />}
    </div>
  );
}