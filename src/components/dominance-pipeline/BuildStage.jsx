import React, { useState } from 'react';
import { Code2, Check, Globe, Zap, Smartphone, FileCode, Search } from 'lucide-react';

const GOOGLE_STANDARDS = [
  { id: 'cwv', label: 'Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms)', icon: Zap },
  { id: 'mobile', label: 'Mobile-first responsive design', icon: Smartphone },
  { id: 'ssl', label: 'SSL/HTTPS enforced', icon: Globe },
  { id: 'schema', label: 'Structured data (LocalBusiness, FAQ, Service)', icon: FileCode },
  { id: 'sitemap', label: 'XML sitemap + robots.txt', icon: Search },
  { id: 'semantic', label: 'Semantic HTML + accessible markup', icon: Code2 },
];

export default function BuildStage({ data, onUpdate, onAdvance, allData }) {
  const [templateName, setTemplateName] = useState(data?.templateName || '');
  const [domainPattern, setDomainPattern] = useState(data?.domainPattern || '');
  const [sections, setSections] = useState(data?.sections || ['hero', 'services', 'gallery', 'testimonials', 'faq', 'cta', 'contact']);
  const [standards, setStandards] = useState(data?.standards || GOOGLE_STANDARDS.reduce((a, s) => ({ ...a, [s.id]: true }), {}));
  const [built, setBuilt] = useState(data?.built || false);

  const toggleSection = (s) => setSections((prev) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleStandard = (id) => setStandards((prev) => ({ ...prev, [id]: !prev[id] }));

  const build = () => {
    onUpdate({ templateName, domainPattern, sections, standards, built: true });
    setBuilt(true);
    onAdvance();
  };

  const allStandardsMet = Object.values(standards).every(Boolean);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Code2 className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-bold text-stone-800">Programmatic Website Template</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Template Name</label>
          <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Epoxy Garage Pro"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
        </div>
        <div>
          <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Domain Pattern</label>
          <input value={domainPattern} onChange={(e) => setDomainPattern(e.target.value)} placeholder="e.g. {city}-epoxy-{service}.com"
            className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:border-amber-500 outline-none" />
        </div>
      </div>

      {/* Section selection */}
      <div>
        <label className="text-sm font-semibold text-stone-700 mb-2 block">Page Sections</label>
        <div className="flex flex-wrap gap-2">
          {['hero', 'services', 'gallery', 'testimonials', 'faq', 'cta', 'contact', 'about', 'pricing', 'location', 'blog'].map((s) => (
            <button key={s} onClick={() => toggleSection(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                sections.includes(s) ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-500 hover:border-stone-300'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Google standards checklist */}
      <div>
        <label className="text-sm font-semibold text-stone-700 mb-2 block">Google Standards Compliance</label>
        <div className="grid sm:grid-cols-2 gap-2">
          {GOOGLE_STANDARDS.map((s) => {
            const Icon = s.icon;
            const on = standards[s.id];
            return (
              <button key={s.id} onClick={() => toggleStandard(s.id)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                  on ? 'border-emerald-300 bg-emerald-50' : 'border-stone-200 bg-white'
                }`}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${on ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                  {on ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-xs font-medium ${on ? 'text-emerald-800' : 'text-stone-500'}`}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`rounded-xl border px-4 py-3 ${allStandardsMet ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
        <p className={`text-sm font-semibold ${allStandardsMet ? 'text-emerald-700' : 'text-amber-700'}`}>
          {allStandardsMet ? '✓ All Google standards enabled — template is compliant.' : '⚠ Enable all Google standards for full compliance.'}
        </p>
      </div>

      <button onClick={build} disabled={!templateName || !allStandardsMet}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed">
        <Code2 className="h-4 w-4" /> Build Template & Continue
      </button>
    </div>
  );
}