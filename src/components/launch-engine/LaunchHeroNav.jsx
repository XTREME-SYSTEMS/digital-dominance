import React from 'react';
import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';

const links = [['Industries', '#industries'], ['Templates', '#templates'], ['How It Works', '#how'], ['Pricing', '#pricing'], ['Portals', '#portals'], ['Contact', '#contact']];

export default function LaunchHeroNav() {
  return <nav className="wle-home-nav" aria-label="Main navigation">
    <div className="wle-home-nav-in">
      <Link to="/" className="wle-home-logo" aria-label="Website Launch Engine home">
        <span className="wle-home-rocket" aria-hidden="true">🚀</span>
        <span>Website<br />Launch Engine<small>FLORIDA BASED · NATIONWIDE REACH</small></span>
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