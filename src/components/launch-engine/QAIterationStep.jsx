import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Loader2, Check, Wand2, MousePointerClick, AlertTriangle } from 'lucide-react';

/**
 * The QA and validation step. Runs the validator and the QA agent over the
 * page that was just presented, shows every flagged area, and lets the owner
 * tick the suggestions they want — the button then reads Regenerate.
 */
export default function QAIterationStep({ result, running, onRun, checked, onToggle, onRegenerate, onOpenEditor, appliedFixes }) {
  const [touched, setTouched] = useState(false);
  const validation = result?.validation;
  const qa = result?.qa;
  const suggestions = result?.suggestions || [];
  const findings = validation?.findings || [];
  const flagged = qa?.flagged || [];
  const count = checked.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-gray-800">QA agent &amp; validation agent</p>
          <p className="text-[11px] text-gray-500">Scans your first page for anything missing, mock or off-brand, then scores it.</p>
        </div>
        <button
          type="button"
          onClick={() => { setTouched(true); onRun(); }}
          disabled={running}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#00a2ff] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#0090e0] disabled:opacity-50"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          {running ? 'Scanning…' : result ? 'Re-scan' : 'Run the scan'}
        </button>
      </div>

      {appliedFixes?.length > 0 && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-[11px] font-semibold text-green-700">
          {appliedFixes.length} fix{appliedFixes.length === 1 ? '' : 'es'} already applied and regenerated onto the page.
        </p>
      )}

      {!result && !running && (
        <p className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500">
          Run the scan to see what the agents flag on this template.
        </p>
      )}

      {running && !result && <p className="text-center text-xs text-gray-400">Both agents are reviewing your page…</p>}

      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Validation</p>
              <p className={`mt-1 text-lg font-black ${validation?.passed ? 'text-green-600' : 'text-amber-600'}`}>
                {validation?.passed ? 'Page is clean' : `${findings.length} issue${findings.length === 1 ? '' : 's'} to fix`}
              </p>
              <p className="text-[11px] text-gray-500">{validation?.summary}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">QA score</p>
              <p className="mt-1 text-lg font-black text-[#0a1220]">{qa?.score ?? '—'}<span className="text-xs text-gray-400"> / 100</span></p>
              <p className="text-[11px] text-gray-500">{qa?.verdict}</p>
            </div>
          </div>

          {(findings.length > 0 || flagged.length > 0) && (
            <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" /> Flagged areas
              </p>
              <ul className="space-y-1">
                {findings.map(item => (
                  <li key={item.id} className="text-[11px] text-amber-900">• {item.label}{item.detail ? ` — ${item.detail}` : ''}</li>
                ))}
                {flagged.map(item => (
                  <li key={item} className="text-[11px] text-amber-900">• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-gray-500">
                <Sparkles className="h-3.5 w-3.5 text-[#00a2ff]" /> Suggested improvements — tick what you want
              </p>
              <div className="grid gap-1.5">
                {suggestions.map(suggestion => {
                  const isChecked = checked.includes(suggestion.id);
                  return (
                    <button
                      type="button"
                      key={suggestion.id}
                      onClick={() => onToggle(suggestion.id)}
                      aria-pressed={isChecked}
                      className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition ${isChecked ? 'border-[#00a2ff] bg-[#00a2ff]/5' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isChecked ? 'border-[#00a2ff] bg-[#00a2ff] text-white' : 'border-gray-300'}`}>
                        {isChecked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-gray-800">{suggestion.label}</span>
                        {suggestion.detail && <span className="block text-[11px] leading-snug text-gray-500">{suggestion.detail}</span>}
                      </span>
                      {suggestion.severity === 'high' && <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-700">must</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onRegenerate(checked)}
              disabled={running || (!count && !touched)}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00a2ff] to-[#0066cc] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {count ? `Regenerate (${count} selected)` : 'Regenerate'}
            </button>
            <button
              type="button"
              onClick={onOpenEditor}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-[#00a2ff] hover:text-[#00a2ff]"
            >
              <MousePointerClick className="h-4 w-4" /> Point, click &amp; edit
            </button>
          </div>
        </>
      )}
    </div>
  );
}