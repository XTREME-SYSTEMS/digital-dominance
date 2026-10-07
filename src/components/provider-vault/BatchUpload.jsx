import React, { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  UploadCloud, FileText, Check, X, RefreshCw, AlertCircle,
  Sparkles, ChevronDown, ChevronRight, Pencil, Trash2,
} from "lucide-react";

// Keyword-based categorization (no AI credits needed)
const CATEGORY_RULES = [
  { match: ["supabase"], category: "provider_account", service: "supabase", label: "Supabase" },
  { match: ["vercel_ai", "vck_", "vercel_ai_gateway", "ai_gateway"], category: "provider_account", service: "vercel_ai_gateway", label: "Vercel AI Gateway" },
  { match: ["vercel"], category: "provider_account", service: "vercel", label: "Vercel" },
  { match: ["railway"], category: "provider_account", service: "railway", label: "Railway" },
  { match: ["google", "gcloud", "gcp", "googleworkspace", "google_workspace"], category: "provider_account", service: "google_workspace", label: "Google Workspace" },
  { match: ["github", "gh_"], category: "api_key", service: "github", label: "GitHub" },
  { match: ["telnyx"], category: "api_key", service: "telnyx", label: "Telnyx" },
  { match: ["godaddy"], category: "api_key", service: "godaddy", label: "GoDaddy" },
  { match: ["stripe"], category: "api_key", service: "stripe", label: "Stripe" },
  { match: ["openai"], category: "api_key", service: "openai", label: "OpenAI" },
  { match: ["anthropic", "claude"], category: "api_key", service: "anthropic", label: "Anthropic" },
  { match: ["groq"], category: "api_key", service: "groq", label: "Groq" },
  { match: ["openrouter"], category: "api_key", service: "openrouter", label: "OpenRouter" },
  { match: ["browserbase"], category: "api_key", service: "browserbase", label: "Browserbase" },
  { match: ["rentcast"], category: "api_key", service: "rentcast", label: "RentCast" },
  { match: ["bls"], category: "api_key", service: "bls", label: "BLS" },
  { match: ["xtreme_communication", "xtreme_comms"], category: "api_key", service: "xtreme_comms", label: "Xtreme Comms" },
  { match: ["seogenerator"], category: "api_key", service: "seogenerator", label: "SEO Generator" },
  { match: ["engine_api", "engine"], category: "api_key", service: "engine", label: "Engine" },
  { match: ["cloud_browser"], category: "api_key", service: "cloud_browser", label: "Cloud Browser" },
  { match: ["smtp", "imap", "email", "mail_"], category: "email", service: "email", label: "Email" },
  { match: ["webhook"], category: "webhook", service: "webhook", label: "Webhook" },
  { match: ["token", "secret", "password", "credential", "auth"], category: "credential", service: "auth", label: "Credential" },
];

function categorize(keyName, keyValue) {
  const k = (keyName || "").toLowerCase();
  const v = String(keyValue || "").toLowerCase();
  const combined = `${k} ${v}`;
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.match) {
      if (combined.includes(kw)) return { category: rule.category, service: rule.service, label: rule.label };
    }
  }
  // No match — create new category from key prefix
  const prefix = k.split(/[_\-\.]/)[0] || "other";
  return { category: "api_key", service: prefix, label: prefix.charAt(0).toUpperCase() + prefix.slice(1) };
}

function flattenObject(obj, prefix = "") {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}_${key}` : key;
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val, fullKey));
    } else {
      result[fullKey] = String(val);
    }
  }
  return result;
}

function parseContent(content, filename) {
  const items = [];
  const ext = (filename || "").split(".").pop().toLowerCase();

  try {
    if (ext === "json") {
      const obj = JSON.parse(content);
      const flat = flattenObject(obj);
      for (const [key, val] of Object.entries(flat)) {
        items.push({ key_name: key, key_value: val });
      }
    } else if (ext === "csv") {
      const lines = content.split(/\r?\n/).filter((l) => l.trim());
      for (const line of lines) {
        const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        if (cols.length >= 2 && cols[0] && !cols[0].toLowerCase().includes("key")) {
          items.push({ key_name: cols[0], key_value: cols.slice(1).join(", ") });
        }
      }
    } else {
      // env, txt, md, yaml — parse KEY=value or KEY: value lines
      // Also handle markdown code blocks and tables
      const cleaned = content.replace(/```[\s\S]*?```/g, (block) =>
        block.replace(/```\w*\n?/g, "").replace(/```$/g, "")
      );
      const lines = cleaned.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//") || trimmed.startsWith("<!--")) continue;
        // Skip markdown headers and table separators
        if (/^#{1,6}\s/.test(trimmed) || /^\|[-:\s|]+\|$/.test(trimmed)) continue;
        // Match KEY=value, KEY: value, "KEY": "value", | KEY | value |
        let m = trimmed.match(/^[|`"]?([A-Za-z0-9_][A-Za-z0-9_\-\.]*)[`"]?\s*[=:]\s*(.+)$/);
        if (m) {
          let val = m[2].replace(/^["'\s]+|["'\s,|]+$/g, "").trim();
          if (val) items.push({ key_name: m[1], key_value: val });
        }
      }
    }
  } catch (e) {
    // If JSON parse fails, fall back to line parsing
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const m = trimmed.match(/^([A-Za-z0-9_][A-Za-z0-9_\-\.]*)\s*[=:]\s*(.+)$/);
      if (m) items.push({ key_name: m[1], key_value: m[2].replace(/^["']|["']$/g, "") });
    }
  }

  return items;
}

export default function BatchUpload({ onClose }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedCats, setExpandedCats] = useState({});

  const handleFiles = useCallback(async (files) => {
    const allItems = [];
    for (const file of files) {
      const text = await file.text();
      const items = parseContent(text, file.name);
      // Tag each with source file
      items.forEach((it) => allItems.push({ ...it, _source: file.name }));
    }

    // Categorize each
    const categorized = allItems.map((it) => {
      const cat = categorize(it.key_name, it.key_value);
      return {
        ...it,
        category: cat.category,
        service: cat.service,
        _label: cat.label,
        name: it.key_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        is_secret: !it.key_name.toLowerCase().includes("url") && !it.key_name.toLowerCase().includes("email"),
        active: true,
      };
    });

    setParsed(categorized);
    // Expand all categories by default
    const cats = {};
    categorized.forEach((it) => { cats[it._label] = true; });
    setExpandedCats({ ...expandedCats, ...cats });
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files);
  };

  const onFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) handleFiles(files);
  };

  const updateItem = (idx, updates) => {
    setParsed((prev) => prev.map((it, i) => (i === idx ? { ...it, ...updates } : it)));
  };

  const removeItem = (idx) => {
    setParsed((prev) => prev.filter((_, i) => i !== idx));
  };

  const grouped = parsed.reduce((acc, it, idx) => {
    const key = it._label;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...it, _idx: idx });
    return acc;
  }, {});

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    let created = 0, failed = 0;
    const records = parsed.map((it) => ({
      name: it.name,
      category: it.category,
      service: it.service,
      key_name: it.key_name,
      key_value: it.key_value,
      is_secret: it.is_secret,
      active: true,
      notes: `Batch imported from ${it._source}`,
    }));

    try {
      // Batch in groups of 50
      for (let i = 0; i < records.length; i += 50) {
        const batch = records.slice(i, i + 50);
        try {
          await base44.entities.VaultEntry.bulkCreate(batch);
          created += batch.length;
        } catch (e) {
          failed += batch.length;
        }
      }
      setResult({ created, failed, total: records.length });
      queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
      if (failed === 0) {
        setTimeout(() => onClose(), 1500);
      }
    } catch (e) {
      setResult({ created, failed: records.length, total: records.length, error: e.message });
    } finally {
      setImporting(false);
    }
  };

  const toggleCat = (cat) => setExpandedCats((p) => ({ ...p, [cat]: !p[cat] }));

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-amber-500" /> Batch Upload Secrets
        </h3>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X className="h-4 w-4" /></button>
      </div>

      <p className="text-sm text-stone-600">
        Upload <code className="text-amber-700">.env</code>, <code className="text-amber-700">.txt</code>, <code className="text-amber-700">.md</code>, <code className="text-amber-700">.json</code>, or <code className="text-amber-700">.csv</code> files.
        Secrets are parsed locally in your browser and auto-categorized by keyword. New categories are created automatically.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          dragOver ? "border-amber-500 bg-amber-100" : "border-stone-300 bg-white hover:border-amber-400"
        }`}
      >
        <UploadCloud className="h-10 w-10 mx-auto mb-2 text-stone-400" />
        <p className="text-sm font-medium text-stone-700">
          {dragOver ? "Drop files here..." : "Click or drag files to upload"}
        </p>
        <p className="text-xs text-stone-400 mt-1">Supports .env, .txt, .md, .json, .csv — multiple files OK</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".env,.txt,.md,.markdown,.json,.csv,.yaml,.yml"
          onChange={onFileSelect}
          className="hidden"
        />
      </div>

      {/* Parsed preview */}
      {parsed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-stone-700">
              {parsed.length} secrets parsed into {Object.keys(grouped).length} categories
            </span>
            <button
              onClick={handleImport}
              disabled={importing}
              className="h-9 px-4 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold flex items-center gap-2 hover:bg-amber-400 disabled:opacity-50"
            >
              {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Import {parsed.length} Secrets
            </button>
          </div>

          {result && (
            <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${
              result.failed === 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {result.failed === 0 ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {result.created} created, {result.failed} failed out of {result.total}
              {result.error && ` — ${result.error}`}
            </div>
          )}

          {/* Grouped preview */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat} className="rounded-xl border border-stone-200 bg-white">
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                >
                  {expandedCats[cat] ? <ChevronDown className="h-4 w-4 text-stone-400" /> : <ChevronRight className="h-4 w-4 text-stone-400" />}
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-bold text-stone-700">{cat}</span>
                  <span className="text-xs text-stone-400">({items.length})</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 capitalize">
                    {items[0].category}
                  </span>
                </button>
                {expandedCats[cat] && (
                  <div className="border-t border-stone-100 divide-y divide-stone-50">
                    {items.map((it) => (
                      <div key={it._idx} className="flex items-center gap-2 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <input
                            value={it.name}
                            onChange={(e) => updateItem(it._idx, { name: e.target.value })}
                            className="w-full text-sm font-medium text-stone-900 bg-transparent border-0 outline-none focus:bg-stone-50 rounded px-1"
                          />
                          <div className="flex items-center gap-2 mt-0.5">
                            <code className="text-xs text-stone-400 font-mono">{it.key_name}</code>
                            <span className="text-xs text-stone-300">→</span>
                            <code className="text-xs text-stone-500 font-mono truncate">
                              {it.is_secret ? "••••••••" : it.key_value.slice(0, 40)}
                            </code>
                          </div>
                        </div>
                        <select
                          value={it.category}
                          onChange={(e) => updateItem(it._idx, { category: e.target.value })}
                          className="h-7 text-xs rounded border border-stone-200 bg-white px-1 outline-none"
                        >
                          <option value="api_key">API Key</option>
                          <option value="provider_account">Provider</option>
                          <option value="email">Email</option>
                          <option value="credential">Credential</option>
                          <option value="webhook">Webhook</option>
                          <option value="sync_config">Sync Config</option>
                          <option value="other">Other</option>
                        </select>
                        <button
                          onClick={() => removeItem(it._idx)}
                          className="h-7 w-7 grid place-items-center rounded border border-stone-200 text-stone-400 hover:text-red-600 hover:border-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}