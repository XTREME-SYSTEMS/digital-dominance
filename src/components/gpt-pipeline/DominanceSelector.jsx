import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, MapPin, ChevronRight, Check } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default function DominanceSelector({ onQuickAction }) {
  const [selectedStates, setSelectedStates] = useState([]);
  const [siteCount, setSiteCount] = useState(50);
  const [niche, setNiche] = useState("epoxy garage floors");

  const toggleState = (st) => {
    setSelectedStates((prev) => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);
  };
  const selectAllStates = () => {
    setSelectedStates(prev => prev.length === US_STATES.length ? [] : [...US_STATES]);
  };

  const launchDominance = () => {
    const stateList = selectedStates.length === US_STATES.length ? "all 50 US states" : selectedStates.join(", ");
    onQuickAction(`Launch a digital dominance campaign for ${niche}. Create ${siteCount} programmatic websites according to Google's exact deterministic and programmatic specifications. Target ${stateList}. For each state, generate every county and every city. Each site must be fully Google-compliant: schema, sitemap, Search Console, Analytics, AEO, GEO, and SEO. Deploy each to Vercel, sync to Google, and validate. Use the queue system for batch processing. After deployment, activate autonomous agents to monitor, analyze, fix, and evolve each site.`);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-stone-900">Digital Dominance</h3>
        <p className="text-[11px] text-stone-500">Unlimited programmatic websites by state → county → city</p>
      </div>

      {/* Niche */}
      <div>
        <label className="text-xs font-bold text-stone-600">Industry / Niche</label>
        <input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. epoxy garage floors, water damage restoration, roofing"
          className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 outline-none" />
      </div>

      {/* Site count */}
      <div>
        <label className="text-xs font-bold text-stone-600">Number of websites</label>
        <div className="flex items-center gap-2 mt-1">
          <input type="number" value={siteCount} onChange={(e) => setSiteCount(Math.max(1, parseInt(e.target.value) || 1))} min={1}
            className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 outline-none" />
          <div className="flex gap-1.5">
            {[50, 100, 350, 1000].map((n) => (
              <button key={n} onClick={() => setSiteCount(n)} className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${siteCount === n ? "bg-amber-500 text-stone-900" : "border border-stone-200 text-stone-600 hover:border-amber-300"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* State selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-stone-600">Target States ({selectedStates.length}/{US_STATES.length})</label>
          <button onClick={selectAllStates} className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700">
            {selectedStates.length === US_STATES.length ? <><Check className="h-3 w-3" /> Uncheck all</> : "Select all"}
          </button>
        </div>
        <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto rounded-lg border border-stone-200 p-2">
          {US_STATES.map((st) => (
            <button key={st} onClick={() => toggleState(st)}
              className={`rounded-md py-1.5 text-xs font-bold transition ${selectedStates.includes(st) ? "bg-amber-500 text-stone-900" : "bg-stone-50 text-stone-500 hover:bg-stone-100"}`}>
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Launch */}
      <button onClick={launchDominance} disabled={!niche || selectedStates.length === 0}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50 transition">
        <Globe className="h-4 w-4" />
        Launch {siteCount} sites across {selectedStates.length || 0} states
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Deep links */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
        <Link to="/admin/dominance-pipeline" className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-amber-300">Dominance Pipeline</Link>
        <Link to="/admin/digital-dominance" className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-amber-300">Digital Dominance</Link>
        <Link to="/admin/autonomous-dominance" className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-amber-300">Autonomous Dominance</Link>
        <Link to="/admin/website-queue" className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:border-amber-300">Site Queue</Link>
      </div>
    </div>
  );
}