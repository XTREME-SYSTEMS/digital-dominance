import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { captureIndustryBenchmark } from '../../shared/benchmarkCapture.js';
export default async function(req){
 try{
  const base44=createClientFromRequest(req);const user=await base44.auth.me();
  if(!user)return Response.json({error:'Unauthorized'},{status:401});
  if(user.role!=='admin')return Response.json({error:'Forbidden'},{status:403});
  const {benchmarkId}=await req.json();
  if(typeof benchmarkId!=='string'||!benchmarkId)return Response.json({error:'Select a benchmark reference'},{status:400});
  const record=await base44.entities.IndustryBenchmark.get(benchmarkId);
  if(!record?.reference_key?.startsWith('reference-'))return Response.json({error:'Only curated public references can be captured'},{status:400});
  try{
   const changes=await captureIndustryBenchmark(base44,record);
   await base44.entities.IndustryBenchmark.update(record.id,changes);
   return Response.json({id:record.id,status:changes.evidence_status,capabilities:changes.capabilities.length,captured_at:changes.captured_at});
  }catch(error){
   console.error('Benchmark capture:',error.message);
   await base44.entities.IndustryBenchmark.update(record.id,{evidence_status:'blocked',error:error.message.slice(0,2000)});
   return Response.json({error:error.message,status:'blocked'},{status:422});
  }
 }catch(error){console.error('Industry benchmark:',error.message);return Response.json({error:error.message},{status:500});}
}