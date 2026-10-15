import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { STOCK_INDUSTRIES, STOCK_VERSION } from '../../../base44/shared/stockIndustries.js';
import { STOCK_DESIGNS } from '../../../base44/shared/stockDesigns.js';
import { stockTemplateRecord } from '../../../base44/shared/stockTemplateCompiler.js';
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
 const location=useLocation();
 const {state}=location;
 const routeStock = React.useMemo(() => {
  const slug=new URLSearchParams(location.search).get("stock");
  if (!slug || !/^stock-[a-z0-9_-]+$/.test(slug)) return null;
  const ind=STOCK_INDUSTRIES.find(i => slug.startsWith("stock-"+i.key+"-"));
  if (!ind) return null;
  const key=slug.slice(("stock-"+ind.key+"-").length);
  const idx=STOCK_DESIGNS.findIndex(d => d.key===key);
  if (idx<0) return null;
  const rec=stockTemplateRecord(ind,STOCK_DESIGNS[idx],idx,STOCK_VERSION);
  return {...rec,id:"source-"+ind.key+"-"+key,
    source_version:STOCK_VERSION,catalog_source:"canonical_public_stock_compiler",preview_only:true};
 },[location.search]);
 const initial=useQuery({queryKey:['selected-stock-template',state?.selectedStockTemplateId],enabled:!!state?.selectedStockTemplateId,queryFn:()=>base44.entities.TemplateLibrary.get(state.selectedStockTemplateId)});
 const active=selected||(!dismissed?(state?.selectedStockTemplateSnapshot||routeStock||initial.data):null);
 const nextDesign=async()=>{
  if (active?.preview_only) {
    const manifest=active.sections?.find(s=>s.section_type==='manifest')?.config;
    const ind=STOCK_INDUSTRIES.find(i=>i.key===manifest?.industry_key);
    const idx=STOCK_DESIGNS.findIndex(d=>d.key===manifest?.design_key);
    if (!ind || idx<0) throw new Error("Local template source mismatch");
    const nextIdx=(idx+1)%STOCK_DESIGNS.length;
    const design=STOCK_DESIGNS[nextIdx];
    const rec=stockTemplateRecord(ind,design,nextIdx,STOCK_VERSION);
    setSelected({...rec,id:"source-"+ind.key+"-"+design.key,
      catalog_source:"canonical_public_stock_compiler",preview_only:true});
    return;
  }
  const query={...STOCK_QUERY,niche:active.niche,sort_order:{$gt:active.sort_order}};
  let page=await base44.entities.TemplateLibrary.filter(query,{sort:'sort_order',limit:1});
  if(!page.items.length)page=await base44.entities.TemplateLibrary.filter({...STOCK_QUERY,niche:active.niche},{sort:'sort_order',limit:1});
  setSelected(page.items[0]);
 };
 return <main className="mx-auto max-w-7xl space-y-6 p-4 text-foreground md:p-6"><header><p className="text-sm font-bold text-muted-foreground">ONE SHARED CATALOGUE</p><h1 className="mt-2 font-heading text-3xl font-extrabold">Template Studio</h1><p className="mt-3 text-muted-foreground">20 industries. 10 distinct designs each. The exact templates shown on the homepage.</p></header><Tabs defaultValue="templates"><TabsList><TabsTrigger value="templates">Stock templates</TabsTrigger><TabsTrigger value="benchmarks">Benchmark evidence</TabsTrigger></TabsList><TabsContent value="templates" className="mt-6">{initial.error&&<p role="alert" className="text-destructive">{initial.error.message}</p>}{initial.isLoading&&state?.selectedStockTemplateId?<p role="status">Loading your selected template…</p>:active?<StockStudioEditor key={active.id} template={active} onNext={nextDesign} onBack={()=>{setSelected(null);setDismissed(true);}}/>:<StockTemplateLibrary onSelect={setSelected}/>}</TabsContent><TabsContent value="benchmarks" className="mt-6"><BenchmarkLibrary/></TabsContent></Tabs></main>;
}