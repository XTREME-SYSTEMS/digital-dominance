import React from 'react';
import { Check, Maximize2 } from 'lucide-react';
import TemplateLivePreview from '@/components/launch-engine/TemplateLivePreview';
import { layoutNameForTemplate, openHtmlInBrowser, useLayoutHtml } from '@/lib/x1Preview';

export default function LayoutCard({ template, brief, active, designName, onSelect }) {
  const { html, imageSet } = useLayoutHtml(template, brief);
  const layoutName = layoutNameForTemplate(template);

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border-2 bg-white transition ${active ? 'border-[#00a2ff] ring-2 ring-[#00a2ff]/30' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="relative h-[232px] overflow-hidden bg-gray-100 p-1.5">
        <TemplateLivePreview html={html} className="h-full w-full" />
        {active && (
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-[#00a2ff] p-1">
            <Check className="h-3 w-3 text-white" />
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 px-3 py-2">
        <span className="min-w-0">
          <span className={`block truncate text-xs font-bold ${active ? 'text-[#00a2ff]' : 'text-gray-800'}`}>{designName}</span>
          <span className={`mt-0.5 block truncate text-[10px] ${imageSet.approved ? 'text-gray-400' : 'text-amber-600'}`}>
            {layoutName} · {imageSet.approved ? `${imageSet.label} photography` : 'imagery needs review'}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={active}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${active ? 'bg-[#00a2ff] text-white' : 'border border-gray-200 text-gray-700 hover:border-[#00a2ff] hover:text-[#00a2ff]'}`}
          >
            {active ? 'Selected' : 'Choose'}
          </button>
          <button
            type="button"
            onClick={() => openHtmlInBrowser(html)}
            disabled={!html}
            aria-label={`See the ${layoutName} layout full screen`}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 transition hover:border-[#00a2ff] hover:text-[#00a2ff] disabled:opacity-40"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        </span>
      </div>
    </div>
  );
}