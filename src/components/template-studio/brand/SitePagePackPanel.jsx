import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Layers, Maximize2, Download, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';

const COUNTS = [
  { value: 5, label: '5 pages', desc: 'Home, Services, Service Area, About, Free Estimate' },
  { value: 6, label: '6 pages', desc: 'Adds the project gallery' },
  { value: 7, label: '7 pages', desc: 'Adds a dedicated request-a-quote funnel page' },
];

function openInNewTab(html) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function saveHtml(html, slug) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slug}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

// One-click build of the full page pack for this brand.
export default function SitePagePackPanel({ profile, onBuilt }) {
  const [pages, setPages] = useState(profile?.pages || []);
  const [count, setCount] = useState(7);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [openingKey, setOpeningKey] = useState('');
  const packTag = `brand-${profile.id}`;

  // Pick up a pack built in an earlier session.
  useEffect(() => {
    setPages(profile?.pages || []);
    if (profile?.pages?.length) return undefined;
    let live = true;
    base44.entities.TemplateLibrary
      .filter({ tags: packTag }, { sort: 'sort_order', limit: 10, fields: ['id', 'name', 'slug', 'category', 'sort_order', 'preview_image_url'] })
      .then((page) => {
        if (!live || !page?.items?.length) return;
        setPages(page.items.map((item) => ({ key: item.slug, title: item.name.split(' — ').pop(), path: `/${item.slug}`, category: item.category, template_id: item.id })));
      })
      .catch((e) => console.warn('Page pack load failed:', e.message));
    return () => { live = false; };
  }, [profile?.id]);

  const build = async () => {
    setBuilding(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('pagePackGenerator', { profile_id: profile.id, page_count: count });
      setPages(res.data.pages || []);
      onBuilt?.(res.data.pages || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Could not build the page pack');
    } finally {
      setBuilding(false);
    }
  };

  const withContent = async (page, action) => {
    setOpeningKey(page.key);
    try {
      const record = page.template_id
        ? await base44.entities.TemplateLibrary.get(page.template_id)
        : (await base44.entities.TemplateLibrary.filter({ slug: page.key, tags: packTag }, { limit: 1 })).items[0];
      if (!record?.content) throw new Error('This page has no saved content yet.');
      if (action === 'view') setPreview({ title: `${profile.business_name} — ${page.title}`, html: record.content });
      if (action === 'tab') openInNewTab(record.content);
      if (action === 'download') saveHtml(record.content, record.slug || page.key);
    } catch (e) {
      setError(e.message || 'Could not open this page');
    } finally {
      setOpeningKey('');
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <Layers className="h-4 w-4 text-[#00a2ff]" />
        <h3 className="text-sm font-extrabold">One-click website build</h3>
        <p className="w-full text-xs text-muted-foreground sm:w-auto">
          Every page written from your industry research, with your logo, colors and contact details.
        </p>
      </header>

      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {COUNTS.map((option) => (
          <button
            key={option.value}
            onClick={() => setCount(option.value)}
            aria-pressed={count === option.value}
            className={`rounded-xl border p-3 text-left transition ${count === option.value ? 'border-[#00a2ff] ring-2 ring-[#00a2ff]/25' : 'border-border hover:border-[#00a2ff]/50'}`}
          >
            <span className="text-sm font-bold">{option.label}</span>
            <p className="mt-1 text-xs text-muted-foreground">{option.desc}</p>
          </button>
        ))}
      </div>

      <Button onClick={build} disabled={building} style={{ background: 'linear-gradient(135deg,#126fc8,#0d9488)', color: '#fff' }}>
        {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {building ? 'Writing pages and generating images…' : pages.length ? `Rebuild my ${count}-page site` : `Build my ${count}-page site`}
      </Button>

      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      {!!pages.length && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <div key={page.key} className="rounded-xl border border-border p-3">
              <p className="text-sm font-bold">{page.title}</p>
              <p className="text-xs text-muted-foreground">{page.path}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => withContent(page, 'view')} disabled={openingKey === page.key}>
                  {openingKey === page.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />} Preview
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => withContent(page, 'tab')}>
                  <Maximize2 className="h-3 w-3" /> Full screen
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => withContent(page, 'download')}>
                  <Download className="h-3 w-3" /> HTML
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader><DialogTitle>{preview?.title}</DialogTitle></DialogHeader>
          {preview && (
            <iframe title={preview.title} className="h-[72vh] w-full rounded-lg border border-border" srcDoc={preview.html} sandbox="" referrerPolicy="no-referrer" />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}