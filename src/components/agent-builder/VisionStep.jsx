import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { invokeLLM } from '@/lib/gateway';
import { Sparkles, Loader2, Star, History, Trash2, X } from 'lucide-react';

// ── 10 Vision Prompts researched from top entrepreneur/wealth-builder topics ──
const VISION_PROMPTS = [
  {
    label: 'Market Gap Scanner',
    icon: '🔍',
    prompt: 'Build an AI-powered market gap scanner that continuously analyzes emerging industries, identifies underserved niches with high demand and low competition, and automatically generates business plans with go-to-market strategies for each opportunity found.',
  },
  {
    label: 'Trend Forecasting',
    icon: '📈',
    prompt: 'Create an autonomous trend forecasting system that aggregates signals from social media, search trends, patent filings, and venture capital flows to predict the next big opportunities 6-12 months before they peak — giving me a first-mover advantage in every market.',
  },
  {
    label: 'Wealth Multiplier',
    icon: '💰',
    prompt: 'Design a wealth multiplication engine that uses AI agents to identify undervalued assets across real estate, stocks, crypto, and businesses, then automatically executes diversified investment strategies with risk management and portfolio rebalancing.',
  },
  {
    label: 'Competitor Intelligence',
    icon: '🎯',
    prompt: 'Build a self-evolving competitive intelligence network that monitors every move of my top 5 competitors in real-time, predicts their next actions using game theory, and recommends counter-strategies to maintain market dominance.',
  },
  {
    label: 'Lead Gen Machine',
    icon: '🚀',
    prompt: 'Create an autonomous lead generation machine that identifies ideal prospects across any industry, qualifies them through multi-channel outreach (email, SMS, social, voice), and nurtures them to conversion with zero human intervention.',
  },
  {
    label: 'Content Empire',
    icon: '📝',
    prompt: 'Design an AI content factory that produces SEO-optimized articles, viral videos, and social posts at scale for any niche, with agents that research, write, design, publish, and analyze performance automatically — generating organic traffic on autopilot.',
  },
  {
    label: 'Process Automator',
    icon: '⚙️',
    prompt: 'Build a business process automation system that maps my entire operation, identifies every repetitive task, and deploys specialized AI agents to handle each one — reducing operating costs by 80% while scaling output 10x.',
  },
  {
    label: 'Retention Engine',
    icon: '🛡️',
    prompt: 'Create a customer retention engine that predicts churn before it happens, identifies the root cause for each at-risk customer, and automatically launches personalized multi-touch retention campaigns across email, SMS, and phone.',
  },
  {
    label: 'Pricing Optimizer',
    icon: '⚡',
    prompt: 'Design an autonomous pricing optimization agent that monitors market conditions, competitor pricing, demand elasticity, and inventory levels in real-time to maximize revenue and profit margins across all products and services.',
  },
  {
    label: 'Scale Predictor',
    icon: '🔮',
    prompt: 'Build a scalability prediction system that analyzes any business model and identifies exactly which processes can be automated by AI agents, projecting the deterministic path from current revenue to 10x scale with an execution roadmap.',
  },
  {
    label: 'Niche Discovery',
    icon: '🔬',
    prompt: 'Create an AI niche discovery engine that scans thousands of micro-niches daily, identifies ones with high search volume and low competition, and automatically builds profit-pulling landing pages and lead funnels for each one.',
  },
  {
    label: 'SaaS Factory',
    icon: '🏭',
    prompt: 'Build an autonomous SaaS factory that identifies software gaps in any industry, generates the full application with AI agents, deploys it, and launches marketing — creating a new revenue-generating SaaS product every week.',
  },
  {
    label: 'Real Estate Finder',
    icon: '🏠',
    prompt: 'Design an AI real estate deal finder that scans MLS, foreclosure listings, and off-market properties nationwide, identifies undervalued opportunities with 20%+ equity spread, and automatically analyzes cash flow and ROI for each.',
  },
  {
    label: 'Social Dominator',
    icon: '📱',
    prompt: 'Build an autonomous social media growth engine that creates viral content, posts across all platforms, engages with followers, and grows audiences organically — turning followers into customers with AI-driven conversion funnels.',
  },
  {
    label: 'SEO Autopilot',
    icon: '🌐',
    prompt: 'Create a self-optimizing SEO system that researches keywords, writes content, builds backlinks, and ranks pages automatically — dominating Google search results for any niche with zero human intervention.',
  },
  {
    label: 'Crypto Trading',
    icon: '₿',
    prompt: 'Design an autonomous crypto trading system with AI agents that analyze on-chain data, social sentiment, and market patterns to execute profitable trades 24/7 with built-in risk management and portfolio rebalancing.',
  },
  {
    label: 'Franchise Cloner',
    icon: '📋',
    prompt: 'Build a business cloning system that analyzes any successful business model, extracts its core processes, and creates a franchise-ready playbook with AI agents that replicate the model in new markets automatically.',
  },
  {
    label: 'Influencer Matcher',
    icon: '⭐',
    prompt: 'Create an AI-powered influencer marketing platform that matches brands with micro-influencers based on audience demographics and engagement, automatically negotiates deals, and tracks ROI for every campaign.',
  },
  {
    label: 'Review Engine',
    icon: '💬',
    prompt: 'Build an autonomous reputation management system that collects reviews from happy customers, responds to negative feedback, monitors all review platforms, and generates a steady stream of 5-star reviews for any business.',
  },
  {
    label: 'Appointment Setter',
    icon: '📅',
    prompt: 'Design an AI appointment setting system that engages inbound leads instantly via SMS, email, and voice, qualifies them, and books them directly onto your calendar — capturing every opportunity before competitors respond.',
  },
  {
    label: 'Voice Sales Agent',
    icon: '🎙️',
    prompt: 'Build an autonomous AI voice agent that makes outbound sales calls, handles objections, qualifies prospects, and books appointments — operating 24/7 with natural conversation that prospects can\'t distinguish from a human.',
  },
  {
    label: 'Data Scraper',
    icon: '📊',
    prompt: 'Create a public data scraping empire with AI agents that collect, clean, and monetize data across industries — selling datasets, generating reports, and building lead lists for any niche market.',
  },
  {
    label: 'Subscription Builder',
    icon: '🔄',
    prompt: 'Build a system that identifies recurring-revenue opportunities in any market, creates the subscription product, sets up billing, and launches customer acquisition funnels — generating passive monthly income on autopilot.',
  },
  {
    label: 'Local Biz Dominator',
    icon: '📍',
    prompt: 'Create an AI system that helps local businesses dominate their area — automatically managing their Google Business Profile, collecting reviews, running local SEO, and generating leads from nearby customers searching for their services.',
  },
];

const HISTORY_KEY = 'agent-builder-vision-history';
const MAX_HISTORY = 10;

export default function VisionStep({ vision, setVision, onAnalyze, analyzing }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      setHistory(stored);
    } catch {
      setHistory([]);
    }
  }, []);

  const saveToHistory = (text) => {
    if (!text.trim() || text.length < 20) return;
    const entry = { text: text.trim(), date: new Date().toISOString() };
    const filtered = history.filter((h) => h.text !== entry.text);
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleAiAssist = async () => {
    setAiLoading(true);
    try {
      const res = await invokeLLM({
        prompt: `You are a visionary business architect. Generate ONE powerful, specific vision statement (2-4 sentences) for an autonomous AI agent system that a business owner or entrepreneur could build. 

The system can create: AI tools, mobile apps, lead generation funnels, content factories, prediction engines, crypto creators, agent swarms, SEO dominators, and autonomous workflows — all powered by deterministic, infinitely capable AI agents.

The vision should be ambitious, specific, and actionable — describing a real system that solves a real problem and creates wealth. Focus on a DIFFERENT niche or angle than typical SaaS — think about underserved markets, emerging trends, or wealth multiplication.

Output ONLY the vision statement text, no preamble or explanation.`,
        response_json_schema: {
          type: 'object',
          properties: {
            vision: { type: 'string' },
          },
        },
      });
      const generated = res.vision || res.text || '';
      if (generated) {
        setVision(generated);
        saveToHistory(generated);
      }
    } catch (e) {
      // Fallback: pick a random prompt
      const random = VISION_PROMPTS[Math.floor(Math.random() * VISION_PROMPTS.length)];
      setVision(random.prompt);
    }
    setAiLoading(false);
  };

  const handlePromptClick = (promptText) => {
    setVision(promptText);
    saveToHistory(promptText);
  };

  const handleAnalyzeWithHistory = () => {
    saveToHistory(vision);
    onAnalyze();
  };

  const loadFromHistory = (text) => {
    setVision(text);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return (
    <div className="p-6">
      {/* Textarea with AI assist star button */}
      <div className="relative">
        <textarea
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          placeholder="e.g. Build X1 AI Hub — a platform where users connect their ChatGPT, Claude, and Gemini accounts to access AI tools, workflows, a prediction system, no-code crypto creator, and autonomous agent swarms..."
          className="w-full h-36 rounded-xl border border-stone-200 p-4 pr-14 text-sm text-stone-800 focus:border-amber-500 outline-none resize-none"
          maxLength={2000}
        />
        {/* AI Assist Star Button */}
        <button
          onClick={handleAiAssist}
          disabled={aiLoading}
          title="AI Vision Prompt Generator"
          className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg flex items-center justify-center hover:scale-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {aiLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5 fill-white" />}
        </button>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">{vision.length}/2000</span>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-amber-600 transition"
          >
            <History className="h-3.5 w-3.5" />
            History ({history.length})
          </button>
        </div>
        <button
          onClick={handleAnalyzeWithHistory}
          disabled={!vision.trim() || analyzing}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600 transition disabled:opacity-50 shadow-md"
        >
          {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {analyzing ? 'Analyzing...' : 'Analyze Vision'}
        </button>
      </div>

      {/* Vision History dropdown */}
      {showHistory && (
        <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-600 uppercase">Vision History</span>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-stone-400 py-2">No saved visions yet. Analyze a vision to save it here.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {history.map((h, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-white border border-stone-200 p-2.5 hover:border-amber-400 transition cursor-pointer group" onClick={() => loadFromHistory(h.text)}>
                  <p className="text-xs text-stone-700 flex-1 line-clamp-2">{h.text}</p>
                  <span className="text-[10px] text-stone-400 shrink-0">{new Date(h.date).toLocaleDateString()}</span>
                  <X className="h-3 w-3 text-stone-300 group-hover:text-red-500 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 10 Vision Prompt Buttons */}
      <div className="mt-5">
        <p className="text-xs font-bold text-stone-500 uppercase mb-2.5">
          Vision Prompts — 25 Entrepreneur & Wealth-Building Strategies
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {VISION_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => handlePromptClick(p.prompt)}
              title={p.prompt}
              className="flex flex-col items-center gap-1 rounded-xl border border-stone-200 bg-white p-3 text-center hover:border-amber-500 hover:bg-amber-50 transition group"
            >
              <span className="text-2xl">{p.icon}</span>
              <span className="text-[11px] font-bold text-stone-700 group-hover:text-amber-700 leading-tight">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}