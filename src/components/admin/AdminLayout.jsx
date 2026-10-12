import React, { useState } from "react";
import { NavLink, Navigate, Outlet, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import AIAssistBubble from "@/components/ai-assist/AIAssistBubble";

const NAV_ITEMS = [
  { to: "/admin", end: true, icon: "▦", label: "Overview" },
  { to: "/admin/templates", icon: "◈", label: "Website Catalog" },
  { to: "/admin/mass-launch", icon: "⇧", label: "Launch Queue" },
  { to: "/admin/site-command", icon: "✓", label: "Approval Desk" },
  { to: "/admin/assistant", icon: "✦", label: "AI Operations" },
  { to: "/admin/analytics", icon: "⌁", label: "Analytics" },
  { to: "/admin/tools", icon: "⚙", label: "Integrations" },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  if (user && user.role !== "admin") return <Navigate to="/portal/dashboard" replace />;

  return (
    <div className="min-h-screen w-full bg-[#f4f8fd]">
      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/50 lg:hidden" />}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-40 flex h-screen h-[100dvh] w-[270px] shrink-0 flex-col gap-2 border-r border-[#275074] bg-[#031327] p-[18px] text-[#e9f4ff] transition-transform duration-200 lg:sticky lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Brand */}
        <Link to="/" className="mb-6 flex items-center gap-2.5 text-[19px] font-black leading-[1.05] tracking-[-0.03em] text-white">
          <span className="text-[31px] leading-none">🚀</span>
          <span>
            Website<br />Launch Engine
            <small className="mt-1.5 block text-[9px] tracking-[0.15em] text-[#6cc6ff]">STRATEGIC MINDS AI</small>
          </span>
        </Link>

        <div className="my-3 ml-[9px] text-[11px] font-extrabold tracking-[0.18em] text-[#89a6c2]">PLATFORM OPERATIONS</div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, end, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-[9px] border px-3.5 py-3.5 text-left text-[15px] font-bold transition-colors ${
                  isActive
                    ? "border-[#309afb] bg-[#126fc8] text-white"
                    : "border-transparent bg-transparent text-[#bad3e9] hover:bg-[#126fc8] hover:text-white"
                }`
              }
            >
              <span className="text-[20px]">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="mt-auto border-t border-[#26435f] pt-[18px] text-[12px] leading-[1.7] text-[#8faec9]">
          Florida Based · Nationwide Reach
          <a href="tel:+17722090266" className="block text-[#99d7ff]">☎ (772) 209-0266</a>
          <Link to="/admin/contents" className="block text-[#99d7ff]">⊞ All Tools</Link>
          <Link to="/" className="block text-[#99d7ff]">← Back to Website Launch Engine</Link>
        </div>

        <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute right-3 top-6 text-white lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-col lg:ml-[270px]">
        {/* Top bar */}
        <header className="flex min-h-[82px] items-center justify-between gap-4 border-b border-[#dce6f1] bg-white px-[clamp(18px,3.5vw,52px)]">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="lg:hidden">
              <Menu className="h-6 w-6 text-[#06213b]" />
            </button>
            <span className="text-[18px] font-extrabold text-[#06213b]">Admin Control Center</span>
          </div>
          <div className="flex items-center gap-3.5">
            <Link to="/" className="text-[14px] font-bold text-[#116ed0]">View public site ↗</Link>
            <span className="rounded-full bg-[#fff2d8] px-3 py-2 text-[11px] font-extrabold text-[#8d5b09]">PREVIEW ONLY</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>

      <AIAssistBubble />
    </div>
  );
}