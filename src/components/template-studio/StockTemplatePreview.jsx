import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { STOCK_QUERY } from '@/components/template-studio/useStockTemplates';
export default function StockTemplatePreview({ template, industry, className = 'h-full w-full', overrideHtml, brand }) {
 const {data,isLoading,error}=useQuery({queryKey:['stock-preview',template?.id||template||'',industry||''],enabled:!overrideHtml,queryFn:async()=>{
  if(template?.id)return base44.entities.TemplateLibrary.get(template.id);
  const query={...STOCK_QUERY,...(industry?{niche:industry}:{})};
  if(typeof template==='string'&&template)query.$or=[{slug:template},{name:template},{name:{$regex:template.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'}}];
  else query.is_default=true;
  const page=await base44.entities.TemplateLibrary.filter(query,{limit:1});return page.items[0]||null;
 }});
 if(!overrideHtml&&isLoading)return <div className="flex h-full min-h-48 items-center justify-center bg-card"><Loader2 className="h-6 w-6 animate-spin" aria-label="Loading template"/></div>;
 if(error)return <p role="alert" className="p-6 text-destructive">Unable to load this template: {error.message}</p>;
 if(!overrideHtml&&!data?.content)return <p className="p-6 text-muted-foreground">No matching stock template. Choose a design from this industry’s library.</p>;
 const source=overrideHtml||data.content;
 const html=/^#[0-9a-f]{6}$/i.test(brand?.accent||'')?source.replace(/--accent:#[0-9a-f]{3,6};/i,`--accent:${brand.accent};`):source;
 return <iframe title={data?.name||'Original website template preview'} className={className} srcDoc={html} sandbox="" referrerPolicy="no-referrer" />;
}