import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileCode2, Layers, BarChart3 } from 'lucide-react';
import ZipBatchUpload from './ZipBatchUpload';

export default function MassIngestionSystem() {
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [filterStage, setFilterStage] = useState('');
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['ingestion-stats'],
    queryFn: async () => (await base44.functions.invoke('massIngestionEngine', { action: 'stats' })).data,
    refetchInterval: 5000,
  });

  const { data: listData } = useQuery({
    queryKey: ['ingestion-list', filterStage],
    queryFn: async () => (await base44.functions.invoke('massIngestionEngine', { action: 'list', stage: filterStage || undefined, limit: 50 })).data,
    refetchInterval: 5000,
  });

  const handleUrlIngest = async (urlsText) => {
    setIngesting(true);
    setError(null);
    try {
      const urls = urlsText.split('\n').filter(u => u.trim());
      const sources = urls.map(url => ({ source_url: url.trim(), source_name: url.trim().split('/').pop() || url }));
      const res = await base44.functions.invoke('massIngestionEngine', { action: 'batch_ingest', sources });
      setBatchResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['ingestion-stats'] });
    } catch (e) {
      setError(e.message);
    } finally {
      setIngesting(false);
    }
  };

  const websites = listData?.websites || [];
  const s = stats?.stats || {};

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Total', val: s.total || 0, color: 'text-stone-900' },
          { label: 'Cleaning', val: s.cleaning || 0, color: 'text-blue-600' },
          { label: 'Parsing', val: s.parsing || 0, color: 'text-violet-600' },
          { label: 'Organized', val: s.organizing || 0, color: 'text-amber-600' },
          { label: 'Categorized', val: s.categorized || 0, color: 'text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-stone-200 bg-white p-3 text-center">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      <ZipBatchUpload onComplete={() => {
        queryClient.invalidateQueries({ queryKey: ['ingestion-stats'] });
        queryClient.invalidateQueries({ queryKey: ['ingestion-list'] });
        queryClient.invalidateQueries({ queryKey: ['templateLibrary'] });
      }} />

      {/* URL Ingest */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h4 className="text-sm font-bold text-stone-900 mb-2">Or paste website URLs to ingest:</h4>
        <textarea
          placeholder="https://example.com&#10;https://another-site.com"
          className="w-full rounded-lg border border-stone-200 p-2 text-sm h-20"
          onBlur={(e) => e.target.value && handleUrlIngest(e.target.value)}
        />
        {ingesting && <p className="text-xs text-stone-500 mt-2">Submitting URLs…</p>}
        {batchResult && !ingesting && <p className="text-xs text-green-700 mt-2">Submitted {batchResult.ingested || 0} URLs for processing.</p>}
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>

      {/* 3-Stage Pipeline Visualization */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-600" /> 3-Stage Pipeline: Clean → Parse → Organize
        </h4>
        <div className="flex items-center gap-2">
          {['Stage 1: Clean', 'Stage 2: Parse', 'Stage 3: Organize'].map((stage, i) => (
            <React.Fragment key={i}>
              <div className="flex-1 rounded-lg bg-stone-100 p-3 text-center">
                <p className="text-xs font-bold text-stone-700">{stage}</p>
                <p className="text-[10px] text-stone-500 mt-1">{[s.cleaning, s.parsing, s.organizing][i] || 0} in progress</p>
              </div>
              {i < 2 && <div className="text-stone-300">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Ingested Websites List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2"><FileCode2 className="h-4 w-4 text-amber-600" /> Ingested Websites ({websites.length})</h4>
          <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="rounded-lg border border-stone-200 px-2 py-1 text-xs">
            <option value="">All Stages</option>
            <option value="uploaded">Uploaded</option>
            <option value="cleaned">Cleaned</option>
            <option value="parsed">Parsed</option>
            <option value="categorized">Categorized</option>
            <option value="rebranded">Rebranded</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
          {websites.map((w) => (
            <div key={w.website_id} className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-stone-900 truncate flex-1">{w.source_name}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                  w.stage === 'categorized' ? 'bg-green-100 text-green-700' :
                  w.stage === 'failed' ? 'bg-red-100 text-red-700' :
                  w.stage === 'rebranded' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{w.stage}</span>
              </div>
              <p className="text-[10px] text-stone-500">{w.tags?.includes('zip_import') ? 'ZIP archive' : w.industry || 'detecting...'} · {w.template_type || ''}</p>
              {w.error_log && <p className="mt-1 text-[10px] text-red-600">{w.error_log}</p>}
              {w.quality_score > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <BarChart3 className="h-3 w-3 text-stone-400" />
                  <span className="text-[10px] text-stone-600">Q: {w.quality_score}</span>
                </div>
              )}
              {w.color_palette?.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {w.color_palette.slice(0, 5).map((c, i) => (
                    <div key={i} className="h-3 w-3 rounded border border-stone-200" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {websites.length === 0 && <p className="text-xs text-stone-400 col-span-full text-center py-4">No websites ingested yet. Import ZIPs above to begin.</p>}
        </div>
      </div>
    </div>
  );
}