import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { card, heading, muted, badge, tone } from './chainStyles';

/** The auto-recommender's output: what is still weak, in the order worth fixing. */
export default function ChainRecommendations({ run }) {
  const items = run?.recommendations || [];
  if (!run) return null;

  return (
    <section style={card}>
      <h2 style={{ ...heading, marginBottom: '4px' }}>Auto-recommender</h2>
      <p style={{ ...muted, marginBottom: '12px' }}>
        Ranked by severity, then by the points still on the table. Each one names the route that should carry it.
      </p>
      {items.length === 0 ? (
        <p style={muted}>Nothing outstanding: every scored criterion earned its full weight.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '8px' }}>
          {items.map(item => (
            <li key={item.id} style={{ border: '1px solid var(--launch-admin-border)', borderLeft: `3px solid ${tone(item.severity)}`, borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={badge(item.severity)}>{item.severity}</span>
                <strong style={{ fontSize: '13px', color: 'var(--launch-admin-heading)' }}>{item.title}</strong>
                <span style={{ ...muted, marginLeft: 'auto' }}>{item.points} pts · route {item.route}</span>
              </div>
              <p style={muted}>{item.detail}</p>
            </li>
          ))}
        </ul>
      )}
      {run.verdict === 'PARTIAL' && (
        <p style={{ ...muted, marginTop: '10px', display: 'flex', gap: '7px', alignItems: 'flex-start', color: 'var(--launch-admin-notice-text)' }}>
          <AlertTriangle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
          A stage is blocked or is missing evidence, so the chain refuses to call this a pass. Missing evidence is never scored as success.
        </p>
      )}
    </section>
  );
}