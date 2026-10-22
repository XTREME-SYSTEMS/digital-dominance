import React, { useState } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * AI assist for services. Reads the services already chosen and the industry,
 * then finds the newer services and niches that trade is moving into. The owner
 * ticks what applies and adds them all in one click.
 */
export default function ServiceDiscovery({ industry, subIndustries, services, onAdd }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [found, setFound] = useState([]);
  const [picked, setPicked] = useState([]);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('serviceDiscovery', { industry, subIndustries, services });
      const core = (res.data?.core_missing || []).map(name => ({
        name, why: 'Core service customers in this trade expect', type: 'core', demand: 'missing',
      }));
      const coreNames = new Set(core.map(item => item.name));
      const list = [...core, ...(res.data?.services || []).filter(item => !coreNames.has(item.name))];
      setFound(list);
      setPicked(list.map(item => item.name));
      if (!list.length) setError('No new services came back — try again or add your own.');
    } catch (e) {
      setError(e.message || 'The service scan did not come back');
    } finally {
      setRunning(false);
    }
  };

  const toggle = name => setPicked(prev => (prev.includes(name) ? prev.filter(v => v !== name) : [...prev, name]));
  const allPicked = found.length > 0 && picked.length === found.length;

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-[#00a2ff]/40 bg-[#00a2ff]/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-gray-800">AI assistant — analyze my services</p>
          <p className="text-[11px] text-gray-500">Reads your industry and the services you ticked, then returns the core services you are missing, what is in high demand right now, and the newer niches worth adding.</p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#00a2ff] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#0090e0] disabled:opacity-50"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {running ? 'Analyzing…' : 'AI assistant'}
        </button>
      </div>

      {error && <p role="alert" className="text-[11px] text-red-500">{error}</p>}

      {found.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{picked.length} of {found.length} selected</span>
            <button
              type="button"
              onClick={() => setPicked(allPicked ? [] : found.map(item => item.name))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-700 transition hover:border-[#00a2ff] hover:text-[#00a2ff]"
            >
              {allPicked ? 'Clear all' : 'Select all'}
            </button>
          </div>

          <div className="grid max-h-48 gap-1.5 overflow-y-auto sm:grid-cols-2">
            {found.map(item => {
              const isPicked = picked.includes(item.name);
              return (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => toggle(item.name)}
                  aria-pressed={isPicked}
                  title={item.why}
                  className={`flex items-start gap-2 rounded-lg border bg-white px-2.5 py-2 text-left transition ${isPicked ? 'border-[#00a2ff]' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isPicked ? 'border-[#00a2ff] bg-[#00a2ff] text-white' : 'border-gray-300'}`}>
                    {isPicked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-gray-800">{item.name}</span>
                    {item.why && <span className="block text-[10px] leading-snug text-gray-500">{item.why}</span>}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {item.type === 'core' && <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: '#fee2e2', color: '#b91c1c' }}>missing</span>}
                    {item.type === 'niche' && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">niche</span>}
                    {item.demand === 'high' && <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: '#dcfce7', color: '#15803d' }}>high demand</span>}
                    {item.demand === 'growing' && <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase" style={{ background: '#dbeafe', color: '#1d4ed8' }}>up and coming</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onAdd(found.filter(item => picked.includes(item.name)).map(item => item.name))}
            disabled={!picked.length}
            className="w-full rounded-lg bg-[#0a1220] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#16233a] disabled:opacity-40"
          >
            Add {picked.length} service{picked.length === 1 ? '' : 's'} to my site
          </button>
        </>
      )}
    </div>
  );
}