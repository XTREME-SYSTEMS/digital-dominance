import React, { useState } from 'react';
import { Globe, Check, Loader2, BarChart, Search, FileCode, Link, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const REQUIREMENTS = [
  { id: 'analytics', label: 'Google Analytics 4', desc: 'Connect GA4 property for traffic tracking', icon: BarChart, fn: 'googleAnalytics' },
  { id: 'searchconsole', label: 'Google Search Console', desc: 'Verify ownership & submit sitemap', icon: Search, fn: 'addSearchConsoleProperty' },
  { id: 'sitemap', label: 'XML Sitemap Generated', desc: 'Auto-generate and publish sitemap.xml', icon: MapPin, fn: 'generateSitemap' },
  { id: 'schema', label: 'Structured Data Validated', desc: 'LocalBusiness + FAQ + Service schema', icon: FileCode, fn: null },
  { id: 'indexnow', label: 'IndexNow Ping', desc: 'Instant index submission to Bing/Yandex', icon: Link, fn: 'pingIndexNow' },
  { id: 'robots', label: 'robots.txt Configured', desc: 'Allow all + point to sitemap', icon: Globe, fn: null },
];

export default function ProvisionStage({ data, onUpdate, onAdvance, allData }) {
  const [status, setStatus] = useState(data?.status || REQUIREMENTS.reduce((a, r) => ({ ...a, [r.id]: 'pending' }), {}));
  const [running, setRunning] = useState(null);
  const [error, setError] = useState('');

  const runRequirement = async (req) => {
    setRunning(req.id);
    setError('');
    setStatus((prev) => ({ ...prev, [req.id]: 'running' }));
    try {
      if (req.fn) {
        await base44.functions.invoke(req.fn, { domain: allData.build?.domainPattern || 'epoxyquotenearme.com' });
      }
      setStatus((prev) => ({ ...prev, [req.id]: 'done' }));
    } catch (e) {
      setStatus((prev) => ({ ...prev, [req.id]: 'error' }));
      setError(`${req.label}: ${e.message}`);
    }
    setRunning(null);
  };

  const runAll = async () => {
    for (const req of REQUIREMENTS) {
      if (status[req.id] !== 'done') await runRequirement(req);
    }
  };

  const allDone = Object.values(status).every((s) => s === 'done');
  const complete = () => { onUpdate({ status, complete: true }); onAdvance(); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-stone-800">Google Provisioning & Visibility</h2>
        </div>
        <button onClick={runAll} disabled={running !== null}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50">
          {running ? 'Provisioning...' : 'Provision All'}
        </button>
      </div>

      <div className="space-y-2">
        {REQUIREMENTS.map((req) => {
          const Icon = req.icon;
          const st = status[req.id];
          return (
            <div key={req.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
              st === 'done' ? 'border-emerald-300 bg-emerald-50' :
              st === 'running' ? 'border-amber-300 bg-amber-50' :
              st === 'error' ? 'border-red-300 bg-red-50' : 'border-stone-200 bg-white'
            }`}>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                st === 'done' ? 'bg-emerald-500 text-white' :
                st === 'running' ? 'bg-amber-500 text-white' :
                st === 'error' ? 'bg-red-500 text-white' : 'bg-stone-100 text-stone-400'
              }`}>
                {st === 'done' ? <Check className="h-5 w-5" /> :
                 st === 'running' ? <Loader2 className="h-5 w-5 animate-spin" /> :
                 <Icon className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800">{req.label}</p>
                <p className="text-xs text-stone-500">{req.desc}</p>
              </div>
              {st !== 'done' && st !== 'running' && (
                <button onClick={() => runRequirement(req)} disabled={running !== null}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50">
                  Run
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className={`rounded-xl border px-4 py-3 ${allDone ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 bg-stone-50'}`}>
        <p className={`text-sm font-semibold ${allDone ? 'text-emerald-700' : 'text-stone-600'}`}>
          {allDone ? '✓ All Google requirements provisioned — sites are ready to be seen.' : 'Provision each requirement, or click "Provision All" to run them sequentially.'}
        </p>
      </div>

      <button onClick={complete} disabled={!allDone}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed">
        <Globe className="h-4 w-4" /> Provisioning Complete — Continue to Launch
      </button>
    </div>
  );
}