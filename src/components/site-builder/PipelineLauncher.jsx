import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Eye,
  FileCode2,
  GitBranch,
  Globe2,
  Loader2,
  LockKeyhole,
  Rocket,
  ShieldCheck,
  Smartphone,
  Database,
  SearchCheck,
} from "lucide-react";

const SAFE_PREVIEW_STEPS = [
  { icon: FileCode2, label: "Compile BuildPacket", desc: "Freeze the business, brand, content, routes, stack target, and validation requirements." },
  { icon: GitBranch, label: "Feature Branch", desc: "Worker is allowed to create and modify a non-default GitHub branch only." },
  { icon: Eye, label: "Vercel Preview", desc: "Build a protected preview before any public or production release." },
  { icon: Smartphone, label: "Desktop + Mobile QA", desc: "Validate 1440×1100 and 390×844 views plus interaction states." },
  { icon: Database, label: "Lead/Data Validation", desc: "Verify forms, persistence, RLS/tenant boundaries, and attribution." },
  { icon: SearchCheck, label: "SEO/AEO Validation", desc: "Validate metadata, canonical, schema, robots, sitemap, accessibility and useful unique content." },
  { icon: ClipboardCheck, label: "Independent Receipt", desc: "A validator must certify the preview before release approval can even be requested." },
];

const LOCKED_ACTIONS = [
  "Production deploy / default-branch merge",
  "Domain purchase or DNS change",
  "Mass indexable location-page generation",
  "Live social publishing",
  "Customer email / SMS / voice",
  "Secret creation or replacement",
  "Spend or paid provisioning",
  "Destructive or irreversible action",
];

export default function PipelineLauncher({ config, onBack }) {
  const [compiling, setCompiling] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const summary = useMemo(() => ({
    industry: config.industry?.label || config.industry?.id || "—",
    business: config.businessName || "—",
    domain: config.domain || "No domain selected",
    location: [config.city, config.state].filter(Boolean).join(", ") || "Not specified",
  }), [config]);

  const compilePreview = async () => {
    setCompiling(true);
    setError("");
    setResult(null);
    try {
      const response = await base44.functions.invoke("compileWebsiteBuildPacket", {
        config,
        opportunity_id: config.opportunityId || undefined,
      });
      const data = response?.data || response;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e?.message || "Could not compile preview build packet.");
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-[0.18em]">
          <ShieldCheck className="h-4 w-4" /> DDV3 Governed Website Factory
        </div>
        <h2 className="text-xl font-bold text-stone-900 mt-1">Step 5 — Compile Preview Build</h2>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">
          This step creates the deterministic BuildPacket and a branch-safe WorkPacket.
          It does not purchase a domain, deploy production, publish social, contact customers,
          or create mass indexable pages.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key}>
              <div className="text-[10px] uppercase tracking-wider font-black text-stone-400">{key}</div>
              <div className="text-sm font-semibold text-stone-900 mt-1">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 pt-4 border-t border-stone-100">
          <div className="w-5 h-5 rounded-full border border-stone-300" style={{ backgroundColor: config.accentColor }} />
          <span className="text-xs text-stone-500">{config.accentName || "Brand accent"}</span>
          {config.logoUrl && <img src={config.logoUrl} alt="Selected logo" className="h-8 w-8 object-contain rounded border border-stone-200" />}
          <span className="ml-auto text-xs font-bold text-emerald-700 flex items-center gap-1">
            <LockKeyhole className="h-3.5 w-3.5" /> Preview-only
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-bold text-stone-900 mb-4">What the build worker is allowed to do</h3>
          <div className="space-y-3">
            {SAFE_PREVIEW_STEPS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex gap-3 rounded-xl border border-stone-100 p-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-stone-900">{label}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="bg-stone-950 text-white rounded-2xl p-5">
          <div className="flex items-center gap-2 text-red-300 text-xs font-black uppercase tracking-[0.16em]">
            <LockKeyhole className="h-4 w-4" /> Locked until separate approval
          </div>
          <div className="space-y-2.5 mt-4">
            {LOCKED_ACTIONS.map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-stone-300">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] leading-relaxed text-stone-500 mt-5">
            A high DDV3 opportunity score can qualify a preview for consideration. It never authorizes a protected action.
          </p>
        </aside>
      </div>

      {!result && (
        <button
          onClick={compilePreview}
          disabled={compiling || !config.businessName || !config.industry}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 text-lg font-black flex items-center justify-center gap-3 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition shadow-lg"
        >
          {compiling ? <Loader2 className="h-7 w-7 animate-spin" /> : <Rocket className="h-7 w-7" />}
          {compiling ? "COMPILING BUILD PACKET..." : "COMPILE PREVIEW BUILD"}
        </button>
      )}

      {result && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-950">Preview BuildPacket Ready</h3>
              <p className="text-sm text-emerald-800 mt-1">
                The job is queued as branch-write work. Production remains unchanged.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mt-4 text-xs">
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="font-black text-stone-400 uppercase">Build packet</div>
                  <div className="font-mono text-stone-900 mt-1 break-all">{result.packet_id}</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="font-black text-stone-400 uppercase">Work packet</div>
                  <div className="font-mono text-stone-900 mt-1 break-all">{result.work_packet_id}</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <div className="font-black text-stone-400 uppercase">Mode</div>
                  <div className="font-semibold text-stone-900 mt-1">{result.build_mode}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-emerald-900">
                Next: worker builds feature branch → Vercel preview → independent validation → approval request.
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          disabled={compiling}
          className="px-5 py-2.5 rounded-lg border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="text-[10px] text-stone-400 flex items-center gap-1">
          <Globe2 className="h-3 w-3" /> No public release occurs on this screen.
        </div>
      </div>
    </div>
  );
}
