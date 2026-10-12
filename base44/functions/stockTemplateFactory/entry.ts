import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { STOCK_INDUSTRIES, STOCK_VERSION } from '../../shared/stockIndustries.js';
import { STOCK_DESIGNS } from '../../shared/stockDesigns.js';
import { stockTemplateRecord, compileStockTemplate } from '../../shared/stockTemplateCompiler.js';
import { assessGoogleReadiness } from '../../shared/googleReadiness.js';
import { openBenchmarkBrowser, loadStockDocument, screenshotFile } from '../../shared/benchmarkBrowser.js';
export default async function(req) {
 let browser;
 try {
  const base44=createClientFromRequest(req);const user=await base44.auth.me();
  if(!user)return Response.json({error:'Unauthorized'},{status:401});
  if(user.role!=='admin')return Response.json({error:'Forbidden'},{status:403});
  const body=await req.json();const svc=base44.asServiceRole;
  if(body.action==='seed'){
   const records=STOCK_INDUSTRIES.flatMap(industry=>STOCK_DESIGNS.map((design,index)=>stockTemplateRecord(industry,design,index,STOCK_VERSION)));
   const library=await svc.entities.TemplateLibrary.upsert(records,{key:'slug'});
   if(body.references!==false)await svc.entities.IndustryBenchmark.upsert(STOCK_INDUSTRIES.map(ind=>({reference_key:`reference-${ind.key}`,industry_key:ind.key,industry:ind.label,name:new URL(ind.benchmark.url).hostname,url:ind.benchmark.url,source_url:ind.benchmark.source,selection_basis:`Research reference, not a verified global ranking. ${ind.benchmark.pattern}`,evidence_status:'reference',unknowns:['Visual capture not yet collected','Public UI does not reveal server-side implementation','Rank and traffic not independently measured']})),{key:'reference_key'});
   return Response.json({created:library.created,updated:library.updated,templates:records.length,industries:STOCK_INDUSTRIES.length,designsPerIndustry:STOCK_DESIGNS.length,version:STOCK_VERSION});
  }
  if(body.action==='captureStock'){
   const page=await svc.entities.TemplateLibrary.filter({tags:{$all:[STOCK_VERSION]},is_default:true},{sort:'niche',limit:Math.min(5,Math.max(1,Number(body.limit)||5)),...(body.cursor?{cursor:body.cursor}:{})});
   browser=await openBenchmarkBrowser();const captured=[];
   for(const record of page.items){
    await loadStockDocument(browser,record.content);
    const {file_url}=await svc.integrations.Core.UploadPublicFile({file:await screenshotFile(browser)});
    await svc.entities.TemplateLibrary.update(record.id,{preview_image_url:file_url});
    captured.push({id:record.id,industry:record.niche,image:file_url});
   }
   return Response.json({captured,next_cursor:page.next_cursor,has_more:page.has_more});
  }
  if(body.action==='compile'){
   const industry=STOCK_INDUSTRIES.find(i=>i.key===body.industryKey);const design=STOCK_DESIGNS.find(d=>d.key===body.designKey);
   if(!industry||!design)return Response.json({error:'Select a stock industry and design'},{status:400});
   const html=compileStockTemplate(industry,design,body.brand||{});
   return Response.json({html,readiness:assessGoogleReadiness(html),compiler_version:STOCK_VERSION});
  }
  if(body.action==='readiness'){
   const record=await svc.entities.TemplateLibrary.get(body.templateId);
   if(!record?.tags?.includes(STOCK_VERSION))return Response.json({error:'Stock template not found'},{status:404});
   return Response.json(assessGoogleReadiness(record.content));
  }
  return Response.json({error:'Unsupported studio operation'},{status:400});
 }catch(error){console.error('Stock studio:',error.message);return Response.json({error:error.message},{status:500});}
 finally{browser?.close();}
}