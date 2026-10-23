import React from 'react';
import { Loader2, Send } from 'lucide-react';
import { card, heading, muted, cell, badge, primaryButton, ghostButton } from './chainStyles';

/** The compiled work packets: pick the ones to queue, or queue them all. */
export default function ChainPackets({ run, selected, onToggle, onQueue, onQueueAll, busy }) {
  const packets = run?.packets || [];
  if (!packets.length) return null;

  return (
    <section style={card}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <h2 style={heading}>Implementation packets</h2>
        <span style={muted}>{packets.length} compiled · {selected.length} selected</span>
      </div>
      <p style={{ ...muted, marginBottom: '12px' }}>
        Each packet carries its own acceptance test and routes to the agent that owns that kind of work. Queueing writes one
        enhancement job per packet, deduplicated by run and criterion, so running the chain twice never doubles the queue.
      </p>

      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '8px' }}>
        {packets.map(packet => {
          const queued = (run.actions || []).find(action => action.packet_id === packet.id);
          const checked = selected.includes(packet.id);
          return (
            <li key={packet.id} style={{ border: '1px solid var(--launch-admin-border)', borderRadius: '10px', padding: '10px 12px' }}>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(packet.id)}
                  style={{ marginTop: '3px', width: '16px', height: '16px' }}
                />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--launch-admin-heading)' }}>{packet.title}</strong>
                    <span style={{ ...badge('low'), background: 'var(--launch-admin-action-secondary)', color: 'var(--launch-admin-action-secondary-text)' }}>
                      route {packet.route}
                    </span>
                    {queued && <span style={badge(queued.status === 'queued' ? 'PASS' : 'BLOCKED')}>{String(queued.status).replace(/_/g, ' ')}</span>}
                  </span>
                  <span style={{ ...muted, display: 'block' }}>Criterion {packet.criterion_id}</span>
                  {(packet.acceptance || []).map(test => (
                    <span key={test} style={{ ...cell, display: 'block', borderBottom: 0, padding: '4px 0 0', color: 'var(--launch-admin-action-secondary-text)' }}>
                      ✓ {test}
                    </span>
                  ))}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
        <button type="button" onClick={onQueue} disabled={busy || selected.length === 0} style={primaryButton(busy || selected.length === 0)}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          Queue {selected.length} selected packet{selected.length === 1 ? '' : 's'}
        </button>
        <button type="button" onClick={onQueueAll} disabled={busy} style={ghostButton(busy)}>
          Queue every packet
        </button>
      </div>
    </section>
  );
}