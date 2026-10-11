import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import HorizontalTimeline from "@/components/smai-os/HorizontalTimeline";
import EdenAvatar from "@/components/smai-os/EdenAvatar";
import { Building2, FileText, Palette, Globe, Sparkles, Loader2, CheckCircle2, Search, Image as ImageIcon, Lightbulb } from "lucide-react";

const STEPS = [
  { step_number: 1, step_key: "eden_welcome", title: "Welcome", icon: Sparkles },
  { step_number: 2, step_key: "esign_privacy", title: "Privacy", icon: FileText },
  { step_number: 3, step_key: "esign_info", title: "Info Policy", icon: FileText },
  { step_number: 4, step_key: "questionnaire", title: "Questionnaire", icon: Building2 },
  { step_number: 5, step_key: "vision", title: "Vision", icon: Palette },
  { step_number: 6, step_key: "skip_trace", title: "Skip Trace", icon: Search },
  { step_number: 7, step_key: "logo_generation", title: "101 Logos", icon: ImageIcon },
  { step_number: 8, step_key: "strategy_generation", title: "Strategies", icon: Lightbulb },
];

export default function OnboardingPortal() {
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [onboarding, setOnboarding] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [edenMessages, setEdenMessages] = useState([]);
  const [edenThinking, setEdenThinking] = useState(false);

  useEffect(() => {
    loadClient();
  }, []);

  const loadClient = async () => {
    try {
      const me = await base44.auth.me();
      const clients = await base44.entities.SmaiClient.filter({ user_id: me.id }).catch(() => ({ items: [] }));
      let clientRecord = clients.items?.[0];
      if (!clientRecord) {
        const clientId = `CLI-${Date.now()}`;
        clientRecord = await base44.entities.SmaiClient.create({
          client_id: clientId,
          user_id: me.id,
          full_name: me.full_name || me.email,
          email: me.email,
          status: "onboarding",
          onboarding_step: "eden_welcome",
        });
      }
      setClient(clientRecord);

      const onboardings = await base44.entities.SmaiOnboarding.filter({ client_id: clientRecord.client_id }).catch(() => ({ items: [] }));
      let ob = onboardings.items?.[0];
      if (!ob) {
        ob = await base44.entities.SmaiOnboarding.create({
          client_id: clientRecord.client_id,
          user_id: me.id,
          current_step: 1,
          total_steps: 8,
          steps: STEPS.map(s => ({ step_number: s.step_number, step_key: s.step_key, title: s.title, status: s.step_number === 1 ? "active" : "locked" })),
          status: "in_progress",
        });
      }
      setOnboarding(ob);
      setCurrentStep(ob.current_step || 1);

      // Eden welcome message
      setEdenMessages([{
        role: "eden",
        content: `Welcome to Strategic Minds AI, ${me.full_name || me.email}! I'm Eden Skye, your personal AI guide.\n\nI'll walk you through our approval gate process step by step. Here's what we'll do together:\n\n1. Sign your Privacy Policy agreement\n2. Sign your Information Policy agreement\n3. Complete your onboarding questionnaire\n4. Answer a few vision questions\n5. I'll run a comprehensive skip trace to understand your business\n6. We'll generate 101 logo concepts for you\n7. We'll create custom strategies for your business\n8. You'll review and approve everything\n\nReady to begin? Let's start with your Privacy Policy agreement.`,
      }]);
    } catch (e) {
      console.error("Load client error:", e);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepNumber, extraData = {}) => {
    if (!onboarding) return;
    const newSteps = onboarding.steps.map(s => {
      if (s.step_number === stepNumber) return { ...s, status: "completed", completed_at: new Date().toISOString() };
      if (s.step_number === stepNumber + 1) return { ...s, status: "active" };
      return s;
    });
    const nextStep = stepNumber + 1;
    const updated = await base44.entities.SmaiOnboarding.update(onboarding.id, {
      steps: newSteps,
      current_step: nextStep,
      ...extraData,
    });
    setOnboarding(updated);
    setCurrentStep(nextStep);
  };

  const handleEdenSend = (msg) => {
    setEdenMessages(prev => [...prev, { role: "client", content: msg, timestamp: new Date().toISOString() }]);
    setEdenThinking(true);
    setTimeout(() => {
      setEdenThinking(false);
      setEdenMessages(prev => [...prev, {
        role: "eden",
        content: "Great question! Let's continue with the onboarding process. Click the 'Continue' button below to move to the next step.",
      }]);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#03070d] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03070d] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-stone-800 bg-[#050a12]">
        <Link to="/smai/os" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00D4FF] to-[#0040CC]" />
          <span className="font-bold text-sm">Client Portal</span>
        </Link>
        <span className="text-xs text-stone-400">{client?.full_name || user?.email}</span>
      </header>

      {/* Horizontal Timeline — at the top */}
      <div className="border-b border-stone-800 bg-[#050a12] py-4 px-2">
        <HorizontalTimeline
          steps={onboarding?.steps || STEPS}
          currentStep={currentStep}
          onStepClick={(n) => {
            const step = onboarding?.steps?.find(s => s.step_number === n);
            if (step?.status !== "locked") setCurrentStep(n);
          }}
        />
      </div>

      {/* Step content */}
      <main className="flex-1 overflow-y-auto">
        {currentStep === 1 && (
          <div className="h-full">
            <EdenAvatar messages={edenMessages} onSend={handleEdenSend} thinking={edenThinking} />
            <div className="absolute bottom-20 right-4">
              <button
                onClick={() => completeStep(1, { eden_session_completed: true })}
                className="rounded-xl bg-[#00D4FF] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#00D4FF]/80 transition shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              >
                Continue to Privacy Policy →
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <ESignStep
            title="Privacy Policy Agreement"
            type="privacy"
            onboarding={onboarding}
            onComplete={(sig) => completeStep(2, { esign_privacy_signed: true, esign_privacy_signature: sig, esign_privacy_signed_at: new Date().toISOString() })}
          />
        )}

        {currentStep === 3 && (
          <ESignStep
            title="Information Policy Agreement"
            type="info"
            onboarding={onboarding}
            onComplete={(sig) => completeStep(3, { esign_info_signed: true, esign_info_signature: sig, esign_info_signed_at: new Date().toISOString() })}
          />
        )}

        {currentStep === 4 && (
          <QuestionnaireStep client={client} onboarding={onboarding} onComplete={(answers) => completeStep(4, { questionnaire_answers: answers })} />
        )}

        {currentStep === 5 && (
          <VisionStep onboarding={onboarding} onComplete={(answers) => completeStep(5, { vision_answers: answers })} />
        )}

        {currentStep === 6 && (
          <SkipTraceStep client={client} onComplete={(data) => completeStep(6, { skip_trace_data: data })} />
        )}

        {currentStep === 7 && (
          <LogoGenerationStep client={client} onComplete={() => completeStep(7, {})} />
        )}

        {currentStep === 8 && (
          <StrategyStep client={client} onComplete={() => completeStep(8, {})} />
        )}

        {currentStep > 8 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Onboarding Complete!</h2>
            <p className="text-stone-400 mb-6">Your 101 logos and strategies are ready for review.</p>
            <Link to="/smai/os" className="rounded-xl bg-[#00D4FF] px-6 py-2.5 text-sm font-bold text-black hover:bg-[#00D4FF]/80 transition">
              Go to Operating System →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── E-Signature Step ──────────────────────────────────────────────
function ESignStep({ title, type, onboarding, onComplete }) {
  const [signed, setSigned] = useState(type === "privacy" ? onboarding?.esign_privacy_signed : onboarding?.esign_info_signed);
  const [signature, setSignature] = useState("");
  const [drawing, setDrawing] = useState(false);
  const canvasRef = React.useRef(null);

  const PRIVACY_TEXT = `By signing this Privacy Policy Agreement, you acknowledge that Strategic Minds AI will:
1. Collect and process your personal and business information for the purpose of providing AI-powered digital dominance services.
2. Conduct comprehensive research (skip trace) on your business, social media, and public information to better understand your needs.
3. Use AI to generate logos, strategies, and marketing materials tailored to your business.
4. Store your data securely and never sell it to third parties.
5. Provide you with access to your data and the ability to request deletion at any time.

This agreement is valid for the duration of your engagement with Strategic Minds AI.`;

  const INFO_TEXT = `By signing this Information Policy Agreement, you acknowledge that:
1. All information you provide will be used to train and optimize AI models for your specific business needs.
2. Generated logos, strategies, and content are owned by you upon full payment.
3. Strategic Minds AI may use anonymized, aggregated data for system improvement.
4. You are responsible for the accuracy of all information you provide.
5. Any AI-generated content should be reviewed by you before public deployment.
6. Strategic Minds AI is not liable for business outcomes resulting from the use of generated materials.

This agreement is valid for the duration of your engagement with Strategic Minds AI.`;

  const text = type === "privacy" ? PRIVACY_TEXT : INFO_TEXT;

  const handleSign = () => {
    if (!signature.trim()) return;
    onComplete(signature);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-6 mb-6">
        <pre className="text-sm text-stone-300 whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
      </div>
      <div className="mb-4">
        <label className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2 block">Type your full name to sign</label>
        <input
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Your full legal name"
          className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 outline-none focus:border-[#00D4FF] transition"
        />
      </div>
      <button
        onClick={handleSign}
        disabled={!signature.trim() || signed}
        className="w-full rounded-xl bg-[#00D4FF] py-3 text-sm font-bold text-black disabled:opacity-40 hover:bg-[#00D4FF]/80 transition"
      >
        {signed ? "✓ Signed" : "Sign & Continue →"}
      </button>
    </div>
  );
}

// ─── Questionnaire Step ────────────────────────────────────────────
function QuestionnaireStep({ client, onboarding, onComplete }) {
  const [form, setForm] = useState({
    full_name: onboarding?.questionnaire_answers?.full_name || client?.full_name || "",
    address: onboarding?.questionnaire_answers?.address || "",
    email: onboarding?.questionnaire_answers?.email || client?.email || "",
    phone: onboarding?.questionnaire_answers?.phone || client?.phone || "",
    business_name: onboarding?.questionnaire_answers?.business_name || client?.business_name || "",
    business_url: onboarding?.questionnaire_answers?.business_url || client?.business_url || "",
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const valid = form.full_name && form.address && form.email && form.phone && form.business_name;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-2">Onboarding Questionnaire</h2>
      <p className="text-sm text-stone-400 mb-6">Tell us about yourself and your business so we can tailor everything to your needs.</p>
      <div className="space-y-4">
        <Field label="Full Name" value={form.full_name} onChange={(v) => set("full_name", v)} />
        <Field label="Address" value={form.address} onChange={(v) => set("address", v)} />
        <Field label="Email Address" value={form.email} onChange={(v) => set("email", v)} type="email" />
        <Field label="Phone Number" value={form.phone} onChange={(v) => set("phone", v)} type="tel" />
        <Field label="Existing Business Name" value={form.business_name} onChange={(v) => set("business_name", v)} />
        <Field label="Business URL (if exists)" value={form.business_url} onChange={(v) => set("business_url", v)} placeholder="https://..." />
      </div>
      <button
        onClick={() => onComplete(form)}
        disabled={!valid}
        className="w-full mt-6 rounded-xl bg-[#00D4FF] py-3 text-sm font-bold text-black disabled:opacity-40 hover:bg-[#00D4FF]/80 transition"
      >
        Continue to Vision Questionnaire →
      </button>
    </div>
  );
}

// ─── Vision Questionnaire Step ─────────────────────────────────────
function VisionStep({ onboarding, onComplete }) {
  const QUESTIONS = [
    {
      q: "What is your primary goal for this engagement?",
      choices: ["Increase leads/sales", "Build a new website", "Improve online presence", "Automate marketing", "All of the above"],
    },
    {
      q: "What best describes your target audience?",
      choices: ["Local homeowners", "Commercial businesses", "National audience", "Niche/specialty market", "Other (fill in)"],
    },
    {
      q: "What is your preferred brand style?",
      choices: ["Modern & clean", "Bold & high-impact", "Classic & elegant", "Industrial & rugged", "Luxury & premium"],
    },
    {
      q: "What is your biggest current challenge?",
      choices: ["Not enough leads", "Outdated website", "No social media presence", "Poor SEO ranking", "No automation", "Other (fill in)"],
    },
    {
      q: "What is your monthly marketing budget range?",
      choices: ["Under $1,000", "$1,000-$5,000", "$5,000-$10,000", "$10,000+", "Prefer not to say"],
    },
    {
      q: "How quickly do you need results?",
      choices: ["ASAP (30 days)", "1-3 months", "3-6 months", "Long-term (6+ months)"],
    },
    {
      q: "What services are you most interested in?",
      choices: ["Website design", "SEO dominance", "Social media automation", "Logo & branding", "Complete digital dominance", "Other (fill in)"],
    },
    {
      q: "What differentiates you from competitors?",
      choices: ["Quality of work", "Price/affordability", "Speed/service", "Experience/expertise", "Unique technology", "Other (fill in)"],
    },
    {
      q: "What is your ideal customer relationship?",
      choices: ["One-time project", "Ongoing monthly service", "Annual contract", "Referral-based", "Other (fill in)"],
    },
    {
      q: "Anything else you want Eden Skye to know?",
      choices: ["No, that covers it", "I'll add details below"],
    },
  ];

  const [answers, setAnswers] = useState(onboarding?.vision_answers || QUESTIONS.map((q, i) => ({ question: q.q, answer: "", custom_fill: "" })));

  const setAnswer = (i, field, val) => {
    setAnswers(prev => prev.map((a, j) => j === i ? { ...a, [field]: val } : a));
  };

  const valid = answers.every(a => a.answer);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-2">Vision Questionnaire</h2>
      <p className="text-sm text-stone-400 mb-6">10 quick questions to help our AI understand your vision. Choose an option or fill in your own answer.</p>
      <div className="space-y-6">
        {QUESTIONS.map((q, i) => (
          <div key={i} className="rounded-xl border border-stone-800 bg-stone-900/50 p-4">
            <p className="text-sm font-semibold text-white mb-3">{i + 1}. {q.q}</p>
            <div className="space-y-2">
              {q.choices.map((c, j) => (
                <button
                  key={j}
                  onClick={() => setAnswer(i, "answer", c)}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${
                    answers[i]?.answer === c
                      ? "border-[#00D4FF] bg-[#00D4FF]/10 text-[#00D4FF]"
                      : "border-stone-700 text-stone-300 hover:border-stone-600"
                  }`}
                >
                  {c}
                </button>
              ))}
              {answers[i]?.answer?.includes("Other") && (
                <input
                  value={answers[i]?.custom_fill || ""}
                  onChange={(e) => setAnswer(i, "custom_fill", e.target.value)}
                  placeholder="Fill in your own answer..."
                  className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-white placeholder-stone-500 outline-none focus:border-[#00D4FF]"
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onComplete(answers)}
        disabled={!valid}
        className="w-full mt-6 rounded-xl bg-[#00D4FF] py-3 text-sm font-bold text-black disabled:opacity-40 hover:bg-[#00D4FF]/80 transition"
      >
        Continue to Skip Trace →
      </button>
    </div>
  );
}

// ─── Skip Trace Step ───────────────────────────────────────────────
function SkipTraceStep({ client, onComplete }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runTrace = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await base44.functions.invoke("smaiSkipTrace", {
        client_id: client?.client_id,
        full_name: client?.full_name,
        business_name: client?.business_name,
        business_url: client?.business_url,
        email: client?.email,
        phone: client?.phone,
        address: client?.address,
      });
      setResult(res.data?.result);
    } catch (e) {
      setError(e.message || "Skip trace failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-2">Skip Trace Research</h2>
      <p className="text-sm text-stone-400 mb-6">Our AI will comprehensively research your business, social media, and public information to understand your needs and identify gaps.</p>

      {!running && !result && (
        <button onClick={runTrace} className="w-full rounded-xl bg-[#00D4FF] py-3 text-sm font-bold text-black hover:bg-[#00D4FF]/80 transition">
          Start Skip Trace Research →
        </button>
      )}

      {running && (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="h-10 w-10 text-[#00D4FF] animate-spin mb-4" />
          <p className="text-sm text-stone-400">Researching your business and online presence...</p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mb-2" />
            <p className="text-sm font-bold text-emerald-400">Skip Trace Complete</p>
          </div>
          {result.public_info_summary && (
            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">Public Information Summary</p>
              <p className="text-sm text-stone-300">{result.public_info_summary}</p>
            </div>
          )}
          {result.identified_gaps?.length > 0 && (
            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">Identified Gaps ({result.identified_gaps.length})</p>
              <ul className="space-y-1">
                {result.identified_gaps.map((g, i) => <li key={i} className="text-sm text-amber-400">• {g}</li>)}
              </ul>
            </div>
          )}
          {result.identified_problems?.length > 0 && (
            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">Identified Problems ({result.identified_problems.length})</p>
              <ul className="space-y-1">
                {result.identified_problems.map((p, i) => <li key={i} className="text-sm text-red-400">• {p}</li>)}
              </ul>
            </div>
          )}
          {result.social_profiles?.length > 0 && (
            <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">Social Profiles Found ({result.social_profiles.length})</p>
              <ul className="space-y-1">
                {result.social_profiles.map((s, i) => <li key={i} className="text-sm text-[#00D4FF]">• {s.platform}: {s.url}</li>)}
              </ul>
            </div>
          )}
          <button onClick={() => onComplete(result)} className="w-full rounded-xl bg-[#00D4FF] py-3 text-sm font-bold text-black hover:bg-[#00D4FF]/80 transition">
            Continue to Logo Generation →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Logo Generation Step ──────────────────────────────────────────
function LogoGenerationStep({ client, onComplete }) {
  const [generating, setGenerating] = useState(false);
  const [logos, setLogos] = useState([]);
  const [error, setError] = useState("");

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("smaiGenerate101Logos", {
        client_id: client?.client_id,
        business_name: client?.business_name,
        industry: client?.industry,
        batch_size: 12,
      });
      setLogos(res.data?.results?.filter(r => !r.error) || []);
    } catch (e) {
      setError(e.message || "Logo generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-2">101 Logo Concepts</h2>
      <p className="text-sm text-stone-400 mb-6">Our AI will generate 101 unique logo concepts for your business. We'll start with a batch of 12 and generate more as you review.</p>

      {!generating && logos.length === 0 && (
        <button onClick={generate} className="w-full rounded-xl bg-[#00D4FF] py-3 text-sm font-bold text-black hover:bg-[#00D4FF]/80 transition">
          Generate First Batch of Logos →
        </button>
      )}

      {generating && (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="h-10 w-10 text-[#00D4FF] animate-spin mb-4" />
          <p className="text-sm text-stone-400">Generating 12 logo concepts...</p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {logos.length > 0 && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {logos.map((logo, i) => (
              <div key={i} className="rounded-xl border border-stone-800 bg-stone-900/50 p-3">
                {logo.image_url ? (
                  <img src={logo.image_url} alt={`Logo ${logo.concept_number}`} className="w-full h-32 object-contain rounded-lg mb-2" />
                ) : (
                  <div className="w-full h-32 rounded-lg bg-stone-800 flex items-center justify-center mb-2">
                    <ImageIcon className="h-8 w-8 text-stone-600" />
                  </div>
                )}
                <p className="text-[10px] font-bold text-[#00D4FF]">#{logo.concept_number} — {logo.style}</p>
                <p className="text-[10px] text-stone-500">{logo.color_scheme}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={generate} className="flex-1 rounded-xl border border-stone-700 py-3 text-sm font-bold text-stone-300 hover:border-[#00D4FF] transition">
              Generate More
            </button>
            <button onClick={onComplete} className="flex-1 rounded-xl bg-[#00D4FF] py-3 text-sm font-bold text-black hover:bg-[#00D4FF]/80 transition">
              Continue to Strategies →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Strategy Generation Step ──────────────────────────────────────
function StrategyStep({ client, onComplete }) {
  const [generating, setGenerating] = useState(false);
  const [strategies, setStrategies] = useState([]);
  const [error, setError] = useState("");

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("smaiGenerateStrategies", {
        client_id: client?.client_id,
        business_name: client?.business_name,
        industry: client?.industry,
      });
      setStrategies(res.data?.strategies || []);
    } catch (e) {
      setError(e.message || "Strategy generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-2">Proposed Strategies</h2>
      <p className="text-sm text-stone-400 mb-6">Our AI will generate comprehensive business, system, and website strategies tailored to your business based on your questionnaire and skip trace data.</p>

      {!generating && strategies.length === 0 && (
        <button onClick={generate} className="w-full rounded-xl bg-[#00D4FF] py-3 text-sm font-bold text-black hover:bg-[#00D4FF]/80 transition">
          Generate Strategies →
        </button>
      )}

      {generating && (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="h-10 w-10 text-[#00D4FF] animate-spin mb-4" />
          <p className="text-sm text-stone-400">Generating custom strategies...</p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {strategies.length > 0 && (
        <div>
          <div className="space-y-3 mb-6">
            {strategies.map((s, i) => (
              <div key={i} className="rounded-xl border border-stone-800 bg-stone-900/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-[#00D4FF]/20 border border-[#00D4FF]/30 px-2 py-0.5 text-[10px] font-bold uppercase text-[#00D4FF]">{s.category}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    s.priority === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                    s.priority === "high" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    "bg-stone-700/40 text-stone-400 border border-stone-600"
                  }`}>{s.priority}</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
                <p className="text-xs text-stone-400 mb-2">{s.description}</p>
                {s.estimated_impact && <p className="text-xs text-emerald-400 font-semibold">Impact: {s.estimated_impact}</p>}
              </div>
            ))}
          </div>
          <button onClick={onComplete} className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-black hover:bg-emerald-400 transition">
            ✓ Complete Onboarding
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 outline-none focus:border-[#00D4FF] transition"
      />
    </div>
  );
}