import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Phone, Smartphone, Palette, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import InstallAppButton from "@/components/home/InstallAppButton";
import { trackEvent } from "@/lib/tracking";

export default function Nav({ settings }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
    };
  }, [open]);

  const links = [
    { label: "How it works", to: "/how-it-works" },
    { label: "Color charts", to: "/color-charts" },
    { label: "Gallery", to: "/gallery" },
    { label: "Reviews", to: "/reviews" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
    { label: "FAQ", href: "#faq" }
  ];

  return (
    <header ref={headerRef} className="fixed top-0 inset-x-0 z-50">
      {/* Estimate entry point */}
      <Link
        to="/funnel"
        onClick={() => trackEvent("funnel_cta_clicked", { location: "home_promo" })}
        className="block bg-amber-500 text-stone-950 text-center text-xs font-bold tracking-wide py-1.5 hover:bg-amber-400 transition"
      >
        FREE GARAGE FLOOR ESTIMATE · SEE A PRELIMINARY PRICE RANGE
      </Link>

      <div className="transition-all duration-300 bg-stone-950/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="xl" colorClass="text-white" />

          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              l.to
                ? <Link key={l.label} to={l.to} className="text-sm font-medium text-white hover:text-amber-500 transition">{l.label}</Link>
                : <a key={l.label} href={l.href} className="text-sm font-medium text-white hover:text-amber-500 transition">{l.label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 mt-4">
            <a href={`tel:${settings.phone}`} className="h-9 px-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold transition border border-white/80">
              <Phone className="h-4 w-4" /> Call Us
            </a>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <a href={`tel:${settings.phone}`} className="flex h-9 items-center gap-1.5 px-3 rounded-lg text-xs font-bold transition" style={{ background: 'linear-gradient(180deg, #FFE25A 0%, #FFD700 45%, #C8A300 100%)', border: '2px solid #000', color: '#1a1a1a', boxShadow: '0 3px 8px rgba(255,215,0,.35), inset 0 1px rgba(255,255,255,.4)' }}>
              <Phone className="h-4 w-4" /> Call
            </a>
            <button onClick={() => setOpen(!open)} className="text-white">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {open && (
        <div className="md:hidden bg-stone-950/95 backdrop-blur-md border-t border-white/10 px-6 py-4 space-y-3 text-right">
          {links.map((l) => (
            l.to
              ? <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="block text-sm font-medium text-stone-200 hover:text-amber-500">{l.label}</Link>
              : <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="block text-sm font-medium text-stone-200 hover:text-amber-500">{l.label}</a>
          ))}
          <a href={`tel:${settings.phone}`} className="block text-sm font-medium text-stone-200">Call: {settings.phone}</a>
          <a href={`sms:${settings.automation_phone || "+1-833-700-1239"}`} className="block text-sm font-medium text-amber-400">Text our AI: {settings.automation_phone_display || "1-833-700-1239"}</a>
          <div className="pt-2 border-t border-white/10 space-y-2.5">
            <Link to="/funnel" onClick={() => { trackEvent("funnel_cta_clicked", { location: "home_mobile_nav" }); setOpen(false); }} className="flex h-11 items-center justify-end gap-2 rounded-xl text-sm font-bold transition pr-4" style={{ background: 'linear-gradient(180deg, #FFE25A 0%, #FFD700 45%, #C8A300 100%)', border: '2px solid #000', color: '#1a1a1a', boxShadow: '0 4px 12px rgba(255,215,0,.4), inset 0 1px rgba(255,255,255,.4)' }}>
              Price my Floor + Visualize it <Palette className="h-4 w-4" />
            </Link>
            <Link to="/elite" onClick={() => setOpen(false)} className="flex h-11 items-center justify-end gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold transition pr-4" style={{ border: '2px solid #FFD700', color: '#FFD700' }}>
              Epoxy Pro Contractor APP <Smartphone className="h-4 w-4" />
            </Link>
            <InstallAppButton
              label="Epoxy It! & Save!"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-stone-950 hover:bg-stone-900 border-2 border-amber-500 text-amber-400 text-sm font-bold transition"
            />
          </div>
          <Link to="/admin" onClick={() => setOpen(false)} className="block text-sm font-medium text-stone-400 pt-2">
            Admin Sign In
          </Link>
        </div>
      )}
    </header>
  );
}