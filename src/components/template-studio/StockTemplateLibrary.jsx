import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useStockTemplates from '@/components/template-studio/useStockTemplates';
import StockTemplateCard from '@/components/template-studio/StockTemplateCard';
export default function StockTemplateLibrary({ onSelect, initialIndustry = '', limit = 20 }) {
 const [industry,setIndustry]=useState(initialIndustry),[search,setSearch]=useState(''),[term,setTerm]=useState('');
 useEffect(()=>{const timer=setTimeout(()=>setTerm(search.trim()),300);return()=>clearTimeout(timer);},[search]);
 const categories=useStockTemplates({is_default:true},20);
 const conditions={...(industry?{niche:industry}:{}),...(term?{name:{$regex:term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'}}:{})};
 const library=useStockTemplates(conditions,limit);
 return <div className="space-y-5">
  <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="stock-industry" className="mb-2 block text-sm font-bold">Industry</label><select id="stock-industry" value={industry} onChange={e=>setIndustry(e.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground"><option value="">All industries</option>{categories.items.map(t=><option key={t.id} value={t.niche}>{t.niche}</option>)}</select></div><div><label htmlFor="stock-search" className="mb-2 block text-sm font-bold">Search templates</label><input id="stock-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by industry or design" className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground"/></div></div>
  <p className="text-sm text-muted-foreground">{library.total===undefined?'Loading catalogue…':`${library.total} matching stock templates`} · Original concept photography · No invented reviews or ratings</p>
  {library.isLoading&&<Loader2 className="h-6 w-6 animate-spin" aria-label="Loading designs"/>}
  {library.error&&<p role="alert" className="text-destructive">Unable to load templates: {library.error.message}</p>}
  {!library.isLoading&&!library.error&&!library.items.length&&<p className="rounded-lg border border-border p-6 text-muted-foreground">No designs match your search.</p>}
  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{library.items.map(t=><StockTemplateCard key={t.id} template={t} onSelect={onSelect}/>)}</div>
  {library.hasNextPage&&<Button variant="outline" disabled={library.isFetchingNextPage} onClick={()=>library.fetchNextPage()}>{library.isFetchingNextPage?'Loading…':'Load more templates'}</Button>}
 </div>;
}