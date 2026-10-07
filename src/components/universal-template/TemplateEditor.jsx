import React, { useMemo } from "react";
import DeviceFrame from "./DeviceFrame.jsx";
import { PREVIEW_STYLES } from "@/lib/universal-template/previewStyles.js";
import { themeToCssVars } from "@/lib/universal-template/studioConfig.js";
import { renderTemplate } from "@/lib/universal-template/visualizerRenderer.js";
import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";

const SECTION_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "stats", label: "Stats Bar" },
  { value: "showcase", label: "System Showcase" },
  { value: "problem_solution", label: "Problem / Solution" },
  { value: "testimonials", label: "Testimonials" },
  { value: "cta", label: "Final CTA" },
  { value: "gallery", label: "Gallery" },
  { value: "color_charts", label: "Color Charts" },
];

export default function TemplateEditor({ template, config, onChange }) {
  const themeVars = useMemo(() => themeToCssVars(config), [config]);
  const preview = useMemo(() => renderTemplate(template?.sections || [], config), [template, config]);

  const sections = template?.sections || [];

  const updateSection = (idx, patch) => {
    const next = [...sections];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...template, sections: next });
  };

  const move = (idx, dir) => {
    const next = [...sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange({ ...template, sections: next });
  };

  const remove = (idx) => {
    onChange({ ...template, sections: sections.filter((_, i) => i !== idx) });
  };

  const addSection = (type) => {
    const label = SECTION_TYPES.find((s) => s.value === type)?.label || type;
    onChange({
      ...template,
      sections: [...sections, {
        section_id: `${type}_${Date.now()}`,
        section_type: type,
        name: label,
        enabled: true,
        content: {},
      }],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Section list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">Sections ({sections.length})</h3>
          <div className="flex items-center gap-2">
            <select onChange={(e) => { if (e.target.value) { addSection(e.target.value); e.target.value = ""; } }} className="text-xs px-2 py-1.5 border border-stone-300 rounded-lg bg-white">
              <option value="">+ Add section…</option>
              {SECTION_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {sections.length === 0 && (
          <div className="text-center py-8 text-sm text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
            No sections yet. Add one above.
          </div>
        )}

        {sections.map((s, idx) => (
          <div key={s.section_id || idx} className={`rounded-xl border-2 p-3 ${s.enabled ? "border-stone-200 bg-white" : "border-stone-200 bg-stone-50 opacity-60"}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">{idx + 1}</span>
                <span className="text-sm font-bold text-stone-900 truncate">{s.name || s.section_type}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateSection(idx, { enabled: !s.enabled })} className={`text-[10px] px-2 py-1 rounded ${s.enabled ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-600"}`}>
                  {s.enabled ? "ON" : "OFF"}
                </button>
                <button onClick={() => move(idx, -1)} className="p-1 hover:bg-stone-100 rounded"><ChevronUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => move(idx, 1)} className="p-1 hover:bg-stone-100 rounded"><ChevronDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(idx)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <SectionContentEditor section={s} onChange={(patch) => updateSection(idx, { content: patch })} />
          </div>
        ))}
      </div>

      {/* Live preview */}
      <div className="lg:sticky lg:top-4 self-start">
        <h3 className="text-sm font-bold text-stone-900 mb-2">Live Preview</h3>
        <div className="flex items-center justify-center bg-stone-100 rounded-xl py-6 overflow-hidden" style={themeVars}>
          <style>{PREVIEW_STYLES}</style>
          <DeviceFrame type={preview.frame} designW={preview.designW} designH={preview.designH} displayW={340}>
            <div style={{ width: preview.designW, height: preview.designH }} dangerouslySetInnerHTML={{ __html: preview.html }} />
          </DeviceFrame>
        </div>
      </div>
    </div>
  );
}

function SectionContentEditor({ section, onChange }) {
  const c = section.content || {};
  const type = section.section_type;

  if (type === "hero") {
    return (
      <div className="space-y-2">
        <input type="text" value={c.headline || ""} onChange={(e) => onChange({ ...c, headline: e.target.value })} placeholder="Headline" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
        <input type="text" value={c.subheadline || ""} onChange={(e) => onChange({ ...c, subheadline: e.target.value })} placeholder="Subheadline" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={c.cta_text || ""} onChange={(e) => onChange({ ...c, cta_text: e.target.value })} placeholder="CTA text" className="px-2 py-1 text-xs border border-stone-300 rounded" />
          <input type="text" value={c.cta_link || ""} onChange={(e) => onChange({ ...c, cta_link: e.target.value })} placeholder="CTA link" className="px-2 py-1 text-xs border border-stone-300 rounded" />
        </div>
        <input type="text" value={(c.trust_badges || []).join(", ")} onChange={(e) => onChange({ ...c, trust_badges: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Trust badges (comma separated)" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
        <input type="text" value={c.background_image || ""} onChange={(e) => onChange({ ...c, background_image: e.target.value })} placeholder="Background image URL" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
      </div>
    );
  }

  if (type === "stats") {
    const items = c.items || [];
    return (
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1">
            <input type="text" value={item.value || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], value: e.target.value }; onChange({ ...c, items: n }); }} placeholder="Value" className="px-2 py-1 text-xs border border-stone-300 rounded" />
            <input type="text" value={item.label || ""} onChange={(e) => { const n = [...items]; n[i] = { ...n[i], label: e.target.value }; onChange({ ...c, items: n }); }} placeholder="Label" className="px-2 py-1 text-xs border border-stone-300 rounded" />
            <button onClick={() => onChange({ ...c, items: items.filter((_, idx) => idx !== i) })} className="px-1 text-red-500"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <button onClick={() => onChange({ ...c, items: [...items, { value: "", label: "" }] })} className="text-[10px] text-amber-600 font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Add stat</button>
      </div>
    );
  }

  if (type === "showcase") {
    const systems = c.systems || [];
    return (
      <div className="space-y-1.5">
        <input type="text" value={c.title || ""} onChange={(e) => onChange({ ...c, title: e.target.value })} placeholder="Section title" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
        {systems.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1">
            <input type="text" value={s.name || ""} onChange={(e) => { const n = [...systems]; n[i] = { ...n[i], name: e.target.value }; onChange({ ...c, systems: n }); }} placeholder="Name" className="px-2 py-1 text-xs border border-stone-300 rounded" />
            <input type="text" value={s.image || ""} onChange={(e) => { const n = [...systems]; n[i] = { ...n[i], image: e.target.value }; onChange({ ...c, systems: n }); }} placeholder="Image URL" className="px-2 py-1 text-xs border border-stone-300 rounded" />
            <button onClick={() => onChange({ ...c, systems: systems.filter((_, idx) => idx !== i) })} className="px-1 text-red-500"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <button onClick={() => onChange({ ...c, systems: [...systems, { name: "", image: "", price_tier: "" }] })} className="text-[10px] text-amber-600 font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Add system</button>
      </div>
    );
  }

  if (type === "testimonials") {
    const reviews = c.reviews || [];
    return (
      <div className="space-y-1.5">
        <input type="text" value={c.title || ""} onChange={(e) => onChange({ ...c, title: e.target.value })} placeholder="Section title" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
        {reviews.map((r, i) => (
          <div key={i} className="space-y-1 border border-stone-200 rounded p-1.5">
            <textarea value={r.text || ""} onChange={(e) => { const n = [...reviews]; n[i] = { ...n[i], text: e.target.value }; onChange({ ...c, reviews: n }); }} placeholder="Review text" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" rows={2} />
            <div className="grid grid-cols-2 gap-1">
              <input type="text" value={r.name || ""} onChange={(e) => { const n = [...reviews]; n[i] = { ...n[i], name: e.target.value }; onChange({ ...c, reviews: n }); }} placeholder="Name" className="px-2 py-1 text-xs border border-stone-300 rounded" />
              <input type="text" value={r.role || ""} onChange={(e) => { const n = [...reviews]; n[i] = { ...n[i], role: e.target.value }; onChange({ ...c, reviews: n }); }} placeholder="Role" className="px-2 py-1 text-xs border border-stone-300 rounded" />
            </div>
            <button onClick={() => onChange({ ...c, reviews: reviews.filter((_, idx) => idx !== i) })} className="text-[10px] text-red-500 font-bold">Remove</button>
          </div>
        ))}
        <button onClick={() => onChange({ ...c, reviews: [...reviews, { name: "", role: "", text: "" }] })} className="text-[10px] text-amber-600 font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Add review</button>
      </div>
    );
  }

  if (type === "cta") {
    return (
      <div className="space-y-2">
        <input type="text" value={c.headline || ""} onChange={(e) => onChange({ ...c, headline: e.target.value })} placeholder="Headline" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
        <input type="text" value={c.subheadline || ""} onChange={(e) => onChange({ ...c, subheadline: e.target.value })} placeholder="Subheadline" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
        <input type="text" value={c.cta_text || ""} onChange={(e) => onChange({ ...c, cta_text: e.target.value })} placeholder="Button text" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
      </div>
    );
  }

  if (type === "color_charts" || type === "gallery") {
    const swatches = c.swatches || c.images || [];
    const field = type === "color_charts" ? "swatches" : "images";
    return (
      <div className="space-y-1.5">
        <input type="text" value={c.title || ""} onChange={(e) => onChange({ ...c, title: e.target.value })} placeholder="Section title" className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
        {swatches.map((sw, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1">
            <input type="text" value={sw.image_url || sw.url || ""} onChange={(e) => { const n = [...swatches]; n[i] = { ...n[i], image_url: e.target.value, url: e.target.value }; onChange({ ...c, [field]: n }); }} placeholder="Image URL" className="px-2 py-1 text-xs border border-stone-300 rounded" />
            <input type="text" value={sw.hex || ""} onChange={(e) => { const n = [...swatches]; n[i] = { ...n[i], hex: e.target.value }; onChange({ ...c, [field]: n }); }} placeholder="Hex (optional)" className="px-2 py-1 text-xs border border-stone-300 rounded" />
            <button onClick={() => onChange({ ...c, [field]: swatches.filter((_, idx) => idx !== i) })} className="px-1 text-red-500"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <button onClick={() => onChange({ ...c, [field]: [...swatches, { image_url: "", hex: "" }] })} className="text-[10px] text-amber-600 font-bold flex items-center gap-1"><Plus className="w-3 h-3" /> Add swatch</button>
      </div>
    );
  }

  if (type === "problem_solution") {
    return (
      <div className="space-y-2">
        <div>
          <label className="text-[10px] font-bold text-stone-600">Problems (comma separated)</label>
          <input type="text" value={(c.problems || []).join(", ")} onChange={(e) => onChange({ ...c, problems: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-stone-600">Solutions (comma separated)</label>
          <input type="text" value={(c.solutions || []).join(", ")} onChange={(e) => onChange({ ...c, solutions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="w-full px-2 py-1 text-xs border border-stone-300 rounded" />
        </div>
      </div>
    );
  }

  return <div className="text-[10px] text-stone-400">No editor for this section type.</div>;
}