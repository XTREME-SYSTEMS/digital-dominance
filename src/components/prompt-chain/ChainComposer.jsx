import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { card, label, heading, muted, input, primaryButton } from './chainStyles';

const TARGETS = ['website', 'page', 'template', 'system', 'copy', 'automation'];

/** One sentence in. Two optional facts about it. One button that runs the chain. */
export default function ChainComposer({ form, setForm, running, onRun }) {
  const canRun = form.sentence.trim().length >= 12 && !running;
  const set = patch => setForm(prev => ({ ...prev, ...patch }));

  return (
    <section style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
        <h2 style={heading}>Prompt transformer</h2>
        <span style={label}>One sentence in, execution brief out</span>
      </div>

      <label style={{ ...label, display: 'block', marginBottom: '6px' }} htmlFor="chain-sentence">The sentence or command</label>
      <textarea
        id="chain-sentence"
        value={form.sentence}
        onChange={event => set({ sentence: event.target.value })}
        rows={3}
        placeholder="Make my epoxy garage flooring site win the local search results and take bookings"
        style={{ ...input, minHeight: '84px', resize: 'vertical', marginBottom: '12px' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ ...label, display: 'block', marginBottom: '6px' }} htmlFor="chain-industry">Industry (optional)</label>
          <input
            id="chain-industry"
            value={form.industry}
            onChange={event => set({ industry: event.target.value })}
            placeholder="Detected from the sentence when left blank"
            style={input}
          />
        </div>
        <div>
          <label style={{ ...label, display: 'block', marginBottom: '6px' }} htmlFor="chain-target">What it produces</label>
          <select id="chain-target" value={form.target} onChange={event => set({ target: event.target.value })} style={input}>
            {TARGETS.map(target => <option key={target} value={target}>{target}</option>)}
          </select>
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginBottom: '10px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={form.auto_implement}
          onChange={event => set({ auto_implement: event.target.checked })}
          style={{ marginTop: '3px', width: '16px', height: '16px' }}
        />
        <span style={muted}>
          <strong style={{ color: 'var(--launch-admin-text)' }}>Autonomous implementation.</strong> Queue every packet the chain compiles,
          routed to the builder, admin or worker agent. Off means the chain still plans and scores, and nothing is queued until you say so.
        </span>
      </label>

      <details style={{ marginBottom: '12px' }}>
        <summary style={{ ...muted, cursor: 'pointer', fontWeight: 700 }}>Have the QA agent score a rendered page (optional)</summary>
        <textarea
          value={form.artefact_html}
          onChange={event => set({ artefact_html: event.target.value })}
          rows={4}
          placeholder="Paste the rendered page HTML. The chain hands it to the page QA agent and folds its score into the QA stage."
          style={{ ...input, minHeight: '76px', marginTop: '8px', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}
        />
      </details>

      <button type="button" onClick={onRun} disabled={!canRun} style={primaryButton(!canRun)}>
        {running ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {running ? 'Running the chain…' : 'Run the chain'}
      </button>
      {form.sentence.trim().length > 0 && form.sentence.trim().length < 12 && (
        <p style={{ ...muted, marginTop: '8px', color: 'var(--launch-admin-notice-text)' }}>
          Add a little more detail: at least a dozen characters.
        </p>
      )}
    </section>
  );
}