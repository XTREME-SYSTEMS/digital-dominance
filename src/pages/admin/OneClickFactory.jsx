import React, { useState, useMemo, useCallback } from 'react';
import { Rocket, Check, ChevronRight, Loader2, ShieldCheck, AlertTriangle, Eye, Lock, FileCheck, Globe } from 'lucide-react';
import { HOMEPAGE_INDUSTRY_IMAGES } from '@/data/homeIndustryImages';
import SafeImage from '@/components/ui/SafeImage';
import { base44 } from '@/api/base44Client';

const LAYOUTS = [
  { id: 1, name: 'Split Modern', desc: 'Hero left, content right with asymmetric grid' },
  { id: 2, name: 'Bold Centered', desc: 'Full-width centered hero with bold typography' },
  { id: 3, name: 'Corporate Sidebar', desc: 'Sidebar nav with structured content sections' },
];

const BATCH_SIZES = [1, 10, 100];

const STATUSES = {
  CONFIGURED: { label: 'Configured', color: 'text-slate-400 bg-slate-500/10' },
  QUEUED: { label: 'Queued', color: 'text-sky-400 bg-sky-500/10' },
  BUILDING: { label: 'Building', color: 'text-amber-400 bg-amber-500/10' },
  PREVIEW_READY: { label: 'Preview Ready', color: 'text-purple-400 bg-purple-500/10' },
  VALIDATED: { label: 'Validated', color: 'text-cyan-400 bg-cyan-500/10' },
  APPROVED: { label: 'Approved', color: 'text-emerald-400 bg-emerald-500/10' },
  LIVE: { label: 'Live', color: 'text-green-400 bg-green-500/10' },
  FAILED: { label: 'Failed', color: 'text-red-400 bg-red-500/10' },
  ROLLED_BACK: { label: 'Rolled Back', color: 'text-orange-400 bg-orange-500/10' },
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

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">One-Click Factory</h1>
            <p className="text-sm text-slate-400">Industry → Design → Quantity → Generate → Validate → Approve → Publish</p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {[
            { n: 1, label: 'Industry' },
            { n: 2, label: 'Design' },
            { n: 3, label: 'Quantity' },
            { n: 4, label: 'Generate' },
            { n: 5, label: 'Preview & QA' },
            { n: 6, label: 'Approve' },
            { n: 7, label: 'Publish' },
          ].map((s) => (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  step >= s.n
                    ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                    : 'border-slate-700 bg-slate-800/50 text-slate-500'
                }`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                  step > s.n ? 'bg-sky-500 text-white' : step === s.n ? 'border border-sky-400 text-sky-300' : 'bg-slate-700 text-slate-500'
                }`}>
                  {step > s.n ? <Check className="h-3 w-3" /> : s.n}
                </span>
                {s.label}
              </div>
              {s.n < 7 && <ChevronRight className="h-3 w-3 text-slate-600" />}
            </div>
          ))}
        </div>

        {/* Batch Status Badge */}
        {batchStatus !== 'CONFIGURED' && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-xs text-slate-400">Batch Status:</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUSES[batchStatus]?.color}`}>
              {STATUSES[batchStatus]?.label || batchStatus}
            </span>
          </div>
        )}

        {/* Step 1: Industry Selection */}
        {step === 1 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Choose Your Industry</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {industries.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => handleIndustrySelect(ind.niche)}
                  className="group relative aspect-[5/3] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-left transition hover:-translate-y-1 hover:border-sky-500"
                >
                  <SafeImage src={ind.image_url} alt={ind.alt_text} niche={ind.niche} failClosed className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-bold">{ind.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Design Selection */}
        {step === 2 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Choose Your Design</h2>
            <p className="mb-6 text-sm text-slate-400">Industry: <span className="font-semibold text-sky-300">{selectedIndustry}</span></p>
            <div className="grid gap-4 md:grid-cols-3">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => handleLayoutSelect(layout.id)}
                  className="group rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-left transition hover:-translate-y-1 hover:border-sky-500"
                >
                  <div className="mb-3 grid h-32 place-items-center rounded-lg border border-slate-700 bg-slate-800">
                    <span className="text-4xl font-bold text-slate-600">{String.fromCharCode(64 + layout.id)}</span>
                  </div>
                  <h3 className="mb-1 font-bold">{layout.name}</h3>
                  <p className="text-xs text-slate-400">{layout.desc}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="mt-6 text-sm text-slate-400 hover:text-sky-300">← Back to industries</button>
          </div>
        )}

        {/* Step 3: Quantity */}
        {step === 3 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Choose Batch Size</h2>
            <p className="mb-6 text-sm text-slate-400">
              Industry: <span className="font-semibold text-sky-300">{selectedIndustry}</span> · Design: <span className="font-semibold text-sky-300">{LAYOUTS.find((l) => l.id === selectedLayout)?.name}</span>
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {BATCH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => handleBatchSizeSelect(size)}
                  className={`rounded-xl border p-8 text-center transition hover:-translate-y-1 ${
                    batchSize === size ? 'border-sky-500 bg-sky-500/10' : 'border-slate-700 bg-slate-900/50'
                  }`}
                >
                  <div className="text-4xl font-bold text-sky-300">{size}</div>
                  <div className="mt-2 text-sm text-slate-400">{size === 1 ? 'Canary site' : size === 10 ? 'Preview batch' : 'Stress test'}</div>
                  {size === 100 && <p className="mt-2 text-xs text-amber-400">Compilation only — no auto-deploy</p>}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="mt-6 text-sm text-slate-400 hover:text-sky-300">← Back to designs</button>
          </div>
        )}

        {/* Step 4: Generate */}
        {step === 4 && (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-8 text-center">
            <h2 className="mb-2 text-lg font-bold">Ready to Generate</h2>
            <p className="mb-6 text-sm text-slate-400">
              {batchSize} site(s) · {selectedIndustry} · {LAYOUTS.find((l) => l.id === selectedLayout)?.name} · NOINDEX preview
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-700 px-8 py-3 font-bold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
              {generating ? 'Generating...' : 'Generate Preview Batch'}
            </button>
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            <button onClick={() => setStep(3)} className="mt-6 block text-sm text-slate-400 hover:text-sky-300">← Back</button>
          </div>
        )}

        {/* Step 5: Preview & QA */}
        {step === 5 && (
          <div>
            <h2 className="mb-4 text-lg font-bold">Preview & Independent QA</h2>
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-900/20 p-3">
              <Lock className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-amber-300">All preview sites are NOINDEX. They will not be indexed by search engines until explicitly approved and published.</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {generatedPreviews.map((preview) => (
                <div key={preview.id} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50">
                  {preview.html ? (
                    <iframe srcDoc={preview.html} className="h-64 w-full" title={`Preview ${preview.id}`} sandbox="allow-same-origin" />
                  ) : (
                    <div className="grid h-64 place-items-center text-sm text-red-400">
                      <div className="text-center">
                        <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
                        {preview.error || 'Generation failed'}
                      </div>
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{preview.niche} · Layout {preview.layout}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUSES[preview.status]?.color || 'text-slate-400'}`}>
                        {STATUSES[preview.status]?.label || preview.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {batchStatus === 'PREVIEW_READY' && (
              <div className="mt-6 flex items-center gap-4">
                <button onClick={handleApprove} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:brightness-110">
                  <ShieldCheck className="h-5 w-5" /> Approve for Release
                </button>
                <button onClick={() => setStep(4)} className="text-sm text-slate-400 hover:text-sky-300">← Regenerate</button>
              </div>
            )}
            {batchStatus === 'FAILED' && (
              <div className="mt-6">
                <button onClick={() => setStep(4)} className="text-sm text-slate-400 hover:text-sky-300">← Back to generation</button>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Approval */}
        {step === 6 && (
          <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-8 text-center">
            <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
            <h2 className="mb-2 text-lg font-bold">Batch Approved</h2>
            <p className="mb-6 text-sm text-slate-400">
              {batchSize} site(s) approved for {selectedIndustry}. Ready to publish.
            </p>
            <button
              onClick={handlePublish}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 px-8 py-3 font-bold text-white transition hover:brightness-110"
            >
              <Globe className="h-5 w-5" /> Publish to Production
            </button>
            <button onClick={reset} className="mt-6 block text-sm text-slate-400 hover:text-sky-300">← Start over</button>
          </div>
        )}

        {/* Step 7: Published */}
        {step === 7 && (
          <div className="rounded-xl border border-green-700/50 bg-green-900/20 p-8 text-center">
            <FileCheck className="mx-auto mb-4 h-12 w-12 text-green-400" />
            <h2 className="mb-2 text-lg font-bold">Batch Published</h2>
            <p className="mb-6 text-sm text-slate-400">
              {batchSize} site(s) are now live for {selectedIndustry}. Monitor performance in the Proof Dashboard.
            </p>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-2 text-sm text-slate-300 transition hover:border-sky-500">
              <Rocket className="h-4 w-4" /> Launch Another Batch
            </button>
          </div>
        )}
      </div>
    </div>
  );
}