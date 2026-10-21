import React from 'react';
import { Loader2, AlertCircle, Radar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Renders the background industry discovery for one brand profile.
export default function BrandDiscoveryPanel({ profile }) {
  const d = profile?.discovery;
  const status = profile?.discovery_status || 'pending';

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <Radar className="h-4 w-4 text-[#00a2ff]" />
        <h3 className="text-sm font-extrabold">Industry Discovery</h3>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          status === 'ready' ? 'bg-[#16a34a]/10 text-[#16a34a]'
            : status === 'failed' ? 'bg-destructive/10 text-destructive'
              : 'bg-[#00a2ff]/10 text-[#00a2ff]'
        }`}>
          {status === 'ready' ? 'Complete' : status === 'failed' ? 'Failed' : 'Running in background'}
        </span>
      </header>

      {status === 'running' || status === 'pending' ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Scanning {profile.industry_label || profile.industry}
          {profile.city ? ` in ${profile.city}, ${profile.state}` : ''} — services, imagery, materials, slogans, search intent and marketing plays.
        </p>
      ) : null}

      {status === 'failed' && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {profile.discovery_error || 'Discovery failed.'}
        </p>
      )}

      {status === 'ready' && !d && (
        <p className="text-sm text-muted-foreground">Discovery finished without a saved dossier. Run the brand setup again to retry.</p>
      )}

      {status === 'ready' && d && (
        <Tabs defaultValue="services">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="materials">Materials and Tools</TabsTrigger>
            <TabsTrigger value="copy">Hooks &amp; Slogans</TabsTrigger>
            <TabsTrigger value="search">SEO / AEO / GEO</TabsTrigger>
            <TabsTrigger value="trust">Trust Signals</TabsTrigger>
            <TabsTrigger value="marketing">Marketing Plays</TabsTrigger>
            <TabsTrigger value="design">Layouts and Fonts</TabsTrigger>
            <TabsTrigger value="funnel">Funnel and Pages</TabsTrigger>
          </TabsList>

          <div className="mt-4 text-sm">
            {d.summary && <p className="mb-3 rounded-lg bg-muted p-3 text-muted-foreground">{d.summary}</p>}

            <TabsContent value="services">
              <Cards items={d.services} titleKey="name" bodyKey="description" metaKey="buyer_question" metaPrefix="Buyer asks: " />
            </TabsContent>
            <TabsContent value="images">
              <Cards items={d.image_prompts} titleKey="slot" bodyKey="prompt" />
            </TabsContent>
            <TabsContent value="materials">
              <Cards items={d.products_and_tools} titleKey="name" bodyKey="use" metaKey="brand_examples" metaPrefix="Used by: " />
            </TabsContent>
            <TabsContent value="copy">
              <Group title="Hooks that stop the scroll" items={d.hooks} />
              <Group title="Words, phrases and slogans this trade uses" items={d.phrases_and_slogans} />
            </TabsContent>
            <TabsContent value="search">
              <Group title="High-intent SEO keywords" items={d.seo_keywords} />
              <Group title="Questions to answer (AEO)" items={d.aeo_questions} />
              <Group title="Local and entity facts (GEO)" items={d.geo_facts} />
            </TabsContent>
            <TabsContent value="trust">
              <Group title="Credibility signals to surface" items={d.trust_signals} />
            </TabsContent>
            <TabsContent value="marketing">
              <Group title="Top 20 website marketing recommendations" items={d.marketing_recommendations} ordered />
            </TabsContent>
            <TabsContent value="design">
              <Cards items={d.preferred_layouts} titleKey="name" bodyKey="why" />
              <Cards items={d.font_pairings} titleKey="heading" bodyKey="mood" metaKey="body" metaPrefix="Body: " />
            </TabsContent>
            <TabsContent value="funnel">
              <Cards items={d.funnel_placements} titleKey="placement" bodyKey="offer" />
              <Cards items={d.pages} titleKey="title" bodyKey="purpose" listKey="sections" listPrefix="Sections: " />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </section>
  );
}

function Group({ title, items, ordered }) {
  if (!items?.length) return null;
  return (
    <div className="mb-4">
      <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 rounded-lg border border-border px-3 py-1.5">
            {ordered && <span className="font-bold text-[#00a2ff]">{i + 1}.</span>}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cards({ items, titleKey, bodyKey, metaKey, metaPrefix, listKey, listPrefix }) {
  if (!items?.length) return <p className="text-muted-foreground">Nothing captured for this section.</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border p-3">
          {item[titleKey] && <p className="font-bold">{item[titleKey]}</p>}
          {item[bodyKey] && <p className="mt-1 text-muted-foreground">{item[bodyKey]}</p>}
          {metaKey && item[metaKey] && <p className="mt-1 text-xs text-muted-foreground">{metaPrefix}{item[metaKey]}</p>}
          {listKey && item[listKey]?.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{listPrefix}{item[listKey].join(' · ')}</p>}
        </div>
      ))}
    </div>
  );
}