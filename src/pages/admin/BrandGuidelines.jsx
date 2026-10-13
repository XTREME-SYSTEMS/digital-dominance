import React, { useState } from 'react';
import { Palette, Type, Layout, Eye, Check, Copy } from 'lucide-react';

const BRAND = {
  colors: {
    primary: { name: 'Electric Blue', hex: '#00a2ff', rgb: '0, 162, 255', usage: 'Primary CTAs, links, active states' },
    secondary: { name: 'Deep Navy', hex: '#0a1220', rgb: '10, 18, 32', usage: 'Dark backgrounds, headers, footer' },
    accent: { name: 'Neon Green', hex: '#22c55e', rgb: '34, 197, 94', usage: 'Hover borders, success states, validation' },
    gold: { name: 'Metallic Gold', hex: '#D4AF37', rgb: '212, 175, 55', usage: 'Premium accents, badges, tier highlights' },
    white: { name: 'Pure White', hex: '#ffffff', rgb: '255, 255, 255', usage: 'Text on dark, card surfaces' },
    muted: { name: 'Slate Gray', hex: '#6b7280', rgb: '107, 114, 128', usage: 'Secondary text, descriptions' },
  },
  fonts: {
    heading: { name: 'Plus Jakarta Sans', weights: '400-800', usage: 'Headlines, hero text, section titles' },
    body: { name: 'Inter', weights: '400-700', usage: 'Body text, paragraphs, descriptions' },
    mono: { name: 'JetBrains Mono', weights: '400-800', usage: 'Code, technical labels, data' },
  },
  spacing: ['4px', '8px', '12px', '16px', '24px', '32px', '48px', '64px'],
  radii: { sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '24px' },
  shadows: {
    card: '0 8px 24px rgba(0, 0, 0, 0.08)',
    glow: '0 0 16px -2px rgba(34, 197, 94, 0.5)',
    blue: '0 0 16px -2px rgba(0, 162, 255, 0.5)',
  },
};

export default function BrandGuidelines() {
  const [tab, setTab] = useState('colors');
  const [copied, setCopied] = useState(null);

  const copy = (val) => { navigator.clipboard.writeText(val); setCopied(val); setTimeout(() => setCopied(null), 1500); };

  return (
    <div className="min-h-screen bg-[#050508] p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1220] to-[#0d1a2e] p-6">
          <div className="flex items-center gap-3">
            <Palette className="h-8 w-8 text-[#00a2ff]" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">Visual Brand Guidelines</h1>
              <p className="text-sm text-white/60">The visual perfection system — applied site-wide across every page, component, and interaction</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[{id:'colors',label:'Colors',icon:Palette},{id:'fonts',label:'Typography',icon:Type},{id:'layout',label:'Layout & Spacing',icon:Layout},{id:'effects',label:'Effects',icon:Eye}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-[#00a2ff] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'colors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(BRAND.colors).map(([key, c]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-[#0a1220] p-5 hover:border-green-400/50 transition-all duration-300">
                <div className="h-20 rounded-xl mb-3" style={{ background: c.hex }} />
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-white">{c.name}</h3>
                  <button onClick={() => copy(c.hex)} className="text-xs text-white/40 hover:text-white">
                    {copied === c.hex ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-white/40 mb-2">{c.usage}</p>
                <div className="flex gap-2 text-[10px] font-mono">
                  <span className="rounded bg-white/5 px-2 py-1 text-white/60">{c.hex}</span>
                  <span className="rounded bg-white/5 px-2 py-1 text-white/60">rgb({c.rgb})</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'fonts' && (
          <div className="space-y-4">
            {Object.entries(BRAND.fonts).map(([key, f]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-[#0a1220] p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">{f.name}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-[#00a2ff]">{key}</span>
                </div>
                <p className="text-xs text-white/40 mb-3">{f.usage} · Weights: {f.weights}</p>
                <p className={`text-white ${key === 'heading' ? 'text-3xl font-extrabold' : key === 'body' ? 'text-lg' : 'text-lg font-mono'}`}>
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === 'layout' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6">
              <h3 className="text-sm font-bold text-white mb-4">Spacing Scale</h3>
              <div className="flex flex-wrap items-end gap-3">
                {BRAND.spacing.map((s, i) => (
                  <div key={s} className="text-center">
                    <div className="bg-[#00a2ff] rounded-t" style={{ width: '40px', height: s }} />
                    <p className="text-[10px] text-white/40 mt-1">{s}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6">
              <h3 className="text-sm font-bold text-white mb-4">Border Radius</h3>
              <div className="flex flex-wrap gap-4">
                {Object.entries(BRAND.radii).map(([key, val]) => (
                  <div key={key} className="text-center">
                    <div className="bg-[#00a2ff]/20 border border-[#00a2ff]/40" style={{ width: '60px', height: '60px', borderRadius: val }} />
                    <p className="text-[10px] text-white/40 mt-1">{key}: {val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'effects' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-6 text-center">
              <div className="h-24 rounded-xl bg-white/5 mb-3" style={{ boxShadow: BRAND.shadows.card }} />
              <h3 className="text-sm font-bold text-white">Card Shadow</h3>
              <p className="text-xs text-white/40">{BRAND.shadows.card}</p>
            </div>
            <div className="rounded-2xl border border-green-400/30 bg-[#0a1220] p-6 text-center">
              <div className="h-24 rounded-xl bg-green-500/10 mb-3" style={{ boxShadow: BRAND.shadows.glow }} />
              <h3 className="text-sm font-bold text-white">Neon Green Glow</h3>
              <p className="text-xs text-white/40">{BRAND.shadows.glow}</p>
            </div>
            <div className="rounded-2xl border border-[#00a2ff]/30 bg-[#0a1220] p-6 text-center">
              <div className="h-24 rounded-xl bg-[#00a2ff]/10 mb-3" style={{ boxShadow: BRAND.shadows.blue }} />
              <h3 className="text-sm font-bold text-white">Blue Glow</h3>
              <p className="text-xs text-white/40">{BRAND.shadows.blue}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}