import React from 'react';
import { ArrowLeft, Check, ExternalLink, Loader2, Sparkles, Wand2, RefreshCw, AlertCircle } from 'lucide-react';
import QAIterationStep from '@/components/launch-engine/QAIterationStep';
import ImageConceptPicker from '@/components/launch-engine/wizard/ImageConceptPicker';
import { LAYOUT_NAMES } from '@/lib/x1Preview';

/**
 * The controls for one technology. Every entry either changes the live page —
 * which re-renders immediately behind this panel — or opens the tool that owns
 * that technology.
 */
export default function OptimizerPanel({ tool, state, actions }) {
  const { profile, installed = [], removed = [], appliedFixes = [], layout, chosenImages = [], scan, scanning, checked = [], aiCopy, busy } = state;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={actions.back}
        className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 transition hover:text-[#00a2ff]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All technologies
      </button>

      <div>
        <h2 className="text-sm font-black text-[#0a1220]">{tool.label}</h2>
        <p className="mt-1 text-[11px] leading-snug text-gray-500">{tool.blurb}</p>
      </div>

      {state.error && (
        <p role="alert" className="flex items-start gap-1.5 rounded-lg bg-red-50 p-2 text-[11px] text-red-600">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {state.error}
        </p>
      )}

      {/* ── Applied to the page, no action needed ───────────── */}
      {tool.kind === 'status' && tool.id === 'install' && (
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">Installed from your answers</p>
          {installed.length ? (
            <ul className="space-y-0.5">
              {installed.map(item => <li key={item} className="text-[11px] text-gray-700">✓ {item}</li>)}
            </ul>
          ) : (
            <p className="text-[11px] text-gray-500">Nothing installed yet — the page has not rendered.</p>
          )}
          {removed.length > 0 && (
            <>
              <p className="pt-1 text-[11px] font-black uppercase tracking-wider text-gray-400">Demonstration content removed</p>
              <ul className="space-y-0.5">
                {removed.map(item => <li key={item} className="text-[11px] text-gray-500">✕ {item}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      {tool.kind === 'status' && tool.id === 'rating-band' && (
        <p className="rounded-lg border border-gray-200 p-2 text-[11px] text-gray-700">
          {profile?.has_rating
            ? `On — ${Number(profile.rating_value) || 5} of 5${profile.rating_count ? ` from ${profile.rating_count} reviews` : ''}.`
            : 'Off — you told the wizard you have no reviews, so nothing about ratings appears on the page.'}
        </p>
      )}

      {/* ── A fix applied to the page ───────────────────────── */}
      {tool.kind === 'fix' && (
        <button
          type="button"
          onClick={() => actions.applyFix(tool.fix)}
          disabled={appliedFixes.includes(tool.fix)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00a2ff] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0090e0] disabled:opacity-50"
        >
          {appliedFixes.includes(tool.fix)
            ? <><Check className="h-3.5 w-3.5" /> Applied to the page</>
            : <><Wand2 className="h-3.5 w-3.5" /> Apply to my page</>}
        </button>
      )}

      {/* ── Layout style ────────────────────────────────────── */}
      {tool.kind === 'layout' && (
        <div className="grid gap-1.5">
          {Object.entries(LAYOUT_NAMES).map(([id, name]) => (
            <button
              type="button"
              key={id}
              onClick={() => actions.setLayout(id)}
              className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left text-[11px] font-bold transition ${layout === id ? 'border-[#00a2ff] bg-[#00a2ff]/5 text-[#0a1220]' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
            >
              {name}
              {layout === id && <Check className="h-3 w-3 text-[#00a2ff]" />}
            </button>
          ))}
        </div>
      )}

      {/* ── Ten generated images ────────────────────────────── */}
      {tool.kind === 'images' && (
        <>
          <ImageConceptPicker profile={profile} chosen={chosenImages} onPick={actions.pickImages} />
          <p className="text-[11px] text-gray-500">
            {chosenImages.length
              ? `${chosenImages.length} image${chosenImages.length === 1 ? '' : 's'} on the page — the page behind this panel has already changed.`
              : 'Pick none and the page keeps the industry photography it already has.'}
          </p>
        </>
      )}

      {/* ── AI copy rewrite ─────────────────────────────────── */}
      {tool.kind === 'copy' && (
        <div className="space-y-2">
          {aiCopy?.headline && (
            <div className="rounded-lg border border-gray-200 p-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Currently on the page</p>
              <p className="mt-1 text-[11px] font-bold text-gray-800">{aiCopy.headline}</p>
              <p className="text-[11px] text-gray-500">{aiCopy.description}</p>
            </div>
          )}
          <button
            type="button"
            onClick={actions.runCopy}
            disabled={busy === 'copy'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00a2ff] to-[#0066cc] px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy === 'copy' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {busy === 'copy' ? 'Writing…' : aiCopy?.headline ? 'Rewrite again' : 'Rewrite my copy'}
          </button>
          <p className="text-[11px] text-gray-500">Written from your own services. It never claims certifications, awards or years in business you did not give.</p>
        </div>
      )}

      {/* ── The two independent agents ──────────────────────── */}
      {tool.kind === 'scan' && (
        <QAIterationStep
          result={scan}
          running={scanning}
          onRun={actions.runScan}
          checked={checked}
          onToggle={actions.toggleChecked}
          onRegenerate={actions.regenerate}
          onOpenEditor={() => actions.openTool('/admin/visual-editor')}
          appliedFixes={appliedFixes}
        />
      )}

      {/* ── A dedicated tool ────────────────────────────────── */}
      {tool.kind === 'link' && (
        <button
          type="button"
          onClick={() => actions.openTool(tool.route)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:border-[#00a2ff] hover:text-[#00a2ff]"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open {tool.label}
        </button>
      )}

      <button
        type="button"
        onClick={actions.reload}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold text-gray-500 transition hover:text-[#00a2ff]"
      >
        <RefreshCw className="h-3 w-3" /> Reload the page
      </button>
    </div>
  );
}