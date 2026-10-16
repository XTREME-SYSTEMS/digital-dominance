import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutDashboard, Settings, Shield, Zap } from "lucide-react";

export default function AdminAccessDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Template Studio", path: "/admin/template-studio", icon: Zap },
    { label: "Image Validator", path: "/admin/image-validator", icon: Shield },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/80 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10 hover:text-white"
      >
        <LayoutDashboard className="h-3.5 w-3.5" />
        Admin
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#031127]/95 shadow-2xl backdrop-blur-xl z-50">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white last:border-b-0"
              >
                <Icon className="h-4 w-4 text-[#6cc6ff]" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}