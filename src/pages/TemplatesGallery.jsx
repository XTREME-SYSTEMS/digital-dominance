import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Sparkles, Rocket, Phone } from "lucide-react";
import { TOP_20_INDUSTRIES } from "@/data/topIndustries";

export default function TemplatesGallery() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = TOP_20_INDUSTRIES.filter((t) =>
    !search || t.label.toLowerCase().includes(search.toLowerCase())
  );

  const chooseTemplate = (tpl) => {
    const prompt = `Build a website using the ${tpl.label} template. Services: ${(tpl.services || []).join(", ")}. Generate the brand pack, deploy to Vercel, sync Google, validate 3x, and email the result.`;
    navigate("/admin", { state: { initialMessage: prompt } });
  };

  return (
    <div className="min-h-screen bg-white text-[#0a1220]">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a2ff] to-[#0066cc]">
            <Rocket className="h-5 w-5 text-white" />
          </div>
          <div className="leading-none">
            <span className="block text-sm font-extrabold tracking-tight text-[#0a1220]">Website Launch Engine</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#00a2ff]">Florida Based · Nationwide</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-xs font-bold tracking-wider text-[#6b7280] hover:text-[#00a2ff]">PRICING</Link>
          <a href="tel:+17722090266" className="flex items-center gap-2 rounded-full bg-[#00a2ff] px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(0,162,255,0.4)] transition hover:bg-[#0090e0]">
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">(772) 209-0266</span>
          </a>
          <Link to="/portal" className="flex items-center gap-2 rounded-lg border border-[#00a2ff]/50 px-4 py-2 text-xs font-bold tracking-wider text-[#00a2ff] hover:bg-[#00a2ff]/10">PORTAL</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-wide mb-4 text-[#0a1220]">CHOOSE YOUR <span className="text-[#00a2ff]">TEMPLATE</span></h1>
        <p className="text-[#6b7280] mb-8 max-w-2xl mx-auto">Pick a template. We build it, brand it, deploy it, and automate your marketing — done in days.</p>
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-full border border-gray-300 bg-white px-12 py-3 text-sm text-[#0a1220] placeholder-gray-400 outline-none focus:border-[#00a2ff]"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tpl) => (
            <div key={tpl.id} className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-[#00a2ff]/50 hover:shadow-xl transition">
              <div className="h-48 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${tpl.accentColor || "#00a2ff"}30, ${tpl.accentColor || "#00a2ff"}05)` }}>
                <span className="text-5xl font-black opacity-30" style={{ color: tpl.accentColor || "#00a2ff" }}>{tpl.label.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold mb-1 text-[#0a1220]">{tpl.label}</h3>
                <p className="text-xs text-[#6b7280] mb-4">{tpl.services?.length || 0} services</p>
                <button
                  onClick={() => chooseTemplate(tpl)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00a2ff] py-3 text-sm font-bold tracking-wider text-white hover:bg-[#00a2ff]/80 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  CHOOSE THIS
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}