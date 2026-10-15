#!/usr/bin/env node
'use strict';
const {spawn}=require('node:child_process'),{mkdirSync,writeFileSync,mkdtempSync,rmSync}=require('node:fs'),path=require('node:path'),os=require('node:os');
const dir=path.resolve(__dirname,'receipts');mkdirSync(dir,{recursive:true});
const base=process.env.PREMIUM_QA_URL||'http://127.0.0.1:4189';
const port=19800+Math.floor(Math.random()*1200);const profile=mkdtempSync(path.join(os.tmpdir(),'premium-master-qa-'));
const chrome=spawn(process.env.CHROME_BIN||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
 ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--no-default-browser-check','--remote-allow-origins=*','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws,id=0;const waiting=new Map(),exceptions=[];const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,ms=24000){const t=Date.now();while(Date.now()-t<ms){try{const v=await fn();if(v)return v}catch{}await sleep(175)}throw Error('TIMEOUT waiting for Chrome, document or expected DOM');}
async function cdp(method,params={}){return await new Promise((resolve,reject)=>{const n=++id;waiting.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(waiting.has(n)){waiting.delete(n);reject(Error('CDP_TIMEOUT '+method))}},15000)})}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error('JAVASCRIPT '+r.exceptionDetails.text);return r.result.value;}
async function navigate(p){await cdp('Page.navigate',{url:base+p});await until(()=>evaluate('document.readyState==="complete" && document.querySelector("main") !== null'));await sleep(800);}
async function photo(name){const r=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(dir,name+'.png'),Buffer.from(r.data,'base64'));}
async function main(){
const target=await until(async()=>{const d=await(await fetch('http://127.0.0.1:'+port+'/json')).json();return d.find(x=>x.type==='page'&&x.webSocketDebuggerUrl)});
ws=new WebSocket(target.webSocketDebuggerUrl);ws.addEventListener('message',e=>{try{const x=JSON.parse(e.data);if(x.method==='Runtime.exceptionThrown')exceptions.push(x.params?.exceptionDetails?.text||'uncaught error');if(x.id&&waiting.has(x.id)){const t=waiting.get(x.id);waiting.delete(x.id);x.error?t.reject(Error(x.error.message)):t.resolve(x.result)}}catch{}});
await until(()=>ws.readyState===1);await cdp('Page.enable');await cdp('Runtime.enable');const results=[];
const routes=[['gallery','/premium-lab.html',null],['legal','/premium-legal.html','.hero .primary'],['epoxy','/premium-epoxy.html','.hero .cta'],['spa','/premium-spa.html','.hero .button']];
for(const viewport of [{label:'desktop',width:1440,height:900},{label:'tablet',width:768,height:1024},{label:'mobile',width:390,height:844}]){
 await cdp('Emulation.setDeviceMetricsOverride',{width:viewport.width,height:viewport.height,deviceScaleFactor:1,mobile:viewport.label==='mobile'});
 for(const [name,route,cta] of routes){
  await navigate(route);
  const expression='(()=>{const imgs=[...document.images],cta='+JSON.stringify(cta)+'?document.querySelector('+JSON.stringify(cta)+'):null;return {title:document.title,viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,hasH1:!!document.querySelector("h1"),metaNoindex:!!document.querySelector("meta[name=robots]")?.content.includes("noindex"),images:imgs.length,brokenImages:imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),buttonVisible:cta?cta.getBoundingClientRect().top<innerHeight:null,mainText:document.querySelector("main")?.innerText.length||0,route:location.pathname}})()';
  const snapshot=await evaluate(expression);
  const galleryValid=name!=='gallery'||(await evaluate('[...document.querySelectorAll("a[href^=\\"/premium-\\"]")].filter(x=>x.getAttribute("href").endsWith(".html")).length>=3'));
  const pass=snapshot.hasH1&&snapshot.metaNoindex&&snapshot.documentWidth<=viewport.width+3&&snapshot.viewport<=viewport.width+3&&snapshot.brokenImages.length===0&&snapshot.mainText>650&&galleryValid&&snapshot.images>=(name==='gallery'?3:name==='spa'?1:0)&&(cta?snapshot.buttonVisible:true);
  results.push({name,view:viewport.label,status:pass?'PASS':'FAIL',...snapshot,galleryValid});
  await photo(name+'-'+viewport.label);
  console.log(name.toUpperCase()+' '+viewport.label+' '+(pass?'PASS':'FAIL')+' width='+snapshot.documentWidth+'/'+snapshot.viewport+' imgs='+snapshot.images+' broken='+snapshot.brokenImages.length+' cta='+snapshot.buttonVisible);
 }
}
await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await navigate('/premium-legal.html');
await evaluate('document.querySelector("[data-incident]").click()');
await evaluate('document.querySelector("#demo-next").click()');
const legalIntake=await evaluate('document.querySelector("#demo-result").classList.contains("show") && document.querySelector("#demo-result").innerText.includes("No information was collected")');
results.push({name:'legal-interaction',status:legalIntake?'PASS':'FAIL'});console.log('LEGAL INTAKE '+legalIntake);
await navigate('/premium-epoxy.html');
await evaluate('document.querySelectorAll("[data-img]")[1].click()');
const swatch=await evaluate('document.querySelector("#finish-img").getAttribute("src")==="/premium-assets/epoxy-metal.png" && document.querySelectorAll("[data-img]")[1].getAttribute("aria-pressed")==="true"');
await evaluate('document.querySelector("#len").value=20; document.querySelector("#wid").value=20; document.querySelector("#calculate").click()');
const calc=await evaluate('document.querySelector("#result").classList.contains("show") && document.querySelector("#result").textContent.includes("400")');
results.push({name:'epoxy-interactions',status:swatch&&calc?'PASS':'FAIL',swatch,calc});console.log('EPOXY SELECTOR '+swatch+' CALCULATOR '+calc);
await navigate('/premium-spa.html');
await evaluate('document.querySelector("[data-choice]").click()');
await evaluate('document.querySelector("#continue").click()');
const spaDemo=await evaluate('document.querySelector("#result").classList.contains("show") && document.querySelector("#result").textContent.includes("sends nothing")');
results.push({name:'spa-interaction',status:spaDemo?'PASS':'FAIL'});console.log('SPA DEMO '+spaDemo);
const status=results.every(x=>x.status==='PASS')&&exceptions.length===0?'PASS':'FAIL';
const receipt={schema:'digital-dominance.premium-master-concepts.qa.v1',status,baseUrl:base,results,exceptions,notes:['Preapproval design concepts; not measured aesthetic approval','Independent legal/medical, source licensing and material claim reviews required','Preview-only, no live customer acquisition or backend']};
writeFileSync(path.join(dir,'PREMIUM_MASTER_BROWSER_QA.json'),JSON.stringify(receipt,null,2)+'\n');console.log('QA_TOTAL='+status+' checks='+results.length+' exceptions='+exceptions.length);if(status!=='PASS')process.exitCode=1;
}
main().catch(err=>{console.error('BROWSER_QA_ERROR '+err.stack);writeFileSync(path.join(dir,'QA_ERROR.txt'),err.stack+'\n');process.exitCode=2}).finally(()=>{try{ws?.close()}catch{}chrome.kill();try{rmSync(profile,{force:true,recursive:true,maxRetries:2})}catch{}});