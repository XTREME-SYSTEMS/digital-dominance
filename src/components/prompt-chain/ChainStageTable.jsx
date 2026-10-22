import React from 'react';
import { card, heading, table, headCell, cell, badge } from './chainStyles';

/** Every stage, the agent that owned it, and the evidence it produced. */
export default function ChainStageTable({ stages = [] }) {
  if (!stages.length) return null;
  return (
    <section style={card}>
      <h2 style={{ ...heading, marginBottom: '10px' }}>Chain stages</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={table}>
          <thead>
            <tr>
              <th style={headCell}>Stage</th>
              <th style={headCell}>Agent</th>
              <th style={headCell}>Status</th>
              <th style={headCell}>Score</th>
              <th style={headCell}>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {stages.map(stage => (
              <tr key={stage.id}>
                <td style={{ ...cell, fontWeight: 700 }}>{stage.name}</td>
                <td style={cell}>{stage.agent}</td>
                <td style={cell}><span style={badge(stage.status)}>{stage.status}</span></td>
                <td style={{ ...cell, fontWeight: 800 }}>{Number(stage.score || 0).toFixed(1)}</td>
                <td style={{ ...cell, color: 'var(--launch-admin-muted)' }}>{stage.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}