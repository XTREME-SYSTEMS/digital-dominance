import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Maximize2 } from 'lucide-react';
import { openHtmlInBrowser } from '@/lib/x1Preview';

const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 390;

/**
 * A pane holds a real page at its true layout width, scaled to fit the pane.
 * It opens at the top of the page and scrolls inside, so the visitor sees a
 * close-up of the hero and can scroll the whole site — never a squeezed strip.
 */
function Pane({ html, width, label, icon: Icon, className = '', hint }) {
  const boxRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = boxRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = size.width > 0 ? size.width / width : 0;
  const ready = html && scale > 0 && size.height > 0;

  return (
    <div ref={boxRef} className={`relative overflow-hidden bg-white ${className}`}>
      <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
        <Icon className="h-2.5 w-2.5" aria-hidden="true" /> {label}
      </span>
      {ready && (
        <iframe
          title={`${label} website layout preview`}
          srcDoc={html}
          scrolling="yes"
          style={{
            width,
            height: size.height / scale,
            border: 0,
            display: 'block',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      )}
      {hint && ready && (
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded bg-black/60 px-2 py-1 text-[9px] font-semibold text-white">
          {hint}
        </span>
      )}
    </div>
  );
}

export default function TemplateLivePreview({
  html,
  className = '',
  showMobile = true,
  showFullScreen = false,
  showHint = false,
  desktopClassName = 'flex-1',
  mobileClassName = 'w-[22%] min-w-[72px] shrink-0',
  emptyLabel = 'Preparing this layout…',
}) {
  if (!html) {
    return (
      <p className={`flex items-center justify-center p-4 text-center text-xs text-muted-foreground ${className}`}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="relative flex min-h-0 flex-1 gap-2">
        <Pane
          html={html}
          width={DESKTOP_WIDTH}
          label="Desktop"
          icon={Monitor}
          className={`${desktopClassName} rounded-md ring-1 ring-black/10`}
          hint={showHint ? 'Scroll inside to see the whole page' : undefined}
        />
        {showMobile && (
          <Pane
            html={html}
            width={MOBILE_WIDTH}
            label="Mobile"
            icon={Smartphone}
            className={`${mobileClassName} rounded-md ring-1 ring-black/10`}
          />
        )}
      </div>
      {showFullScreen && (
        <button
          type="button"
          onClick={() => openHtmlInBrowser(html)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-[#00a2ff] hover:text-[#00a2ff]"
        >
          <Maximize2 className="h-3.5 w-3.5" /> See it full screen in the browser
        </button>
      )}
    </div>
  );
}