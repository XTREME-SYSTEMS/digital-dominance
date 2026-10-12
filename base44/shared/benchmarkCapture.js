import { openBenchmarkBrowser, screenshotFile } from './benchmarkBrowser.js';
const extraction = `(()=>{const clean=v=>String(v||'').replace(/\\s+/g,' ').trim().slice(0,500);const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};const elements=Array.from(document.querySelectorAll('header,nav,main,section,footer,h1,h2,h3,a,button,input,select,textarea,details,img,video')).filter(visible).slice(0,1200).map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName.toLowerCase(),text:clean(e.textContent),href:e.href||null,type:e.type||null,alt:e.alt||null,box:{x:Math.round(r.x),y:Math.round(r.y+scrollY),width:Math.round(r.width),height:Math.round(r.height)},style:{color:s.color,background:s.backgroundColor,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,radius:s.borderRadius,position:s.position}}});return {schema_version:'public-observation-v1',url:location.href,title:document.title,description:document.querySelector('meta[name="description"]')?.content||'',viewport:{width:innerWidth,height:innerHeight},elements,limits:{max_elements:1200,truncated:document.querySelectorAll('*').length>1200},forms:Array.from(document.forms).map(f=>({action:f.action,method:f.method,controls:Array.from(f.elements).map(i=>({tag:i.tagName,type:i.type,name:i.name,required:i.required}))})),headings:Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>({level:e.tagName,text:clean(e.textContent)})),assets:Array.from(document.images).slice(0,100).map(i=>({src:i.currentSrc||i.src,alt:i.alt,loaded:i.complete&&i.naturalWidth>0})),unknowns:['No form was submitted','Backend logic, payments, accounts and hidden states not inspected','No traffic, conversion rate or rankings measured','Only public homepage at two viewports observed']}})()`;
function identifyCapabilities(observation){
 const elements=observation.elements;
 const capability=(name,category,description,benefit,evidence)=>({name,category,description,benefit,evidence,verification:'observed DOM, not end-to-end tested'});
 const items=[capability('Visual hierarchy','aesthetics','Measured visible headings, font families, spacing and element bounds.','Supports scan-friendly content and consistent layout.',`${observation.headings.length} headings; ${elements.length} visible elements captured`)];
 const add=(condition,...args)=>{if(condition)items.push(capability(...args));};
 add(elements.some(e=>e.tag==='nav'),'Navigation','interaction','Visible navigation links separate content destinations.','Helps visitors locate relevant information.','Visible nav element');
 add(observation.forms.length,'Contact or request form','conversion','Form fields, required inputs and declared destinations were inventoried without sending data.','May reduce inquiry friction when correctly connected.',`${observation.forms.length} forms; submission not tested`);
 add(elements.some(e=>e.type==='search'),'Search input','discovery','A search input is visible. Search results and index are not verified.','May help visitors discover relevant products or services.','input[type=search]');
 add(elements.some(e=>e.tag==='details'),'Expandable content','interaction','Native disclosure controls were found.','Makes supporting answers available without overwhelming the page.','details element');
 add(elements.some(e=>String(e.href).startsWith('tel:')),'Click-to-call','conversion','A telephone link appears in the document.','Provides a direct phone contact path.','tel: link; call not placed');
 add(elements.some(e=>e.tag==='video'),'Video presentation','media','A native video element is present.','Supports richer visual explanation when accessible.','video element; playback not verified');
 add(elements.some(e=>['sticky','fixed'].includes(e.style.position)),'Persistent interface','aesthetics','A fixed or sticky element remains part of the measured UI.','Can retain navigation or conversion context.','computed position sticky/fixed');
 add(observation.assets.length,'Photography and illustrations','media','Image locations, descriptions and loaded status were inventoried.','Supports visual communication and contextual credibility.',`${observation.assets.length} visible image references`);
 add(observation.headings.some(h=>/faq|question/i.test(h.text)),'Question content','content','A visible question or FAQ heading exists.','Helps visitors resolve uncertainty.','Matching FAQ/question heading; answers need review');
 return items;
}
export async function captureIndustryBenchmark(base44,record){
 const allowedHost=new URL(record.url).hostname;
 let robots=await fetch(new URL('/robots.txt',record.url),{redirect:'manual',signal:AbortSignal.timeout(10000)});
 if(robots.status>=300&&robots.status<400){
  const location=robots.headers.get('location');
  if(!location)throw new Error('Robots redirect has no destination');
  const redirect=new URL(location,record.url);
  if(redirect.protocol!=='https:'||redirect.hostname.replace(/^www\./,'')!==allowedHost.replace(/^www\./,''))throw new Error('Robots redirect requires manual review');
  robots=await fetch(redirect,{redirect:'manual',signal:AbortSignal.timeout(10000)});
 }
 if(!robots.ok&&robots.status!==404)throw new Error('Robots policy unavailable; capture deferred');
 if(robots.ok){const text=await robots.text();const groups=text.split(/(?=User-agent:)/i);if(groups.some(g=>/^User-agent:\s*\*/im.test(g)&&/^Disallow:\s*\/\s*$/im.test(g)))throw new Error('Public crawl is disallowed by robots.txt');}
 let browser;
 try{
  browser=await openBenchmarkBrowser();
  // Navigation is restricted to curated public references, never caller-chosen URLs.
  await browser.call('Page.navigate',{url:record.url});
  await browser.evaluate(`new Promise(resolve=>{let n=0;const timer=setInterval(()=>{if(document.readyState==='complete'||++n>=20){clearInterval(timer);resolve(true)}},500)})`);
  const observation=await browser.evaluate(extraction);
  if(!observation||new URL(observation.url).hostname.replace(/^www\./,'')!==allowedHost.replace(/^www\./,''))throw new Error('Unexpected redirect; capture requires review');
  if(/captcha|access denied|verify you are human|just a moment/i.test(observation.title))throw new Error('Site restricted automated access; no bypass attempted');
  const desktop=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:await screenshotFile(browser,1200)});
  const mobile=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:await screenshotFile(browser,390)});
  const mobileObservation=await browser.evaluate(extraction);
  const normalized=JSON.stringify({...observation,mobile:mobileObservation});
  const artifact=await base44.asServiceRole.integrations.Core.UploadPrivateFile({file:new File([normalized],'benchmark-observation.json',{type:'application/json'})});
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized)))).map(b=>b.toString(16).padStart(2,'0')).join('');
  return {evidence_status:'captured',screenshot_uri:desktop.file_uri,mobile_screenshot_uri:mobile.file_uri,normalized_uri:artifact.file_uri,captured_at:new Date().toISOString(),capture_hash:hash,capabilities:identifyCapabilities(observation),visual_tokens:{fonts:[...new Set(observation.elements.map(e=>e.style.font))].slice(0,12),colors:[...new Set(observation.elements.map(e=>e.style.color))].slice(0,20),viewports:[1200,390],element_count:observation.elements.length},rebrand_review:['Replace names, logos, mascots, slogans and distinctive brand identity','Do not reuse competitor photography, videos, copy, reviews or proprietary assets','Create original layouts rather than claiming a rebrand makes an exact clone lawful','Do not retain competitor contact details, analytics IDs, forms or account integrations','Verify claims and rights; legal review is required before commercial publication'],unknowns:observation.unknowns,error:''};
 }finally{browser?.close();}
}