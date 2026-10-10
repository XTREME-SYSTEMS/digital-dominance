import React from "react";
import { Link } from "react-router-dom";
import { Eye, Target, Palette, LayoutTemplate, Share2, Rocket, Globe, Search, ScanLine, CheckCircle2, ChevronRight } from "lucide-react";

const STAGES = [
  { key: "vision", label: "Vision & Onboarding", icon: Eye, desc: "GPT asks onboarding questions, refines your concept", page: "/admin/concept-to-completion", prompt: "Start the onboarding process. Ask me the key questions about my business: am I enhancing an existing business, rebranding, or building new? What industry, location, name, phone, and address?" },
  { key: "strategy", label: "10 Strategies", icon: Target, desc: "GPT generates 10 strategies, you pick one", page: "/admin/concept-to-completion", prompt: "Generate 10 distinct business strategies for my concept. Include business names, domain suggestions, target cities, monetization models, and recommended agents. I'll pick one." },
  { key: "research", label: "Competitor & Industry Research", icon: Search, desc: "Skip trace + competitor scan + top 5 benchmark", page: "/admin/competitors", prompt: "Research the top 5 existing competitors in my industry and location. Skip trace their business data, scan their websites, and benchmark their strategies. Use this as our baseline." },
  { key: "template", label: "Industry Template Match", icon: LayoutTemplate, desc: "Match from 20 top industry templates", page: "/admin/template-studio", prompt: "Match my business to the best industry template from the 20 top industries library. Show me the homepage sections, page types, and conversion elements." },
  { key: "branding", label: "Logo + Brand Pack", icon: Palette, desc: "10 logos → pick → brand pack", page: "/admin/rebrand-studio", prompt: "Generate 10 logo options with transparent backgrounds for my business. After I approve one, create a complete brand pack: colors, fonts, tagline, and domain suggestion." },
  { key: "websites", label: "10 Website Packs", icon: LayoutTemplate, desc: "10 layouts, light/dark, mobile/desktop PWA", page: "/admin/site-builder", prompt: "Generate 10 website layout variations using my approved logo, brand pack, and onboarding answers. Include light mode, dark mode, desktop and mobile PWA views. Let me regenerate or enhance any option." },
  { key: "social", label: "20-Day Social + Video", icon: Share2, desc: "20-day calendar, 10 viral videos, images, hashtags", page: "/admin/social-studio", prompt: "Generate a 20-day social media content calendar with video generation, image generation, hashtag generation, and full post generation specific to my business content. Also generate 10 viral scroll-stopping videos." },
  { key: "assets", label: "Digital Cards & Brochures", icon: CheckCircle2, desc: "Business cards, brochures, packaged for download", page: "/admin/rebrand-studio", prompt: "Generate digital business cards and digital brochures. Package all digital assets (logo, brand pack, websites, social, videos, cards, brochures) for download and share via email and text message." },
  { key: "provision", label: "Provision & Deploy", icon: Rocket, desc: "Vercel + Supabase + Railway + GitHub + GoDaddy", page: "/admin/concept-to-completion", prompt: "Provision and deploy my website: push to Vercel production, set up Supabase backend, deploy Railway workers if needed, create or connect GitHub repo, and purchase a URL through GoDaddy with my approval." },
  { key: "google", label: "Google Sync & Compliance", icon: Globe, desc: "Search Console, Analytics, sitemap, full compliance", page: "/admin/google", prompt: "Sync my website with Google Search Console and Google Analytics. Upload the sitemap, meet all Google requirements for compliance, and verify everything is tracked." },
  { key: "dominance", label: "Digital Dominance", icon: ScanLine, desc: "Unlimited programmatic sites by state/city", page: "/admin/dominance-pipeline", prompt: "Launch a digital dominance campaign. Ask me how many websites I want, which states and cities to target. Generate unlimited programmatic websites according to Google standards, deploy each, and sync to Google." },
  { key: "validate", label: "Validate & Harden", icon: CheckCircle2, desc: "Independent validator checks and fixes all gaps", page: "/admin/system-audit", prompt: "Run a full system audit and validation. Check every website for Google compliance, SEO, AEO, GEO. Fix any gaps found. Harden the entire system and confirm all sites are operational." },
];

export default function PipelineStages({ onQuickAction }) {
  return (
    <div className="p-4 space-y-2">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-stone-900">Pipeline Stages</h3>
        <p className="text-[11px] text-stone-500">Click any stage to send it to GPT, or visit the full page</p>
      </div>
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={s.key} className="group rounded-xl border border-stone-200 bg-white hover:border-amber-300 transition">
            <div className="flex items-start gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-500 group-hover:bg-amber-100 group-hover:text-amber-600 shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400">{i + 1}</span>
                  <h4 className="text-sm font-bold text-stone-900">{s.label}</h4>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">{s.desc}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => onQuickAction(s.prompt)} className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-stone-900 hover:bg-amber-400 transition">
                    Send to GPT <ChevronRight className="h-3 w-3" />
                  </button>
                  <Link to={s.page} className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-[10px] font-medium text-stone-600 hover:border-stone-300">
                    Open page
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}