import React from "react";

export default function EmpireHero({ stats, onAIGenerate, onBatchMode, batchMode }) {
  return (
    <div className="te-hero te-fade-in">
      <div className="te-hero-bg">
        <div className="te-hero-grid" />
      </div>

      <div className="te-hero-cards">
        <div className="te-hero-card">
          <div className="te-hero-card-top">
            <div className="te-hero-card-dot" style={{ background: "#34d399" }} />
            <div className="te-hero-card-title">Templates</div>
          </div>
          <div className="te-hero-card-val">{stats.templates || 0}</div>
          <div className="te-hero-card-sub">Visual renders ready</div>
          <div className="te-hero-card-bar"><span style={{ width: "72%" }} /></div>
        </div>
        <div className="te-hero-card">
          <div className="te-hero-card-top">
            <div className="te-hero-card-dot" style={{ background: "#a5b4fc" }} />
            <div className="te-hero-card-title">Industries</div>
          </div>
          <div className="te-hero-card-val">{stats.industries || 0}</div>
          <div className="te-hero-card-sub">Universal niches</div>
          <div className="te-hero-card-bar"><span style={{ width: "88%" }} /></div>
        </div>
        <div className="te-hero-card">
          <div className="te-hero-card-top">
            <div className="te-hero-card-dot" style={{ background: "#fbbf24" }} />
            <div className="te-hero-card-title">Sites Launched</div>
          </div>
          <div className="te-hero-card-val">{stats.launched || 0}</div>
          <div className="te-hero-card-sub">From this system</div>
          <div className="te-hero-card-bar"><span style={{ width: "64%" }} /></div>
        </div>
      </div>

      <div className="te-herocopy">
        <div className="te-hero-badge">Visual Template Empire · Live</div>
        <h1>Launch <em>thousands</em> of websites from one gallery</h1>
        <p>See a visual render of every template. Pick a starting point, generate a logo, content, and images with AI, or type what you want and let the AI build a beautiful website in minutes.</p>
        <div className="te-buttons">
          <button onClick={onAIGenerate} className="te-bigbutton gold">
            ✨ Generate with AI
          </button>
          <button onClick={onBatchMode} className={`te-bigbutton ${batchMode ? "alt" : ""}`}>
            {batchMode ? "✓ Batch Mode On" : "Batch Launch"}
          </button>
        </div>
      </div>
    </div>
  );
}