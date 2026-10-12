import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useStockTemplates from '@/components/template-studio/useStockTemplates';
import StockTemplateCard from '@/components/template-studio/StockTemplateCard';
import StockPreviewDialog from '@/components/template-studio/StockPreviewDialog';

export default function TemplatesShowcase({ onChoose, workspace = false }) {
 const [preview,setPreview]=useState(null);
 const {items,isLoading,error}=useStockTemplates({is_default:true},6);
 return <section id="templates" className={workspace?'rounded-2xl border border-border bg-card p-5 sm:p-6':'bg-muted py-16 md:py-24 text-foreground'}><div className={workspace?'w-full':'mx-auto max-w-7xl px-4 md:px-8'}>
  <div className="mb-10 text-center"><h2 className="font-heading text-3xl font-extrabold">Explore Real Templates</h2><p className="mt-3 text-muted-foreground">The same 200 stock designs available in the studio, with 10 distinct layouts in each industry.</p><Link to={workspace?'/admin/template-studio':'/templates'} className="mt-4 inline-block font-bold underline">View all templates</Link></div>
  {isLoading&&<Loader2 className="mx-auto h-6 w-6 animate-spin" aria-label="Loading templates"/>}
  {error&&<p role="alert" className="text-destructive">Unable to load templates: {error.message}</p>}
  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map(template=><StockTemplateCard key={template.id} template={template} onSelect={setPreview}/>)}</div>
 </div><StockPreviewDialog template={preview} onClose={()=>setPreview(null)} onChoose={onChoose}/></section>;
}