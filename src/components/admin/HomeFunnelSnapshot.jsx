import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function HomeFunnelSnapshot() {
  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ["home-funnel-events"],
    queryFn: () => base44.entities.FunnelEvent.list("-created_date", 2000)
  });
  const homeSessions = new Set(events.filter(e => {
    if (e.event !== "page_view") return false;
    try { return JSON.parse(e.meta || "{}").page === "/"; } catch { return false; }
  }).map(e => e.session_id).filter(Boolean));
  const clicked = new Set(events.filter(e => e.event === "funnel_cta_clicked" && homeSessions.has(e.session_id)).map(e => e.session_id));
  const converted = new Set(events.filter(e => e.event === "lead_created" && homeSessions.has(e.session_id)).map(e => e.session_id));
  const stats = [
    ["Homepage visitors", homeSessions.size],
    ["Estimate clicks", clicked.size],
    ["Leads captured", converted.size],
    ["Visitor-to-lead", homeSessions.size ? `${Math.round(converted.size / homeSessions.size * 100)}%` : "—"]
  ];
  return <section className="rounded-2xl border border-stone-200 bg-white p-5" aria-label="Homepage lead funnel">
    <h2 className="text-lg font-bold text-stone-900">Homepage lead funnel</h2>
    <p className="mt-1 text-xs text-stone-500">Unique sessions from recent tracked visits; includes callback requests and completed estimates.</p>
    {isLoading ? <p className="mt-4 text-sm text-stone-500">Loading conversion data…</p> : isError ? <p className="mt-4 text-sm text-red-700">Could not load conversion data.</p> :
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([label, value]) =>
        <div key={label} className="rounded-xl bg-stone-50 p-4"><p className="text-2xl font-bold text-stone-900">{value}</p><p className="text-xs text-stone-600">{label}</p></div>
      )}</div>}
    {!isLoading && !isError && !homeSessions.size && <p className="mt-3 text-xs text-stone-500">No tracked homepage sessions in the most recent 2,000 events.</p>}
  </section>;
}