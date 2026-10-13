import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, AlertTriangle, DollarSign, Trophy, Zap, Shield, Gauge } from 'lucide-react';

const GOOGLE_HAPPINESS = [
  { category: 'Core Web Vitals (2026)', items: [
    { factor: 'LCP (Largest Contentful Paint)', target: '≤ 2.5s', status: 'critical', detail: '75th percentile of real users over 28-day window. Poor: >4.0s' },
    { factor: 'INP (Interaction to Next Paint)', target: '≤ 200ms', status: 'critical', detail: 'Replaced FID in 2024. Poor: >500ms' },
    { factor: 'CLS (Cumulative Layout Shift)', target: '≤ 0.1', status: 'critical', detail: 'Every image/iframe needs explicit width+height. Poor: >0.25' },
  ]},
  { category: 'Content Quality (E-E-A-T)', items: [
    { factor: 'Experience', target: 'First-hand', status: 'high', detail: 'Author has real experience with the topic' },
    { factor: 'Expertise', target: 'Demonstrated', status: 'high', detail: 'Author credentials, bios, qualifications visible' },
    { factor: 'Authoritativeness', target: 'Established', status: 'high', detail: 'Cited by others, recognized in industry' },
    { factor: 'Trustworthiness', target: 'Transparent', status: 'high', detail: 'Clear contact, about, privacy, terms pages' },
    { factor: 'Content Depth', target: '1,400+ words', status: 'high', detail: 'Average first-page Google result is ~1,400 words' },
    { factor: 'Unique Insights', target: 'Original', status: 'high', detail: 'Google penalizes thin affiliate sites with no new value' },
    { factor: 'Fresh Content', target: 'Updated', status: 'medium', detail: 'Caffeine update favors recently updated content' },
  ]},
  { category: 'Technical SEO', items: [
    { factor: 'SSL/HTTPS', target: 'Required', status: 'critical', detail: 'Google confirmed ranking signal. Tiebreaker between equal sites' },
    { factor: 'Mobile-First Indexing', target: 'Responsive', status: 'critical', detail: 'Google indexes mobile version first' },
    { factor: 'Page Speed', target: '<2.5s LCP', status: 'critical', detail: 'Both Google and Bing use page speed as ranking factor' },
    { factor: 'XML Sitemap', target: 'Valid', status: 'high', detail: 'Helps Googlebot access and index all pages' },
    { factor: 'Structured Data (Schema)', target: 'Valid JSON-LD', status: 'high', detail: 'LocalBusiness, FAQ, Review, Product schema' },
    { factor: 'Canonical Tags', target: 'Correct', status: 'high', detail: 'Prevents duplicate content issues' },
    { factor: 'Robots.txt', target: 'Configured', status: 'high', detail: 'Controls crawler access' },
    { factor: 'Clean URL Structure', target: 'Short, keyword-rich', status: 'medium', detail: 'Short URLs have slight edge in SERPs' },
    { factor: 'Internal Linking', target: 'Logical hierarchy', status: 'medium', detail: 'More internal links = more important page signal' },
  ]},
  { category: 'On-Page Factors', items: [
    { factor: 'Title Tag (keyword first)', target: '60 chars', status: 'high', detail: 'Title tags starting with keyword perform better' },
    { factor: 'Meta Description', target: '155 chars', status: 'medium', detail: 'Not direct ranking signal but impacts CTR' },
    { factor: 'H1 Tag', target: 'One per page', status: 'high', detail: 'Secondary relevancy signal' },
    { factor: 'H2/H3 Structure', target: 'Hierarchical', status: 'medium', detail: 'Helps Google understand page structure' },
    { factor: 'Image Alt Text', target: 'Descriptive', status: 'high', detail: 'Images send relevancy signals via alt text' },
    { factor: 'Keyword in First 100 Words', target: 'Yes', status: 'medium', detail: 'Correlated with first-page rankings' },
    { factor: 'LSI Keywords', target: 'Natural', status: 'medium', detail: 'Helps Google discern meaning of ambiguous words' },
    { factor: 'Table of Contents', target: 'Linked', status: 'low', detail: 'Can result in sitelinks in SERPs' },
  ]},
  { category: 'Local SEO (for service businesses)', items: [
    { factor: 'Google Business Profile', target: 'Verified, complete', status: 'critical', detail: 'Essential for local pack rankings' },
    { factor: 'NAP Consistency', target: 'Consistent everywhere', status: 'critical', detail: 'Name, Address, Phone must match across all citations' },
    { factor: 'Local Reviews', target: '50+ reviews, 4.5+ stars', status: 'high', detail: 'Review schema + Google Business Profile reviews' },
    { factor: 'Location Pages', target: 'One per city', status: 'high', detail: 'Unique content per location, not templated duplicates' },
    { factor: 'Google Maps Embed', target: 'Yes', status: 'medium', detail: 'Embedded map with business location' },
  ]},
];

const GOOGLE_PENALTIES = [
  { penalty: 'Thin Content', severity: 'high', cause: 'Pages with little/no value, AI content published without human editing', fix: 'Ensure every page has 1,400+ words of original, helpful content with E-E-A-T signals' },
  { penalty: 'Keyword Stuffing', severity: 'high', cause: 'Unnaturally repeating keywords to manipulate rankings', fix: 'Use keywords naturally, target 1-2% density, use LSI keywords' },
  { penalty: 'Duplicate Content', severity: 'medium', cause: 'Same content across multiple pages or sites (templated location pages)', fix: 'Each page must have unique content. Use canonical tags for similar pages' },
  { penalty: 'Cloaking', severity: 'critical', cause: 'Showing different content to Googlebot vs users', fix: 'Never serve different content based on user agent' },
  { penalty: 'Hidden Text/Links', severity: 'high', cause: 'Text same color as background, hidden divs, tiny font', fix: 'All content must be visible to users' },
  { penalty: 'Link Spam', severity: 'high', cause: 'Buying links, link farms, excessive reciprocal links', fix: 'Earn links naturally. Disavow toxic backlinks' },
  { penalty: 'User-Generated Spam', severity: 'medium', cause: 'Unmoderated comments with spam links', fix: 'Moderate all user content, add nofollow to comment links' },
  { penalty: 'Slow Page Speed', severity: 'medium', cause: 'LCP >4s, INP >500ms, CLS >0.25', fix: 'Optimize images, minify CSS/JS, use CDN, server-side rendering' },
  { penalty: 'Mobile Usability Issues', severity: 'high', cause: 'Tiny text, clickable elements too close, viewport not set', fix: 'Responsive design, test on real mobile devices' },
  { penalty: 'AI Content Without Human Review', severity: 'high', cause: 'Publishing AI content as-is without editing', fix: 'Human review and enhancement of all AI-generated content' },
  { penalty: 'Doorway Pages', severity: 'high', cause: 'Multiple pages targeting same keyword with slight variations', fix: 'Consolidate into one authoritative page per topic' },
  { penalty: 'Scraped Content', severity: 'high', cause: 'Copying content from other sites without adding value', fix: 'Only publish original content with unique insights' },
];

const WEBSITE_TYPES = [
  { type: 'Business Website', included: ['5-10 pages', 'Contact form', 'About page', 'Services', 'Mobile responsive', 'SSL'], low: 500, mid: 2500, high: 10000, addons: ['Blog ($500-2000)', 'SEO package ($500-2000/mo)', 'Logo design ($200-1000)', 'Copywriting ($500-3000)'] },
  { type: 'E-commerce Store', included: ['Product catalog', 'Shopping cart', 'Payment gateway', 'Order management', 'Mobile responsive', 'SSL'], low: 2000, mid: 10000, high: 50000, addons: ['Custom design ($2000-10000)', 'ERP integration ($3000-15000)', 'Marketing automation ($500-3000/mo)', 'Product photography ($500-5000)'] },
  { type: 'Landing Page', included: ['Single page', 'Hero section', 'CTA form', 'Social proof', 'Mobile responsive'], low: 200, mid: 1000, high: 5000, addons: ['A/B testing ($200-1000)', 'Copywriting ($300-2000)', 'Video ($500-5000)', 'Heatmap analytics ($100-500/mo)'] },
  { type: 'SaaS/Web App', included: ['User auth', 'Dashboard', 'API', 'Database', 'Admin panel', 'Responsive'], low: 10000, mid: 50000, high: 250000, addons: ['Custom integrations ($5000-25000)', 'Mobile app ($15000-100000)', 'DevOps ($2000-10000/mo)', 'Security audit ($3000-15000)'] },
  { type: 'Programmatic SEO Site', included: ['Template system', 'Data-driven pages', 'Sitemap automation', 'Schema markup', 'CDN'], low: 5000, mid: 20000, high: 100000, addons: ['Content generation ($1000-5000)', 'Rank tracking ($200-1000/mo)', 'Link building ($1000-5000/mo)', 'Technical SEO audit ($2000-10000)'] },
  { type: 'Portfolio Site', included: ['Gallery', 'About', 'Contact', 'Project pages', 'Responsive'], low: 300, mid: 1500, high: 5000, addons: ['Custom CMS ($500-3000)', 'Blog ($300-1500)', 'Client portal ($1000-5000)'] },
  { type: 'Membership Site', included: ['User auth', 'Payment processing', 'Content gating', 'Member dashboard', 'Email integration'], low: 3000, mid: 15000, high: 75000, addons: ['Forum ($2000-10000)', 'Course platform ($3000-15000)', 'Community features ($2000-10000)'] },
  { type: 'Directory Site', included: ['Listing system', 'Search/filter', 'User submissions', 'Categories', 'Map integration'], low: 3000, mid: 12000, high: 50000, addons: ['Claim listing feature ($1000-5000)', 'Premium listings ($500-3000)', 'Review system ($1000-5000)'] },
  { type: 'Lead Generation Funnel', included: ['Multi-step form', 'CRM integration', 'Email automation', 'Analytics', 'A/B testing'], low: 1000, mid: 5000, high: 20000, addons: ['SMS automation ($500-2000/mo)', 'Call tracking ($100-500/mo)', 'Chatbot ($500-3000)'] },
  { type: 'AI Agent Platform', included: ['Agent orchestration', 'LLM integration', 'Tool calling', 'Memory system', 'Multi-channel'], low: 15000, mid: 75000, high: 300000, addons: ['Custom training ($5000-25000)', 'API development ($3000-15000)', 'Monitoring ($1000-5000/mo)'] },
];

const COMPETITORS = {
  top_dogs: [
    { name: 'Wix', pricing: '$17-159/mo', strength: 'Drag-and-drop ease, massive template library', weakness: 'Limited customization, no mass deployment, one site at a time' },
    { name: 'Squarespace', pricing: '$19-139/mo', strength: 'Beautiful templates, all-in-one platform', weakness: 'No code access on lower tiers, one site at a time' },
    { name: 'Shopify', pricing: '$29-2300+/mo', strength: 'E-commerce dominance, app ecosystem', weakness: 'Transaction fees, limited design control, one store at a time' },
    { name: 'WordPress', pricing: '$4-30/mo hosting', strength: 'Open source, unlimited plugins, full control', weakness: 'Maintenance burden, security issues, one site at a time' },
    { name: 'Webflow', pricing: '$14-39+/mo', strength: 'Design control, clean code output', weakness: 'Steep learning curve, no mass deployment' },
  ],
  mid_dogs: [
    { name: 'Hostinger AI Builder', pricing: '$2.99-12.99/mo', strength: 'AI-generated sites, cheap', weakness: 'Basic output, no mass deployment' },
    { name: 'Framer', pricing: '$5-30/mo', strength: 'Design-focused, animations', weakness: 'Limited CMS, one site at a time' },
    { name: 'Replit', pricing: 'Free-$25/mo', strength: 'AI coding agent, full apps', weakness: 'Requires coding knowledge, one project at a time' },
    { name: 'GoDaddy Builder', pricing: '$9.99-24.99/mo', strength: 'Domain + site bundle', weakness: 'Basic templates, limited features' },
    { name: 'Elementor (WordPress)', pricing: '$59-399/yr', strength: 'Visual WordPress builder', weakness: 'WordPress overhead, one site at a time' },
  ],
};

const LAUNCH_LIMITS = {
  sites_per_batch: 'Unlimited (orchestrated by MassLaunchBatch entity)',
  sites_per_hour: '100-500+ (limited by Vercel deployment API rate limits)',
  sites_per_day: '1,000+ (with parallel orchestration)',
  pages_per_site: 'Unlimited (programmatic SEO generates as many as needed)',
  concurrent_deployments: 'Limited by Vercel project count (100 per team on Pro plan)',
  rate_limit_note: 'Vercel API: 100 deployments/minute. GitHub: 5,000 requests/hour. GoDaddy: 60 requests/minute.',
  our_advantage: 'No competitor matches this. Programmatic SEO tools create PAGES, not full sites. AI builders create ONE site at a time. We are the only platform that mass-launches complete websites with autonomous operation.',
};

export default function GoogleHappiness() {
  const [tab, setTab] = useState('happiness');

  return (
    <div className="min-h-screen bg-[#050508] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1220] to-[#0d1a2e] p-6">
          <div className="flex items-center gap-3">
            <Search className="h-8 w-8 text-[#00a2ff]" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">Google Happiness & Market Intelligence</h1>
              <p className="text-sm text-white/60">Exactly what makes Google 100% happy, what gets you penalized, market pricing, competitors, and our launch limits</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[{id:'happiness',label:'Google Happiness',icon:CheckCircle2},{id:'penalties',label:'Penalties & Limits',icon:AlertTriangle},{id:'pricing',label:'Website Pricing',icon:DollarSign},{id:'competitors',label:'Competitors',icon:Trophy},{id:'limits',label:'Launch Limits',icon:Zap}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-[#00a2ff] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'happiness' && (
          <div className="space-y-4">
            {GOOGLE_HAPPINESS.map(cat => (
              <div key={cat.category} className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
                <h3 className="text-sm font-bold text-[#00a2ff] mb-3 flex items-center gap-2"><Gauge className="h-4 w-4" /> {cat.category}</h3>
                <div className="space-y-2">
                  {cat.items.map(item => (
                    <div key={item.factor} className="flex items-start justify-between gap-3 rounded-lg bg-white/5 p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-4 w-4 ${item.status === 'critical' ? 'text-red-400' : item.status === 'high' ? 'text-amber-400' : 'text-green-400'}`} />
                          <span className="text-sm font-semibold text-white">{item.factor}</span>
                        </div>
                        <p className="text-xs text-white/40 mt-1 ml-6">{item.detail}</p>
                      </div>
                      <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded whitespace-nowrap">{item.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'penalties' && (
          <div className="space-y-2">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 mb-4">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2"><Shield className="h-4 w-4" /> What Gets Us Penalized — Our Limits</h3>
            </div>
            {GOOGLE_PENALTIES.map(p => (
              <div key={p.penalty} className="rounded-xl border border-white/10 bg-[#0a1220] p-4 hover:border-red-400/50 transition">
                <div className="flex items-start gap-3">
                  <XCircle className={`h-4 w-4 mt-0.5 ${p.severity === 'critical' ? 'text-red-500' : p.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{p.penalty}</h3>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${p.severity === 'critical' ? 'bg-red-500/20 text-red-400' : p.severity === 'high' ? 'bg-red-400/20 text-red-300' : 'bg-amber-400/20 text-amber-300'}`}>{p.severity}</span>
                    </div>
                    <p className="text-xs text-white/50 mt-1"><span className="text-red-400">Cause:</span> {p.cause}</p>
                    <p className="text-xs text-white/50 mt-1"><span className="text-green-400">Fix:</span> {p.fix}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'pricing' && (
          <div className="space-y-3">
            {WEBSITE_TYPES.map(w => (
              <div key={w.type} className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 hover:border-green-400/50 transition">
                <h3 className="text-sm font-bold text-white mb-2">{w.type}</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-2 text-center">
                    <p className="text-[9px] uppercase text-green-400">Low</p>
                    <p className="text-sm font-black text-white">${w.low.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-center">
                    <p className="text-[9px] uppercase text-amber-400">Mid</p>
                    <p className="text-sm font-black text-white">${w.mid.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-center">
                    <p className="text-[9px] uppercase text-red-400">High</p>
                    <p className="text-sm font-black text-white">${w.high.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Traditionally Included</p>
                  <div className="flex flex-wrap gap-1">
                    {w.included.map(i => <span key={i} className="text-[10px] bg-white/5 text-white/60 px-2 py-0.5 rounded">{i}</span>)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Add-ons</p>
                  <div className="flex flex-wrap gap-1">
                    {w.addons.map(a => <span key={a} className="text-[10px] bg-[#00a2ff]/10 text-[#00a2ff] px-2 py-0.5 rounded">{a}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'competitors' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3"><Trophy className="h-4 w-4" /> Top Dogs (Market Leaders)</h3>
              <div className="space-y-2">
                {COMPETITORS.top_dogs.map(c => (
                  <div key={c.name} className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-white">{c.name}</h4>
                      <span className="text-xs font-mono text-green-400">{c.pricing}</span>
                    </div>
                    <p className="text-xs text-white/50"><span className="text-green-400">Strength:</span> {c.strength}</p>
                    <p className="text-xs text-white/50"><span className="text-red-400">Weakness:</span> {c.weakness}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#00a2ff]/20 bg-[#00a2ff]/5 p-5">
              <h3 className="text-sm font-bold text-[#00a2ff] flex items-center gap-2 mb-3"><Trophy className="h-4 w-4" /> Mid Dogs (Challengers)</h3>
              <div className="space-y-2">
                {COMPETITORS.mid_dogs.map(c => (
                  <div key={c.name} className="rounded-lg bg-white/5 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-white">{c.name}</h4>
                      <span className="text-xs font-mono text-green-400">{c.pricing}</span>
                    </div>
                    <p className="text-xs text-white/50"><span className="text-green-400">Strength:</span> {c.strength}</p>
                    <p className="text-xs text-white/50"><span className="text-red-400">Weakness:</span> {c.weakness}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'limits' && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-green-400/20 bg-green-500/5 p-5">
              <h3 className="text-sm font-bold text-green-400 flex items-center gap-2 mb-3"><Zap className="h-4 w-4" /> Our Launch Capacity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(LAUNCH_LIMITS).map(([key, val]) => (
                  <div key={key} className="rounded-lg bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/30">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-white mt-1">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}