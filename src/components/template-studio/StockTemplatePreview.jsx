import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { STOCK_QUERY } from '@/components/template-studio/useStockTemplates';
import { getBuiltinStockTemplateById, getBuiltinStockPage, isStockBackendUnavailable } from '@/lib/stockCatalogFallback';
export default function StockTemplatePreview({ template, industry, className = 'h-full w-full', overrideHtml, brand }) {
 const {data,isLoading,error}=useQuery({queryKey:['stock-preview',template?.id||template||'',industry||''],enabled:!overrideHtml,queryFn:async()=>{
  // A complete bundled or remote record is already the exact preview source.
  if(template?.content)return template;
  if(template?.id){
    const builtIn=getBuiltinStockTemplateById(template.id);
    if(builtIn)return builtIn;
    try{return await base44.entities.TemplateLibrary.get(template.id);}
    catch(error){
      if(!isStockBackendUnavailable(error))throw error;
      return getBuiltinStockTemplateById(template.slug)||null;
    }
  }
  const query={...STOCK_QUERY,...(industry?{niche:industry}:{})};
  if(typeof template==='string'&&template)query.$or=[{slug:template},{name:template},{name:{$regex:template.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'}}];
  else query.is_default=true;
  try {
    const page=await base44.entities.TemplateLibrary.filter(query,{limit:1});
    if(page?.items?.length)return page.items[0];
  } catch(error) {
    if(!isStockBackendUnavailable(error))throw error;
  }
  return getBuiltinStockPage(query,{limit:1}).items[0]||null;
 }});
 if(!overrideHtml&&isLoading)return <div className="flex h-full min-h-48 items-center justify-center bg-card"><Loader2 className="h-6 w-6 animate-spin" aria-label="Loading template"/></div>;
 if(error)return <p role="alert" className="p-6 text-destructive">Unable to load this template: {error.message}</p>;
 if(!overrideHtml&&!data?.content)return <p className="p-6 text-muted-foreground">No matching stock template. Choose a design from this industry’s library.</p>;
 let source=overrideHtml||data.content;
 if(brand?.colorScheme?.accent&&/^#[0-9a-f]{3,6}$/i.test(brand.colorScheme.accent)){
   source=source.replace(/--accent:#[0-9a-f]{3,6};/gi,`--accent:${brand.colorScheme.accent};`);
   source=source.replace(/--accent-light:#[0-9a-f]{3,6};/gi,`--accent-light:${brand.colorScheme.accentLight};`);
 } else if(brand?.accent&&/^#[0-9a-f]{3,6}$/i.test(brand.accent)){
   source=source.replace(/--accent:#[0-9a-f]{3,6};/gi,`--accent:${brand.accent};`);
 }
 if(brand?.businessName){
   source=source.replace(/<h1[^>]*>.*?<\/h1>/i,`<h1>${brand.businessName.replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</h1>`);
 }
 if(brand?.logo?.url){
   source=source.replace(/<img[^>]*class="[^"]*logo[^"]*"[^>]*>/i,`<img src="${brand.logo.url}" alt="logo" style="max-height:48px;object-fit:contain;" />`);
 }
 if(brand?.phone){
   const safePhone=brand.phone.replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
   // Replace all tel: href values with the user's phone
   source=source.replace(/href="tel:[^"]*"/gi,`href="tel:${safePhone.replace(/\s/g,'')}"`);
   // Replace displayed phone numbers in (555) XXX-XXXX format
   source=source.replace(/\(555\)\s*\d{3}-\d{4}/g,safePhone);
 }
 return <iframe title={data?.name||'Original website template preview'} className={className} srcDoc={source} sandbox="" referrerPolicy="no-referrer" />;
}