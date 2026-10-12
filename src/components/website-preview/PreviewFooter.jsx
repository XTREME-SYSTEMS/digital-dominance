import React from "react";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from "lucide-react";

export default function PreviewFooter({ c, LogoIcon, industry }) {
  return (
    <footer className="bg-[#0a0a0a] text-white/60 px-4 py-5 wp-font-body">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentLight})` }}>
          {LogoIcon ? <LogoIcon className="w-3 h-3 text-white" /> : <span className="text-white font-black text-[9px]">{industry?.[0] || "P"}</span>}
        </div>
        <span className="text-[11px] font-bold text-white wp-font-heading">{industry || "Pro"}</span>
      </div>
      <div className="space-y-1 mb-2 text-center">
        <div className="flex items-center justify-center gap-1 text-[9px]"><Phone className="w-2.5 h-2.5" /> {c.phone}</div>
        <div className="flex items-center justify-center gap-1 text-[9px]"><Mail className="w-2.5 h-2.5" /> info@{c.domain}</div>
        <div className="flex items-center justify-center gap-1 text-[9px]"><MapPin className="w-2.5 h-2.5" /> 123 Main St, Your City, ST 12345</div>
        <div className="flex items-center justify-center gap-1 text-[9px]"><Clock className="w-2.5 h-2.5" /> Mon-Sun: 24/7 Emergency Service</div>
      </div>
      <div className="flex items-center justify-center gap-3 mb-2">
        <Facebook className="w-3.5 h-3.5 hover:text-white cursor-pointer transition" />
        <Instagram className="w-3.5 h-3.5 hover:text-white cursor-pointer transition" />
        <Twitter className="w-3.5 h-3.5 hover:text-white cursor-pointer transition" />
      </div>
      <div className="text-[8px] text-white/30 text-center">© 2026 {industry || "Pro"}. All rights reserved. | Privacy Policy | Terms | Sitemap</div>
    </footer>
  );
}