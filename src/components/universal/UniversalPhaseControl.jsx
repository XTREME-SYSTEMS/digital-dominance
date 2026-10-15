import React, { useMemo, useState } from "react";
import { generateSite, getSupportedNiches } from "../../../base44/shared/universalGenerator.ts";
import { PHASE_GROUPS, PHASE_STEPS, createMissionPlan, executeSyntheticMission, phaseSummary } from "../../../base44/shared/universalPhaseRuntime.js";
import { validateSandboxArtifact } from "../../../base44/shared/universalPhaseQa.js";
import { runSyntheticForesight, FORESIGHT_STATUS } from "../../../base44/shared/godModeForesightSandbox.js";

const SOURCE_SHA = typeof __DD_BUILD_SOURCE_SHA__ === "string" ? __DD_BUILD_SOURCE_SHA__ : "UNKNOWN";
const badge = status => status === "PASS" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
  status === "FAIL" ? "bg-red-50 text-red-800 border-red-200" :
    "bg-amber-50 text-amber-800 border-amber-200";

/** Synthetic-only. No provider writes, leads, credentials, domains, or schedules. */
export default function UniversalPhaseControl() {
  const niches = useMemo(() => getSupportedNiches(), []);
  const [niche, setNiche] = useState(niches.includes("epoxy_flooring") ? "epoxy_flooring" : niches[0] || "generic");
  const [brandName, setBrandName] = useState("Sandbox Example Epoxy");
  const [city, setCity] = useState("Boca Raton");
  const [state, setState] = useState("FL");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [showStages, setShowStages] = useState(false);
  const [foresight, setForesight] = useState(null);
  const phases = report ? phaseSummary(report) : PHASE_GROUPS.map(p => ({
    key:p.key, name:p.name, provider:p.provider, total_steps:p.steps.length,
    executed_steps:0, unexecuted_steps:p.steps.length, stage_status:"PARTIAL"
  }));

  function runSandbox() {
    setError(""); setReport(null);
    try {
      const plan = createMissionPlan({
        synthetic:true, niche, brandName, city, state, sourceSha:SOURCE_SHA,
        allowProduction:false, allowPublishing:false, allowExternalMessaging:false
      });
      setReport(executeSyntheticMission(plan, generateSite, validateSandboxArtifact));
    } catch (e) { setError(e.message || "Sandbox execution failed"); }
  }

  function runForesight() {
    try {
      setError("");
      setForesight(runSyntheticForesight({seed:20261013,draws:1000,months:12,synthetic:true}));
    } catch (e) { setError(e.message||"Synthetic foresight could not run"); }
  }

  return <section aria-label="Universal Generator sandbox"
    className="rounded-2xl border border-violet-300 bg-white p-5 space-y-5 shadow-sm">
    <header className="space-y-2">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">
        GOD MODE COMMANDER · Lead Asset Foresight · Universal Generator
      </p>
      <h2 className="text-2xl font-extrabold text-slate-950">Universal Phase Sandbox</h2>
      <p className="text-sm text-slate-700">30 stages, one generator context, independent QA.
        This sandbox executes site generation and QA. Research, paid simulations,
        external workflows, X1 jobs and live release are not marked successful without provider receipts.</p>
      <p className="text-xs text-slate-600">Source identity: <code>{SOURCE_SHA === "UNKNOWN"
        ? "UNKNOWN, QA fail-closed" : SOURCE_SHA.slice(0, 12)}</code>
        {" · "}Noindex preview{" · "}No duplicate X1 heartbeat{" · "}No external messaging</p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <label className="text-xs font-semibold text-slate-800">Industry
        <select value={niche} onChange={e => setNiche(e.target.value)}
          className="mt-1 w-full rounded-lg border p-2 text-sm">
          {niches.map(n => <option key={n} value={n}>{n.replaceAll("_", " ")}</option>)}
        </select>
      </label>
      {[
        {key:"brand",label:"Fictional brand",value:brandName,set:setBrandName},
        {key:"city",label:"Test city",value:city,set:setCity},
        {key:"state",label:"State",value:state,set:setState}
      ].map(f => <label key={f.key} className="text-xs font-semibold text-slate-800">{f.label}
        <input value={f.value} maxLength={90} onChange={e=>f.set(e.target.value)}
          className="mt-1 w-full rounded-lg border p-2 text-sm" />
      </label>)}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={runSandbox}
        className="rounded-xl bg-violet-700 hover:bg-violet-800 text-white font-bold px-5 py-3 text-sm">
        Run actual generator + independent QA
      </button>
      <button type="button" onClick={runForesight}
        className="rounded-xl border border-violet-400 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-950">
        Simulate GOD MODE · 10 strategies × 1,000 draws
      </button>
      <button type="button" onClick={() => setShowStages(v => !v)}
        className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
        {showStages ? "Hide" : "Inspect"} 30-stage matrix
      </button>
      {report && <span className={"border rounded-lg px-3 py-2 text-xs font-bold " + badge(report.qa.status)}>
        QA {report.qa.status} · {report.qa.passed}/{report.qa.checks.length}
      </span>}
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
      {phases.map(p => <div key={p.key} className={"border rounded-lg p-3 " + badge(p.stage_status)}>
        <strong className="text-sm block">{p.name}</strong>
        <p className="text-xs">{p.executed_steps}/{p.total_steps} actually executed</p>
        <p className="text-[10px] break-all">{p.provider}</p>
      </div>)}
    </div>
    {showStages && <div className="max-h-72 overflow-auto rounded-lg border">
      <table className="w-full text-xs">
        <thead className="bg-slate-100 sticky top-0"><tr>
          <th className="p-2 text-left">Step</th><th className="p-2 text-left">Stage</th>
          <th className="p-2 text-left">Generator</th><th className="p-2 text-left">Status</th>
        </tr></thead><tbody>{PHASE_STEPS.map(s => <tr key={s.id} className="border-t">
          <td className="p-2">{s.id}</td><td className="p-2">{s.name}</td>
          <td className="p-2">generateSite</td>
          <td className="p-2">{report?.results.find(r => r.step === s.id)?.status || "NOT_EXECUTED"}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    {foresight && <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <h3 className="text-base font-extrabold text-amber-950">GOD MODE Foresight · Hypothetical strategy tournament</h3>
      <p className="text-sm text-amber-900">
        {FORESIGHT_STATUS}. Simulated assumptions only. No Google search metrics, buyer contract,
        validated lead prices, cost quotes or fulfillment proof. All strategies are HOLD.
      </p>
      <div className="overflow-x-auto"><table className="w-full text-xs">
        <thead><tr><th className="text-left p-2">Strategy</th>
          <th className="text-right p-2">P10 (12 mo)</th>
          <th className="text-right p-2">Median (12 mo)</th>
          <th className="text-right p-2">P90 (12 mo)</th>
          <th className="text-right p-2">Profit chance</th></tr></thead>
        <tbody>{foresight.strategies.map(s => <tr key={s.id} className="border-t border-amber-200">
          <td className="p-2">{s.id} · {s.name}</td>
          <td className="text-right p-2">{s.net_12mo_p10.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})}</td>
          <td className="text-right p-2">{s.net_12mo_p50.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})}</td>
          <td className="text-right p-2">{s.net_12mo_p90.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})}</td>
          <td className="text-right p-2">{Math.round(s.probability_positive*100)}% · UNVERIFIED</td>
        </tr>)}</tbody>
      </table></div>
      <p className="text-xs font-bold text-amber-950">
        Release gate: {foresight.decision}. These are example math outputs, not forecasts or promises.
      </p>
    </div>}
    {report && <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <p className="rounded-lg bg-slate-50 p-3">Generated HTML: <b>{report.generator.html_bytes.toLocaleString()} bytes</b></p>
        <p className="rounded-lg bg-slate-50 p-3">Independent QA: <b>{report.qa.status}</b></p>
        <p className="rounded-lg bg-amber-50 p-3">Other phases: <b>{report.remaining_step_count} unverified stages</b></p>
      </div>
      <div className="rounded-xl border overflow-hidden">
        <p className="bg-slate-100 p-2 text-xs font-semibold">Isolated noindex preview. Scripts, forms and network requests blocked.</p>
        <iframe title="Synthetic website preview" sandbox="" srcDoc={report.sandbox_html}
          referrerPolicy="no-referrer" className="w-full h-[560px] bg-white" />
      </div>
      <p className="text-xs text-slate-700">Release status: {report.release_gate}. This QA receipt does not
        certify external plugin, Railway, X1, database or production workflow execution.</p>
    </>}
  </section>;
}