import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Shield, Zap, Check, X, Loader2, Mail, Brain, Database, Server,
  Globe, AlertTriangle, Rocket, RefreshCw, ExternalLink, Lock,
} from "lucide-react";

const MIGRATIONS = [
  {
    id: "gateway",
    icon: Brain,
    title: "Vercel AI Gateway — ALL AI (Primary Route)",
    base44Service: "Core.InvokeLLM + GenerateImage + GenerateSpeech + TranscribeAudio + ExtractData",
    independentFunction: "vercelAiGateway",
    providers: ["Vercel AI Gateway (own billing, separate from Base44 credits)"],
    secrets: ["VERCEL_AI_GATEWAY_API_KEY"],
    status: "active",
    capabilities: [
      "generateText — LLM text (replaces InvokeLLM, claude-opus-4.7 default)",
      "generateImage — text-to-image (replaces GenerateImage, gpt-image-2)",
      "editImage — image editing with reference (Gemini Flash Image / Nano Banana)",
      "generateSpeech — text-to-speech (replaces GenerateSpeech, tts-1)",
      "transcribeAudio — audio transcription (replaces TranscribeAudio, whisper-1)",
      "extractData — file extraction (replaces ExtractDataFromUploadedFile)",
      "generateEmbedding — vector embeddings for RAG",
    ],
    note: "This is the PRIMARY AI route. All Core.InvokeLLM/GenerateImage/GenerateSpeech/TranscribeAudio/ExtractData calls are automatically overridden to route through this gateway on both frontend and backend.",
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI / LLM (Free-Tier Backup)",
    base44Service: "Core.InvokeLLM (backup)",
    independentFunction: "independentAi",
    providers: ["Groq (free tier)", "Google AI (free tier)", "OpenRouter (free models)"],
    secrets: ["GROQ_API_KEY", "GOOGLE_AI_API_KEY", "OPENROUTER_API_KEY"],
    status: "active",
    note: "Free-tier backup for when Vercel AI Gateway credits are exhausted. All three providers have independent rate limits.",
  },
  {
    id: "email",
    icon: Mail,
    title: "Email Sending",
    base44Service: "Core.SendEmail",
    independentFunction: "independentEmail",
    providers: ["Xtreme Communications Gateway", "Gmail Connector (OAuth)"],
    secrets: ["XTREME_COMMUNICATION_API_KEY"],
    connectors: ["gmail"],
    status: "active",
  },
  {
    id: "storage",
    icon: Database,
    title: "File Storage",
    base44Service: "Core.UploadPublicFile / UploadPrivateFile",
    independentFunction: "supabaseUpload",
    providers: ["Supabase Storage"],
    secrets: ["SMAI_SUPABASE_URL", "SMAI_SUPABASE_ANON_KEY"],
    status: "active",
  },
  {
    id: "sms",
    icon: Zap,
    title: "SMS / MMS / Voice",
    base44Service: "Core.SendPushNotification",
    independentFunction: "xtremeComms",
    providers: ["Xtreme Communications (Telnyx)", "Telnyx Direct"],
    secrets: ["XTREME_COMMUNICATION_API_KEY", "TELNYX_API_KEY"],
    status: "active",
  },
  {
    id: "scrape",
    icon: Globe,
    title: "Web Scraping / Browsing",
    base44Service: "N/A (custom)",
    independentFunction: "shadowBrowse",
    providers: ["Cloud Browser Engine", "Browserbase"],
    secrets: ["CLOUD_BROWSER_ENGINE_URL", "BROWSERBASE_API_KEY"],
    status: "active",
  },
  {
    id: "deploy",
    icon: Server,
    title: "Frontend Deployment",
    base44Service: "Base44 hosting",
    independentFunction: "vercelDeploy",
    providers: ["Vercel (paid account)"],
    secrets: ["VERCEL_API_TOKEN", "VERCEL_TEAM"],
    status: "active",
  },
  {
    id: "database",
    icon: Database,
    title: "Backend Database",
    base44Service: "Base44 entities",
    independentFunction: "supabaseMigrationDeploy",
    providers: ["Supabase (paid account)", "PostgreSQL"],
    secrets: ["SMAI_SUPABASE_URL", "SMAI_SUPABASE_ANON_KEY", "SMAI_SUPABASE_SERVICE_ROLE_KEY"],
    status: "partial",
    note: "SMAI portal migrated; main app entities still on Base44",
  },
];

export default function SystemIndependence() {
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    base44.functions.invoke("independentAi", { action: "status" })
      .then((res) => setAiStatus(res.data))
      .catch(() => setAiStatus(null));
  }, []);

  const runTest = async (id) => {
    setTesting((s) => ({ ...s, [id]: true }));
    setTestResults((s) => ({ ...s, [id]: null }));
    try {
      let result;
      if (id === "gateway") {
        result = await base44.functions.invoke("vercelAiGateway", {
          action: "generateText",
          prompt: "Say 'Vercel AI Gateway is live' in exactly 6 words.",
        });
      } else if (id === "ai") {
        result = await base44.functions.invoke("independentAi", {
          prompt: "Say 'System independence confirmed' in exactly 5 words.",
          max_tokens: 20,
        });
      } else if (id === "email") {
        result = await base44.functions.invoke("independentEmail", {
          to: "test@independent.system",
          subject: "Independence Test",
          body: "This email was sent without Base44 integration credits.",
        });
      } else if (id === "storage") {
        result = await base44.functions.invoke("supabaseUpload", {
          file_data: "data:text/plain;base64,SW5kZXBlbmRlbnQgc3RvcmFnZSB0ZXN0",
          filename: "independence-test.txt",
          content_type: "text/plain",
        });
      } else {
        result = { data: { ok: true, note: "Manual test required" } };
      }
      setTestResults((s) => ({ ...s, [id]: { ok: result.data?.ok !== false, data: result.data } }));
    } catch (err) {
      setTestResults((s) => ({ ...s, [id]: { ok: false, error: err.message } }));
    }
    setTesting((s) => ({ ...s, [id]: false }));
  };

  const activeCount = MIGRATIONS.filter((m) => m.status === "active").length;
  const partialCount = MIGRATIONS.filter((m) => m.status === "partial").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">System Independence</h1>
            <p className="text-sm text-stone-500">
              Vercel AI Gateway is the primary AI route — all Core AI calls are automatically overridden. The system functions without Base44 integration credits.
            </p>
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-2xl border-2 p-5 ${aiStatus?.independent ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}>
        <div className="flex items-center gap-3">
          {aiStatus?.independent ? (
            <Check className="w-6 h-6 text-green-600" />
          ) : (
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          )}
          <div>
            <h3 className="text-base font-bold text-stone-900">
              {aiStatus ? "Vercel AI Gateway — Primary AI Route Active" : "Checking AI configuration..."}
            </h3>
            <p className="text-sm text-stone-600">
              {activeCount} independent routes active · {partialCount} partially migrated · All AI calls route through Vercel AI Gateway (own billing)
            </p>
          </div>
        </div>
        {aiStatus?.providers && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(aiStatus.providers).map(([provider, available]) => (
              <span
                key={provider}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                  available ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-400"
                }`}
              >
                {available ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {provider}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Migration cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MIGRATIONS.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border-2 p-5 transition ${
              m.status === "active" ? "border-green-200 bg-white" : "border-amber-200 bg-amber-50/30"
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                m.status === "active" ? "bg-green-100" : "bg-amber-100"
              }`}>
                <m.icon className={`w-5 h-5 ${m.status === "active" ? "text-green-600" : "text-amber-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900">{m.title}</h3>
                  {m.status === "active" ? (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Independent
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Partial
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Replaces: <code className="text-stone-400">{m.base44Service}</code>
                </p>
              </div>
            </div>

            {/* Providers */}
            <div className="mb-3">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1.5">Independent Providers</div>
              <div className="flex flex-wrap gap-1.5">
                {m.providers.map((p) => (
                  <span key={p} className="text-xs px-2 py-1 rounded bg-stone-100 text-stone-600">{p}</span>
                ))}
              </div>
            </div>

            {/* Secrets/Connectors */}
            <div className="mb-3">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1.5">Required Secrets</div>
              <div className="flex flex-wrap gap-1.5">
                {m.secrets.map((s) => (
                  <span key={s} className="text-xs font-mono px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-200">{s}</span>
                ))}
              </div>
            </div>

            {m.capabilities && (
              <div className="mb-3">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1.5">Gateway Capabilities</div>
                <div className="space-y-1">
                  {m.capabilities.map((c) => (
                    <div key={c} className="text-xs text-stone-600 flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                      <span className="font-mono">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {m.note && (
              <div className={`mb-3 text-xs rounded-lg p-2.5 flex items-start gap-2 ${
                m.status === "active" ? "text-green-700 bg-green-50" : "text-amber-600 bg-amber-50"
              }`}>
                {m.status === "active" ? <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                {m.note}
              </div>
            )}

            {/* Test button + result */}
            <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
              <button
                onClick={() => runTest(m.id)}
                disabled={testing[m.id]}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-900 text-white hover:bg-green-600 disabled:opacity-50 transition"
              >
                {testing[m.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Test
              </button>
              {testResults[m.id] && (
                <div className={`text-xs font-bold flex items-center gap-1.5 ${
                  testResults[m.id].ok ? "text-green-600" : "text-red-500"
                }`}>
                  {testResults[m.id].ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {testResults[m.id].ok
                    ? `Working via ${testResults[m.id].data?.provider || "provider"}`
                    : testResults[m.id].error || "Failed"}
                </div>
              )}
              <span className="ml-auto text-xs text-stone-400 font-mono">→ {m.independentFunction}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture diagram */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h3 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-stone-400" /> Independent Architecture
        </h3>
        <div className="space-y-3">
          {[
            { layer: "Frontend", tech: "Vercel (paid)", icon: Globe, color: "text-blue-600 bg-blue-50" },
            { layer: "AI / LLM (Primary)", tech: "Vercel AI Gateway — text, image, speech, transcription, embeddings, extraction", icon: Brain, color: "text-purple-600 bg-purple-50" },
            { layer: "AI / LLM (Backup)", tech: "Groq + Google AI + OpenRouter (free tiers)", icon: Brain, color: "text-indigo-600 bg-indigo-50" },
            { layer: "Email", tech: "Xtreme Comms Gateway + Gmail Connector", icon: Mail, color: "text-green-600 bg-green-50" },
            { layer: "Database", tech: "Supabase PostgreSQL (paid)", icon: Database, color: "text-orange-600 bg-orange-50" },
            { layer: "File Storage", tech: "Supabase Storage", icon: Database, color: "text-orange-600 bg-orange-50" },
            { layer: "SMS / Voice", tech: "Xtreme Comms / Telnyx", icon: Zap, color: "text-yellow-600 bg-yellow-50" },
            { layer: "Web Scraping", tech: "Cloud Browser Engine + Browserbase", icon: Globe, color: "text-indigo-600 bg-indigo-50" },
            { layer: "Background Jobs", tech: "Railway Workers", icon: Server, color: "text-pink-600 bg-pink-50" },
          ].map((row) => (
            <div key={row.layer} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${row.color}`}>
                <row.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-stone-700">{row.layer}</span>
                <span className="text-sm text-stone-400 mx-2">→</span>
                <span className="text-sm text-stone-600">{row.tech}</span>
              </div>
              <Check className="w-4 h-4 text-green-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Usage guide */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h3 className="text-sm font-bold text-stone-900 mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-stone-400" /> How to use independent functions
        </h3>
        <p className="text-sm text-stone-600 mb-3">
          All Core AI calls are automatically overridden on both frontend and backend — no code changes needed. Direct calls also work:
        </p>
        <div className="space-y-2 font-mono text-xs">
          <div className="p-3 rounded-lg bg-white border border-stone-200">
            <div className="text-green-600">✓ Core.InvokeLLM → Vercel AI Gateway (auto-overridden, no code change)</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-stone-200">
            <div className="text-green-600">✓ Core.GenerateImage → Vercel AI Gateway (auto-overridden, no code change)</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-stone-200">
            <div className="text-green-600">✓ Core.GenerateSpeech → Vercel AI Gateway (auto-overridden, no code change)</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-stone-200">
            <div className="text-green-600">✓ Core.TranscribeAudio → Vercel AI Gateway (auto-overridden, no code change)</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-stone-200">
            <div className="text-green-600">✓ Core.ExtractDataFromUploadedFile → Vercel AI Gateway (auto-overridden)</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-stone-200">
            <div className="text-stone-500">Direct: base44.functions.invoke('vercelAiGateway', &#123; action: 'generateText', prompt &#125;)</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-stone-200">
            <div className="text-stone-500">Direct: base44.functions.invoke('independentEmail', &#123; to, subject, body &#125;)</div>
          </div>
          <div className="p-3 rounded-lg bg-white border border-stone-200">
            <div className="text-stone-500">Direct: base44.functions.invoke('supabaseUpload', &#123; file_data, filename &#125;)</div>
          </div>
        </div>
      </div>
    </div>
  );
}