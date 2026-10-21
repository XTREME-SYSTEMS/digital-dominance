import React, { useState } from 'react';
import { Building2, Globe, Sparkles, MapPin, Palette, Rocket, Check, Loader2, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import IndustryPicker from '@/components/template-studio/brand/IndustryPicker';
import PalettePicker from '@/components/template-studio/brand/PalettePicker';

const STEPS = [
  { key: 'business', label: 'Business', icon: Building2 },
  { key: 'website', label: 'Website', icon: Globe },
  { key: 'industry', label: 'Industry', icon: Sparkles },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'colors', label: 'Colors', icon: Palette },
  { key: 'review', label: 'Start', icon: Rocket },
];

export default function BrandSetupWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [websiteMode, setWebsiteMode] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [industryLabel, setIndustryLabel] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [palette, setPalette] = useState(null);
  const [domains, setDomains] = useState(null);
  const [checking, setChecking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  const canAdvance = [
    businessName.trim().length > 1,
    websiteMode === 'existing' ? websiteUrl.trim().length > 3 : websiteMode === 'new',
    !!industry,
    city.trim().length > 1 && state.trim().length === 2,
    !!palette,
    true,
  ][step];

  const checkDomains = async () => {
    setChecking(true);
    setError(null);
    setDomains(null);
    try {
      const res = await base44.functions.invoke('generateBrandIdentity', {
        action: 'check_domains',
        businessName,
      });
      setDomains(res.data.domains || []);
    } catch (e) {
      setError(e.message || 'Could not check domain availability');
    } finally {
      setChecking(false);
    }
  };

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const profile = await base44.entities.BrandProfile.create({
        business_name: businessName.trim(),
        website_mode: websiteMode,
        website_url: websiteMode === 'existing' ? websiteUrl.trim() : '',
        industry,
        industry_label: industryLabel,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        palette_id: palette.id,
        palette,
        status: 'configured',
        discovery_status: 'pending',
      });
      // Discovery runs in the background — the studio is usable while it works.
      base44.functions.invoke('industryDiscovery', {
        profile_id: profile.id,
        industry,
        industry_label: industryLabel,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        business_name: businessName.trim(),
      }).catch((e) => console.warn('Industry discovery failed:', e.message));
      onComplete(profile);
    } catch (e) {
      setError(e.message || 'Could not save your brand profile');
    } finally {
      setStarting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#126fc8] to-[#0d9488]">
          <Palette className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-heading text-base font-extrabold">Brand Generator</h2>
          <p className="text-xs text-muted-foreground">Answer {STEPS.length} quick questions — discovery, logos and content build from your answers.</p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={s.key}
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                active ? 'border-[#00a2ff] bg-[#00a2ff]/10 text-[#00a2ff]'
                  : done ? 'border-[#16a34a]/40 text-[#16a34a]'
                    : 'border-border text-muted-foreground'
              }`}
            >
              {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              {s.label}
            </button>
          );
        })}
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">What is your business called?</label>
          <input
            autoFocus
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Summit Concrete Coatings"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold outline-none focus:border-[#00a2ff]"
          />
          <p className="text-xs text-muted-foreground">This name is used for your logo concepts, domain suggestions and every page headline.</p>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">Do you already have a website?</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { id: 'existing', title: 'Yes — I have one', desc: 'We scan it for your services, wording and imagery.' },
              { id: 'new', title: 'No — I need a new one', desc: 'We suggest available domains you can buy.' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setWebsiteMode(opt.id)}
                className={`rounded-xl border p-3 text-left transition ${websiteMode === opt.id ? 'border-[#00a2ff] ring-2 ring-[#00a2ff]/25' : 'border-border hover:border-[#00a2ff]/50'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold">{opt.title}</span>
                  {websiteMode === opt.id && <Check className="h-3.5 w-3.5 text-[#00a2ff]" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>

          {websiteMode === 'existing' && (
            <input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[#00a2ff]"
            />
          )}

          {websiteMode === 'new' && (
            <div className="space-y-2">
              <Button variant="outline" onClick={checkDomains} disabled={checking || businessName.trim().length < 2}>
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {checking ? 'Checking availability…' : 'Suggest available domains'}
              </Button>
              {domains && (
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {domains.map((d) => (
                    <li key={d.domain} className="flex items-center justify-between rounded-lg border border-border px-3 py-1.5 text-xs">
                      <span className="font-semibold">{d.domain}</span>
                      <span className={d.available === true ? 'font-bold text-[#16a34a]' : d.available === false ? 'text-muted-foreground' : 'text-amber-600'}>
                        {d.available === true ? 'Available' : d.available === false ? 'Taken' : 'Unknown'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">What industry are you in? (20 most popular service industries)</label>
          <IndustryPicker
            value={industry}
            onSelect={(key, label) => { setIndustry(key); setIndustryLabel(label); }}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">Where is your business located?</label>
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (e.g. Fort Lauderdale)"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[#00a2ff]"
            />
            <input
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="FL"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm uppercase outline-none focus:border-[#00a2ff]"
            />
          </div>
          <p className="text-xs text-muted-foreground">Your city and state drive local SEO, service-area pages and the questions buyers ask in your market.</p>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">Pick your color palette</label>
          <PalettePicker value={palette?.id} onSelect={(id, p) => setPalette(p)} />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3">
          <div className="rounded-xl bg-muted p-4 text-sm">
            <Row label="Business" value={businessName} />
            <Row label="Website" value={websiteMode === 'existing' ? websiteUrl : 'New site (domain suggestions ready)'} />
            <Row label="Industry" value={industryLabel} />
            <Row label="Location" value={`${city}, ${state}`} />
            <Row label="Palette" value={palette?.name} />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#00a2ff]/30 bg-[#00a2ff]/5 p-3 text-xs">
            <Sparkles className="h-4 w-4 text-[#00a2ff]" />
            <span>Starting now, we run an exhaustive industry discovery in the background — services, images, materials and tools, hooks, phrases and slogans, SEO/AEO/GEO targeting and the top 20 marketing plays.</span>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      <footer className="mt-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || starting}>Back</Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>Next</Button>
        ) : (
          <Button onClick={start} disabled={starting}>
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {starting ? 'Saving…' : 'Start discovery & generate logos'}
          </Button>
        )}
      </footer>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value || '—'}</span>
    </div>
  );
}