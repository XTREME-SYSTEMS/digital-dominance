import React from 'react';
import { card, heading, label, muted, table, headCell, cell, badge, tone } from './chainStyles';

/** The score, the scoreboard behind it, and the determinism proof. */
export default function ChainScoreboard({ run }) {
  if (!run) return null;
  const scores = run.scores || {};
  const determinism = run.determinism || {};
  const tiles = [
    ['Transform', scores.transform],
    ['Implement', scores.implement],
    ['QA agent', scores.qa],
    ['Validation', scores.validate],
    ['Autonomous', scores.autonomous],
  ];

  return (
    <section style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontSize: '30px', fontWeight: 900, color: 'var(--launch-admin-heading)' }}>{Number(scores.total || 0).toFixed(1)}</span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--launch-admin-primary)' }}>grade {scores.grade || 'F'}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={badge(run.verdict)}>{run.verdict}</span>
          <span style={badge(run.status)}>{String(run.status || '').replace(/_/g, ' ')}</span>
          <span style={{ ...badge('low'), background: 'var(--launch-admin-action-secondary)', color: 'var(--launch-admin-action-secondary-text)' }}>
            {run.receipt_ids?.length || 0} receipts
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '14px' }}>
        {tiles.map(([name, value]) => (
          <div key={name} style={{ border: '1px solid var(--launch-admin-border)', borderRadius: '10px', padding: '9px 11px' }}>
            <p style={label}>{name}</p>
            <p style={{ margin: '3px 0 0', fontSize: '18px', fontWeight: 800, color: 'var(--launch-admin-heading)' }}>{Number(value || 0).toFixed(1)}</p>
          </div>
        ))}
      </div>

      <h3 style={{ ...heading, fontSize: '13px', marginBottom: '8px' }}>Scored criteria</h3>
      <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
        <table style={table}>
          <thead>
            <tr>
              <th style={headCell}>Criterion</th>
              <th style={headCell}>Agent</th>
              <th style={headCell}>Earned</th>
              <th style={headCell}>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {(run.criteria || []).map(item => (
              <tr key={`${item.agent}-${item.key}`}>
                <td style={{ ...cell, fontWeight: 700 }}>{item.label}</td>
                <td style={cell}>{item.agent}</td>
                <td style={{ ...cell, fontWeight: 800, color: item.ratio >= 1 ? tone('PASS') : item.ratio > 0 ? tone('partial') : tone('FAIL') }}>
                  {Number(item.earned || 0).toFixed(1)} / {item.weight}
                </td>
                <td style={{ ...cell, color: 'var(--launch-admin-muted)' }}>{item.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ ...heading, fontSize: '13px', marginBottom: '6px' }}>Deterministic architecture</h3>
      <p style={{ ...muted, marginBottom: '6px' }}>
        Brief digest <code style={{ color: 'var(--launch-admin-primary)' }}>{determinism.hash || '—'}</code> · replay{' '}
        <strong style={{ color: determinism.stable ? tone('PASS') : tone('FAIL') }}>{determinism.stable ? 'identical result' : 'unverified'}</strong>
      </p>
      <ul style={{ margin: 0, paddingLeft: '18px' }}>
        {(determinism.checks || []).map(check => <li key={check} style={muted}>{check}</li>)}
        {(determinism.unsupported_facts || []).length > 0 && (
          <li style={{ ...muted, color: tone('high') }}>Unsupported facts flagged: {determinism.unsupported_facts.join(', ')}</li>
        )}
      </ul>
    </section>
  );
}