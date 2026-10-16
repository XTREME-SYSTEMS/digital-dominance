import React, { useEffect, useRef, useState } from 'react';

/**
 * A real miniature rendering of the selected website HTML, not a decorative
 * industry photograph or invented screenshot. Inert, sandboxed and responsive.
 */
export default function StockDesignThumbnail({ template, className = '' }) {
  const frame = useRef(null);
  const [scale, setScale] = useState(0.32);

  useEffect(() => {
    const container = frame.current;
    if (!container) return;
    const measure = () => {
      const width = container.getBoundingClientRect().width;
      if (width > 0) setScale(Math.min(1, width / 960));
    };
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(container);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div ref={frame} className={`relative h-48 w-full overflow-hidden bg-white ${className}`} data-testid="real-website-thumbnail">
      {typeof template?.content === 'string' && template.content.trim() ? (
        <iframe
          title={`Visual sample of ${template.name || 'website design'}`}
          aria-hidden="true"
          tabIndex={-1}
          loading="lazy"
          srcDoc={template.content}
          sandbox=""
          referrerPolicy="no-referrer"
          className="pointer-events-none absolute left-0 top-0 border-0 bg-white"
          style={{ width: 960, height: 720, transformOrigin: 'top left', transform: `scale(${scale})` }}
        />
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-600">
          Select this design to view the full website.
        </div>
      )}
    </div>
  );
}
