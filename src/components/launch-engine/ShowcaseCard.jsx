import React, { useMemo } from 'react';
import { ExternalLink, Maximize2 } from 'lucide-react';
import TemplateLivePreview from '@/components/launch-engine/TemplateLivePreview';
import { galleryBrief, layoutNameForTemplate, openHtmlInBrowser, useLayoutHtml } from '@/lib/x1Preview';

export default function ShowcaseCard({ template, onPreview }) {
  const brief = useMemo(() => galleryBrief(template), [template]);
  const { html, imageSet } = useLayoutHtml(template, brief);
  const [niche, layout] = template.name.includes(' / ') ? template.name.split(' / ') : [template.niche || 'Website', ''];

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-[#7ed4ff]/25 bg-[#0b2b50] text-left shadow-[0_20px_40px_rgba(0,0,0,.20)] transition duration-200 hover:-translate-y-1 hover:border-[#6ecfff] hover:shadow-[0_22px_45px_rgba(0,145,255,.26)]">
      <button
        type="button"
        onClick={() => onPreview(template)}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6cd3ff]"
      >
        <div className="flex h-7 items-center justify-between border-b border-white/10 bg-[#061429] px-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-300">
          <span aria-hidden="true" className="text-[#66ceff]">● ● ●</span><span>{niche}</span>
        </div>
        <div className="relative h-[250px] overflow-hidden bg-white p-2">
          <TemplateLivePreview html={html} className="h-full w-full" />
          <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 rounded-lg border border-white/70 bg-[#0479ec]/90 px-3 py-2 text-xs font-bold text-white">
            View Full Preview <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="px-4 py-4">
          <h3 className="line-clamp-1 text-lg font-extrabold tracking-tight text-white">{niche}</h3>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#55ceff]/80">
            {layoutNameForTemplate(template)}{layout ? ` · ${layout}` : ''}
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300">
            {template.description || 'Explore the layout and sections in a full-page preview.'}
          </p>
        </div>
      </button>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${imageSet.approved ? 'text-[#55ceff]/70' : 'text-amber-300'}`}>
          {imageSet.approved ? `${imageSet.label} photography` : 'Imagery pending review'}
        </span>
        <button
          type="button"
          onClick={() => openHtmlInBrowser(html)}
          disabled={!html}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-white/25 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:border-[#6cd3ff] hover:text-[#6cd3ff] disabled:opacity-40"
        >
          <Maximize2 className="h-3 w-3" /> Full screen
        </button>
      </div>
    </div>
  );
}