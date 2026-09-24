import React from 'react';
import {
  TrendingUp, Github, Share2, HardHat, Home, Brain, AlertTriangle,
  Gauge, MapPin, Search, Users, Building2, CalendarDays, UtensilsCrossed,
  Loader2, Zap,
} from 'lucide-react';

export const SCANNERS = [
  { key: 'scan_google_trends', label: 'Google Trends', desc: 'Live trending topics & breakout searches', icon: TrendingUp, color: 'amber' },
  { key: 'scan_github_trending', label: 'GitHub Top Repos', desc: 'Highest-rated repos across all categories', icon: Github, color: 'stone' },
  { key: 'scan_social_media_trends', label: 'Social Media Trends', desc: 'Top complaints & needs on social platforms', icon: Share2, color: 'blue' },
  { key: 'scan_construction_trends', label: 'Construction Trends', desc: 'Industry problems & opportunities', icon: HardHat, color: 'amber' },
  { key: 'scan_real_estate_trends', label: 'Real Estate Trends', desc: 'Agent, investor & homeowner pain points', icon: Home, color: 'green' },
  { key: 'scan_ai_demand', label: 'AI Demand by Industry', desc: 'Industries actively seeking AI tools', icon: Brain, color: 'violet' },
  { key: 'scan_ai_problems', label: 'AI Industry Problems', desc: 'All problems & complaints in AI right now', icon: AlertTriangle, color: 'red' },
  { key: 'scan_ai_saturation', label: 'AI Saturation', desc: 'Market saturation by AI category', icon: Gauge, color: 'stone' },
  { key: 'scan_south_florida_competitors', label: 'South Florida Competitors', desc: 'Vero Beach to Miami tech & AI companies', icon: MapPin, color: 'amber' },
  { key: 'scan_craigslist', label: 'Craigslist Scanner', desc: 'Listings may be unavailable when Craigslist blocks access', icon: Search, color: 'blue' },
  { key: 'scan_social_groups', label: 'South Florida Groups', desc: 'Publicly indexed group and community mentions', icon: Users, color: 'violet' },
  { key: 'scan_construction_demand', label: 'Construction Demand', desc: 'Social posts needing AI & app solutions', icon: Building2, color: 'amber' },
  { key: 'scan_networking_events', label: 'Networking Events', desc: 'Public news of dated business & tech events', icon: CalendarDays, color: 'green' },
  { key: 'restaurant_ai_growth', label: 'Restaurant AI Growth', desc: 'AI systems to help restaurants grow', icon: UtensilsCrossed, color: 'red' },
];

const COLOR_MAP = {
  amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100',
  stone: 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-400 hover:bg-stone-100',
  blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100',
  green: 'border-green-200 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100',
  violet: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400 hover:bg-violet-100',
  red: 'border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100',
};

const ICON_BG = {
  amber: 'bg-amber-500 text-stone-950',
  stone: 'bg-stone-700 text-white',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  violet: 'bg-violet-500 text-white',
  red: 'bg-red-500 text-white',
};

export default function ScannerGrid({ onScan, activeScan, scanning, onFullScan, fullScanning }) {
  return (
    <div>
      {/* Full scan button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-stone-900">Opportunity Scanners</h2>
          <p className="text-sm text-stone-500 mt-0.5">14 scanners using public feeds and free-tier AI analysis — source coverage and provider quotas vary</p>
        </div>
        <button
          onClick={onFullScan}
          disabled={fullScanning || scanning}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-50"
        >
          {fullScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {fullScanning ? 'Scanning All...' : 'Run Full Scan'}
        </button>
      </div>

      {/* Scanner grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {SCANNERS.map((s) => {
          const isActive = activeScan === s.key;
          const isLoading = scanning && isActive;
          return (
            <button
              key={s.key}
              onClick={() => onScan(s.key)}
              disabled={scanning || fullScanning}
              className={`text-left rounded-xl border p-4 transition-all disabled:opacity-50 ${COLOR_MAP[s.color]} ${
                isActive ? 'ring-2 ring-amber-500 ring-offset-1' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 ${ICON_BG[s.color]}`}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <s.icon className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{s.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{s.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}