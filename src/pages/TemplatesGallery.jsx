import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-[#050508] text-white">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-black" style={{
            background: "linear-gradient(135deg, #e8e8e8, #ffffff, #a0a0a0)",
            WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>S</span>
          <span className="text-sm font-bold tracking-wider text-white/80">STRATEGIC MINDS AI</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-xs font-bold tracking-wider text-white/60 hover:text-[#00E5FF]">PRICING</Link>
          <Link to="/portal" className="flex items-center gap-2 rounded-lg border border-[#00E5FF]/50 px-4 py-2 text-xs font-bold tracking-wider text-[#00E5FF] hover:bg-[#00E5FF]/10">PORTAL</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-wide mb-4">CHOOSE YOUR <span className="text-[#00E5FF]">TEMPLATE</span></h1>
        <p className="text-white/50 mb-8 max-w-2xl mx-auto">Pick a template. We build it, brand it, deploy it, and automate your marketing — done in days.</p>
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-full border border-white/20 bg-white/5 px-12 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#00E5FF]"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tpl) => (
            <div key={tpl.id} className="group rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-[#00E5FF]/50 transition">
              <div className="h-48 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${tpl.accentColor || "#00E5FF"}30, ${tpl.accentColor || "#00E5FF"}05)` }}>
                <span className="text-5xl font-black opacity-30" style={{ color: tpl.accentColor || "#00E5FF" }}>{tpl.label.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold mb-1 text-white">{tpl.label}</h3>
                <p className="text-xs text-white/40 mb-4">{tpl.services?.length || 0} services</p>
                <button
                  onClick={() => chooseTemplate(tpl)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00E5FF] py-3 text-sm font-bold tracking-wider text-black hover:bg-[#00E5FF]/80 transition"
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