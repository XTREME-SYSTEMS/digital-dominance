import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Button } from '@/components/ui/button';
export default function BenchmarkReferenceCard({ record, onCapture, busy }) {
 const screenshot=useQuery({queryKey:['benchmark-screenshot',record.screenshot_uri],enabled:!!record.screenshot_uri,staleTime:180000,queryFn:()=>base44.integrations.Core.CreateFileSignedUrl({file_uri:record.screenshot_uri,expires_in:300})});
 return <article className="space-y-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
  {screenshot.data?.signed_url?<Image src={screenshot.data.signed_url} alt={`${record.name} captured homepage`} className="block aspect-[4/3] w-full rounded-lg"/>:<div className="grid aspect-[4/3] place-items-center rounded-lg bg-muted p-6 text-center text-sm text-muted-foreground">{record.evidence_status==='captured'?'Loading private capture…':'Homepage capture not yet available'}</div>}
  <div><p className="text-xs font-bold text-muted-foreground">{record.industry} · {record.evidence_status}</p><h3 className="break-words font-heading text-base font-bold">{record.name}</h3></div>
  <p className="text-sm text-muted-foreground">{record.selection_basis}</p><div className="flex flex-wrap gap-4 text-sm"><a href={record.url} target="_blank" rel="noreferrer" className="underline">Visit website</a><a href={record.source_url} target="_blank" rel="noreferrer" className="underline">Research source</a></div>
  <Button variant="outline" onClick={()=>onCapture(record)} disabled={busy}>{busy?'Capturing…':record.evidence_status==='captured'?'Refresh evidence':'Capture and analyze'}</Button>{record.error&&<p className="text-sm text-destructive">{record.error}</p>}
  {!!record.capabilities?.length&&<details><summary className="cursor-pointer text-sm font-bold">Observed capabilities</summary><div className="mt-3 space-y-3">{record.capabilities.map(c=><div key={c.name}><h4 className="text-sm font-bold">{c.category} / {c.name}</h4><p className="text-sm">{c.description}</p><p className="text-sm text-muted-foreground">Benefit: {c.benefit}</p><p className="text-xs text-muted-foreground">Evidence: {c.evidence} · {c.verification}</p></div>)}</div></details>}
  <details><summary className="cursor-pointer text-sm font-bold">Rights review and unknowns</summary><ul className="mt-2 list-disc space-y-2 pl-4 text-sm text-muted-foreground">{[...(record.rebrand_review||['Original assets and legal review required; rebranding does not automatically make a clone lawful.']),...(record.unknowns||[])].map(t=><li key={t}>{t}</li>)}</ul></details>
 </article>;
}