import React from 'react';
import { Sparkles, Phone, MessageSquare, Video, Brain } from 'lucide-react';

const EDEN_IMAGE = 'https://media.base44.com/images/public/6a77f4491f0bf92de9a3ed8b/fe76c662d_image.png';

export default function EdenSkyeHeader({ status, onTab, activeTab }) {
  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'voice', label: 'Voice', icon: Phone },
    { id: 'avatar', label: 'Avatar', icon: Video },
    { id: 'memory', label: 'Memory', icon: Brain },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1220] via-[#0d1a2e] to-[#050508] p-6">
      <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(ellipse at 30% 0%, #00a2ff40, transparent 60%)' }} />
      <div className="relative flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={EDEN_IMAGE} alt="Eden Skye" className="h-20 w-20 rounded-2xl object-cover border-2 border-[#00a2ff]/40 shadow-lg shadow-[#00a2ff]/20" />
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-[#0a1220]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Eden Skye</h1>
              <Sparkles className="h-5 w-5 text-[#00a2ff]" />
            </div>
            <p className="text-sm text-white/60">Executive AI Receptionist</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status?.twilio_configured ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {status?.twilio_configured ? 'Twilio Live' : 'Twilio Pending'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status?.heygen_configured ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {status?.heygen_configured ? 'HeyGen Live' : 'HeyGen Pending'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:ml-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => onTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab.id ? 'bg-[#00a2ff] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}