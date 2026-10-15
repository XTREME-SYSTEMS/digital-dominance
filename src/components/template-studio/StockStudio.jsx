import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StockTemplateLibrary from '@/components/template-studio/StockTemplateLibrary';
import { STOCK_QUERY } from '@/components/template-studio/useStockTemplates';
import StockStudioEditor from '@/components/template-studio/StockStudioEditor';
import BenchmarkLibrary from '@/components/template-studio/BenchmarkLibrary';
export default function StockStudio() {
 const [selected,setSelected]=useState(null);
 const [dismissed,setDismissed]=useState(false);
 const {state}=useLocation();
 const initial=useQuery({queryKey:['selected-stock-template',state?.selectedStockTemplateId],enabled:!!state?.selectedStockTemplateId,queryFn:()=>base44.entities.TemplateLibrary.get(state.selectedStockTemplateId)});
 const active=selected||(!dismissed?initial.data:null);
 const draftPlan=state?.draftLaunchPlan?.template_id===state?.selectedStockTemplateId
   ? state.draftLaunchPlan : null;
 const nextDesign=async()=>{
  const query={...STOCK_QUERY,niche:active.niche,sort_order:{$gt:active.sort_order}};
  let page=await base44.entities.TemplateLibrary.filter(query,{sort:'sort_order',limit:1});
  if(!page.items.length)page=await base44.entities.TemplateLibrary.filter({...STOCK_QUERY,niche:active.niche},{sort:'sort_order',limit:1});
  setSelected(page.items[0]);
 };
 return <main className="mx-auto max-w-7xl space-y-6 p-4 text-foreground md:p-6"><header><p className="text-sm font-bold text-muted-foreground">ONE SHARED CATALOGUE</p><h1 className="mt-2 font-heading text-3xl font-extrabold">Template Studio</h1><p className="mt-3 text-muted-foreground">20 industries. 10 distinct designs each. The exact templates shown on the homepage.</p></header>
 {draftPlan&&<section role="status" aria-label="Draft website launch request" className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-slate-900">
  <p className="text-sm font-extrabold text-sky-900">Launch request draft · PENDING MARKET REVIEW</p>
  <p className="mt-2 text-sm">Requested: <strong>{draftPlan.requested_site_count} sites</strong> for <strong>{draftPlan.industry}</strong>.
   Proposed markets: <strong>{draftPlan.proposed_markets?.length?draftPlan.proposed_markets.join(', '):'Not selected yet'}</strong>.</p>
  <p className="mt-2 text-xs text-slate-700">These are operator inputs, not verified markets. This draft exists only in the current Studio navigation state. No job has been queued, no site generated, and no release approved.</p>
 </section>}
 <Tabs defaultValue="templates"><TabsList><TabsTrigger value="templates">Stock templates</TabsTrigger><TabsTrigger value="benchmarks">Benchmark evidence</TabsTrigger></TabsList><TabsContent value="templates" className="mt-6">{initial.error&&<p role="alert" className="text-destructive">{initial.error.message}</p>}{initial.isLoading&&state?.selectedStockTemplateId?<p role="status">Loading your selected template…</p>:active?<StockStudioEditor key={active.id} template={active} onNext={nextDesign} onBack={()=>{setSelected(null);setDismissed(true);}}/>:<StockTemplateLibrary onSelect={setSelected}/>}</TabsContent><TabsContent value="benchmarks" className="mt-6"><BenchmarkLibrary/></TabsContent></Tabs></main>;
}