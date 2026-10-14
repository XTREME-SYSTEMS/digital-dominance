import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Phone, Rocket, X } from 'lucide-react';

const links = [
  ['Industries', '#industries'],
  ['Templates', '#templates'],
  ['How It Works', '#how'],
  ['Pricing', '#pricing'],
  ['Contact', '#contact'],
];

export default function LaunchHeroNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="wle-home-nav" aria-label="Main navigation">
      <div className="wle-home-nav-in">
        <Link to="/" className="wle-home-logo" aria-label="Digital Dominance home" onClick={() => setMenuOpen(false)}>
          <span className="wle-home-logo-mark"><Rocket aria-hidden="true" /></span>
          <span className="wle-home-logo-wordmark">
            <strong>DIGITAL <span>DOMINANCE</span></strong>
            <small>A STRATEGIC MINDS AI SYSTEM</small>
          </span>
        </Link>

        <div className="wle-home-nav-links">
          {links.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </div>

        <a className="wle-home-phone" href="tel:+17722090266" aria-label="Call Digital Dominance at 772 209 0266">
          <Phone aria-hidden="true" /><span>(772) 209-0266</span>
        </a>

        <button type="button" className="wle-mobile-nav-toggle" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="wle-mobile-nav" onClick={() => setMenuOpen(value => !value)}>
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <div id="wle-mobile-nav" className="wle-mobile-nav-links">
          {links.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <Link to="/templates" onClick={() => setMenuOpen(false)}>Browse All Templates</Link>
        </div>
      )}
    </nav>
  );
}
