import React, { useState, useMemo } from 'react';
import { Shield, AlertTriangle, CheckCircle2, XCircle, HelpCircle, Layers } from 'lucide-react';
import { GENERATOR_REGISTRY, getGeneratorStats, getGeneratorsByClassification } from '@/lib/generatorRegistry';

const CLASSIFICATION_STYLES = {
  REUSE: { color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  CONNECT: { color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  REPAIR: { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  REFACTOR: { color: '#7e22ce', bg: '#faf5ff', border: '#e9d5ff' },
  MERGE: { color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
  'NEW-GAP': { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  QUARANTINE: { color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
};

function GateIcon({ status }) {
  if (status === 'PASS') return <CheckCircle2 style={{ width: 16, height: 16, color: '#059669' }} />;
  if (status === 'FAIL') return <XCircle style={{ width: 16, height: 16, color: '#ef4444' }} />;
  if (status === 'BLOCKED') return <AlertTriangle style={{ width: 16, height: 16, color: '#f59e0b' }} />;
  return <HelpCircle style={{ width: 16, height: 16, color: '#94a3b8' }} />;
}

export default function GeneratorRegistry() {
  const [filter, setFilter] = useState('ALL');
  const stats = useMemo(() => getGeneratorStats(), []);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return GENERATOR_REGISTRY;
    return getGeneratorsByClassification(filter);
  }, [filter]);

  const cardStyle = {
    background: 'var(--launch-admin-surface, #fff)',
    border: '1px solid var(--launch-admin-border, #dce6f1)',
    borderRadius: '13px',
    padding: '23px',
    minHeight: '120px',
    boxShadow: '0 8px 19px rgba(20, 63, 103, 0.06)',
  };

  const labelStyle = {
    fontSize: '13px',
    color: 'var(--launch-admin-muted, #5b7288)',
    display: 'block',
  };

  const valueStyle = {
    display: 'block',
    color: 'var(--launch-admin-stat-text, #06355f)',
    fontWeight: '700',
    fontSize: '24px',
    lineHeight: '1.13',
    marginTop: '14px',
  };

  const panelStyle = {
    background: 'var(--launch-admin-surface, #fff)',
    border: '1px solid var(--launch-admin-panel-border, #d9e5ef)',
    borderRadius: '13px',
    padding: '27px',
    marginTop: '26px',
  };

  const thStyle = {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--launch-admin-muted, #5b7288)',
    borderBottom: '1px solid var(--launch-admin-border, #dce6f1)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const tdStyle = {
    padding: '14px 16px',
    fontSize: '14px',
    color: 'var(--launch-admin-text, #112940)',
    borderBottom: '1px solid var(--launch-admin-task-border, #e4edf5)',
  };

  const btnBase = {
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid var(--launch-admin-border, #dce6f1)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div className="wle-content" style={{ background: 'var(--launch-admin-canvas, #f4f8fd)', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Layers style={{ width: 28, height: 28, color: 'var(--launch-admin-primary, #126fc8)' }} />
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--launch-admin-heading, #06213b)', margin: 0, letterSpacing: '-0.03em' }}>
            Generator Registry
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--launch-admin-muted, #5b7288)', margin: '4px 0 0' }}>
            Authoritative classification of every generator in the system
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '17px' }}>
        <div style={cardStyle}>
          <small style={labelStyle}>Total Generators</small>
          <strong style={valueStyle}>{stats.total}</strong>
        </div>
        <div style={{ ...cardStyle, border: '1px solid #a7f3d0' }}>
          <small style={{ ...labelStyle, color: '#047857' }}>Reuse (Canonical)</small>
          <strong style={{ ...valueStyle, color: '#065f46' }}>{stats.by_classification.REUSE || 0}</strong>
        </div>
        <div style={{ ...cardStyle, border: '1px solid #bae6fd' }}>
          <small style={{ ...labelStyle, color: '#0369a1' }}>Connect</small>
          <strong style={{ ...valueStyle, color: '#075985' }}>{stats.by_classification.CONNECT || 0}</strong>
        </div>
        <div style={{ ...cardStyle, border: '1px solid #fde68a' }}>
          <small style={{ ...labelStyle, color: '#b45309' }}>Repair</small>
          <strong style={{ ...valueStyle, color: '#92400e' }}>{stats.by_classification.REPAIR || 0}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>Routed Through Contract</small>
          <strong style={valueStyle}>{stats.routed_through_universal_contract}</strong>
        </div>
        <div style={cardStyle}>
          <small style={labelStyle}>Not Routed</small>
          <strong style={{ ...valueStyle, color: 'var(--launch-admin-muted, #5b7288)' }}>{stats.not_routed}</strong>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '24px' }}>
        {['ALL', 'REUSE', 'CONNECT', 'REPAIR', 'REFACTOR', 'MERGE', 'NEW-GAP', 'QUARANTINE'].map((c) => {
          const isActive = filter === c;
          const cs = CLASSIFICATION_STYLES[c];
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                ...btnBase,
                background: isActive ? (cs?.bg || 'var(--launch-admin-action-secondary, #e8f2fd)') : 'var(--launch-admin-surface, #fff)',
                color: isActive ? (cs?.color || 'var(--launch-admin-action-secondary-text, #1463a4)') : 'var(--launch-admin-muted, #5b7288)',
                borderColor: isActive ? (cs?.border || 'var(--launch-admin-primary, #126fc8)') : 'var(--launch-admin-border, #dce6f1)',
              }}
            >
              {c === 'ALL' ? 'All' : c}
            </button>
          );
        })}
      </div>

      {/* Registry Table */}
      <div style={panelStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Generator</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Classification</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Gate</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Contract</th>
                <th style={thStyle}>Source Path</th>
                <th style={thStyle}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => {
                const cs = CLASSIFICATION_STYLES[g.classification] || CLASSIFICATION_STYLES.CONNECT;
                return (
                  <tr key={g.id}>
                    <td style={{ ...tdStyle, fontWeight: '600' }}>{g.name}</td>
                    <td style={tdStyle}>{g.category}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        borderRadius: '6px',
                        border: `1px solid ${cs.border}`,
                        background: cs.bg,
                        color: cs.color,
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        {g.classification}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <GateIcon status={g.quality_gate_status} />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {g.routes_through_universal_contract ? (
                        <Shield style={{ width: 16, height: 16, color: '#059669', margin: '0 auto', display: 'block' }} />
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--launch-admin-muted, #5b7288)' }}>
                      {g.source_path}
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--launch-admin-muted, #5b7288)' }}>
                      {g.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}