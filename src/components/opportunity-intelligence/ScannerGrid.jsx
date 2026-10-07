import React from 'react';
import {
  TrendingUp, Github, Share2, HardHat, Home, Brain, AlertTriangle,
  Gauge, MapPin, Search, Users, Building2, CalendarDays, UtensilsCrossed,
  Loader2, Zap,
} from 'lucide-react';

export const SCANNERS = [
  { key: 'scan_google_trends', label: 'Concrete Search Trends', desc: 'Trending epoxy, polished concrete & decorative concrete searches', icon: TrendingUp, color: 'amber' },
  { key: 'scan_github_trending', label: 'Concrete Tech Tools', desc: 'Top concrete & flooring tech repos and tools', icon: Github, color: 'stone' },
  { key: 'scan_social_media_trends', label: 'Concrete Social Trends', desc: 'Homeowner complaints & needs around garage floors, epoxy, concrete', icon: Share2, color: 'blue' },
  { key: 'scan_construction_trends', label: 'Construction Trends', desc: 'Concrete & flooring industry problems & opportunities', icon: HardHat, color: 'amber' },
  { key: 'scan_real_estate_trends', label: 'Real Estate Trends', desc: 'Homeowner & investor pain points driving concrete coating demand', icon: Home, color: 'green' },
  { key: 'scan_ai_demand', label: 'Concrete Contractor AI Demand', desc: 'Contractors seeking AI tools for epoxy & concrete businesses', icon: Brain, color: 'violet' },
  { key: 'scan_ai_problems', label: 'Concrete Industry Problems', desc: 'Pain points & complaints in epoxy, polished & decorative concrete', icon: AlertTriangle, color: 'red' },
  { key: 'scan_ai_saturation', label: 'Concrete Market Saturation', desc: 'Market saturation by concrete coating category & region', icon: Gauge, color: 'stone' },
  { key: 'scan_south_florida_competitors', label: 'South Florida Concrete Competitors', desc: 'Vero Beach to Miami epoxy & concrete coating companies', icon: MapPin, color: 'amber' },
  { key: 'scan_craigslist', label: 'Craigslist Concrete Leads', desc: 'Concrete & flooring service listings (may be blocked by Craigslist)', icon: Search, color: 'blue' },
  { key: 'scan_social_groups', label: 'Concrete Community Groups', desc: 'Publicly indexed concrete & flooring group and community mentions', icon: Users, color: 'violet' },
  { key: 'scan_construction_demand', label: 'Concrete Coating Demand', desc: 'Social posts from homeowners needing epoxy & concrete solutions', icon: Building2, color: 'amber' },
  { key: 'scan_networking_events', label: 'Concrete Industry Events', desc: 'Public news of concrete, flooring & construction trade events', icon: CalendarDays, color: 'green' },
  { key: 'restaurant_ai_growth', label: 'Polished Concrete University', desc: 'Training & education demand for polished concrete professionals', icon: UtensilsCrossed, color: 'red' },
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
          <h2 className="text-xl font-black text-stone-900">Concrete Opportunity Scanners</h2>
          <p className="text-sm text-stone-500 mt-0.5">14 scanners tracking epoxy, polished concrete & decorative concrete market opportunities — public feeds, free-tier AI</p>
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