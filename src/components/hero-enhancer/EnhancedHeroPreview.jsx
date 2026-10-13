import React from 'react';

export default function EnhancedHeroPreview({ html, label = 'Enhanced Hero' }) {
  if (!html) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <p className="text-sm text-white/30">No preview yet — enhance a mockup to see the result</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-white">{label}</h3>
        <span className="text-xs text-white/40">Live iframe preview</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
        <iframe
          srcDoc={html}
          title="Enhanced Hero Preview"
          className="h-[400px] w-full border-0 md:h-[500px]"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}