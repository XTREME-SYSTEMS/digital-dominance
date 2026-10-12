import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
export default function StudioMediaActions({ industry, onAssets }) {
 const [busy,setBusy]=useState(''),[error,setError]=useState(''),[assets,setAssets]=useState({});
 const generate=async type=>{
  setBusy(type);setError('');
  try{
   const result=type==='logo'?await base44.integrations.Core.GenerateImage({prompt:`Create an original geometric logo for an unbranded ${industry} business. No reference brands, trademarks or text. Sophisticated, simple, versatile vector-style mark on white.`}):await base44.integrations.Core.GenerateVideo({prompt:`Original cinematic promotional footage illustrating ${industry} services, careful professional work, warm natural light, no third-party brands, no text, landscape.`,duration:6,aspect_ratio:'16:9',generate_audio:false});
   const next={...assets,[type==='logo'?'logoUrl':'videoUrl']:result.url};setAssets(next);onAssets(next);
  }catch(err){setError(err.message);}finally{setBusy('');}
 };
 return <div className="space-y-3"><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!!busy} onClick={()=>generate('logo')}>{busy==='logo'?'Generating…':'Generate original logo'}</Button><Button variant="outline" disabled={!!busy} onClick={()=>generate('video')}>{busy==='video'?'Generating…':'Generate original video'}</Button></div>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{assets.logoUrl&&<Image src={assets.logoUrl} alt="Original generated brand mark" className="h-16 w-16" fittingType="fit"/>}{assets.videoUrl&&<video src={assets.videoUrl} controls aria-label={`${industry} concept video`} className="max-h-60 w-full rounded-lg"/>}</div>;
}