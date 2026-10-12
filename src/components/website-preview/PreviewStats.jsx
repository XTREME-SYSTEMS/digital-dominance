import React from "react";

export default function PreviewStats({ c }) {
  const stats = [
    { value: "20+", label: "Years in Business" },
    { value: "10K+", label: "Projects Done" },
    { value: "4.9★", label: "Client Rating" },
    { value: "24/7", label: "Available Now" },
  ];
  return (
    <section className="px-4 py-4 wp-font-body">
      <div className="grid grid-cols-4 gap-2 wp-stagger">
        {stats.map((s, i) => (
          <div key={i} className="text-center rounded-xl p-2 wp-glass wp-card-hover" style={{ borderTop: `2px solid ${c.accent}` }}>
            <div className="text-lg font-black wp-font-heading wp-counter" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {s.value}
            </div>
            <div className="text-[7px] text-gray-500 font-semibold leading-tight mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}