import React from 'react';
import { History } from 'lucide-react';
import { card, heading, muted, table, headCell, cell, badge, ghostButton } from './chainStyles';

/** Every past chain run, so the scores and receipts are a record, not a memory. */
export default function ChainHistory({ runs = [], onLoad, busy }) {
  return (
    <section style={card}>
      <h2 style={{ ...heading, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <History size={15} /> Chain history
      </h2>
      <p style={{ ...muted, marginBottom: '12px' }}>
        Reopening a run restores its sentence, so re-running it reproduces the same run ID, the same digest and the same score.
      </p>
      {runs.length === 0 ? (
        <p style={muted}>No runs yet. The first sentence you run appears here with its receipts.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={headCell}>Sentence</th>
                <th style={headCell}>Run</th>
                <th style={headCell}>Score</th>
                <th style={headCell}>Verdict</th>
                <th style={headCell} />
              </tr>
            </thead>
            <tbody>
              {runs.map(item => (
                <tr key={item.id}>
                  <td style={cell}>{item.source_sentence}</td>
                  <td style={{ ...cell, color: 'var(--launch-admin-muted)' }}>{item.run_id}</td>
                  <td style={{ ...cell, fontWeight: 800 }}>{Number(item.scores?.total || 0).toFixed(1)} · {item.scores?.grade || 'F'}</td>
                  <td style={cell}><span style={badge(item.verdict || item.status)}>{item.verdict || item.status}</span></td>
                  <td style={cell}>
                    <button type="button" onClick={() => onLoad(item)} disabled={busy} style={ghostButton(busy)}>Reopen</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}