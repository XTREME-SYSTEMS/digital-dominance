import React from "react";
import { Settings, Gem } from "lucide-react";

export default function DualWorkspaces() {
  return (
    <section id="portals" className="bg-gray-50 py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00a2ff] mb-2">BUILT FOR YOUR BUSINESS</p>
          <h2 className="text-3xl md:text-4xl font-black text-[#0a1220] mb-3">One Platform. Two Focused Workspaces.</h2>
          <p className="text-[#6b7280] max-w-lg mx-auto">Explore the admin and client portal foundations. These are development previews, not authenticated customer accounts.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-7">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0a1220]">
              <Settings className="h-7 w-7 text-[#00a2ff]" />
            </div>
            <h3 className="text-lg font-black text-[#0a1220] mb-2">Admin Control Center</h3>
            <p className="text-sm text-[#6b7280] mb-4">Website catalog, approval workflow, launch-queue states, quality checks, and integration readiness in one view.</p>
            <a href="/admin" className="text-sm font-bold text-[#00a2ff] hover:underline">Explore Admin Preview →</a>
            <p className="mt-2 text-xs text-gray-400">Preview access · No production control or customer data</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-7">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0a1220]">
              <Gem className="h-7 w-7 text-[#00a2ff]" />
            </div>
            <h3 className="text-lg font-black text-[#0a1220] mb-2">Client Workspace</h3>
            <p className="text-sm text-[#6b7280] mb-4">Business onboarding, website projects, lead inbox, approval center, and support designed for owners.</p>
            <a href="/portal" className="text-sm font-bold text-[#00a2ff] hover:underline">Explore Client Preview →</a>
            <p className="mt-2 text-xs text-gray-400">Preview access · No login, messaging, or billing is enabled</p>
          </div>
        </div>
      </div>
    </section>
  );
}