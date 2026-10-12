import React from "react";

export default function ReferenceAdminStats({ stats }) {
  return (
    <div className="wle-stats" id="stats">
      {stats.map(([label, value]) => (
        <div className="wle-stat" key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}