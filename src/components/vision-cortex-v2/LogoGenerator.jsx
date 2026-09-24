import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { invokeLLM } from '@/lib/gateway';
import { Image } from '@/components/ui/image';
import { Palette, Loader2, CheckCircle2, Download, RefreshCw, Sparkles } from 'lucide-react';

export default function LogoGenerator({ vision, approvedLogo, setApprovedLogo }) {
  const [loading, setLoading] = useState(false);
  const [logos, setLogos] = useState([]);
  const [approved, setApproved] = useState(approvedLogo || null);
  const [error, setError] = useState(null);
  const [brandName, setBrandName] = useState('');

  const generate = async () => {
    setLoading(true);
    setError(null);
    setLogos([]);
    setApproved(null);
    try {
      // Generate brand name first
      const nameRes = await invokeLLM({
        prompt: `Generate a single premium brand name for this vision: "${vision}". Return JSON with a name field and no explanation.`,
        response_json_schema: { type: 'object', properties: { name: { type: 'string' } } },
      });
      const name = nameRes.name || 'AI System';
      setBrandName(name);

      // Generate 10 logo variations with transparent backgrounds
      const logoPromises = Array.from({ length: 10 }, (_, i) => {
        const styles = [
          'minimalist geometric', 'modern tech gradient', 'bold typographic', 'abstract neural network',
          'circular emblem', 'hexagonal tech', 'wave dynamic', 'crystalline 3D',
          'circuit-inspired', 'premium gold metallic',
        ];
        return base44.functions.invoke('vercelAiGateway', {
          action: 'generateImage',
          prompt: `Professional logo for "${name}" — ${styles[i]} style, transparent background, high quality, vector-like, clean, modern, premium brand identity, centered, no text watermark, PNG with transparency`,
        }).then((r) => r.data?.urls?.[0] ? ({ url: r.data.urls[0], style: styles[i], index: i }) : null).catch(() => null);
      });

      const results = await Promise.all(logoPromises);
      const available = results.filter(Boolean);
      if (!available.length) throw new Error('Image generation is unavailable. Check your Vercel AI Gateway billing and try again.');
      setLogos(available);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const approve = (logo) => {
    setApproved(logo);
    setApprovedLogo?.(logo);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-black text-stone-900">Logo Generator — 10 Variations</h3>
          {approved && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Approved</span>}
        </div>
        <button onClick={generate} disabled={loading || !vision?.trim()} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generating 10 logos...' : 'Generate Logos'}
        </button>
      </div>

      {brandName && <p className="text-sm font-bold text-stone-700">Brand: <span className="text-amber-600">{brandName}</span></p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {loading && (
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg border-2 border-dashed border-stone-200 grid place-items-center">
              <Loader2 className="h-5 w-5 animate-spin text-stone-300" />
            </div>
          ))}
        </div>
      )}

      {logos.length > 0 && !loading && (
        <div className="grid grid-cols-5 gap-2">
          {logos.map((logo) => (
            <div key={logo.index} className={`relative group rounded-lg border-2 overflow-hidden ${approved?.index === logo.index ? 'border-green-500' : 'border-stone-200'}`}>
              <div className="aspect-square bg-[conic-gradient(at_top_left,_#f0f0f0_25%,_#e0e0e0_25%_50%,_#f0f0f0_50%_75%,_#e0e0e0_75%)]" style={{ background: 'repeating-conic-gradient(#f5f5f5 0% 25%, #e5e5e5 0% 50%)', backgroundSize: '20px 20px' }}>
                <Image src={logo.url} alt={`Logo ${logo.index + 1}`} className="w-full h-full object-contain" fittingType="fit" />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                <button onClick={() => approve(logo)} className="rounded-lg bg-green-500 text-white text-xs font-bold px-3 py-1.5 hover:bg-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Approve
                </button>
                <a href={logo.url} download className="rounded-lg bg-white text-stone-900 text-xs font-bold px-3 py-1.5 hover:bg-stone-100 flex items-center gap-1">
                  <Download className="h-3 w-3" /> Download
                </a>
              </div>
              {approved?.index === logo.index && (
                <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
              <p className="text-[9px] text-stone-400 text-center py-0.5 bg-white">{logo.style}</p>
            </div>
          ))}
        </div>
      )}

      {approved && (
        <div className="rounded-lg border-2 border-green-300 bg-green-50 p-3 flex items-center gap-3">
          <Image src={approved.url} alt="Approved logo" className="h-12 w-12 object-contain" fittingType="fit" />
          <div>
            <p className="text-sm font-bold text-green-700">✓ Logo Approved — {approved.style}</p>
            <p className="text-xs text-stone-500">This logo will be used in the brand kit and all generated assets.</p>
          </div>
        </div>
      )}
    </div>
  );
}