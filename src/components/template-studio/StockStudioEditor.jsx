import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import BrandGenerator from '@/components/launch-engine/BrandGenerator';
import StockTemplatePreview from '@/components/template-studio/StockTemplatePreview';
import StudioMediaActions from '@/components/template-studio/StudioMediaActions';
import GoogleReadinessPanel from '@/components/template-studio/GoogleReadinessPanel';
export default function StockStudioEditor({ template, onBack, onNext }) {
 const [brand,setBrand]=useState(null),[assets,setAssets]=useState({}),[mode,setMode]=useState('desktop');
 const [cycling,setCycling]=useState(false),[cycleError,setCycleError]=useState('');
 const next=async()=>{setCycling(true);setCycleError('');try{await onNext();}catch(error){setCycleError(error.message);}finally{setCycling(false);}};
 const manifest=template.sections?.find(s=>s.section_type==='manifest')?.config;
 const compiled=useQuery({queryKey:['stock-variation',template.id,brand?.accent,assets],enabled:!!brand||!!assets.logoUrl||!!assets.videoUrl,queryFn:async()=>{const res=await base44.functions.invoke('stockTemplateFactory',{action:'compile',industryKey:manifest.industry_key,designKey:manifest.design_key,brand:{accent:brand?.accent,...assets}});return res.data;}});
 const download=async()=>{const html=compiled.data?.html||(await base44.entities.TemplateLibrary.get(template.id)).content;const url=URL.createObjectURL(new Blob([html],{type:'text/html'}));const link=document.createElement('a');link.href=url;link.download=`${template.slug}.html`;link.click();URL.revokeObjectURL(url);};
 return <div className="space-y-5"><div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={onBack}>Back to templates</Button><h2 className="font-heading text-lg font-bold">{template.name}</h2></div><BrandGenerator selected={brand} onSelect={setBrand}/><StudioMediaActions industry={template.niche} onAssets={setAssets}/>
  <div className="flex flex-wrap gap-2"><Button variant={mode==='desktop'?'default':'outline'} onClick={()=>setMode('desktop')}>Desktop</Button><Button variant={mode==='mobile'?'default':'outline'} onClick={()=>setMode('mobile')}>Mobile</Button><Button variant="outline" onClick={next} disabled={cycling}>{cycling?'Loading…':'Next stock design'}</Button><Button variant="outline" onClick={download} disabled={compiled.isFetching}>Download preview HTML</Button></div>
  {cycleError&&<p role="alert" className="text-sm text-destructive">{cycleError}</p>}
  {compiled.isFetching&&<p role="status" className="text-sm text-muted-foreground">Applying original brand assets…</p>}{compiled.error&&<p role="alert" className="text-sm text-destructive">{compiled.error.message}</p>}
  <div className={mode==='mobile'?'mx-auto h-[650px] w-full max-w-[390px] overflow-hidden rounded-xl border border-border':'h-[650px] overflow-hidden rounded-xl border border-border'}><StockTemplatePreview template={template} overrideHtml={compiled.data?.html}/></div>
  <p className="text-sm text-muted-foreground">Stock templates are preview-only. Exact-design mass deployment and verified business contact wiring are the next implementation batch.</p>
  <GoogleReadinessPanel key={template.id} template={template}/>
 </div>;
}