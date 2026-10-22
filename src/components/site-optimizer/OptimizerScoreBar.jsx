import React from 'react';
import { Loader2, RefreshCw, ShieldCheck, Wand2 } from 'lucide-react';

/**
 * The five scores the studio reads back off the finished page, and the three
 * buttons that act on them.
 *
 * Nothing here is scored on trust: a button applies a change, the page redraws,
 * the agents re-read it, and only then does a number move.
 */

const TILES = [
  { key: 'qa', label: 'QA agent' },
  { key: 'validator', label: 'Validator' },
  { key: 'seo', label: 'SEO' },
  { key: 'aeo', label: 'AEO' },
  { key: 'geo', label: 'GEO' },
];

function tone(value) {
  if (value === null || value === undefined) return 'border-white/10 bg-white/5 text-white/35';
  if (value >= 90) return 'border-emerald-400/40 bg-emerald-400/5 text-emerald-300';
  if (value >= 75) return 'border-sky-400/40 bg-sky-400/5 text-sky-300';
  if (value >= 55) return 'border-amber-400/40 bg-amber-400/5 text-amber-300';
  return 'border-red-400/40 bg-red-400/5 text-red-300';
}

export default function OptimizerScoreBar({ scores, scanning, pending, onScan, onAuto }) {
  const waiting = pending?.all || 0;
  const buttons = [
    { scope: 'fix', label: 'Auto Fix', count: pending?.fix || 0, className: 'bg-[#00a2ff] text-white hover:bg-[#0090e0]' },
    { scope: 'optimize', label: 'Auto Optimize', count: pending?.optimize || 0, className: 'bg-emerald-500 text-white hover:bg-emerald-600' },
    { scope: 'all', label: 'Auto Apply', count: waiting, className: 'bg-white text-[#050508] hover:bg-white/90' },
  ];

  return (
    <section aria-label="Page scores" className="border-b border-black bg-[#050508] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {TILES.map(tile => {
          const value = scores ? scores[tile.key] : null;
          return (
            <div key={tile.key} className={`flex min-w-[74px] flex-col rounded-xl border px-2.5 py-1.5 ${tone(value)}`}>
              <span className="text-[9px] font-black uppercase tracking-wider text-white/40">{tile.label}</span>
              <span className="text-lg font-black leading-tight">{value === null || value === undefined ? '—' : value}</span>
            </div>
          );
        })}

        <button
          type="button"
          onClick={onScan}
          disabled={scanning}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-bold text-white/70 transition hover:border-[#00a2ff] hover:text-[#00a2ff] disabled:opacity-40"
        >
          {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {scanning ? 'Scanning…' : scores ? 'Re-scan' : 'Scan the page'}
        </button>

        {buttons.map(button => (
          <button
            key={button.scope}
            type="button"
            onClick={() => onAuto(button.scope)}
            disabled={scanning || !scores || !button.count}
            title={button.count ? `${button.count} change${button.count === 1 ? '' : 's'} waiting` : 'Nothing waiting for this button'}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black transition disabled:opacity-35 ${button.className}`}
          >
            <Wand2 className="h-3.5 w-3.5" /> {button.label}{button.count ? ` (${button.count})` : ''}
          </button>
        ))}
      </div>

      <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/40">
        <ShieldCheck className="h-3 w-3 shrink-0" />
        {scores
          ? 'Scored from the finished page itself. Fix, optimize or apply, then the agents re-read the page and the numbers move.'
          : 'Scan the page to score it. The three buttons then fill with the changes the agents are waiting on.'}
      </p>
    </section>
  );
}