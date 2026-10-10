import React, { useState } from 'react';
import { Sparkles, Loader2, ImageIcon, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PRESETS = [
  'Modern epoxy garage floor landing page hero section, metallic gold accents, luxury home, professional web design',
  'Garage floor coating service website, before and after photos, trust badges, CTA button, clean modern layout',
  'Epoxy flooring funnel page, dark theme, gold metallic, lead capture form, testimonials, pricing tiers',
  'Concrete polishing company homepage, industrial aesthetic, project gallery, service areas, reviews',
];

export default function ChatGPTPanel({ onImageUrl, disabled }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!prompt.trim() || disabled) return;
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('vercelAiGateway', {
        action: 'generateImage',
        prompt: prompt.trim(),
        size: '1536x1024',
      });
      if (res.data?.error) throw new Error(res.data.error);
      if (!res.data?.urls?.length) throw new Error('No image returned');
      onImageUrl(res.data.urls[0]);
    } catch (e) {
      setError(e.message || 'Image generation failed');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
          <Wand2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-800">ChatGPT Image Generation</h3>
          <p className="text-xs text-stone-500">Describe a design — AI generates it, then ingest it into code</p>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={disabled || loading}
        rows={3}
        placeholder="Describe the website design you want... e.g. 'Modern epoxy garage floor landing page with hero image, gold accents, lead capture form'"
        className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:border-emerald-500 focus:outline-none disabled:bg-stone-100 resize-none"
      />

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => setPrompt(p)}
            disabled={disabled || loading}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50"
          >
            Preset {i + 1}
          </button>
        ))}
      </div>

      <button
        onClick={generate}
        disabled={!prompt.trim() || loading || disabled}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating design with AI...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Design Image
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}