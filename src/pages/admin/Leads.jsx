import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useSettings } from "@/lib/useSettings";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/pricing";
import { format } from "date-fns";
import { TIMELINE_OPTIONS } from "@/lib/defaults";

const STATUSES = ["NEW ESTIMATE", "CONTACT ATTEMPTED", "CONSULTATION BOOKED", "CONSULTATION COMPLETED", "IN-HOME ESTIMATE BOOKED", "IN-HOME ESTIMATE COMPLETED", "PROPOSAL SENT", "WON", "LOST", "NURTURE"];

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
      ))}
    </select>
  );
}

export default function Leads() {
  const { settings } = useSettings();
  const { data: leads = [] } = useQuery({ queryKey: ["leads"], queryFn: () => base44.entities.Lead.list("-created_date", 500) });
  const [f, setF] = useState({ zip: "", status: "", system: "", timeline: "", source: "", sales: "", since: "" });
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const rows = leads.filter((l) =>
    (!f.zip || (l.zip || "").includes(f.zip)) &&
    (!f.status || l.status === f.status) &&
    (!f.system || l.desired_system === f.system) &&
    (!f.timeline || l.timeline === f.timeline) &&
    (!f.source || l.lead_source === f.source) &&
    (!f.sales || l.assigned_salesperson === f.sales) &&
    (!f.since || new Date(l.created_date) >= new Date(f.since))
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Leads</h1>

      <div className="flex flex-wrap gap-2">
        <Input type="date" className="h-10 w-40 bg-white" value={f.since} onChange={(e) => set("since")(e.target.value)} />
        <Input placeholder="ZIP" className="h-10 w-28 bg-white" value={f.zip} onChange={(e) => set("zip")(e.target.value)} />
        <Select value={f.status} onChange={set("status")} options={STATUSES} placeholder="All statuses" />
        <Select value={f.system} onChange={set("system")} options={(settings.systems || []).map((s) => ({ value: s.key, label: s.name }))} placeholder="All systems" />
        <Select value={f.timeline} onChange={set("timeline")} options={TIMELINE_OPTIONS} placeholder="All timelines" />
        <Select value={f.source} onChange={set("source")} options={["website", "paid"]} placeholder="All sources" />
        <Select value={f.sales} onChange={set("sales")} options={[...new Set(leads.map((l) => l.assigned_salesperson).filter(Boolean))]} placeholder="All salespeople" />
      </div>

      <div className="rounded-2xl bg-white border border-stone-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              {["Date", "Name", "City / ZIP", "System", "Sq ft", "Estimate", "Timeline", "Score", "Status"].map((h) => (
                <th key={h} className="text-left font-medium px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 whitespace-nowrap text-stone-500">{format(new Date(l.created_date), "MMM d")}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link to={`/admin/leads/${l.id}`} className="font-medium text-stone-900 hover:underline">
                    {l.first_name} {l.last_name}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-stone-600">{l.city} {l.zip}</td>
                <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                  {(settings.systems || []).find((s) => s.key === l.desired_system)?.name || l.desired_system}
                </td>
                <td className="px-4 py-3 tabular-nums text-stone-600">{l.square_footage}</td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">{l.estimate_low != null && l.estimate_high != null ? `${money(l.estimate_low)} – ${money(l.estimate_high)}` : "Awaiting details"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-stone-600">{l.timeline}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {typeof l.lead_score === "number" ? (
                    <span className={`text-xs font-bold px-2 py-1 rounded ${l.lead_score >= 40 ? "bg-amber-500 text-stone-950" : "bg-stone-100 text-stone-600"}`}>{l.lead_score}</span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs font-semibold bg-stone-100 px-2 py-1 rounded">{l.status}</span>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-stone-500">No leads match these filters yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}