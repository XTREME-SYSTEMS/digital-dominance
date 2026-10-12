import React from "react";

export default function ReferenceAdminOverviewPanel({ view }) {
  return (
    <section className="wle-panel">
      <h2 id="panelTitle">{view.name === "Overview" ? "Quick overview" : view.name}</h2>
      <p id="panelDesc">This is the preview of the {view.name.toLowerCase()} workspace, with live integrations deliberately disabled.</p>
      <div id="workList">
        {view.stats.map(([label, value]) => (
          <div className="wle-task" key={label}>
            <div><b>{label}</b><small>Connect a verified data source to activate</small></div>
            <span className="wle-status">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}