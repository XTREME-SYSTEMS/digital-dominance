import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Linkedin, Send } from "lucide-react";
import FooterLocations from "@/components/home/FooterLocations";
import InstallAppButton from "@/components/home/InstallAppButton";
import { useSettings } from "@/lib/useSettings";

const QUICK_LINKS = [
  { label: "Get Estimate", path: "/funnel" },
  { label: "How It Works", path: "/how-it-works" },
  { label: "Color Charts", path: "/color-charts" },
  { label: "Gallery", path: "/gallery" },
  { label: "Reviews", path: "/reviews" },
  { label: "About Us", path: "/about" },
  { label: "Contact", path: "/contact" },
  { label: "All Locations", path: "/locations" },
];

const SEO_LINKS = [
  { label: "Epoxy Garage Floor Cost", path: "/epoxy-garage-floor-cost" },
  { label: "2-Car Garage Epoxy Cost", path: "/2-car-garage-epoxy-cost" },
  { label: "3-Car Garage Epoxy Cost", path: "/3-car-garage-epoxy-cost" },
  { label: "Garage Floor Coating Cost", path: "/garage-floor-coating-cost" },
  { label: "Pompano Beach, FL", path: "/fl/pompano-beach" },
  { label: "Garage Floor Guides", path: "/guides" },
  { label: "Epoxy Pro Guide", path: "/elite" },
];

const SOCIAL_LINKS = [
  { icon: Facebook, url: "https://www.facebook.com/xtremepolishingsystems", label: "Facebook" },
  { icon: Instagram, url: "https://www.instagram.com/xtremepolishingsystems", label: "Instagram" },
  { icon: Youtube, url: "https://www.youtube.com/@xtremepolishingsystems", label: "YouTube" },
  { icon: Linkedin, url: "https://www.linkedin.com/company/xtreme-polishing-systems", label: "LinkedIn" },
];

const COMPANY_BLURB = `Xtreme Polishing Systems supplies concrete and floor resurfacing contractors with professional, premium quality, and innovative concrete products, epoxy coatings, flooring machines, janitorial equipment, and decorative materials used every day on the job site at affordable prices. We provide a full product line of do-it-yourself supplies, contractor equipment and building materials for projects big and small.`;

export default function Footer() {
  const { settings } = useSettings();
  return (
    <footer className="bg-stone-950 text-stone-400 pt-12 pb-6 px-6 border-t border-amber-500/20">
      <div className="max-w-6xl mx-auto">
        {/* Top section: Company + Quick Links + SEO Links + Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Company Info */}
          <div>
            <div className="text-white font-bold text-lg">{settings.company_name || "EpoxyGarageFloorEstimate.com"}</div>
            <div className="inline-block text-sm text-white font-bold mt-1 px-3 py-1 border-2 border-amber-500 rounded-lg">Powered by America's #1 Largest Epoxy Superstore</div>
            <p className="mt-3 text-xs leading-relaxed text-stone-500">{COMPANY_BLURB}</p>
            <div className="mt-4 space-y-1">
              <a href={`tel:${settings.phone}`} className="flex items-center gap-2 text-xs hover:text-amber-500 transition">
                <Phone className="h-3.5 w-3.5" /> Call: {settings.phone}
              </a>
              <a href={`sms:${settings.automation_phone || "+1-833-700-1239"}`} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition">
                <Send className="h-3.5 w-3.5" /> Text our AI Assistant: {settings.automation_phone_display || "1-833-700-1239"}
              </a>
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-xs hover:text-amber-500 transition">
                <Mail className="h-3.5 w-3.5" /> {settings.email}
              </a>
              <div className="flex items-start gap-2 text-xs">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{settings.business_address}</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex gap-3 mt-4">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="text-stone-500 hover:text-amber-500 transition">
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase mb-3">Quick Links</h3>
            <ul className="space-y-1.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.path}>
                  <Link to={l.path} className="text-xs hover:text-amber-500 transition">{l.label}</Link>
                </li>
              ))}
              <li><Link to="/admin" className="text-xs text-stone-600 hover:text-stone-400 transition">Team Login</Link></li>
            </ul>
          </div>

          {/* SEO Content Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase mb-3">Cost Guides & Resources</h3>
            <ul className="space-y-1.5">
              {SEO_LINKS.map((l) => (
                <li key={l.path}>
                  <Link to={l.path} className="text-xs hover:text-amber-500 transition">{l.label}</Link>
                </li>
              ))}
            </ul>
            <h3 className="text-sm font-bold text-white uppercase mb-3 mt-5">Top Products</h3>
            <ul className="space-y-1.5">
              <li><a href="https://xtremepolishingsystems.com" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-amber-500 transition">Top Selling Chemicals</a></li>
              <li><a href="https://xtremepolishingsystems.com" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-amber-500 transition">Top Selling Tooling</a></li>
              <li><a href="https://xtremepolishingsystems.com" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-amber-500 transition">Epoxy Floor Coatings</a></li>
            </ul>
          </div>

          {/* Estimate path */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase mb-3">Get a free estimate</h3>
            <p className="text-xs text-stone-400 mb-3">Tell us about your garage and see a preliminary price range.</p>
            <Link to="/funnel" className="inline-flex min-h-10 items-center rounded-lg bg-amber-500 px-4 text-sm font-bold text-stone-950">Price my floor</Link>
            <div className="mt-4">
              <InstallAppButton variant="dark" />
            </div>
          </div>
        </div>

        {/* All Locations by Region */}
        <div className="border-t border-stone-800 pt-8 mb-8">
          <FooterLocations />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-stone-600">
            © {new Date().getFullYear()} {settings.company_name || "EpoxyGarageFloorEstimate.com"} — Powered by Xtreme Polishing Systems. All rights reserved.
          </div>
          <div className="flex gap-4 text-xs">
            <a href="https://xtremepolishingsystems.com/pages/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-400 transition">Privacy Policy</a>
            <a href="https://xtremepolishingsystems.com/pages/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-400 transition">Terms of Service</a>
            <a href="https://xtremepolishingsystems.com/pages/refund-policy" target="_blank" rel="noopener noreferrer" className="text-stone-600 hover:text-stone-400 transition">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}