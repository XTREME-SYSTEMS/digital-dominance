import React from 'react';
import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';

const links = [['Industries', '#industries'], ['Templates', '#templates'], ['How It Works', '#how'], ['Pricing', '#pricing'], ['Portals', '#portals'], ['Contact', '#contact']];

export default function LaunchHeroNav() {
  return <nav className="wle-home-nav" aria-label="Main navigation">
    <div className="wle-home-nav-in">
      <Link to="/" className="wle-home-logo" aria-label="Unlimited Websites home" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
        <img src="https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/8c6214dbe_generated_image.png" alt="Unlimited Websites icon" style={{ height: "72px", width: "72px", objectFit: "contain", flexShrink: 0, border: "1px solid rgba(255,255,255,0.5)", borderRadius: "12px", padding: "4px" }} />
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "20px", lineHeight: 1, letterSpacing: "-0.02em", color: "#ffffff", whiteSpace: "nowrap" }}>unlimited<span style={{ color: "#00a2ff" }}>websites</span></span>
      </Link>
      <div className="wle-home-nav-links">
        {links.map(([label, href]) => href.startsWith('/') ? <Link key={label} to={href}>{label}</Link> : <a key={label} href={href}>{label}{label === 'Industries' ? ' ▾' : ''}</a>)}
      </div>
      <a className="wle-home-phone" href="tel:+17722090266" aria-label="Call Website Launch Engine at 772 209 0266">
        <Phone aria-hidden="true" /><span>(772) 209-0266</span>
      </a>
    </div>
  </nav>;
}