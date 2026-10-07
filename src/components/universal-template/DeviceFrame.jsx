import React from "react";

// Renders a device chrome (browser or phone) with the preview scaled to fit.
// Only `displayW` is passed; displayH is derived from the design aspect.
export default function DeviceFrame({ type = "browser", designW, designH, displayW = 260, children }) {
  const scale = displayW / designW;
  const displayH = Math.round(designH * scale);
  const screen = (
    <div style={{ width: displayW, height: displayH, overflow: "hidden", position: "relative" }}>
      <div style={{ width: designW, height: designH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );

  if (type === "phone") {
    return (
      <div style={{ padding: 6, background: "#1a1a1a", borderRadius: 20, boxShadow: "0 10px 24px rgba(0,0,0,.22)" }}>
        <div style={{ width: displayW, height: displayH, borderRadius: 14, overflow: "hidden", position: "relative", background: "#fff", border: "1px solid rgba(0,0,0,.12)" }}>
          {screen}
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: displayW, borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 24px rgba(0,0,0,.12)", border: "1px solid #e2e8f0", background: "#fff" }}>
      <div style={{ height: 22, background: "#f1f5f9", display: "flex", alignItems: "center", gap: 5, padding: "0 9px", borderBottom: "1px solid #e2e8f0" }}>
        <span style={{ width: 7, height: 7, borderRadius: 9999, background: "#ef4444" }} />
        <span style={{ width: 7, height: 7, borderRadius: 9999, background: "#f59e0b" }} />
        <span style={{ width: 7, height: 7, borderRadius: 9999, background: "#22c55e" }} />
        <div style={{ flex: 1 }} />
        <div style={{ height: 12, width: "46%", borderRadius: 9999, background: "#fff", border: "1px solid #e2e8f0" }} />
      </div>
      {screen}
    </div>
  );
}