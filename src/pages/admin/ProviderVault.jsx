import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Shield, Database, Globe, Zap, Server, KeyRound, Plus, Trash2,
  Eye, EyeOff, Check, RefreshCw, AlertCircle, Lock, Copy,
  ExternalLink, Cpu, ArrowRight, Sparkles,
} from "lucide-react";

const PROVIDERS = {
  supabase: {
    icon: Database,
    label: "Supabase",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    accent: "emerald",
    description: "Multiple Supabase projects with auth, database & storage",
    fields: [
      { key: "project_name", label: "Project Name", placeholder: "My Production Project", required: true },
      { key: "project_url", label: "Project URL", placeholder: "https://xxx.supabase.co", required: true },
      { key: "project_ref", label: "Project Ref", placeholder: "xxxxxxxxxxxxxxxxxxxx" },
      { key: "anon_key", label: "Anon Key", placeholder: "eyJhbGci...", secret: true },
      { key: "service_role_key", label: "Service Role Key", placeholder: "eyJhbGci...", secret: true },
      { key: "database_url", label: "Database URL (optional)", placeholder: "postgresql://..." },
    ],
  },
  vercel: {
    icon: Globe,
    label: "Vercel",
    color: "text-stone-900",
    bg: "bg-stone-100 border-stone-300",
    accent: "stone",
    description: "Vercel API token for deployment & project management",
    fields: [
      { key: "project_name", label: "Account Name", placeholder: "Personal Vercel", required: true },
      { key: "api_token", label: "API Token", placeholder: "vercel_xxx...", secret: true, required: true },
      { key: "team_id", label: "Team ID (optional)", placeholder: "team_xxx" },
    ],
  },
  vercel_ai_gateway: {
    icon: Cpu,
    label: "Vercel AI Gateway",
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
    accent: "purple",
    description: "Primary AI route — text, image, speech, transcription, extraction",
    fields: [
      { key: "project_name", label: "Gateway Name", placeholder: "Primary AI Gateway", required: true },
      { key: "api_token", label: "Gateway API Key", placeholder: "vck_xxx...", secret: true, required: true },
      { key: "region", label: "Region (optional)", placeholder: "iad1" },
    ],
  },
  railway: {
    icon: Server,
    label: "Railway",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
    accent: "purple",
    description: "Multiple Railway accounts for background workers & jobs",
    fields: [
      { key: "project_name", label: "Account Name", placeholder: "Railway Account 1", required: true },
      { key: "api_token", label: "API Token", placeholder: "railway_xxx...", secret: true, required: true },
      { key: "project_id", label: "Project ID (optional)", placeholder: "prj-xxx" },
    ],
  },
  google_workspace: {
    icon: KeyRound,
    label: "Google Workspace",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    accent: "blue",
    description: "Google Workspace OAuth for Gmail, Calendar, Drive, Sheets",
    fields: [
      { key: "project_name", label: "Workspace Name", placeholder: "Xtreme Polishing", required: true },
      { key: "client_id", label: "Client ID", placeholder: "xxxx.apps.googleusercontent.com", required: true },
      { key: "client_secret", label: "Client Secret", placeholder: "GOCSPX-xxx", secret: true, required: true },
      { key: "refresh_token", label: "Refresh Token (optional)", placeholder: "1//xxx...", secret: true },
      { key: "domain", label: "Domain", placeholder: "thextremeteam.com" },
    ],
  },
};

export default function ProviderVault() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("providers");
  const [addingProvider, setAddingProvider] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [revealed, setRevealed] = useState({});

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["vault-entries"],
    queryFn: () => base44.entities.VaultEntry.list("-created_date", 500),
  });

  const providerEntries = useMemo(() => {
    return entries.filter((e) => e.category === "provider_account");
  }, [entries]);

  const byProvider = useMemo(() => {
    const map = {};
    for (const e of providerEntries) {
      const pt = e.provider_config?.provider_type || e.service;
      if (!map[pt]) map[pt] = [];
      map[pt].push(e);
    }
    return map;
  }, [providerEntries]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this provider account?")) return;
    await base44.entities.VaultEntry.delete(id);
    queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
  };

  const toggleReveal = (id) => setRevealed((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Shield className="h-7 w-7 text-amber-500" /> Provider Vault
        </h1>
        <p className="text-stone-500 mt-1">
          Centralized storage for all your provider accounts, API keys, and MCP sync. Your agents and systems read from here.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        {[
          { id: "providers", label: "Provider Accounts", icon: Database },
          { id: "api", label: "API Generator", icon: KeyRound },
          { id: "mcp", label: "MCP / GPT Sync", icon: Cpu },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition -mb-px ${
              activeTab === tab.id
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-stone-500 hover:text-stone-700"
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* === PROVIDER ACCOUNTS === */}
      {activeTab === "providers" && (
        <div className="space-y-4">
          {/* Provider cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(PROVIDERS).map(([key, prov]) => {
              const accounts = byProvider[key] || [];
              return (
                <div key={key} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`shrink-0 w-10 h-10 rounded-lg grid place-items-center ${prov.bg} border`}>
                        <prov.icon className={`h-5 w-5 ${prov.color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900">{prov.label}</h3>
                        <p className="text-xs text-stone-500">{prov.description}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${accounts.length > 0 ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-400"}`}>
                      {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
                    </span>
                  </div>

                  {/* Accounts list */}
                  {accounts.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {accounts.map((acc) => (
                        <ProviderAccountRow
                          key={acc.id}
                          entry={acc}
                          provider={prov}
                          revealed={!!revealed[acc.id]}
                          onReveal={() => toggleReveal(acc.id)}
                          onDelete={() => handleDelete(acc.id)}
                          onEdit={() => { setEditingEntry(acc); setAddingProvider(key); }}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => { setAddingProvider(key); setEditingEntry(null); }}
                    className="w-full h-9 rounded-lg border-2 border-dashed border-stone-200 text-stone-500 text-sm font-medium hover:border-amber-400 hover:text-amber-600 transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add {prov.label} Account
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add/Edit form */}
          {addingProvider && (
            <ProviderForm
              providerKey={addingProvider}
              editing={editingEntry}
              onSave={async (payload) => {
                await base44.entities.VaultEntry.upsert([payload], { key: "id" });
                queryClient.invalidateQueries({ queryKey: ["vault-entries"] });
                setAddingProvider(null);
                setEditingEntry(null);
              }}
              onCancel={() => { setAddingProvider(null); setEditingEntry(null); }}
            />
          )}
        </div>
      )}

      {/* === API GENERATOR === */}
      {activeTab === "api" && <ApiGeneratorSection />}

      {/* === MCP / GPT SYNC === */}
      {activeTab === "mcp" && <McpSyncSection />}
    </div>
  );
}

function ProviderAccountRow({ entry, provider, revealed, onReveal, onDelete, onEdit }) {
  const cfg = entry.provider_config || {};
  const name = cfg.project_name || entry.name;
  const primaryValue = cfg.api_token || cfg.service_role_key || cfg.anon_key || cfg.client_secret || cfg.project_url || "";

  return (
    <div className="rounded-lg border border-stone-200 p-3 bg-stone-50/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900 text-sm truncate">{name}</span>
            {!entry.active && <span className="text-[10px] text-red-500 font-bold">INACTIVE</span>}
          </div>
          {primaryValue && (
            <div className="flex items-center gap-1.5 mt-1">
              <code className="flex-1 text-xs font-mono text-stone-500 truncate">
                {revealed ? primaryValue : "••••••••••••••••"}
              </code>
              <button onClick={onReveal} className="text-stone-400 hover:text-amber-600">
                {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
          {cfg.project_url && cfg.provider_type === "supabase" && (
            <a href={cfg.project_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 mt-1">
              <ExternalLink className="h-2.5 w-2.5" /> {cfg.project_url}
            </a>
          )}
          {cfg.domain && cfg.provider_type === "google_workspace" && (
            <span className="text-[10px] text-stone-400">{cfg.domain}</span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="h-7 px-2 rounded text-xs font-medium text-stone-500 hover:text-amber-600">Edit</button>
          <button onClick={onDelete} className="h-7 w-7 grid place-items-center rounded text-stone-400 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProviderForm({ providerKey, editing, onSave, onCancel }) {
  const prov = PROVIDERS[providerKey];
  const [form, setForm] = useState(() => {
    const cfg = editing?.provider_config || {};
    const init = { project_name: editing?.name || "" };
    for (const f of prov.fields) {
      init[f.key] = cfg[f.key] || "";
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id: editing?.id,
        name: form.project_name || `${prov.label} Account`,
        category: "provider_account",
        service: providerKey,
        key_name: providerKey.toUpperCase().replace(/ /g, "_"),
        key_value: form.api_token || form.service_role_key || form.anon_key || form.client_secret || "",
        is_secret: true,
        active: true,
        provider_config: {
          ...form,
          provider_type: providerKey,
        },
      };
      await onSave(payload);
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <prov.icon className={`h-5 w-5 ${prov.color}`} />
          {editing ? `Edit ${prov.label} Account` : `Add ${prov.label} Account`}
        </h3>
        <button onClick={onCancel} className="text-stone-400 hover:text-stone-600 text-sm">Cancel</button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prov.fields.map((f) => (
          <div key={f.key} className={f.key === "project_name" || f.key === "project_url" || f.key === "database_url" ? "sm:col-span-2" : ""}>
            <label className="text-xs font-semibold text-stone-500 mb-1 block">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={f.secret ? "password" : "text"}
              placeholder={f.placeholder}
              value={form[f.key] || ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-stone-200 text-sm focus:border-amber-500 outline-none bg-white"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-5 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold flex items-center gap-2 hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {editing ? "Update Account" : "Save Account"}
        </button>
        <button onClick={onCancel} className="h-10 px-4 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

function ApiGeneratorSection() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 grid place-items-center">
            <KeyRound className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900">API Key Generator</h3>
            <p className="text-sm text-stone-500">
              Generate scoped API keys for external systems to sync with your app. Keys are hashed at rest and shown only once.
            </p>
          </div>
        </div>
        <a
          href="/admin/api-keys"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-bold hover:bg-stone-800"
        >
          Open API Key Manager <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h4 className="font-bold text-stone-900 mb-3">How external systems sync with your app</h4>
        <div className="space-y-3 text-sm text-stone-600">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <div>
              <strong>Admin scope</strong> — Full access to every entity and function. Use for trusted internal systems.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <div>
              <strong>SEO scope</strong> — Page generation, indexing, and Search Console functions. Use for SEO bots.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <div>
              <strong>User scope</strong> — Lead submission and property lookup only. Use for external lead sources.
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-stone-50 border border-stone-200 p-3">
          <p className="text-xs font-mono text-stone-500 mb-1">Example usage from any external system:</p>
          <code className="text-xs font-mono text-stone-700 block break-all">
            fetch('https://epoxyquotenearme.base44.app/api/leads', &#123; headers: &#123; 'x-api-key': 'xps_seo_xxxxx' &#125; &#125;)
          </code>
        </div>
      </div>
    </div>
  );
}

function McpSyncSection() {
  const [copied, setCopied] = useState(false);
  const mcpUrl = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "";

  const copyUrl = () => {
    navigator.clipboard?.writeText(mcpUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      {/* MCP Server URL */}
      <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/50 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-100 border border-purple-200 grid place-items-center">
            <Cpu className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-stone-900">MCP Server URL</h3>
            <p className="text-sm text-stone-500">
              Paste this URL into ChatGPT, Claude, Cursor, or any MCP-compatible AI client to let it read your app data and run functions.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <code className="flex-1 bg-stone-900 text-purple-300 rounded-lg px-4 py-3 text-sm font-mono break-all">
            {mcpUrl}
          </code>
          <button
            onClick={copyUrl}
            className="h-auto px-4 rounded-lg bg-purple-600 text-white font-semibold flex items-center gap-2 hover:bg-purple-700 shrink-0"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-bold flex items-center gap-1">
            <Check className="h-3 w-3" /> OAuth Enabled
          </span>
          <span className="text-stone-500">Users sign in to access data based on their app permissions</span>
        </div>
      </div>

      {/* GPT / ChatGPT Setup */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h4 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" /> Connect to ChatGPT / GPT
        </h4>
        <ol className="space-y-2 text-sm text-stone-600">
          <li className="flex gap-2"><span className="font-bold text-stone-900 shrink-0">1.</span> Open ChatGPT and go to <strong>Apps</strong></li>
          <li className="flex gap-2"><span className="font-bold text-stone-900 shrink-0">2.</span> Enable <strong>Developer mode</strong> (confirm the risk warning ChatGPT shows)</li>
          <li className="flex gap-2"><span className="font-bold text-stone-900 shrink-0">3.</span> Click <strong>Create app</strong> and name it (e.g. "Epoxy Command")</li>
          <li className="flex gap-2"><span className="font-bold text-stone-900 shrink-0">4.</span> Paste the MCP server URL above and click <strong>Create</strong></li>
          <li className="flex gap-2"><span className="font-bold text-stone-900 shrink-0">5.</span> Enable the app from the chat composer before prompting it</li>
          <li className="flex gap-2"><span className="font-bold text-stone-900 shrink-0">6.</span> ChatGPT will open your consent page — sign in with your app account and approve</li>
        </ol>
      </div>

      {/* Other clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h4 className="font-bold text-stone-900 mb-2">Claude</h4>
          <p className="text-sm text-stone-600 mb-2">Profile menu → Settings → Connectors → "Add custom connector"</p>
          <p className="text-xs text-stone-400">Name it, paste the URL, click Add.</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h4 className="font-bold text-stone-900 mb-2">Cursor</h4>
          <p className="text-sm text-stone-600 mb-2">Customize → MCPs tab → "New MCP Server"</p>
          <p className="text-xs text-stone-400">Add the URL to mcp.json, save, toggle on.</p>
        </div>
      </div>

      {/* What's exposed */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <h4 className="font-bold text-stone-900 mb-3">What GPT Can Access</h4>
        <div className="space-y-2 text-sm text-stone-600">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <div><strong>All entities</strong> — Leads, Appointments, VaultEntry, and every other entity (read, create, update, delete based on your app role)</div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <div><strong>Backend functions</strong> — Vision engine, dominance campaigns, competitor scanning, system orchestration, and more</div>
          </div>
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
            <div><strong>AI agents</strong> — All in-app agents (SEO manager, lead orchestrator, swarm, etc.)</div>
          </div>
        </div>
        <a
          href="/connect"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-sm font-medium hover:border-amber-500 hover:text-amber-600"
        >
          <ExternalLink className="h-4 w-4" /> View full connection guide
        </a>
      </div>

      {/* Important note */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-stone-700">
          <strong>Important:</strong> You must publish (or republish) the app for MCP changes to take effect. Each time the exposed tool set changes, connected AI clients must re-authorize.
        </div>
      </div>
    </div>
  );
}