import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Loader2, RefreshCw, Rocket, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import OptimizerMenu from '@/components/site-optimizer/OptimizerMenu';
import OptimizerPanel from '@/components/site-optimizer/OptimizerPanel';
import OptimizerPreview from '@/components/site-optimizer/OptimizerPreview';
import { buildSiteBrief, resolveFixes, scrubBrandedHtml } from '@/lib/brandBrief';
import { openHtmlInBrowser, useLayoutHtml } from '@/lib/x1Preview';

/**
 * The site optimization studio — the page the launch wizard hands over to.
 *
 * Left: every technology in this app that fits, edits, enhances, generates,
 * validates or upgrades a website. Right: the live page at full size, redrawn
 * the moment anything changes.
 *
 * It works on the business the wizard saved: the page is rendered from the same
 * brief and the same scrubbing as the wizard's own preview, so what is optimised
 * here is exactly what ships.
 */
export default function SiteOptimizer() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState(null);
  const [appliedFixes, setAppliedFixes] = useState([]);
  const [chosenImages, setChosenImages] = useState([]);
  const [layout, setLayout] = useState(null);
  const [aiCopy, setAiCopy] = useState(null);
  const [scan, setScan] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [checked, setChecked] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // The business the wizard saved, and the template it was built on.
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const page = await base44.entities.BrandProfile.filter({}, { sort: '-updated_date', limit: 1 });
        const brand = (Array.isArray(page) ? page : page.items || [])[0] || null;
        if (!live) return;
        setProfile(brand);
        if (brand) {
          setAppliedFixes(brand.applied_fixes || []);
          setAiCopy(brand.ai_copy || null);
          setChosenImages((brand.photos || []).filter(photo => photo.slot).map(photo => photo.url));
          const templateId = (brand.pages || [])[0]?.template_id;
          if (templateId) {
            const record = await base44.entities.TemplateLibrary.get(templateId).catch(() => null);
            if (live) setTemplate(record);
          }
        }
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  const siteProfile = useMemo(
    () => ({ ...(profile || {}), industry_label: profile?.industry_label, ai_copy: aiCopy || undefined }),
    [profile, aiCopy],
  );
  const fixes = useMemo(() => resolveFixes(appliedFixes), [appliedFixes]);
  const brief = useMemo(() => buildSiteBrief(siteProfile, fixes), [siteProfile, fixes]);
  const { html: renderedHtml } = useLayoutHtml(template, brief, layout, chosenImages);
  const installed = useMemo(
    () => (renderedHtml ? scrubBrandedHtml(renderedHtml, siteProfile, fixes) : { html: null, installed: [], removed: [] }),
    [renderedHtml, siteProfile, fixes],
  );
  const pageHtml = installed.html;

  const persist = useCallback(async patch => {
    if (!profile?.id) return;
    setProfile(prev => (prev ? { ...prev, ...patch } : prev));
    await base44.entities.BrandProfile.update(profile.id, patch).catch(() => {});
  }, [profile?.id]);

  const applyFixes = useCallback(async ids => {
    if (!ids.length) return;
    const next = [...new Set([...appliedFixes, ...ids])];
    setAppliedFixes(next);
    setChecked([]);
    await persist({ applied_fixes: next });
  }, [appliedFixes, persist]);

  const pickImages = useCallback(async urls => {
    setChosenImages(urls);
    await persist({
      photos: urls.map((url, i) => ({ name: `Generated image ${i + 1}`, url, slot: i === 0 ? 'hero' : `gallery${i}` })),
      image_plan: urls.length ? 'ai_generated' : profile?.image_plan,
    });
  }, [persist, profile?.image_plan]);

  const qaProfile = useMemo(() => ({
    business_name: profile?.business_name, industry: profile?.industry, industry_label: profile?.industry_label,
    services: profile?.services, phone: profile?.phone, email: profile?.email,
    address: profile?.address, city: profile?.city, state: profile?.state,
    territory_radius_miles: profile?.territory_radius_miles,
    has_rating: profile?.has_rating, rating_value: profile?.rating_value, rating_count: profile?.rating_count,
    accent: profile?.accent,
  }), [profile]);

  const callAgents = useCallback(async () => {
    if (!pageHtml) throw new Error('There is no rendered page for the agents to read yet.');
    const res = await base44.functions.invoke('templateQaValidator', {
      html: pageHtml, profile: qaProfile, applied_fixes: appliedFixes,
    });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  }, [pageHtml, qaProfile, appliedFixes]);

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      setScan(await callAgents());
    } catch (e) {
      setScan(null);
      setError(e.message || 'The agents could not finish the scan');
    } finally {
      setScanning(false);
    }
  }, [callAgents]);

  const runCopy = useCallback(async () => {
    setBusy('copy');
    setError(null);
    try {
      const result = await callAgents();
      const copy = (result?.suggestions || []).find(item => item.id === 'ai_copy');
      if (!copy?.payload) throw new Error('The copy agent did not return new copy this time — try again.');
      setAiCopy(copy.payload);
      await applyFixes(['ai_copy']);
      await persist({ ai_copy: copy.payload });
    } catch (e) {
      setError(e.message || 'The copy agent did not come back');
    } finally {
      setBusy(null);
    }
  }, [callAgents, applyFixes, persist]);

  const regenerate = useCallback(ids => {
    const copy = (scan?.suggestions || []).find(item => item.id === 'ai_copy' && ids.includes('ai_copy'));
    if (copy?.payload) {
      setAiCopy(copy.payload);
      persist({ ai_copy: copy.payload });
    }
    applyFixes(ids);
  }, [scan, applyFixes, persist]);

  const actions = {
    back: () => { setActiveTool(null); setError(null); },
    applyFix: applyFixes,
    setLayout,
    pickImages,
    runScan,
    runCopy,
    toggleChecked: id => setChecked(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id])),
    regenerate,
    openTool: route => navigate(route),
    reload: () => setReloadKey(key => key + 1),
  };

  const state = { profile, installed: installed.installed, removed: installed.removed, appliedFixes, layout, chosenImages, scan, scanning, checked, aiCopy, busy, error };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#00a2ff]" aria-label="Loading your page" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6">
        <div className="max-w-md space-y-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#00a2ff]">
            <Rocket className="h-6 w-6 text-white" />
          </span>
          <h1 className="text-lg font-black text-[#0a1220]">No website to optimize yet</h1>
          <p className="text-sm text-gray-500">
            Build one in the launch wizard first — it saves your business details here, and this studio takes over from there.
          </p>
          <Link to="/launch-engine" className="inline-flex items-center gap-2 rounded-xl bg-[#00a2ff] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0090e0]">
            <Rocket className="h-4 w-4" /> Open the launch wizard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Left: every technology */}
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-gray-200 bg-gray-50/60">
        <header className="border-b border-gray-200 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Site optimization studio</p>
          <h1 className="truncate text-sm font-black text-[#0a1220]" title={profile.business_name}>{profile.business_name}</h1>
          <p className="truncate text-[11px] text-gray-500">{profile.industry_label || profile.industry}{profile.city ? ` · ${profile.city}` : ''}</p>
        </header>
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {activeTool
            ? <OptimizerPanel tool={activeTool} state={state} actions={actions} />
            : <OptimizerMenu onSelect={tool => { setActiveTool(tool); setError(null); }} appliedFixes={appliedFixes} />}
        </div>
      </aside>

      {/* Right: the live page, full size */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2">
          <p className="flex items-center gap-1.5 truncate text-[11px] font-bold text-gray-500">
            <ShieldCheck className="h-3.5 w-3.5 text-[#00a2ff]" />
            {installed.installed.length} of your details installed{appliedFixes.length ? ` · ${appliedFixes.length} fixes applied` : ''}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={actions.reload}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 transition hover:border-[#00a2ff] hover:text-[#00a2ff]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reload
            </button>
            <button
              type="button"
              onClick={() => openHtmlInBrowser(pageHtml)}
              disabled={!pageHtml}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 transition hover:border-[#00a2ff] hover:text-[#00a2ff] disabled:opacity-40"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Full screen
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <OptimizerPreview html={pageHtml} reloadKey={reloadKey} />
        </div>
      </main>
    </div>
  );
}