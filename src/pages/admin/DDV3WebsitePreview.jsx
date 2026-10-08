import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, CheckCircle2, ExternalLink, Eye, FileWarning,
  Lock, ShieldCheck, Sparkles,
} from "lucide-react";

function Section({ section }) {
  const evidence = section.claim_evidence_ids || [];

  if (section.section_type === "hero") {
    return (
      <section className="rounded-[2rem] bg-stone-950 text-white px-8 py-14 md:px-14 md:py-20 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300 mb-5">
            <Sparkles className="h-3.5 w-3.5" /> Evidence-grounded preview
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">{section.heading}</h2>
          {section.body && <p className="mt-5 text-lg leading-8 text-stone-300 max-w-2xl">{section.body}</p>}
          {!!section.bullets?.length && (
            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              {section.bullets.map((item, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-200">{item}</div>
              ))}
            </div>
          )}
        </div>
        <EvidenceLine evidence={evidence} />
      </section>
    );
  }

  if (section.section_type === "benefits") {
    return (
      <section className="py-12">
        <h2 className="text-3xl font-black text-stone-950">{section.heading}</h2>
        {section.body && <p className="mt-3 max-w-3xl text-stone-600 leading-7">{section.body}</p>}
        <div className="mt-7 grid md:grid-cols-3 gap-4">
          {(section.bullets || []).map((item, i) => (
            <div key={i} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 grid place-items-center font-black">{i + 1}</div>
              <p className="mt-4 font-semibold text-stone-800">{item}</p>
            </div>
          ))}
        </div>
        <EvidenceLine evidence={evidence} />
      </section>
    );
  }

  if (section.section_type === "process") {
    return (
      <section className="py-12 border-t border-stone-200">
        <h2 className="text-3xl font-black text-stone-950">{section.heading}</h2>
        {section.body && <p className="mt-3 max-w-3xl text-stone-600 leading-7">{section.body}</p>}
        <div className="mt-8 space-y-3">
          {(section.bullets || []).map((item, i) => (
            <div key={i} className="flex gap-4 rounded-2xl bg-stone-100 p-4">
              <div className="h-8 w-8 shrink-0 rounded-full bg-stone-950 text-white grid place-items-center text-xs font-black">{i + 1}</div>
              <p className="pt-1 text-sm font-medium text-stone-700">{item}</p>
            </div>
          ))}
        </div>
        <EvidenceLine evidence={evidence} />
      </section>
    );
  }

  if (section.section_type === "pricing" || section.section_type === "proof") {
    return (
      <section className="py-12 border-t border-stone-200">
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-7 md:p-10">
          <h2 className="text-3xl font-black text-stone-950">{section.heading}</h2>
          {section.body && <p className="mt-3 text-stone-700 leading-7">{section.body}</p>}
          {!!section.bullets?.length && (
            <ul className="mt-6 grid md:grid-cols-2 gap-3">
              {section.bullets.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-stone-700">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          )}
          <EvidenceLine evidence={evidence} />
        </div>
      </section>
    );
  }

  if (section.section_type === "faq") {
    return (
      <section className="py-12 border-t border-stone-200">
        <h2 className="text-3xl font-black text-stone-950">{section.heading}</h2>
        {section.body && <p className="mt-3 max-w-3xl text-stone-600 leading-7">{section.body}</p>}
        <div className="mt-7 space-y-3">
          {(section.bullets || []).map((item, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-white px-5 py-4 font-semibold text-stone-800">{item}</div>
          ))}
        </div>
        <EvidenceLine evidence={evidence} />
      </section>
    );
  }

  if (section.section_type === "cta") {
    return (
      <section className="my-12 rounded-[2rem] bg-amber-500 p-8 md:p-12 text-stone-950">
        <h2 className="text-3xl md:text-4xl font-black">{section.heading}</h2>
        {section.body && <p className="mt-3 max-w-2xl text-stone-800 leading-7">{section.body}</p>}
        <div className="mt-6 inline-flex rounded-xl bg-stone-950 px-6 py-3 text-sm font-black text-white">Preview CTA</div>
        <EvidenceLine evidence={evidence} />
      </section>
    );
  }

  return (
    <section className="py-12 border-t border-stone-200">
      <h2 className="text-3xl font-black text-stone-950">{section.heading}</h2>
      {section.body && <p className="mt-3 max-w-3xl text-stone-600 leading-7 whitespace-pre-line">{section.body}</p>}
      {!!section.bullets?.length && (
        <ul className="mt-5 grid md:grid-cols-2 gap-3">
          {section.bullets.map((item, i) => (
            <li key={i} className="rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-700">{item}</li>
          ))}
        </ul>
      )}
      <EvidenceLine evidence={evidence} />
    </section>
  );
}

function EvidenceLine({ evidence }) {
  if (!evidence?.length) return null;
  return (
    <div className="mt-5 flex flex-wrap gap-1.5 opacity-70">
      {evidence.map((id) => (
        <span key={id} className="rounded-md border border-stone-300/60 bg-white/80 px-2 py-0.5 text-[9px] font-mono text-stone-600">
          {id}
        </span>
      ))}
    </div>
  );
}

export default function DDV3WebsitePreview() {
  const { planId } = useParams();
  const [selectedPath, setSelectedPath] = useState("/");

  const { data, isLoading } = useQuery({
    queryKey: ["ddv3-private-preview", planId],
    queryFn: async () => {
      const plan = await base44.entities.WebsiteBuildPlan.get(planId);
      const artifacts = await base44.entities.WebsitePreviewArtifact.filter(
        { build_plan_id: planId },
        "-generated_at",
        5
      );
      return { plan, artifact: artifacts?.[0] || null };
    },
    enabled: Boolean(planId),
  });

  const artifact = data?.artifact;
  const pages = artifact?.pages || [];
  const active = useMemo(
    () => pages.find((p) => p.path === selectedPath) || pages[0] || null,
    [pages, selectedPath]
  );

  if (isLoading) {
    return <div className="py-24 text-center text-stone-500">Loading private preview…</div>;
  }

  if (!artifact) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8">
        <FileWarning className="h-8 w-8 text-amber-700" />
        <h1 className="mt-3 text-xl font-black text-stone-900">No private preview artifact yet</h1>
        <p className="mt-2 text-sm text-stone-600">Generate and validate a preview from the opportunity card first.</p>
        <Link to="/admin/opportunity-intelligence" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-700">
          <ArrowLeft className="h-4 w-4" /> Back to opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <Link to="/admin/opportunity-intelligence" className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-900">
            <ArrowLeft className="h-3.5 w-3.5" /> Opportunities
          </Link>
          <h1 className="mt-2 text-2xl font-black text-stone-950">DDV3 Private Website Preview</h1>
          <p className="text-sm text-stone-500">Plan {planId} · artifact {artifact.artifact_id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-950 px-3 py-1.5 text-xs font-black text-white">
            <Lock className="h-3.5 w-3.5" /> PRIVATE
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-black text-red-700">
            NOINDEX
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" /> {artifact.validation_state || "unvalidated"}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
        This is an authenticated admin preview. It is not a public site, not in the sitemap, not submitted for indexing, and not authorized for release.
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {pages.map((page) => (
          <button
            key={page.path}
            onClick={() => setSelectedPath(page.path)}
            className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold ${active?.path === page.path ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600"}`}
          >
            {page.path}
          </button>
        ))}
      </div>

      {active && (
        <div className="rounded-[1.5rem] border border-stone-300 bg-stone-200 p-2 shadow-xl">
          <div className="rounded-t-[1.15rem] bg-stone-900 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 rounded-md bg-white/10 px-3 py-1 text-center text-[10px] font-mono text-stone-400">
              private-preview.local{active.path}
            </div>
            <Eye className="h-4 w-4 text-stone-500" />
          </div>

          <div className="bg-white min-h-[720px] rounded-b-[1.15rem] overflow-hidden">
            <header className="border-b border-stone-200 bg-white/95 px-7 py-5 flex items-center justify-between">
              <div>
                <div className="font-black text-stone-950 text-lg">{artifact.brand?.name || "Preview Brand"}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-stone-400">{artifact.brand?.tagline || "Private website preview"}</div>
              </div>
              <div className="hidden md:flex items-center gap-5 text-xs font-bold text-stone-500">
                {pages.slice(0, 5).map((p) => <span key={p.path}>{p.page_type}</span>)}
                <span className="rounded-lg bg-amber-500 px-4 py-2 text-stone-950">{artifact.brand?.primary_cta || "Get Started"}</span>
              </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 md:px-10 py-8">
              <div className="mb-7 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-stone-400">{active.page_type} preview</div>
                <h1 className="mt-1 text-xl font-black text-stone-900">{active.h1}</h1>
                {active.subhead && <p className="mt-1 text-sm text-stone-600">{active.subhead}</p>}
              </div>

              {(active.sections || []).map((section, i) => <Section key={i} section={section} />)}
            </main>

            <footer className="border-t border-stone-200 bg-stone-950 text-stone-400 px-8 py-8">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-3 justify-between text-xs">
                <span>{artifact.brand?.name || "Preview"} · DDV3 private review artifact</span>
                <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Not public · noindex</span>
              </div>
            </footer>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-stone-500" />
          <h2 className="text-sm font-black text-stone-900">Preview evidence</h2>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          {artifact.source_evidence_ids?.length || 0} evidence records available to the generator. Evidence IDs are shown beneath sections when claims depend on them.
        </p>
      </div>
    </div>
  );
}
