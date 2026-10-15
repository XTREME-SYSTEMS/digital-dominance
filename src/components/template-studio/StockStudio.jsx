import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StockTemplateLibrary from '@/components/template-studio/StockTemplateLibrary';
import { STOCK_QUERY } from '@/components/template-studio/useStockTemplates';
import StockStudioEditor from '@/components/template-studio/StockStudioEditor';
import BenchmarkLibrary from '@/components/template-studio/BenchmarkLibrary';
import { localStockById, localStockForIndustry } from '@/lib/localStockCatalog';

export default function StockStudio() {
  const [selected, setSelected] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const { state } = useLocation();
  const selectedId = state?.selectedStockTemplateId;
  const initialLocal = localStockById(selectedId);
  const initial = useQuery({
    queryKey: ['selected-stock-template', selectedId],
    enabled: !!selectedId && !initialLocal && Boolean(appParams.appBaseUrl),
    retry: 1,
    queryFn: () => base44.entities.TemplateLibrary.get(selectedId),
  });
  const active = selected || (!dismissed ? initialLocal || initial.data : null);
  const nextDesign = async () => {
    if (active?.is_local_preview) {
      const designs = localStockForIndustry(active.niche);
      const position = designs.findIndex(t => t.id === active.id);
      setSelected(designs[(position + 1) % designs.length]);
      return;
    }
    const query = { ...STOCK_QUERY, niche: active.niche, sort_order: { $gt: active.sort_order } };
    let page = await base44.entities.TemplateLibrary.filter(query, { sort: 'sort_order', limit: 1 });
    if (!page.items.length) page = await base44.entities.TemplateLibrary.filter(
      { ...STOCK_QUERY, niche: active.niche }, { sort: 'sort_order', limit: 1 });
    setSelected(page.items[0] || null);
  };
  return <main className="mx-auto max-w-7xl space-y-6 p-4 text-foreground md:p-6">
    <header>
      <p className="text-sm font-bold text-muted-foreground">ONE SHARED CATALOGUE</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Template Studio</h1>
      <p className="mt-3 text-muted-foreground">20 industries. 10 distinct complete-page layouts each. Choose, customize and preview before any release.</p>
    </header>
    <Tabs defaultValue="templates">
      <TabsList><TabsTrigger value="templates">Stock templates</TabsTrigger><TabsTrigger value="benchmarks">Benchmark evidence</TabsTrigger></TabsList>
      <TabsContent value="templates" className="mt-6">
        {initial.error && <p role="alert" className="text-destructive">{initial.error.message}</p>}
        {initial.isLoading && !!selectedId ? <p role="status">Loading your selected template…</p>
          : active ? <StockStudioEditor key={active.id} template={active} onNext={nextDesign}
              onBack={() => { setSelected(null); setDismissed(true); }} />
          : <StockTemplateLibrary onSelect={setSelected} />}
      </TabsContent>
      <TabsContent value="benchmarks" className="mt-6"><BenchmarkLibrary /></TabsContent>
    </Tabs>
  </main>;
}