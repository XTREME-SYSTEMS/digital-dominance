import React, { useState, useMemo, useCallback } from 'react';
import { Rocket, Check, ChevronRight, Loader2, ShieldCheck, AlertTriangle, Lock, FileCheck, Globe } from 'lucide-react';
import { HOMEPAGE_INDUSTRY_IMAGES } from '@/data/homeIndustryImages';
import SafeImage from '@/components/ui/SafeImage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { base44 } from '@/api/base44Client';

const LAYOUTS = [
  { id: 1, name: 'Split modern', desc: 'Hero left, content right with an asymmetric grid' },
  { id: 2, name: 'Bold centred', desc: 'Full-width centred hero with bold typography' },
  { id: 3, name: 'Corporate sidebar', desc: 'Sidebar navigation with structured content sections' },
];

const BATCH_SIZES = [1, 10, 100];

const STEPS = [
  { n: 1, label: 'Industry' },
  { n: 2, label: 'Design' },
  { n: 3, label: 'Quantity' },
  { n: 4, label: 'Generate' },
  { n: 5, label: 'Preview & QA' },
  { n: 6, label: 'Approve' },
  { n: 7, label: 'Publish' },
];

const STATUSES = {
  CONFIGURED: { label: 'Configured', tone: 'tone-slate' },
  QUEUED: { label: 'Queued', tone: 'tone-sky' },
  BUILDING: { label: 'Building', tone: 'tone-amber' },
  PREVIEW_READY: { label: 'Preview ready', tone: 'tone-purple' },
  VALIDATED: { label: 'Validated', tone: 'tone-cyan' },
  APPROVED: { label: 'Approved', tone: 'tone-emerald' },
  LIVE: { label: 'Live', tone: 'tone-green' },
  FAILED: { label: 'Failed', tone: 'tone-red' },
  ROLLED_BACK: { label: 'Rolled back', tone: 'tone-orange' },
};

export default function OneClickFactory() {
  const [step, setStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [batchSize, setBatchSize] = useState(1);
  const [batchStatus, setBatchStatus] = useState('CONFIGURED');
  const [generatedPreviews, setGeneratedPreviews] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const industries = useMemo(() => HOMEPAGE_INDUSTRY_IMAGES, []);

  const handleIndustrySelect = useCallback((niche) => {
    setSelectedIndustry(niche);
    setSelectedLayout(null);
    setStep(2);
  }, []);

  const handleLayoutSelect = useCallback((layoutId) => {
    setSelectedLayout(layoutId);
    setStep(3);
  }, []);

  const handleBatchSizeSelect = useCallback((size) => {
    setBatchSize(size);
    setStep(4);
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setBatchStatus('QUEUED');

    try {
      setBatchStatus('BUILDING');

      // Generate preview sites using the universal generator via backend function
      const previews = [];
      const count = Math.min(batchSize, 3); // Preview max 3 for UI

      for (let i = 0; i < count; i++) {
        try {
          const response = await base44.functions.invoke('stockTemplateFactory', {
            action: 'generate',
            niche: selectedIndustry,
            layout_variant: selectedLayout,
            preview_index: i,
            noindex: true,
          });
          previews.push({
            id: `preview-${i}`,
            html: response?.data?.html || response?.html || '',
            niche: selectedIndustry,
            layout: selectedLayout,
            status: 'PREVIEW_READY',
          });
        } catch (err) {
          // If function fails, generate locally as fallback for preview only
          previews.push({
            id: `preview-${i}`,
            niche: selectedIndustry,
            layout: selectedLayout,
            status: 'FAILED',
            error: err.message || 'Generation failed',
          });
        }
      }

      setGeneratedPreviews(previews);
      setBatchStatus(previews.every((p) => p.status === 'PREVIEW_READY') ? 'PREVIEW_READY' : 'FAILED');
      setStep(5);
    } catch (err) {
      setError(err.message || 'Generation failed');
      setBatchStatus('FAILED');
    } finally {
      setGenerating(false);
    }
  }, [selectedIndustry, selectedLayout, batchSize]);

  const handleApprove = useCallback(() => {
    setBatchStatus('APPROVED');
    setStep(6);
  }, []);

  const handlePublish = useCallback(async () => {
    // This UI does not verify a deployment provider or Guardian receipt.
    // Never mark a synthetic preview LIVE or publish from local state.
    setError('Release blocked: a verified deployment, independent validation receipt, and scoped operator approval are required in the governed launch workflow.');
    setBatchStatus('APPROVED');
  }, []);

  const reset = useCallback(() => {
    setStep(1);
    setSelectedIndustry(null);
    setSelectedLayout(null);
    setBatchSize(1);
    setBatchStatus('CONFIGURED');
    setGeneratedPreviews([]);
    setError(null);
  }, []);

  const layoutName = LAYOUTS.find((l) => l.id === selectedLayout)?.name;
  const status = STATUSES[batchStatus] || { label: batchStatus, tone: 'tone-slate' };

  return (
    <div className="wle-content">
      <AdminPageHeader
        eyebrow="Site factory"
        title="One-click factory"
        description="Choose an industry, a design and a batch size, then generate NOINDEX previews for review. Nothing publishes from this screen without a verified deployment and an approval receipt."
      />

      {/* Progress */}
      <div className="adm-steps" style={{ marginBottom: 22 }}>
        {STEPS.map((s) => (
          <React.Fragment key={s.n}>
            <div
              className={`adm-step ${step > s.n ? 'done' : step === s.n ? 'active' : ''}`}
              aria-current={step === s.n ? 'step' : undefined}
            >
              <span className="adm-step-num">{step > s.n ? <Check className="h-3 w-3" /> : s.n}</span>
              {s.label}
            </div>
            {s.n < STEPS.length && <ChevronRight className="adm-step-sep h-3.5 w-3.5" />}
          </React.Fragment>
        ))}
      </div>

      {batchStatus !== 'CONFIGURED' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span className="adm-muted">Batch status</span>
          <span className={`adm-badge ${status.tone}`}>{status.label}</span>
        </div>
      )}

      {error && (
        <div className="adm-alert error" role="alert" style={{ marginBottom: 20 }}>
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1 — industry */}
      {step === 1 && (
        <section className="adm-section">
          <h2 className="adm-section-title">Choose your industry</h2>
          <p className="adm-muted" style={{ marginBottom: 16 }}>
            Each industry carries its own approved photography and layout set.
          </p>
          <div className="adm-grid cols-5">
            {industries.map((ind) => (
              <button key={ind.id} type="button" onClick={() => handleIndustrySelect(ind.niche)} className="adm-tile">
                <SafeImage
                  src={ind.image_url}
                  alt={ind.alt_text}
                  niche={ind.niche}
                  failClosed
                  className="adm-tile-media"
                />
                <span className="adm-tile-label">{ind.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 2 — design */}
      {step === 2 && (
        <section className="adm-section">
          <h2 className="adm-section-title">Choose your design</h2>
          <p className="adm-muted" style={{ marginBottom: 16 }}>
            Industry: <strong style={{ color: 'var(--launch-admin-heading)' }}>{selectedIndustry}</strong>
          </p>
          <div className="adm-grid cols-3">
            {LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                type="button"
                onClick={() => handleLayoutSelect(layout.id)}
                className={`adm-choice ${selectedLayout === layout.id ? 'active' : ''}`}
              >
                <div className="adm-mock">{String.fromCharCode(64 + layout.id)}</div>
                <h3 style={{ margin: '14px 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--launch-admin-heading)' }}>
                  {layout.name}
                </h3>
                <p className="adm-choice-note">{layout.desc}</p>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep(1)} className="adm-link" style={{ marginTop: 18 }}>
            ← Back to industries
          </button>
        </section>
      )}

      {/* Step 3 — quantity */}
      {step === 3 && (
        <section className="adm-section">
          <h2 className="adm-section-title">Choose a batch size</h2>
          <p className="adm-muted" style={{ marginBottom: 16 }}>
            {selectedIndustry} · {layoutName}
          </p>
          <div className="adm-grid cols-3">
            {BATCH_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleBatchSizeSelect(size)}
                className={`adm-choice ${batchSize === size ? 'active' : ''}`}
              >
                <div className="adm-choice-value">{size}</div>
                <div className="adm-choice-note">
                  {size === 1 ? 'Canary site' : size === 10 ? 'Preview batch' : 'Stress test'}
                </div>
                {size === 100 && (
                  <div style={{ marginTop: 10 }}>
                    <span className="adm-badge tone-amber">Compilation only — no auto-deploy</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep(2)} className="adm-link" style={{ marginTop: 18 }}>
            ← Back to designs
          </button>
        </section>
      )}

      {/* Step 4 — generate */}
      {step === 4 && (
        <section className="adm-card adm-card-pad" style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>
          <h2 className="adm-section-title">Ready to generate</h2>
          <p className="adm-muted" style={{ margin: '8px 0 20px' }}>
            {batchSize} {batchSize === 1 ? 'site' : 'sites'} · {selectedIndustry} · {layoutName} · NOINDEX preview
          </p>
          <button type="button" onClick={handleGenerate} disabled={generating} className="adm-btn primary lg">
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
            {generating ? 'Generating…' : 'Generate preview batch'}
          </button>
          {error && (
            <div className="adm-alert error" role="alert" style={{ marginTop: 18, textAlign: 'left' }}>
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <button type="button" onClick={() => setStep(3)} className="adm-link" style={{ marginTop: 18 }}>
              ← Back
            </button>
          </div>
        </section>
      )}

      {/* Step 5 — preview & QA */}
      {step === 5 && (
        <section className="adm-section">
          <h2 className="adm-section-title">Preview & independent QA</h2>
          <div className="adm-alert warn" style={{ margin: '14px 0 18px' }}>
            <Lock className="h-4 w-4" />
            <span>
              Every preview here is NOINDEX. Nothing in this batch is indexed by search engines until it is
              approved and published through the governed launch workflow.
            </span>
          </div>
          <div className="adm-grid cols-3">
            {generatedPreviews.map((preview) => {
              const previewStatus = STATUSES[preview.status] || { label: preview.status, tone: 'tone-slate' };
              return (
                <div key={preview.id} className="adm-frame">
                  {preview.html ? (
                    <iframe srcDoc={preview.html} title={`Preview ${preview.id}`} sandbox="allow-same-origin" />
                  ) : (
                    <div className="adm-empty" style={{ border: 0, borderRadius: 0, minHeight: 250 }}>
                      <AlertTriangle className="h-6 w-6" style={{ color: '#a32121' }} />
                      <span>{preview.error || 'Generation failed'}</span>
                    </div>
                  )}
                  <div className="adm-frame-foot">
                    <span>
                      {preview.niche} · Layout {preview.layout}
                    </span>
                    <span className={`adm-badge ${previewStatus.tone}`}>{previewStatus.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {batchStatus === 'PREVIEW_READY' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20 }}>
              <button type="button" onClick={handleApprove} className="adm-btn success lg">
                <ShieldCheck className="h-5 w-5" /> Approve for release
              </button>
              <button type="button" onClick={() => setStep(4)} className="adm-link">
                ← Regenerate
              </button>
            </div>
          )}
          {batchStatus === 'FAILED' && (
            <button type="button" onClick={() => setStep(4)} className="adm-link" style={{ marginTop: 20 }}>
              ← Back to generation
            </button>
          )}
        </section>
      )}

      {/* Step 6 — approval */}
      {step === 6 && (
        <section className="adm-card adm-card-pad" style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto' }}>
          <ShieldCheck className="h-11 w-11" style={{ color: '#15803d', margin: '0 auto 12px' }} />
          <h2 className="adm-section-title">Batch approved</h2>
          <p className="adm-muted" style={{ margin: '8px 0 6px' }}>
            {batchSize} {batchSize === 1 ? 'site' : 'sites'} approved for {selectedIndustry}.
          </p>
          {error ? (
            <div className="adm-alert warn" role="alert" style={{ margin: '16px 0 0', textAlign: 'left' }}>
              <Lock className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : (
            <p className="adm-muted">Ready for the governed launch workflow.</p>
          )}
          <button type="button" onClick={handlePublish} className="adm-btn success lg" style={{ marginTop: 20 }}>
            <Globe className="h-5 w-5" /> Publish to production
          </button>
          <div>
            <button type="button" onClick={reset} className="adm-link" style={{ marginTop: 18 }}>
              ← Start over
            </button>
          </div>
        </section>
      )}

      {/* Step 7 — published */}
      {step === 7 && (
        <section className="adm-card adm-card-pad" style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto' }}>
          <FileCheck className="h-11 w-11" style={{ color: '#15803d', margin: '0 auto 12px' }} />
          <h2 className="adm-section-title">Batch published</h2>
          <p className="adm-muted" style={{ margin: '8px 0 6px' }}>
            {batchSize} {batchSize === 1 ? 'site' : 'sites'} are live for {selectedIndustry}. Track performance in the
            proof dashboard.
          </p>
          <button type="button" onClick={reset} className="adm-btn" style={{ marginTop: 20 }}>
            <Rocket className="h-4 w-4" /> Launch another batch
          </button>
        </section>
      )}
    </div>
  );
}