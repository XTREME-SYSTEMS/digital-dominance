import React, { useState } from 'react';
import { invokeLLM } from '@/lib/gateway';
import { Sparkles, Loader2, Star } from 'lucide-react';

// ── 20 Vision Prompts for the Vision Studio ──
const VISION_PROMPTS = [
  {
    label: 'Emergency Services Empire',
    icon: '🚨',
    prompt: 'Build a system that creates websites for emergency service businesses (plumbers, electricians, HVAC, roofers) across the country, ranks them on Google for emergency keywords, generates leads 24/7, and operates everything automatically with AI agents handling SEO, content, lead qualification, and dispatch.',
  },
  {
    label: 'Healthcare Lead Machine',
    icon: '🏥',
    prompt: 'Create an autonomous healthcare lead generation system that builds SEO-optimized sites for medical practices (dentists, dermatologists, med spas, urgent care), captures patient inquiries, qualifies them with AI, and books appointments directly into practice calendars — scaling to 100+ cities nationwide.',
  },
  {
    label: 'Home Services Dominator',
    icon: '🏠',
    prompt: 'Build a platform that dominates local home service niches (cleaning, landscaping, pest control, pool service) by auto-generating city-specific landing pages, managing reviews, running local SEO, and routing leads to contractors with an AI dispatch agent that handles scheduling and follow-up.',
  },
  {
    label: 'Legal Intake Engine',
    icon: '⚖️',
    prompt: 'Create an AI-powered legal lead intake system for personal injury, family law, and immigration attorneys — generating case-type-specific landing pages, qualifying leads with intake bots, and connecting qualified prospects to attorneys in real-time with automated case evaluation reports.',
  },
  {
    label: 'Real Estate Wholesaler',
    icon: '🏘️',
    prompt: 'Build an autonomous real estate wholesaling system that scans MLS, foreclosures, and off-market properties nationwide, identifies undervalued deals with AI analysis, generates skip-traced seller lists, and auto-sends personalized outreach via SMS, email, and voice agents.',
  },
  {
    label: 'Auto Dealer Lead Gen',
    icon: '🚗',
    prompt: 'Create a system that generates exclusive leads for car dealerships by building city-specific inventory pages, running dynamic ad campaigns, qualifying buyers with AI chatbots, and scheduling test drives — operating across 50+ dealerships with centralized AI management.',
  },
  {
    label: 'Fitness Studio Builder',
    icon: '💪',
    prompt: 'Build a platform that launches fitness studio websites (yoga, pilates, crossfit, martial arts) with class scheduling, member portals, automated trial-signup funnels, and AI agents that handle member onboarding, retention campaigns, and review generation.',
  },
  {
    label: 'Restaurant Growth System',
    icon: '🍽️',
    prompt: 'Create an AI system for restaurants that builds SEO-optimized menus, manages online ordering, runs reputation management (auto-responding to reviews), launches reservation funnels, and executes loyalty programs — scaling to franchise operations with centralized AI control.',
  },
  {
    label: 'Insurance Quote Engine',
    icon: '🛡️',
    prompt: 'Build an autonomous insurance lead engine that creates niche sites for auto, home, life, and business insurance, captures quote requests, qualifies them with AI underwriting bots, and routes hot leads to licensed agents with full compliance tracking and automated follow-up.',
  },
  {
    label: 'Solar Installer Network',
    icon: '☀️',
    prompt: 'Create a nationwide solar installation lead generation system that builds city-specific solar savings calculators, qualifies homeowners with AI, schedules site assessments, and manages the full pipeline from lead to install with autonomous follow-up and document collection.',
  },
  {
    label: 'Med Spa Marketing AI',
    icon: '💉',
    prompt: 'Build a med spa growth platform that generates before/after galleries, runs treatment-specific SEO campaigns, manages patient reviews, books consultations with AI scheduling, and automates rebooking campaigns — operating across a franchise of med spa locations.',
  },
  {
    label: 'Roofing Storm Chaser',
    icon: '🌪️',
    prompt: 'Create an AI system that monitors weather data for storm events, auto-deploys city-specific roofing landing pages in affected areas, captures emergency repair leads, and dispatches them to roofing crews with automated insurance claim assistance and photo documentation.',
  },
  {
    label: 'HVAC Subscription SaaS',
    icon: '❄️',
    prompt: 'Build a platform that helps HVAC companies sell maintenance subscriptions — generating city-specific SEO pages, capturing leads with AI chatbots, scheduling tune-ups, and managing recurring billing with automated renewal campaigns and service reminders.',
  },
  {
    label: 'Dental Patient Magnet',
    icon: '🦷',
    prompt: 'Create a dental practice growth system that builds treatment-specific landing pages (implants, invisalign, cosmetic), manages patient reviews, runs reactivation campaigns for inactive patients, and books new patient exams with AI scheduling — scaling to DSO groups.',
  },
  {
    label: 'Contractor Bid Network',
    icon: '🔨',
    prompt: 'Build a system that connects homeowners with general contractors — auto-generating project-specific bid pages, qualifying homeowners with AI intake, distributing leads to vetted contractors, and managing the bid process with automated proposals and contract generation.',
  },
  {
    label: 'Pet Services Platform',
    icon: '🐾',
    prompt: 'Create a platform for pet service businesses (grooming, boarding, training, vet) that builds city-specific sites, manages bookings, runs vaccination reminders, and executes client retention campaigns with AI agents handling scheduling, follow-up, and review collection.',
  },
  {
    label: 'Event Venue Booking AI',
    icon: '🎉',
    prompt: 'Build a system for event venues that generates SEO-optimized venue pages, manages availability calendars, qualifies inquiries with AI chatbots, sends automated proposals, and collects deposits — operating across a network of wedding and corporate venues.',
  },
  {
    label: 'Moving Company Lead Gen',
    icon: '📦',
    prompt: 'Create an autonomous moving company lead system that builds city-specific moving cost calculators, captures quote requests, qualifies them with AI based on move size and distance, and dispatches leads to local movers with automated scheduling and follow-up.',
  },
  {
    label: 'Senior Care Connector',
    icon: '👴',
    prompt: 'Build a senior living and home care lead generation platform that creates care-type-specific landing pages (assisted living, memory care, in-home care), qualifies families with AI intake bots, matches them to vetted providers, and manages placement with automated follow-up.',
  },
  {
    label: 'Franchise Growth Engine',
    icon: '🔄',
    prompt: 'Create a franchise development system that builds franchise opportunity pages, qualifies prospective franchisees with AI interviews, manages disclosure document delivery, and tracks candidates through the full sales pipeline with automated nurturing campaigns and scheduling.',
  },
];

export default function VisionPrompts({ onPromptSelect }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAiAssist = async () => {
    setAiLoading(true);
    setError('');
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
        onPromptSelect(generated);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Unable to generate a vision right now.');
    }
    setAiLoading(false);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-stone-700 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Vision Prompts — 20 Strategies
        </h3>
        <button
          onClick={handleAiAssist}
          disabled={aiLoading}
          title="AI Vision Prompt Generator"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4 fill-white" />}
          {aiLoading ? 'Generating...' : 'AI Assist'}
        </button>
      </div>
      <p className="text-xs text-stone-400 mb-4">
        Click any strategy to load it into the vision box, or use AI Assist to generate a custom vision.
      </p>
      {error && <p role="alert" className="text-xs text-red-600 mb-4">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {VISION_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => onPromptSelect(p.prompt)}
            title={p.prompt}
            className="flex flex-col items-center gap-1 rounded-xl border border-stone-200 bg-white p-3 text-center hover:border-amber-500 hover:bg-amber-50 transition group"
          >
            <span className="text-2xl">{p.icon}</span>
            <span className="text-[11px] font-bold text-stone-700 group-hover:text-amber-700 leading-tight">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}