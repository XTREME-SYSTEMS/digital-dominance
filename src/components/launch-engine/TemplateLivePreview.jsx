import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { fetchTemplateHtml } from '@/lib/stockPreviewHtml';

const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 390;
const MAX_RENDER_HEIGHT = 14000;

/**
 * Renders the template's real page — never a shared stock photo.
 * Desktop shows the whole page top to bottom; the mobile pane renders the same
 * page at phone width so the responsive layout is what the visitor will see.
 */
function LiveFrame({ html, width, label, icon: Icon, fit, className = '' }) {
  const boxRef = useRef(null);
  const frameRef = useRef(null);
  const measured = useRef(false);
  const [pageHeight, setPageHeight] = useState(6000);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = boxRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setBox({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const measure = () => {
    if (measured.current) return;
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    const height = Math.max(doc.documentElement?.scrollHeight || 0, doc.body?.scrollHeight || 0);
    if (height > 0) {
      measured.current = true;
      setPageHeight(Math.min(height + 120, MAX_RENDER_HEIGHT));
    }
  };

  const scale = box.width > 0
    ? (fit === 'width' ? box.width / width : Math.min(box.width / width, box.height / pageHeight))
    : 0;
  const viewport = fit === 'width' ? 'h-full overflow-y-auto' : 'flex h-full items-start justify-center overflow-hidden';

  return (
    <div ref={boxRef} className={`relative min-w-0 overflow-hidden bg-white ${className}`}>
      <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
        <Icon className="h-2.5 w-2.5" aria-hidden="true" /> {label}
      </span>
      <div className={viewport}>
        <div className="shrink-0 bg-white" style={{ width: width * scale, height: pageHeight * scale }}>
          <iframe
            ref={frameRef}
            title={`${label} live page preview`}
            srcDoc={html}
            onLoad={measure}
            tabIndex={-1}
            scrolling="no"
            aria-hidden="true"
            style={{ width, height: pageHeight, border: 0, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function TemplateLivePreview({ template, html, className = '', fit = 'contain', mobileClassName = 'w-[24%] min-w-[58px] shrink-0' }) {
  const [loaded, setLoaded] = useState(null);
  const direct = html || template?.content || null;

  useEffect(() => {
    let live = true;
    if (direct || !template) { setLoaded(null); return undefined; }
    fetchTemplateHtml(template).then(page => { if (live) setLoaded(page); });
    return () => { live = false; };
  }, [direct, template]);

  const source = useMemo(() => direct || loaded, [direct, loaded]);

  if (!source) {
    return (
      <p className={`flex items-center justify-center p-4 text-center text-xs text-muted-foreground ${className}`}>
        Loading this template's page…
      </p>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <LiveFrame html={source} width={DESKTOP_WIDTH} label="Desktop" icon={Monitor} fit={fit} className="flex-1 rounded-md ring-1 ring-black/10" />
      <LiveFrame html={source} width={MOBILE_WIDTH} label="Mobile" icon={Smartphone} fit={fit} className={`${mobileClassName} rounded-md ring-1 ring-black/10`} />
    </div>
  );
}