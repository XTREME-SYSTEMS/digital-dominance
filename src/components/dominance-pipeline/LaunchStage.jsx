import React, { useState } from 'react';
import { Rocket, Loader2, Check, MapPin, Shuffle, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const VARIANT_AXES = [
  'City/Geo targeting',
  'Service mix emphasis',
  'Color/design variant',
  'CTA & offer angle',
  'Pricing tier positioning',
  'Trust signal rotation',
  'Content voice/tone',
];

export default function LaunchStage({ data, onUpdate, onAdvance, allData }) {
  const [targetCount, setTargetCount] = useState(data?.targetCount || 350);
  const [cityList, setCityList] = useState(data?.cityList || '');
  const [generated, setGenerated] = useState(data?.generated || []);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(data?.launched || 0);
  const [error, setError] = useState('');

  const generateMatrix = async () => {
    setLaunching(true); setError('');
    try {
      const v = allData.vision;
      const s = allData.strategy;
      const res = await base44.functions.invoke('vercelAiGateway', {
        action: 'generateText',
        prompt: `Generate a launch matrix for ${targetCount} programmatic websites in the "${v?.industry}" industry.\n\nStrategy: ${s?.siteVariants || 'N/A'}\nDifferentiators: ${(s?.differentiators || []).join(', ')}\nDomain pattern: ${allData.build?.domainPattern || 'N/A'}\n\nReturn JSON with:\n- cities: an array of ${Math.min(targetCount, 50)} US cities to target (major + secondary markets), as "City, ST"\n- variants: an array of ${targetCount} objects, each with { id, city, service_focus, design_variant, cta_angle } — strategically different per the differentiators`,
        response_json_schema: {
          type: 'object',
          properties: {
            cities: { type: 'array', items: { type: 'string' } },
            variants: { type: 'array', items: {
              type: 'object',
              properties: { id: { type: 'number' }, city: { type: 'string' }, service_focus: { type: 'string' }, design_variant: { type: 'string' }, cta_angle: { type: 'string' } },
              required: ['id', 'city', 'service_focus', 'design_variant', 'cta_angle'],
            }},
          },
          required: ['cities', 'variants'],
        },
      });
      if (res.data?.parsed) {
        setGenerated(res.data.parsed.variants || []);
        setCityList((res.data.parsed.cities || []).join('\n'));
        onUpdate({ targetCount, cityList: res.data.parsed.cities, generated: res.data.parsed.variants, launched: 0 });
      }
    } catch (e) { setError(e.message); }
    setLaunching(false);
  };

  const launch = async () => {
    setLaunching(true); setError('');
    let count = 0;
    for (const variant of generated) {
      try {
        await base44.entities.LaunchCampaign.create({
          name: `${allData.build?.templateName || 'Site'} — ${variant.city}`,
          status: 'active',
          mode: 'autonomous',
          target_cities: [{ city: variant.city, state: '', template_id: allData.build?.templateName || '', status: 'deployed' }],
          auto_deploy: true,
        });
        count++;
        setLaunched(count);
      } catch (e) { console.error('Launch failed for variant:', variant.id, e); }
    }
    onUpdate({ targetCount, cityList, generated, launched: count, launchComplete: true });
    setLaunching(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Rocket className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-bold text-stone-800">Mass Launch — 350+ Strategically Different Sites</h2>
      </div>

      {/* Variant axes */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shuffle className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-stone-700">Strategic Variant Axes</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VARIANT_AXES.map((a, i) => (
            <span key={i} className="rounded-lg bg-white border border-stone-200 px-2.5 py-1 text-xs text-stone-600">{a}</span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Target Site Count</label>
          <input type="number" value={targetCount} onChange={(e) => setTargetCount(parseInt(e.target.value) || 350)} min={10} max={1000}
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Cities (one per line)</label>
          <textarea value={cityList} onChange={(e) => setCityList(e.target.value)} rows={3} placeholder="Orlando, FL&#10;Tampa, FL&#10;Atlanta, GA"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 outline-none resize-none" />
        </div>
      </div>

      {generated.length === 0 ? (
        <button onClick={generateMatrix} disabled={launching}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50">
          {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
          Generate Launch Matrix ({targetCount} variants)
        </button>
      ) : (
        <>
          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <div className="bg-stone-100 px-4 py-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-stone-700">{generated.length} site variants generated</p>
              <button onClick={generateMatrix} disabled={launching} className="text-xs text-amber-600 font-semibold hover:text-amber-700 disabled:opacity-50">
                Regenerate
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-stone-100">
              {generated.slice(0, 20).map((v) => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                  <MapPin className="h-4 w-4 text-stone-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800">{v.city}</p>
                    <p className="text-xs text-stone-500 truncate">{v.service_focus} · {v.design_variant} · {v.cta_angle}</p>
                  </div>
                </div>
              ))}
              {generated.length > 20 && (
                <div className="px-4 py-2 text-xs text-stone-400 text-center">+ {generated.length - 20} more variants...</div>
              )}
            </div>
          </div>

          {launched > 0 && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-700">{launched} sites launched to the LaunchCampaign queue.</p>
            </div>
          )}

          <button onClick={launch} disabled={launching}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3.5 text-sm font-bold text-white hover:from-amber-400 hover:to-amber-500 disabled:opacity-50">
            {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {launching ? `Launching... (${launched}/${generated.length})` : `Launch ${generated.length} Sites`}
          </button>
        </>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
    </div>
  );
}