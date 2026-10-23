import React, { useState } from 'react';
import { Sparkles, Loader2, Check, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { exportLogo, LOGO_SIZES } from '@/lib/logoExport';

// Ten transparent-background logo concepts, each exportable at five sizes.
export default function LogoGeneratorPanel({ profile, onSelectLogo }) {
  const [logos, setLogos] = useState(profile?.logos || []);
  const [selected, setSelected] = useState(profile?.logo_url || '');
  const [size, setSize] = useState(512);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('generateBrandIdentity', {
        action: 'generate_logos',
        businessName: profile.business_name,
        industry: profile.industry_label || profile.industry,
        transparent: true,
      });
      const next = res.data.logos || [];
      setLogos(next);
      await base44.entities.BrandProfile.update(profile.id, { logos: next }).catch(() => {});
    } catch (e) {
      setError(e.message || 'Logo generation failed');
    } finally {
      setBusy(false);
    }
  };

  const choose = async (logo) => {
    setSelected(logo.url);
    onSelectLogo(logo.url);
    await base44.entities.BrandProfile.update(profile.id, { logo_url: logo.url }).catch(() => {});
  };

  const download = (logo) => {
    const name = `${profile.business_name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${logo.style.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${size}.png`;
    exportLogo(logo.url, size, name).catch((e) => setError(e.message));
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#00a2ff]" />
        <h3 className="text-sm font-extrabold">Logo Generator — 10 transparent-background concepts</h3>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Resize to</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold outline-none focus:border-[#00a2ff]"
          >
            {LOGO_SIZES.map((s) => <option key={s} value={s}>{s} × {s} px</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {busy ? 'Generating…' : logos.length ? 'Regenerate 10' : 'Generate 10 logos'}
          </Button>
        </div>
      </header>

      {error && (
        <p role="alert" className="mb-2 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      {busy && <p role="status" className="text-sm text-muted-foreground">Generating 10 logo concepts — this takes about a minute…</p>}

      {!busy && !logos.length && (
        <p className="text-sm text-muted-foreground">No logos yet. Generate 10 concepts built from your business name and industry.</p>
      )}

      {!!logos.length && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {logos.map((logo) => {
            const active = selected === logo.url;
            return (
              <div key={logo.url} className={`rounded-xl border p-2 transition ${active ? 'border-[#00a2ff] ring-2 ring-[#00a2ff]/25' : 'border-border hover:border-[#00a2ff]/50'}`}>
                <div className="grid h-24 place-items-center overflow-hidden rounded-lg" style={{ backgroundImage: 'linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)', backgroundSize: '14px 14px', backgroundPosition: '0 0,0 7px,7px -7px,-7px 0' }}>
                  <img src={logo.url} alt={`${profile.business_name} ${logo.style} logo concept`} className="max-h-20 max-w-full object-contain" loading="lazy" />
                </div>
                <p className="mt-1.5 truncate text-[11px] font-bold" title={logo.style}>{logo.style}</p>
                <div className="mt-1 flex items-center gap-1">
                  <Button size="sm" variant={active ? 'default' : 'outline'} className="h-7 flex-1 px-1 text-[10px]" onClick={() => choose(logo)}>
                    {active ? <><Check className="h-3 w-3" /> Applied</> : 'Use'}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-1.5" onClick={() => download(logo)} title={`Download at ${size}px`}>
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}