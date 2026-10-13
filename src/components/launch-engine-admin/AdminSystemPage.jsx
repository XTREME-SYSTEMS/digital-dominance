import React from "react";

/**
 * Wraps any admin system page in the exact reference admin layout:
 * hero (eyebrow + title + description + badge), stats grid, and a single
 * content panel. Mirrors LaunchEngineAdmin's structure so additional
 * systems look identical to the built-in reference pages.
 */
export default function AdminSystemPage({ eyebrow, title, description, badge, stats = [], children }) {
  return (
    <div className="wle-content">
      {/* Hero */}
      <div className="wle-hero">
        <div>
          {eyebrow && <div className="wle-eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {badge && <div className="wle-hero-badge">{badge}</div>}
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="wle-stats">
          {stats.map(([label, value], i) => (
            <div key={i} className="wle-stat">
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}

      {/* Content panel */}
      <div className="wle-panels">
        <section className="wle-panel" style={{ gridColumn: "1 / -1" }}>
          {children}
        </section>
      </div>
    </div>
  );
}