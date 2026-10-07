import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Loader2, Plus, Save, Eye, FileText, Trash2, ChevronUp, ChevronDown,
  Layers, X, Settings, Monitor, Smartphone,
} from "lucide-react";
import DynamicPageRenderer, { RENDERERS } from "@/components/codestudio/DynamicPageRenderer";
import SectionEditor, { SECTION_TYPES } from "@/components/codestudio/SectionEditor";

const genId = () => Math.random().toString(36).slice(2, 9);

export default function VisualPageEditor() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [device, setDevice] = useState("desktop");

  const { data: pages, isLoading } = useQuery({
    queryKey: ["dynamicPages"],
    queryFn: () => base44.entities.DynamicPage.list("-created_date", 50),
  });

  const selected = pages?.find((p) => p.id === selectedId) || null;

  const createPage = async () => {
    const page = await base44.entities.DynamicPage.create({
      title: "New Visual Page",
      slug: `visual-${Date.now()}`,
      sections: [],
      status: "draft",
      is_public: true,
    });
    qc.invalidateQueries({ queryKey: ["dynamicPages"] });
    setSelectedId(page.id);
  };

  const updateField = (key, val) => {
    if (!selected) return;
    qc.setQueryData(["dynamicPages"], (old) =>
      old?.map((p) => (p.id === selected.id ? { ...p, [key]: val } : p))
    );
  };

  const addSection = (type) => {
    const newSection = { id: genId(), type, props: {} };
    const updated = [...(selected.sections || []), newSection];
    updateField("sections", updated);
    setShowAdd(false);
    setEditingIdx(updated.length - 1);
  };

  const updateSection = (idx, section) => {
    const updated = [...(selected.sections || [])];
    updated[idx] = section;
    updateField("sections", updated);
  };

  const removeSection = (idx) => {
    updateField("sections", (selected.sections || []).filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const moveSection = (idx, dir) => {
    const arr = [...(selected.sections || [])];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    updateField("sections", arr);
    setEditingIdx(target);
  };

  const savePage = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const cleanedSections = (selected.sections || []).map((s) => {
        const props = { ...s.props };
        for (const [k, v] of Object.entries(props)) {
          if (typeof v === "string" && ["images", "items", "fields"].includes(k)) {
            try { props[k] = JSON.parse(v); } catch {}
          }
        }
        return { ...s, props };
      });
      await base44.entities.DynamicPage.update(selected.id, {
        ...selected,
        sections: cleanedSections,
      });
      qc.invalidateQueries({ queryKey: ["dynamicPages"] });
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const deletePage = async (page) => {
    await base44.entities.DynamicPage.delete(page.id);
    qc.invalidateQueries({ queryKey: ["dynamicPages"] });
    if (selectedId === page.id) setSelectedId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
      </div>
    );
  }

  const editingSection = editingIdx !== null ? selected?.sections?.[editingIdx] : null;

  return (
    <div className="flex flex-col h-full bg-stone-100">
      {/* === TOP BAR — page selector + actions === */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-stone-200 shrink-0">
        <select
          value={selectedId || ""}
          onChange={(e) => { setSelectedId(e.target.value); setEditingIdx(null); }}
          className="text-sm border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:border-amber-500 min-w-[180px]"
        >
          <option value="">Select a page...</option>
          {(pages || []).map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <button onClick={createPage} className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 px-2 py-1">
          <Plus className="h-3.5 w-3.5" /> New
        </button>

        {selected && (
          <>
            <div className="h-5 w-px bg-stone-200 mx-1" />
            <input
              value={selected.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Page title"
              className="text-sm border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500 w-40"
            />
            <input
              value={selected.slug}
              onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="slug"
              className="text-sm border border-stone-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500 w-32 font-mono"
            />
            <select
              value={selected.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 outline-none focus:border-amber-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>

            <div className="ml-auto flex items-center gap-1.5">
              {/* Device toggle */}
              <div className="flex items-center rounded-lg border border-stone-200 overflow-hidden">
                <button
                  onClick={() => setDevice("desktop")}
                  className={`p-1.5 ${device === "desktop" ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-stone-600"}`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDevice("mobile")}
                  className={`p-1.5 ${device === "mobile" ? "bg-amber-500 text-stone-950" : "text-stone-400 hover:text-stone-600"}`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
              <a
                href={`/p/${selected.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-600 hover:border-stone-300"
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </a>
              <button
                onClick={() => deletePage(selected)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={savePage}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </button>
            </div>
          </>
        )}
      </div>

      {/* === CANVAS === */}
      <div className="flex-1 overflow-y-auto bg-stone-200 p-4 flex justify-center">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-400">
            <FileText className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm font-semibold">Select a page to edit visually</p>
            <p className="text-xs mt-1">or click "New" to create one</p>
          </div>
        ) : (
          <div
            className={`bg-white shadow-xl transition-all duration-200 ${
              device === "mobile" ? "w-[390px]" : "w-full max-w-4xl"
            }`}
          >
            {/* Sections with visual overlays */}
            {(selected.sections || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <Layers className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm font-semibold">No sections yet</p>
                <p className="text-xs mt-1">Click "Add Section" below to start building</p>
              </div>
            ) : (
              (selected.sections || []).map((section, idx) => {
                const Renderer = RENDERERS[section.type];
                const isEditing = editingIdx === idx;
                return (
                  <div
                    key={section.id || idx}
                    className={`relative group cursor-pointer transition-all ${
                      isEditing ? "ring-2 ring-amber-500 ring-inset" : "hover:ring-2 hover:ring-amber-300 hover:ring-inset"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingIdx(idx);
                    }}
                  >
                    {/* Section label + controls overlay */}
                    <div
                      className={`absolute top-1 right-1 z-20 flex items-center gap-0.5 rounded-md bg-stone-900/90 px-1 py-0.5 transition-opacity ${
                        isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wide text-amber-400 px-1">
                        {section.type}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSection(idx, -1); }}
                        disabled={idx === 0}
                        className="p-0.5 text-stone-300 hover:text-white disabled:opacity-30"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveSection(idx, 1); }}
                        disabled={idx === (selected.sections || []).length - 1}
                        className="p-0.5 text-stone-300 hover:text-white disabled:opacity-30"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSection(idx); }}
                        className="p-0.5 text-stone-300 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {/* Render the section live */}
                    {Renderer ? (
                      <Renderer {...(section.props || {})} />
                    ) : (
                      <div className="p-8 text-center text-red-400 text-sm">Unknown section: {section.type}</div>
                    )}
                  </div>
                );
              })
            )}

            {/* Add section button */}
            <div className="p-4 border-t border-stone-100">
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 py-3 text-sm font-bold text-stone-500 hover:border-amber-400 hover:text-amber-600 transition"
              >
                <Plus className="h-4 w-4" /> Add Section
              </button>
              {showAdd && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {SECTION_TYPES.map((s) => (
                    <button
                      key={s.type}
                      onClick={() => addSection(s.type)}
                      className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-700 hover:border-amber-400 hover:bg-amber-50 transition"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* === EDIT DRAWER — slides in from right when a section is selected === */}
      {editingSection && (
        <div className="absolute inset-0 z-30 flex justify-end" onClick={() => setEditingIdx(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-[360px] bg-white shadow-2xl overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 bg-stone-50 shrink-0">
              <Settings className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold text-stone-900 flex-1">Edit Section</span>
              <button onClick={() => setEditingIdx(null)} className="p-1 rounded hover:bg-stone-200">
                <X className="h-4 w-4 text-stone-500" />
              </button>
            </div>
            <div className="p-4">
              <SectionEditor
                section={editingSection}
                onChange={(s) => updateSection(editingIdx, s)}
                onRemove={() => removeSection(editingIdx)}
                onMove={(d) => moveSection(editingIdx, d)}
                canUp={editingIdx > 0}
                canDown={editingIdx < (selected.sections || []).length - 1}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}