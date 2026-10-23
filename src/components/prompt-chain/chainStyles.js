/** Admin-shell styles for the prompt chain console. Inline, token-driven:
 *  the admin shell injects --launch-admin-* variables, so nothing here can be
 *  purged, overridden or lost to a Tailwind class clash. */

export const card = {
  background: 'var(--launch-admin-surface)',
  border: '1px solid var(--launch-admin-border)',
  borderRadius: '14px',
  padding: '16px',
  marginBottom: '14px',
};

export const label = {
  margin: 0,
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--launch-admin-muted)',
};

export const heading = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 800,
  color: 'var(--launch-admin-heading)',
};

export const body = {
  margin: 0,
  fontSize: '13px',
  lineHeight: 1.5,
  color: 'var(--launch-admin-text)',
};

export const muted = {
  margin: 0,
  fontSize: '12px',
  lineHeight: 1.5,
  color: 'var(--launch-admin-muted)',
};

export const input = {
  width: '100%',
  minHeight: '42px',
  borderRadius: '10px',
  border: '1px solid var(--launch-admin-border)',
  background: '#ffffff',
  color: 'var(--launch-admin-text)',
  padding: '9px 12px',
  fontSize: '14px',
  fontFamily: 'inherit',
};

export const primaryButton = (disabled) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '7px',
  minHeight: '42px',
  borderRadius: '10px',
  border: '1px solid var(--launch-admin-primary-border)',
  background: 'var(--launch-admin-primary)',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: '13px',
  padding: '0 16px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1,
});

export const ghostButton = (disabled) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  minHeight: '38px',
  borderRadius: '10px',
  border: '1px solid var(--launch-admin-border)',
  background: '#ffffff',
  color: 'var(--launch-admin-primary)',
  fontWeight: 700,
  fontSize: '12.5px',
  padding: '0 13px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});

export const cell = {
  padding: '8px 10px',
  fontSize: '12.5px',
  lineHeight: 1.45,
  color: 'var(--launch-admin-text)',
  borderBottom: '1px solid var(--launch-admin-border)',
  verticalAlign: 'top',
};

export const headCell = {
  ...cell,
  fontSize: '10px',
  fontWeight: 800,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--launch-admin-muted)',
  background: 'var(--launch-admin-action-secondary)',
};

export const table = { width: '100%', borderCollapse: 'collapse' };

export const TONES = {
  PASS: '#16a34a',
  verified: '#16a34a',
  FAIL: '#dc2626',
  failed: '#dc2626',
  PARTIAL: '#d97706',
  planned: '#d97706',
  partially_verified: '#d97706',
  BLOCKED: '#64748b',
  blocked: '#64748b',
  MISSING_EVIDENCE: '#7c3aed',
  queued: '#2563eb',
  running: '#2563eb',
  critical: '#b91c1c',
  high: '#dc2626',
  medium: '#d97706',
  low: '#475569',
};

export const tone = (key) => TONES[key] || '#475569';

export const badge = (key) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  borderRadius: '999px',
  padding: '2px 9px',
  fontSize: '10.5px',
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#ffffff',
  background: tone(key),
});