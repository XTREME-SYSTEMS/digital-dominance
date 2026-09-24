import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, Eye, Compass, Rocket, CheckCircle2, XCircle, ArrowRight,
  Loader2, RefreshCw, AlertCircle, Globe, Building2, MapPin, DollarSign,
  Clock, TrendingUp, Zap, Crown, Bot, Network, Shield, Brain,
  Check, ChevronDown, ChevronUp, Wand2, Target, Lightbulb,
} from 'lucide-react';
import VisionPrompts from '@/components/vision-studio/VisionPrompts';

const DIFFICULTY_COLORS = {
  low: 'bg-green-100 text-green-700 border-green-300',
  medium: 'bg-amber-100 text-amber-700 border-amber-300',
  high: 'bg-red-100 text-red-700 border-red-300',
};

export default function VisionStudio() {
  const [step, setStep] = useState(1); // 1=vision, 2=strategies, 3=generate, 4=launch
  const [rawIdea, setRawIdea] = useState('');
  const [feedback, setFeedback] = useState('');
  const [assisting, setAssisting] = useState(false);
  const [visionResult, setVisionResult] = useState(null);
  const [visionApproved, setVisionApproved] = useState(false);

  const [generatingStrategies, setGeneratingStrategies] = useState(false);
  const [strategies, setStrategies] = useState([]);
  const [strategyAngle, setStrategyAngle] = useState('');
  const [excludeNames, setExcludeNames] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [expandedStrategy, setExpandedStrategy] = useState(null);

  const [generatingAgents, setGeneratingAgents] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState(null);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  // ── Step 1: AI-Assisted Vision ──────────────────────────────────────────
  const handleAssist = useCallback(async () => {
    if (!rawIdea.trim()) return;
    setAssisting(true);
    setError('');
    try {
      const res = await base44.functions.invoke('visionEngine', {
        action: 'assist',
        raw_idea: rawIdea.trim(),
        feedback: feedback.trim(),
      });
      const data = res.data || res;
      setVisionResult(data);
      setVisionApproved(false);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Request failed. Please try again.');
    }
    setAssisting(false);
  }, [rawIdea, feedback]);

  const handleRegenerateVision = useCallback(async () => {
    setVisionResult(null);
    setVisionApproved(false);
    setStep(1);
  }, []);

  const handleApproveVision = useCallback(() => {
    setVisionApproved(true);
    setStep(2);
  }, [visionResult]);

  // ── Step 2: Generate 10 Strategies ──────────────────────────────────────
  const handleGenerateStrategies = useCallback(async () => {
    if (!visionResult?.refined_vision) return;
    setGeneratingStrategies(true);
    setError('');
    try {
      const res = await base44.functions.invoke('visionEngine', {
        action: 'strategies',
        vision: visionResult.refined_vision,
        angle: strategyAngle.trim(),
        exclude_names: excludeNames,
      });
      const data = res.data || res;
      setStrategies(data.strategies || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Request failed. Please try again.');
    }
    setGeneratingStrategies(false);
  }, [visionResult, strategyAngle, excludeNames]);

  const handleRegenerateStrategies = useCallback(async () => {
    // Track rejected names
    const rejected = strategies.map(s => s.business_name).filter(Boolean);
    setExcludeNames(prev => [...new Set([...prev, ...rejected])]);
    setStrategies([]);
    await handleGenerateStrategies();
  }, [strategies, handleGenerateStrategies]);

  const handleSelectStrategy = useCallback((idx) => {
    setSelectedStrategy(idx);
    setStep(3);
  }, []);

  // ── Step 3: Generate Agents ─────────────────────────────────────────────
  const handleGenerateAgents = useCallback(async () => {
    if (!selectedStrategy && selectedStrategy !== 0) return;
    const strategy = strategies[selectedStrategy];
    if (!strategy) return;

    setGeneratingAgents(true);
    setError('');
    setGenResult(null);

    try {
      // First analyze the vision with the selected strategy
      const combinedVision = `${visionResult.refined_vision}\n\nSELECTED STRATEGY: ${strategy.strategy_name}\n${strategy.summary}\nNiche: ${strategy.recommended_niche}\nCities: ${strategy.target_cities?.join(', ')}`;

      const analyzeRes = await base44.functions.invoke('agentBuilderEngine', {
        action: 'analyze',
        vision: combinedVision,
      });
      const analysis = analyzeRes.data || analyzeRes;

      // Then generate the agents
      const genRes = await base44.functions.invoke('agentBuilderEngine', {
        action: 'generate',
        vision: combinedVision,
        recommended_agents: analysis.recommended_agents,
      });
      const gen = genRes.data || genRes;
      setGenResult(gen);
      setStep(4);
      queryClient.invalidateQueries({ queryKey: ['agent-personas'] });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Request failed. Please try again.');
    }
    setGeneratingAgents(false);
  }, [selectedStrategy, strategies, visionResult, queryClient]);

  // ── Step 4: Launch ───────────────────────────────────────────────────────
  const handleLaunch = useCallback(async () => {
    setLaunching(true);
    setError('');
    try {
      const res = await base44.functions.invoke('agentBuilderEngine', { action: 'launch' });
      setLaunchResult(res.data || res);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Request failed. Please try again.');
    }
    setLaunching(false);
  }, []);

  const reset = () => {
    setStep(1);
    setRawIdea('');
    setFeedback('');
    setVisionResult(null);
    setVisionApproved(false);
    setStrategies([]);
    setSelectedStrategy(null);
    setGenResult(null);
    setLaunchResult(null);
    setError('');
    setStrategyAngle('');
    setExcludeNames([]);
  };

  const selectedStrategyData = selectedStrategy !== null ? strategies[selectedStrategy] : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center pt-2">
        <h1 className="text-3xl font-black text-stone-900 flex items-center justify-center gap-3">
          <Wand2 className="h-8 w-8 text-amber-500" />
          Vision Studio
        </h1>
        <p className="text-sm text-stone-500 mt-2">
          From rough idea to autonomous empire. AI-assisted vision → 10 strategies → auto-generated agents → live system.
        </p>
      </div>

      {/* Pipeline Steps */}
      <div className="flex items-center justify-center gap-2 text-xs font-bold">
        {[
          { n: 1, label: 'Vision', icon: Eye },
          { n: 2, label: 'Strategies', icon: Compass },
          { n: 3, label: 'Agents', icon: Bot },
          { n: 4, label: 'Launch', icon: Rocket },
        ].map((s, i) => {
          const Icon = s.icon;
          const active = step === s.n;
          const done = step > s.n;
          return (
            <React.Fragment key={s.n}>
              <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 transition ${
                active ? 'border-amber-500 bg-amber-50 text-amber-700' :
                done ? 'border-green-500 bg-green-50 text-green-700' :
                'border-stone-200 bg-white text-stone-400'
              }`}>
                <Icon className="h-4 w-4" />
                {s.label}
              </div>
              {i < 3 && <ArrowRight className="h-3 w-3 text-stone-300" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: VISION GENERATOR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-bold text-stone-800 mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Describe Your Vision
            </h2>
            <p className="text-sm text-stone-500 mb-4">
              Don't worry about getting it perfect — the AI will help you articulate it. Just describe what you want to build.
            </p>
            <textarea
              value={rawIdea}
              onChange={(e) => setRawIdea(e.target.value)}
              placeholder="e.g. I want to build a system that creates websites for emergency service businesses across the country, ranks them on Google, generates leads, and operates everything automatically..."
              className="w-full h-32 rounded-xl border border-stone-200 p-4 text-sm text-stone-800 focus:border-amber-500 outline-none resize-none"
              maxLength={3000}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-stone-400">{rawIdea.length}/3000</span>
              <button
                onClick={handleAssist}
                disabled={!rawIdea.trim() || assisting}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600 transition disabled:opacity-50 shadow-md"
              >
                {assisting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {assisting ? 'Articulating Vision...' : 'AI-Assisted Vision Generator'}
              </button>
            </div>
          </div>

          {/* 20 Vision Prompt Buttons + AI Assist */}
          <VisionPrompts onPromptSelect={(text) => setRawIdea(text)} />

          {/* AI-Refined Vision Result */}
          {visionResult && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-amber-600" />
                  AI-Refined Vision
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerateVision}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-600 hover:border-amber-500 hover:text-amber-600"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                  </button>
                  <button
                    onClick={handleApproveVision}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-green-700"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve Vision
                  </button>
                </div>
              </div>

              {/* Feedback input for regeneration */}
              <div className="mb-4">
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Feedback for next generation (optional)..."
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="space-y-4">
                {/* Refined Vision */}
                <div className="rounded-xl bg-white p-4 border border-amber-200">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Refined Vision</p>
                  <p className="text-sm text-stone-800 font-medium">{visionResult.refined_vision}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-3 border border-stone-200">
                    <p className="text-xs font-bold text-stone-500 uppercase mb-1">Target Market</p>
                    <p className="text-sm text-stone-700">{visionResult.target_market}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-stone-200">
                    <p className="text-xs font-bold text-stone-500 uppercase mb-1">Scale & Scope</p>
                    <p className="text-sm text-stone-700">{visionResult.scale_scope}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-3 border border-stone-200">
                  <p className="text-xs font-bold text-stone-500 uppercase mb-1">Differentiation</p>
                  <p className="text-sm text-stone-700">{visionResult.differentiation}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-3 border border-stone-200">
                    <p className="text-xs font-bold text-stone-500 uppercase mb-2">Core Capabilities</p>
                    <ul className="space-y-1">
                      {visionResult.core_capabilities?.map((c, i) => (
                        <li key={i} className="text-xs text-stone-700 flex items-start gap-1">
                          <span className="text-amber-500 mt-0.5">▸</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-stone-200">
                    <p className="text-xs font-bold text-stone-500 uppercase mb-2">Success Metrics</p>
                    <ul className="space-y-1">
                      {visionResult.success_metrics?.map((m, i) => (
                        <li key={i} className="text-xs text-stone-700 flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">✓</span> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {visionResult.clarifying_questions?.length > 0 && (
                  <div className="rounded-xl bg-blue-50 p-3 border border-blue-200">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-2">Clarifying Questions</p>
                    <ul className="space-y-1">
                      {visionResult.clarifying_questions.map((q, i) => (
                        <li key={i} className="text-xs text-stone-700 flex items-start gap-1">
                          <span className="text-blue-500 mt-0.5">?</span> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: 10 STRATEGIES */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Approved Vision Banner */}
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-green-600 uppercase">Approved Vision</p>
              <p className="text-sm text-stone-700">{visionResult?.refined_vision}</p>
            </div>
          </div>

          {/* Generate Strategies */}
          {strategies.length === 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm text-center">
              <Target className="h-12 w-12 text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-stone-800 mb-2">Generate 10 Strategies</h2>
              <p className="text-sm text-stone-500 mb-4">
                The AI will generate 10 distinct strategies with business names, domain suggestions (with live availability checking), and recommendations.
              </p>
              <input
                type="text"
                value={strategyAngle}
                onChange={(e) => setStrategyAngle(e.target.value)}
                placeholder="Optional: strategic angle (e.g., 'focus on speed to market', 'maximize automation')"
                className="w-full max-w-md rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-700 focus:border-amber-500 outline-none mb-4"
              />
              <div>
                <button
                  onClick={handleGenerateStrategies}
                  disabled={generatingStrategies}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600 transition disabled:opacity-50 shadow-md mx-auto"
                >
                  {generatingStrategies ? <Loader2 className="h-5 w-5 animate-spin" /> : <Compass className="h-5 w-5" />}
                  {generatingStrategies ? 'Generating 10 Strategies...' : 'Generate 10 Strategies'}
                </button>
              </div>
            </div>
          )}

          {/* Strategy Cards */}
          {strategies.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-stone-800">
                  {strategies.length} Strategies Generated
                </h2>
                <button
                  onClick={handleRegenerateStrategies}
                  disabled={generatingStrategies}
                  className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-600 hover:border-amber-500 hover:text-amber-600 disabled:opacity-50"
                >
                  {generatingStrategies ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Regenerate All
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {strategies.map((s, i) => (
                  <StrategyCard
                    key={i}
                    strategy={s}
                    index={i}
                    expanded={expandedStrategy === i}
                    onToggle={() => setExpandedStrategy(expandedStrategy === i ? null : i)}
                    onSelect={() => handleSelectStrategy(i)}
                    isSelected={selectedStrategy === i}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: GENERATE AGENTS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 3 && selectedStrategyData && (
        <div className="space-y-4">
          {/* Selected Strategy Summary */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-bold text-amber-600 uppercase">Selected Strategy</p>
                <h2 className="text-xl font-black text-stone-900">{selectedStrategyData.strategy_name}</h2>
              </div>
              <button
                onClick={() => { setStep(2); setSelectedStrategy(null); }}
                className="text-xs text-stone-500 hover:text-stone-700"
              >
                ← Back to Strategies
              </button>
            </div>
            <p className="text-sm text-stone-700 mb-4">{selectedStrategyData.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white p-3 border border-stone-200">
                <p className="text-xs text-stone-400 uppercase">Business Name</p>
                <p className="text-sm font-bold text-stone-800">{selectedStrategyData.business_name}</p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-stone-200">
                <p className="text-xs text-stone-400 uppercase">Niche</p>
                <p className="text-sm font-bold text-stone-800">{selectedStrategyData.recommended_niche}</p>
              </div>
              <div className="rounded-lg bg-white p-3 border border-stone-200">
                <p className="text-xs text-stone-400 uppercase">Difficulty</p>
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[selectedStrategyData.difficulty] || DIFFICULTY_COLORS.medium}`}>
                  {selectedStrategyData.difficulty}
                </span>
              </div>
              <div className="rounded-lg bg-white p-3 border border-stone-200">
                <p className="text-xs text-stone-400 uppercase">Est. Revenue</p>
                <p className="text-sm font-bold text-stone-800">{selectedStrategyData.estimated_monthly_revenue}</p>
              </div>
            </div>
            {/* Domain availability */}
            {selectedStrategyData.domain_status?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold text-stone-500 uppercase mb-2">Domain Availability</p>
                <div className="flex flex-wrap gap-2">
                  {selectedStrategyData.domain_status.map((d, j) => (
                    <div key={j} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border ${
                      d.available ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'
                    }`}>
                      {d.available ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {d.domain}
                      {d.available && d.price && <span className="text-stone-400">(${d.price.toFixed(2)}/yr)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generate Agents Button */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm text-center">
            <Bot className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-stone-800 mb-2">Auto-Generate Agent Fleet</h2>
            <p className="text-sm text-stone-500 mb-4">
              The system will analyze your strategy and generate all the agents needed to build, operate, audit, and auto-heal the system 24/7.
            </p>
            <button
              onClick={handleGenerateAgents}
              disabled={generatingAgents}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600 transition disabled:opacity-50 shadow-md mx-auto"
            >
              {generatingAgents ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {generatingAgents ? 'Generating Agent Fleet...' : 'Generate All Agents'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 4: LAUNCH */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {step === 4 && genResult && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                {genResult.agents_created || 0} Agents Generated
              </h2>
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition disabled:opacity-50 shadow-md"
              >
                {launching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {launching ? 'Validating...' : 'Validate & Launch System'}
              </button>
            </div>

            {/* Agent Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {genResult.agents?.map((agent, i) => (
                <div key={i} className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-center">
                  <Bot className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-stone-800">{agent.name}</p>
                  <p className="text-[10px] text-stone-400">{agent.short_name}</p>
                  {agent.skipped && <p className="text-[9px] text-stone-400 mt-1">already exists</p>}
                </div>
              ))}
            </div>

            {genResult.errors?.length > 0 && (
              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-bold text-amber-700 mb-1">Partial Errors:</p>
                {genResult.errors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-600">{e}</p>
                ))}
              </div>
            )}
          </div>

          {/* Launch Result */}
          {launchResult && (
            <div className={`rounded-2xl border-2 p-6 shadow-sm ${launchResult.ready ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}`}>
              <div className="flex items-center gap-3 mb-4">
                {launchResult.ready ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-stone-800">
                    {launchResult.ready ? 'System is LIVE' : 'Validation Issues'}
                  </h3>
                  <p className="text-sm text-stone-600">{launchResult.message}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-white p-3 text-center border border-stone-200">
                  <p className="text-xl font-black text-stone-800">{launchResult.validation?.total_agents}</p>
                  <p className="text-xs text-stone-400 uppercase">Total Agents</p>
                </div>
                <div className="rounded-lg bg-white p-3 text-center border border-stone-200">
                  <p className="text-xl font-black text-green-600">{launchResult.validation?.agents_with_prompts}</p>
                  <p className="text-xs text-stone-400 uppercase">With Prompts</p>
                </div>
                <div className="rounded-lg bg-white p-3 text-center border border-stone-200">
                  <p className="text-xl font-black text-blue-600">{launchResult.validation?.agents_with_actions}</p>
                  <p className="text-xs text-stone-400 uppercase">With Actions</p>
                </div>
                <div className="rounded-lg bg-white p-3 text-center border border-stone-200">
                  <p className="text-xl font-black text-purple-600">{launchResult.validation?.agents_with_memory}</p>
                  <p className="text-xs text-stone-400 uppercase">Memory</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button onClick={reset} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 hover:border-amber-500 hover:text-amber-600 transition">
              <RefreshCw className="h-4 w-4" /> New Vision
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Strategy Card Component ────────────────────────────────────────────────
function StrategyCard({ strategy, index, expanded, onToggle, onSelect, isSelected }) {
  return (
    <div className={`rounded-2xl border-2 bg-white p-5 shadow-sm transition ${
      isSelected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-stone-200 hover:border-amber-300'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          <span className="text-xs font-black text-stone-300">#{index + 1}</span>
          <div>
            <h3 className="text-base font-black text-stone-900">{strategy.strategy_name}</h3>
            <p className="text-xs text-stone-500">{strategy.business_name}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[strategy.difficulty] || DIFFICULTY_COLORS.medium}`}>
          {strategy.difficulty}
        </span>
      </div>

      {/* Summary */}
      <p className="text-sm text-stone-600 mb-3">{strategy.summary}</p>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <DollarSign className="h-3.5 w-3.5 text-amber-500" />
          {strategy.estimated_monthly_revenue}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <Clock className="h-3.5 w-3.5 text-stone-400" />
          {strategy.time_to_market}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <MapPin className="h-3.5 w-3.5 text-stone-400" />
          {strategy.target_cities?.slice(0, 3).join(', ')}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <TrendingUp className="h-3.5 w-3.5 text-stone-400" />
          {strategy.recommended_niche}
        </div>
      </div>

      {/* Domain Availability */}
      {strategy.domain_status?.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {strategy.domain_status.map((d, j) => (
              <div key={j} className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border ${
                d.available ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'
              }`}>
                {d.available ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                {d.domain}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expand/Collapse */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 mb-2"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {expanded ? 'Less details' : 'More details'}
      </button>

      {expanded && (
        <div className="space-y-2 mb-3 pt-2 border-t border-stone-100">
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase mb-1">Differentiator</p>
            <p className="text-xs text-stone-700">{strategy.key_differentiator}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase mb-1">Monetization</p>
            <p className="text-xs text-stone-700">{strategy.monetization}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase mb-1">Why It Works</p>
            <p className="text-xs text-stone-700">{strategy.why_it_works}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase mb-1">Recommended Agents</p>
            <div className="flex flex-wrap gap-1">
              {strategy.recommended_agents?.map((a, j) => (
                <span key={j} className="text-[10px] bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-stone-600">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Select Button */}
      <button
        onClick={onSelect}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
          isSelected
            ? 'bg-amber-500 text-white'
            : 'border border-stone-300 text-stone-700 hover:border-amber-500 hover:text-amber-600'
        }`}
      >
        {isSelected ? <><Check className="h-4 w-4" /> Selected</> : <><ArrowRight className="h-4 w-4" /> Select & Generate Agents</>}
      </button>
    </div>
  );
}