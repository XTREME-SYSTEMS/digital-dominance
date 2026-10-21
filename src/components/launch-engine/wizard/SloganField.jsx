import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Field, inputCls } from './wizardFields';
import { OTHER_OPTION, industryLabel } from '@/data/industryCatalog';

export default function SloganField({ value, set }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const trade = value.industry === OTHER_OPTION ? value.industry_other : industryLabel(value.industry);
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Write ONE original, memorable advertising slogan of six words or fewer for a ${trade || 'local service'} business named "${value.business_name || 'this business'}"${value.city ? ` in ${value.city}, ${value.state}` : ''}. It must be specific to that trade and avoid clichés like "quality you can trust" or "your satisfaction is our goal". Return JSON.`,
        response_json_schema: {
          type: 'object',
          properties: { slogan: { type: 'string', description: 'The slogan, six words or fewer' } },
          required: ['slogan'],
        },
      });
      const slogan = res?.slogan || res?.data?.slogan;
      if (!slogan) throw new Error('No slogan came back — try again.');
      set({ slogan: String(slogan).trim().replace(/^["']|["']$/g, '') });
    } catch (e) {
      setError(e.message || 'Could not generate a slogan');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label="Slogan / tagline" hint="Write your own, or have one generated from your business, trade and city.">
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={value.slogan}
          onChange={e => set({ slogan: e.target.value })}
          placeholder="Floors that outlast the house"
        />
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#00a2ff] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#0090e0] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {busy ? 'Generating…' : 'Generate one'}
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-[11px] text-red-500">{error}</p>}
    </Field>
  );
}