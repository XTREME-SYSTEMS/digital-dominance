import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * The live page, at full size: the exact HTML the site will ship, with its own
 * scripts running so the mobile menu and scrolling behave as they will on the
 * published site.
 */
export default function OptimizerPreview({ html, reloadKey, loading }) {
  if (loading) {
    return (
      <div className="grid h-full place-items-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#00a2ff]" aria-label="Loading the page" />
      </div>
    );
  }

  if (!html) {
    return (
      <div className="grid h-full place-items-center bg-white px-8 text-center">
        <p className="max-w-sm text-sm text-gray-500">
          There is no rendered page yet. Bring in a template and your business details, and the page appears here.
        </p>
      </div>
    );
  }

  return (
    <iframe
      key={reloadKey}
      title="Your page"
      srcDoc={html}
      sandbox="allow-scripts allow-popups"
      className="h-full w-full border-0 bg-white"
    />
  );
}