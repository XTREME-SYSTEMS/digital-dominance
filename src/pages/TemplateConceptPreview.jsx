import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Monitor, Smartphone, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StockTemplatePreview from '@/components/template-studio/StockTemplatePreview';
import BrandGenerator from '@/components/launch-engine/BrandGenerator';
import { localStockById, localStockForIndustry } from '@/lib/localStockCatalog';

// Public PREVIEW studio only. It never calls production publishing or lead APIs.
export default function TemplateConceptPreview() {
  const { slug } = useParams();
  const template = localStockById(slug);
  const [brand, setBrand] = useState(null);
  const [device, setDevice] = useState('desktop');
  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    const previous = existing?.content;
    const element = existing || document.createElement('meta');
    element.name = 'robots';
    element.content = 'noindex,nofollow,noarchive';
    if (!existing) document.head.appendChild(element);
    return () => { if (existing) element.content = previous || ''; else element.remove(); };
  }, []);

  if (!template) return <main className="min-h-screen bg-[#071a30] p-8 text-white">
    <h1 className="text-3xl font-bold">This template was not found.</h1>
    <Link className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-3" to="/templates">Browse 200 website previews</Link>
  </main>;

  const variations = localStockForIndustry(template.niche);
  const current = variations.findIndex(t => t.slug === template.slug);
  const next = variations[(current + 1) % variations.length];
  const download = () => {
    const html = /^#[0-9a-f]{6}$/i.test(brand?.accent || '')
      ? template.content.replace(/--accent:#[0-9a-f]{3,6};/i, '--accent:' + brand.accent + ';')
      : template.content;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = template.slug + '.html';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <main className="min-h-screen bg-[#061a33] text-white">
    <header className="border-b border-white/15 bg-[#031121] px-4 py-5 sm:px-8">
      <nav className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4">
        <Link to="/templates" className="inline-flex items-center gap-2 font-bold text-[#8cdeff] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All templates
        </Link>
        <p className="text-sm font-bold tracking-wider">DIGITAL DOMINANCE / VISUAL STUDIO</p>
        <Link to="/" className="text-sm text-slate-300 hover:text-white">Back to homepage</Link>
      </nav>
    </header>
    <div className="mx-auto max-w-[1480px] space-y-6 px-4 py-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-[#5cd3ff]">{template.niche_label} · {template.is_local_preview ? 'Original compiler design' : 'Design'}</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{template.name}</h1>
          <p className="mt-3 max-w-3xl text-slate-300">{template.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={'/preview-template/' + next.slug} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/25 px-4 font-bold hover:bg-white/10">
            Next design <ArrowRight className="h-4 w-4" />
          </Link>
          <Button onClick={download} className="min-h-11 bg-[#0877ea] font-bold text-white hover:bg-blue-500">
            <Download className="mr-2 h-4 w-4" /> Download HTML
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-[#5cd3ff]/25 bg-[#0b2b4d] p-4">
        <p className="flex items-start gap-2 text-sm leading-6 text-[#d5f3ff]">
          <ShieldCheck className="mt-1 h-4 w-4 shrink-0" />
          <span><strong>Preview-only concept.</strong> This full-page website renders from the existing original stock compiler. Business names and imagery are illustrative. Live launch, lead forms and customer communication require verified business data, independent QA and explicit release approval.</span>
        </p>
      </div>
      <section className="rounded-xl border border-white/15 bg-white p-4 text-[#0b1b33]">
        <h2 className="mb-3 text-lg font-extrabold">Customize your preview</h2>
        <BrandGenerator selected={brand} onSelect={setBrand} />
      </section>
      <div className="flex flex-wrap justify-between gap-3">
        <div className="inline-flex gap-2">
          <Button variant={device === 'desktop' ? 'default' : 'outline'} onClick={() => setDevice('desktop')}>
            <Monitor className="mr-2 h-4 w-4" /> Desktop
          </Button>
          <Button variant={device === 'mobile' ? 'default' : 'outline'} onClick={() => setDevice('mobile')}>
            <Smartphone className="mr-2 h-4 w-4" /> Mobile
          </Button>
        </div>
        <span className="self-center text-xs text-slate-300">Scroll inside the website to review every section.</span>
      </div>
      <div className={device === 'mobile' ? 'mx-auto h-[760px] w-full max-w-[390px] overflow-hidden rounded-xl border-4 border-slate-500 bg-white shadow-2xl' : 'h-[760px] w-full overflow-hidden rounded-xl border border-white/20 bg-white shadow-2xl'}>
        <StockTemplatePreview template={template} brand={brand} />
      </div>
      <div className="border-t border-white/15 py-6 text-sm text-slate-300">
        This is a design preview and downloadable HTML artifact, not a published business website. Noindex until independent production validation.
      </div>
    </div>
  </main>;
}