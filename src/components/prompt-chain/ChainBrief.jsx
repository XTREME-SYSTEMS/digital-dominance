import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { card, heading, muted, ghostButton } from './chainStyles';

/** The transformed brief itself — the thing that gets implemented. */
export default function ChainBrief({ run }) {
  const [copied, setCopied] = useState(false);
  if (!run?.brief_text) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(run.brief_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      setCopied(false);
    }
  };

  return (
    <section style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <h2 style={heading}>The execution brief</h2>
        <button type="button" onClick={copy} style={ghostButton(false)}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy the brief'}
        </button>
      </div>
      <p style={{ ...muted, marginBottom: '8px' }}>
        Run <code style={{ color: 'var(--launch-admin-primary)' }}>{run.run_id}</code> on chain {run.chain_version}. This is what an
        implementing agent receives: no questions, no gaps, every check measurable.
      </p>
      <pre style={{
        margin: 0,
        maxHeight: '340px',
        overflow: 'auto',
        background: 'var(--launch-admin-action-secondary)',
        color: 'var(--launch-admin-heading)',
        border: '1px solid var(--launch-admin-border)',
        borderRadius: '10px',
        padding: '12px',
        fontSize: '12px',
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        fontFamily: 'ui-monospace, monospace',
      }}>
        {run.brief_text}
      </pre>
    </section>
  );
}