import React, { useState } from 'react';
import { Sparkles, Loader2, Check, AlertCircle, Images } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

/**
 * Ten candidate photographs for the page, built from the owner's trade and
 * services. They tick the ones they want: the first tick becomes the page's
 * hero image and the rest fill the remaining photo slots.
 *
 * Every generated image carries the disclaimer — it is an AI illustration and
 * must never be presented as a photo of real completed work.
 */
export default function ImageConceptPicker({ profile, chosen = [], onPick }) {
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('siteImageConcepts', {
        industry: profile?.industry_label || profile?.industry || '',
        sub_industry: profile?.sub_industry || '',
        services: profile?.services || [],
        city: profile?.city || '',
        state: profile?.state || '',
      });
      const list = res.data?.images || [];
      if (!list.length) throw new Error(res.data?.error || 'No images came back — try again');
      setImages(list);
    } catch (e) {
      setError(e.message || 'Image generation failed');
    } finally {
      setBusy(false);
    }
  };

  const toggle = url => onPick(chosen.includes(url) ? chosen.filter(v => v !== url) : [...chosen, url]);
  const allPicked = images.length > 0 && images.every(image => chosen.includes(image.url));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-gray-800">Generate 10 images and pick the ones that fit</p>
          <p className="text-[11px] text-gray-500">Built from your trade{profile?.services?.length ? ' and the services you chose' : ''}. Your first pick becomes the hero image.</p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#00a2ff] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#0090e0] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Images className="h-3.5 w-3.5" />}
          {busy ? 'Generating…' : images.length ? 'Regenerate 10' : 'Generate 10 images'}
        </button>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-[11px] text-red-500">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {busy && <p role="status" className="text-[11px] text-gray-500">Generating 10 images — about a minute…</p>}

      {images.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{chosen.length} of {images.length} selected</span>
            <button
              type="button"
              onClick={() => onPick(allPicked ? [] : images.map(image => image.url))}
              className="rounded-lg border border-gray-200 px-3 py-1 text-[11px] font-bold text-gray-700 transition hover:border-[#00a2ff] hover:text-[#00a2ff]"
            >
              {allPicked ? 'Clear all' : 'Select all'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {images.map(image => {
              const isPicked = chosen.includes(image.url);
              const isHero = chosen[0] === image.url;
              return (
                <button
                  type="button"
                  key={image.url}
                  onClick={() => toggle(image.url)}
                  aria-pressed={isPicked}
                  className={`overflow-hidden rounded-xl border text-left transition ${isPicked ? 'border-[#00a2ff] ring-2 ring-[#00a2ff]/25' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="relative block">
                    <Image src={image.url} alt={image.style} className="h-24 w-full object-cover" />
                    <span className={`absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded border ${isPicked ? 'border-[#00a2ff] bg-[#00a2ff] text-white' : 'border-white/80 bg-black/40'}`}>
                      {isPicked && <Check className="h-3 w-3" />}
                    </span>
                    {isHero && <span className="absolute left-1.5 top-1.5 rounded bg-[#00a2ff] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">Hero</span>}
                  </span>
                  <span className="block truncate px-1.5 py-1 text-[10px] font-bold text-gray-700" title={image.style}>{image.style}</span>
                </button>
              );
            })}
          </div>

          <p className="flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-800">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            Every image here is AI-created. Review each one before publishing, and never present a generated image as a photo of real completed work.
          </p>
        </>
      )}

      {!busy && !images.length && !error && (
        <p className="flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 p-3 text-[11px] text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-[#00a2ff]" />
          No images yet. Generate ten from your trade, or upload your own photos instead.
        </p>
      )}
    </div>
  );
}