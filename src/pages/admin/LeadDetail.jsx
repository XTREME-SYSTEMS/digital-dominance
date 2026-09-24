import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useSettings } from "@/lib/useSettings";
import { money } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { trackEvent } from "@/lib/tracking";

const STATUSES = ["NEW ESTIMATE", "CONTACT ATTEMPTED", "CONSULTATION BOOKED", "CONSULTATION COMPLETED", "IN-HOME ESTIMATE BOOKED", "IN-HOME ESTIMATE COMPLETED", "PROPOSAL SENT", "WON", "LOST", "NURTURE"];

const Row = ({ label, children }) => (
  <div className="py-3 border-b border-stone-100 flex justify-between gap-6 text-sm">
    <span className="text-stone-500">{label}</span>
    <span className="font-medium text-stone-900 text-right">{children}</span>
  </div>
);

export default function LeadDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { settings } = useSettings();
  const { data: lead } = useQuery({ queryKey: ["lead", id], queryFn: () => base44.entities.Lead.get(id) });
  const { data: appts = [] } = useQuery({ queryKey: ["appts", id], queryFn: () => base44.entities.Appointment.filter({ lead_id: id }, "-created_date") });
  const [notes, setNotes] = useState(null);
  const [visit, setVisit] = useState({ date: "", time: "" });

  if (!lead) return <div className="py-20 text-center text-stone-500">Loading lead…</div>;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["lead", id] });
    qc.invalidateQueries({ queryKey: ["appts", id] });
    qc.invalidateQueries({ queryKey: ["leads"] });
  };

  const setStatus = async (status) => {
    await base44.entities.Lead.update(id, { status });
    if (status === "PROPOSAL SENT") trackEvent("proposal_sent", { lead_id: id });
    if (status === "WON") trackEvent("won", { lead_id: id });
    if (status === "LOST") trackEvent("lost", { lead_id: id });
    refresh();
  };

  const bookVisit = async () => {
    if (!visit.date || !visit.time) return;
    await base44.entities.Appointment.create({
      lead_id: id,
      type: "IN-HOME ESTIMATE",
      date: visit.date,
      time: visit.time,
      salesperson: lead.assigned_salesperson || settings.salesperson?.name,
      status: "booked"
    });
    await base44.entities.Lead.update(id, { status: "IN-HOME ESTIMATE BOOKED", appointment_status: "home_visit_booked" });
    trackEvent("home_visit_booked", { lead_id: id });
    setVisit({ date: "", time: "" });
    refresh();
  };

  const conditions = (lead.floor_condition || []).map(
    (k) => (settings.condition_adjustments || []).find((c) => c.key === k)?.label || k
  );

  return (
    <div className="space-y-6">
      <Link to="/admin/leads" className="text-sm text-stone-500 hover:text-stone-900">← All leads</Link>
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{lead.first_name} {lead.last_name}</h1>
            {typeof lead.lead_score === "number" && (
              <span className="text-xs font-bold bg-amber-500 text-stone-950 px-2.5 py-1 rounded-full">SCORE {lead.lead_score}</span>
            )}
          </div>
          <p className="text-stone-500 text-sm mt-1">
            <a href={`tel:${lead.phone}`} className="underline">{lead.phone}</a> · <a href={`mailto:${lead.email}`} className="underline">{lead.email}</a>
          </p>
        </div>
        <select value={lead.status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white border border-stone-200 p-6">
          <h2 className="font-semibold text-stone-900 mb-2">Project details</h2>
          <Row label="Property">{lead.address}, {lead.city}, {lead.state} {lead.zip}</Row>
          <Row label="Garage size">{lead.garage_size} · {lead.square_footage} sq ft</Row>
          <Row label="Floor condition">{conditions.join(", ") || "—"}</Row>
          <Row label="Desired floor">{(settings.systems || []).find((s) => s.key === lead.desired_system)?.name || lead.desired_system}</Row>
          <Row label="Timeline">{lead.timeline}</Row>
          <Row label="Estimate shown">{lead.estimate_low != null && lead.estimate_high != null ? `${money(lead.estimate_low)} – ${money(lead.estimate_high)}` : "Awaiting details"}</Row>
          <Row label="Estimate midpoint">{lead.estimate_mid != null ? money(lead.estimate_mid) : "—"}</Row>
          <Row label="Lead source">{lead.lead_source} {lead.utm_source ? `· ${lead.utm_source}` : ""} {lead.utm_campaign || ""}</Row>
          <Row label="Attribution">{[lead.utm_medium, lead.utm_term, lead.utm_content].filter(Boolean).join(" · ") || "organic"}</Row>
          <Row label="Device / referrer">{[lead.device, lead.referrer].filter(Boolean).join(" · ") || "—"}</Row>
          <Row label="Landing page">{lead.landing_page || "/"}</Row>
          <Row label="Lead score">{lead.lead_score ?? 0}</Row>
          <Row label="Assigned to">{lead.assigned_salesperson || "—"}</Row>
          <Row label="Submitted">{format(new Date(lead.created_date), "MMM d, yyyy p")}</Row>

          {!!(lead.photos || []).length && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {lead.photos.map((p, i) => (
                <a key={i} href={p} target="_blank" rel="noreferrer">
                  <img src={p} alt="Garage" className="aspect-square object-cover rounded-lg" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-900">Appointments</h2>
            <div className="mt-3 space-y-2">
              {appts.map((a) => (
                <div key={a.id} className="text-sm border border-stone-100 rounded-xl p-3">
                  <div className="font-medium text-stone-900">{a.type}</div>
                  <div className="text-stone-500">{a.date} at {a.time} · {a.salesperson}</div>
                </div>
              ))}
              {!appts.length && <p className="text-sm text-stone-500">No appointments booked yet.</p>}
            </div>

            <div className="mt-5 border-t border-stone-100 pt-4">
              <div className="text-sm font-medium text-stone-700 mb-2">Schedule free in-home inspection</div>
              <div className="flex gap-2">
                <Input type="date" value={visit.date} onChange={(e) => setVisit({ ...visit, date: e.target.value })} className="h-11" />
                <Input placeholder="10:00 AM" value={visit.time} onChange={(e) => setVisit({ ...visit, time: e.target.value })} className="h-11" />
                <Button onClick={bookVisit} className="h-11 bg-stone-900 hover:bg-stone-800">Book</Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-900">Notes</h2>
            <Textarea
              className="mt-3 min-h-32"
              value={notes ?? lead.notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Call notes, next steps…"
            />
            <Button
              className="mt-3 bg-stone-900 hover:bg-stone-800"
              onClick={async () => { await base44.entities.Lead.update(id, { notes: notes ?? "" }); refresh(); }}
            >
              Save notes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}