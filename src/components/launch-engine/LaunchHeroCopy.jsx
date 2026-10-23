import React from 'react';
import { Phone } from 'lucide-react';

const benefits = [
  ['ϟ', <>Fast website<br />launch planning</>],
  ['▥', <>Conversion-focused<br />premium designs</>],
  ['◉', <>Built for 20+<br />industries</>],
  ['♧', <>Florida based<br />nationwide reach</>],
];

export default function LaunchHeroCopy({ onBrowse }) {
  return <div className="wle-hero-copy">
    <div className="wle-hero-kicker">FAST WEBSITES. REAL LEADS. BIGGER BUSINESS.</div>
    <h1 id="cinematicHeroTitle">Launch <em>100s</em> of Websites in <em>Minutes.</em></h1>
    <p>Explore premium, conversion-focused websites for high-value industries. Choose an industry, select a design, and launch your next site. Live builds and delivery are confirmed after approval.</p>
    <div className="wle-hero-actions">
      <button type="button" onClick={onBrowse} className="wle-primary">Browse Industries <span aria-hidden="true">→</span></button>
      <a href="#templates" className="wle-outline">View Templates</a>
      <a href="tel:+17722090266" className="wle-outline wle-hero-call" aria-label="Call Digital Dominance at 772 209 0266">
        <Phone aria-hidden="true" /><span><small>Call Now</small><strong>(772) 209-0266</strong></span>
      </a>
    </div>
    <div className="wle-feature-row" aria-label="Digital Dominance benefits">
      {benefits.map(([icon, label]) => <div key={icon}><span aria-hidden="true">{icon}</span><b>{label}</b></div>)}
    </div>
    <button type="button" className="wle-open-wizard" onClick={onBrowse}>Plan a website launch <span aria-hidden="true">↗</span></button>
  </div>;
}