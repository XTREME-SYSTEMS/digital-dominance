import React, { useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import BenchmarkReferenceCard from '@/components/template-studio/BenchmarkReferenceCard';
export default function BenchmarkLibrary() {
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[industry,setIndustry]=useState('');
 const client=useQueryClient();const query=industry?{industry}:{};
 const records=useInfiniteQuery({queryKey:['industry-benchmarks',query],initialPageParam:null,queryFn:({pageParam})=>base44.entities.IndustryBenchmark.filter(query,{sort:'industry',limit:20,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:p=>p.has_more?p.next_cursor:undefined});
 const industries=useQuery({queryKey:['benchmark-industries'],queryFn:()=>base44.entities.IndustryBenchmark.list({distinct:'industry',limit:50})});
 const total=useQuery({queryKey:['industry-benchmark-count',query],queryFn:()=>base44.entities.IndustryBenchmark.count(query)});
 const capture=async record=>{setBusy(record.id);setError('');try{await base44.functions.invoke('industryBenchmarkCapture',{benchmarkId:record.id});}catch(err){setError(err.response?.data?.error||err.message);}finally{await client.invalidateQueries({queryKey:['industry-benchmarks']});setBusy('');}};
 return <section className="space-y-5"><h2 className="font-heading text-2xl font-bold">Evidence Library</h2><p className="text-sm text-muted-foreground">{total.data??'…'} curated research references. This initial corpus is not the requested 400-site ranking study. Captures measure public homepage structure, visual tokens and visible capabilities; they do not reveal private operations.</p><label className="block text-sm font-bold">Industry<select value={industry} onChange={e=>setIndustry(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3"><option value="">All industries</option>{industries.data?.items?.map(i=><option key={i} value={i}>{i}</option>)}</select></label>
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{records.isLoading&&<p role="status">Loading references…</p>}{records.error&&<p role="alert" className="text-destructive">{records.error.message}</p>}
  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{records.data?.pages.flatMap(p=>p.items).map(r=><BenchmarkReferenceCard key={r.id} record={r} onCapture={capture} busy={busy===r.id}/>)}</div>
  {records.hasNextPage&&<Button variant="outline" onClick={()=>records.fetchNextPage()} disabled={records.isFetchingNextPage}>Load more references</Button>}
 </section>;
}