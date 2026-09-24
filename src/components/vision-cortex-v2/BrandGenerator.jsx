import React, { useState } from 'react';
import { invokeLLM } from '@/lib/gateway';
import { Sparkles, Loader2, Palette, Type, Volume2, Image } from 'lucide-react';

export default function BrandGenerator({ vision, approvedLogo, brand: brandProp, setBrand: setBrandProp }) {
  const [loading, setLoading] = useState(false);
  const [brand, setBrandState] = useState(brandProp || null);
  const [error, setError] = useState(null);

  const setBrand = (b) => {
    setBrandState(b);
    setBrandProp?.(b);
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invokeLLM({
        prompt: `Generate a comprehensive brand kit for this vision: "${vision}".
The brand should be premium, modern, and memorable.

Include:
1. Brand name and tagline
2. Color palette (5 colors with hex codes, names, and usage guidelines)
3. Typography pairing (heading font, body font, display font)
4. Brand voice and tone guidelines
5. Brand personality traits (5)
6. Brand values (5)
7. Logo usage guidelines
8. Social media style guide
9. Email/template style guide
10. Do's and don'ts

Return JSON: {
  "name": string, "tagline": string,
  "colors": [ { "name": string, "hex": string, "usage": string } ],
  "typography": { "heading": string, "body": string, "display": string },
  "voice": string, "personality": [string], "values": [string],
  "logo_guidelines": [string], "social_style": [string], "email_style": [string],
  "dos": [string], "donts": [string]
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' }, tagline: { type: 'string' },
            colors: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, hex: { type: 'string' }, usage: { type: 'string' } } } },
            typography: { type: 'object', properties: { heading: { type: 'string' }, body: { type: 'string' }, display: { type: 'string' } } },
            voice: { type: 'string' }, personality: { type: 'array', items: { type: 'string' } }, values: { type: 'array', items: { type: 'string' } },
            logo_guidelines: { type: 'array', items: { type: 'string' } }, social_style: { type: 'array', items: { type: 'string' } },
            email_style: { type: 'array', items: { type: 'string' } }, dos: { type: 'array', items: { type: 'string' } }, donts: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      setBrand(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-black text-stone-900">Comprehensive Brand Generator</h3>
        </div>
        <button onClick={generate} disabled={loading || !vision?.trim()} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generating...' : 'Generate Brand Kit'}
        </button>
      </div>

      {approvedLogo && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <Image className="h-3 w-3" /> Using approved logo in brand kit
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {brand && (
        <div className="space-y-3">
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
            <div className="flex items-center gap-3">
              {approvedLogo && <img src={approvedLogo.url} alt="Logo" className="h-12 w-12 object-contain" />}
              <div>
                <p className="text-lg font-black text-stone-900">{brand.name}</p>
                <p className="text-sm text-amber-600 font-bold">"{brand.tagline}"</p>
              </div>
            </div>
          </div>

          {brand.colors?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1"><Palette className="h-3 w-3" /> COLOR PALETTE</p>
              <div className="grid grid-cols-5 gap-2">
                {brand.colors.map((c, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-stone-200">
                    <div className="h-16" style={{ backgroundColor: c.hex }} />
                    <div className="p-1.5">
                      <p className="text-xs font-bold text-stone-700">{c.name}</p>
                      <p className="text-[10px] text-stone-400 font-mono">{c.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {brand.typography && (
            <div className="rounded-lg border border-stone-200 p-3">
              <p className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1"><Type className="h-3 w-3" /> TYPOGRAPHY</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="font-bold text-stone-600">Heading:</span> <span className="text-stone-800">{brand.typography.heading}</span></div>
                <div><span className="font-bold text-stone-600">Body:</span> <span className="text-stone-800">{brand.typography.body}</span></div>
                <div><span className="font-bold text-stone-600">Display:</span> <span className="text-stone-800">{brand.typography.display}</span></div>
              </div>
            </div>
          )}

          {brand.voice && (
            <div className="rounded-lg border border-stone-200 p-3">
              <p className="text-xs font-bold text-stone-500 mb-1 flex items-center gap-1"><Volume2 className="h-3 w-3" /> BRAND VOICE</p>
              <p className="text-sm text-stone-700">{brand.voice}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {brand.personality?.length > 0 && (
              <div className="rounded-lg border border-stone-200 p-3">
                <p className="text-xs font-bold text-stone-500 mb-1">PERSONALITY</p>
                <div className="flex flex-wrap gap-1">{brand.personality.map((p, i) => <span key={i} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">{p}</span>)}</div>
              </div>
            )}
            {brand.values?.length > 0 && (
              <div className="rounded-lg border border-stone-200 p-3">
                <p className="text-xs font-bold text-stone-500 mb-1">VALUES</p>
                <div className="flex flex-wrap gap-1">{brand.values.map((v, i) => <span key={i} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">{v}</span>)}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {brand.dos?.length > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-xs font-bold text-green-600 mb-1">✓ DO'S</p>
                <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">{brand.dos.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </div>
            )}
            {brand.donts?.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-bold text-red-600 mb-1">✗ DON'TS</p>
                <ul className="list-disc list-inside text-xs text-stone-600 space-y-0.5">{brand.donts.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}