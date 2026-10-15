#!/usr/bin/env node
// Browser QA for source-compiled, preview-only, offline template gallery.
const {spawn}=require('node:child_process');
const {mkdirSync,writeFileSync,mkdtempSync,rmSync}=require('node:fs');
const os=require('node:os'),path=require('node:path');
const out=path.resolve(process.env.QA_OUT||path.join(__dirname,'..','audit-evidence','template-gallery'));
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4178/';
const sleep=t=>new Promise(resolve=>setTimeout(resolve,t));mkdirSync(out,{recursive:true});
const profile=mkdtempSync(path.join(os.tmpdir(),'dd-template-qa-'));const port=19900+Math.floor(Math.random()*700);
const chrome=spawn(process.env.CHROME_BIN||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
 ['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--no-default-browser-check',
 '--remote-allow-origins=*','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],
 {windowsHide:true,stdio:'ignore'});
let socket,count=0;const pending=new Map(),exceptions=[];
async function wait(fn,timeout=22000){const start=Date.now();while(Date.now()-start<timeout){try{const x=await fn();if(x)return x}catch{}await sleep(220)}throw Error('Timed out waiting for browser / UI');}
async function send(method,params={}){return await new Promise((resolve,reject)=>{const id=++count;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('CDP timeout '+method))}},15000)})}
async function evalJS(code){const res=await send('Runtime.evaluate',{expression:code,awaitPromise:true,returnByValue:true});if(res.exceptionDetails)throw Error(res.exceptionDetails.text);return res.result.value;}
async function shot(name){const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.join(out,name+'.png'),Buffer.from(s.data,'base64'));}
async function nav(page){await send('Page.navigate',{url:new URL(page,base).toString()});await wait(()=>evalJS('document.readyState==="complete" && Boolean(document.querySelector("main,#templates"))'));await sleep(1350);}
async function main(){
 const target=await wait(async()=>{const result=await fetch('http://127.0.0.1:'+port+'/json');const arr=await result.json();return arr.find(x=>x.type==='page'&&x.webSocketDebuggerUrl)});
 socket=new WebSocket(target.webSocketDebuggerUrl);
 socket.addEventListener('message',event=>{try{const msg=JSON.parse(event.data);if(msg.method==='Runtime.exceptionThrown')exceptions.push(msg.params?.exceptionDetails?.text||'uncaught JS');if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result)}}catch{}});
 await wait(()=>socket.readyState===1);await send('Page.enable');await send('Runtime.enable');const results=[];
 for(const view of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
  await send('Emulation.setDeviceMetricsOverride',{width:view.width,height:view.height,deviceScaleFactor:1,mobile:view.name==='mobile'});
  await nav('/');
  await evalJS('document.querySelector("#templates")?.scrollIntoView({block:"start"});');
  await sleep(750);
  const initial=await evalJS('(()=>{const r=document.querySelector("#templates"),p=[...r.querySelectorAll("button")].filter(x=>x.querySelector("iframe[srcdoc]"));return {cards:p.length,sourceMessage:r.innerText.includes("200 full-page design concepts"),validHtml:p.every(x=>x.querySelector("iframe").srcdoc.includes("<main id=\\"main\\">")),imageReferences:p.every(x=>x.querySelector("iframe").srcdoc.includes("/images/industries/")||x.querySelector("iframe").srcdoc.includes("/images/home-industries/")),overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)}})()');
  await shot('homepage-'+view.name);
  if(initial.cards>0)await evalJS('(()=>{[...document.querySelectorAll("#templates button")].find(x=>x.querySelector("iframe[srcdoc]")).click();return true})()');
  await wait(()=>evalJS('Boolean(document.querySelector("[role=dialog] iframe[srcdoc]"))'));
  const modal=await evalJS('(()=>{const d=document.querySelector("[role=dialog]"),f=d?.querySelector("iframe");return {exists:Boolean(d),htmlLength:f?.srcdoc.length||0,choose:!![...(d?.querySelectorAll("button")||[])].find(x=>x.innerText.includes("Choose this exact template"))}})()');
  await evalJS('(()=>{[...document.querySelectorAll("[role=dialog] button")].find(x=>x.innerText.includes("Choose this exact template")).click();return true})()');
  await wait(()=>evalJS('Boolean([...document.querySelectorAll("h3")].find(x=>x.innerText.includes("Website Launch Wizard")))'));
  const pass=initial.cards>=6&&initial.sourceMessage&&initial.validHtml&&initial.imageReferences&&initial.overflow<=5&&modal.htmlLength>6000&&modal.choose;
  results.push({view:view.name,page:'/',pass,initial,modal,wizardOpened:true});
  console.log('HOMEPAGE '+view.name+' '+(pass?'PASS':'FAIL')+' cards='+initial.cards);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});await nav('/templates');
 const first=await evalJS('(()=>{const v=[...document.querySelectorAll("iframe[srcdoc]")];return{cards:v.length,total:document.body.innerText.includes("200 available full-page design concepts"),loadMore:[...document.querySelectorAll("button")].some(x=>x.innerText.includes("Load more templates"))}})()');
 await shot('catalog-first-page');
 if(first.loadMore){await evalJS('(()=>{[...document.querySelectorAll("button")].find(x=>x.innerText.includes("Load more templates")).click();return true})()');await wait(()=>evalJS('document.querySelectorAll("iframe[srcdoc]").length>=40'));}
 const expanded=await evalJS('document.querySelectorAll("iframe[srcdoc]").length');
 const catPass=first.cards>=20&&first.total&&expanded>=40;results.push({page:'/templates',pass:catPass,first,expanded});console.log('CATALOG '+(catPass?'PASS':'FAIL')+' expanded='+expanded);
 await evalJS('(()=>{[...document.querySelectorAll("button")].find(b=>b.querySelector("iframe[srcdoc]")).click();return true})()');
 await wait(()=>evalJS('Boolean(document.querySelector("[role=dialog] iframe[srcdoc]"))'));
 await evalJS('(()=>{[...document.querySelectorAll("[role=dialog] button")].find(b=>b.innerText.includes("Choose this exact template")).click();return true})()');
 await wait(()=>evalJS('location.pathname.startsWith("/preview-template/")'));await wait(()=>evalJS('Boolean(document.querySelector("iframe[srcdoc]"))'));
 const studio=await evalJS('(()=>({iframes:document.querySelectorAll("iframe[srcdoc]").length,publishGated:document.body.innerText.includes("Preview-only concept"),download:document.body.innerText.includes("Download HTML")}))()');
 const studioPass=studio.iframes>=1&&studio.publishGated&&studio.download;results.push({page:'/admin/template-studio',pass:studioPass,studio});await shot('studio-selected-template');console.log('STUDIO '+(studioPass?'PASS':'FAIL'));
 const status=results.every(x=>x.pass)?'PASS':'FAIL';
 const receipt={schema:'digital-dominance.template-gallery-qa.v1',status,base,results,exceptions,notes:['Preview-only local compiler concepts, not live clients','Backend integration and semantic image rights still require separate approval']};
 writeFileSync(path.join(out,'TEMPLATE_GALLERY_QA_RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n');console.log('TOTAL '+status);
 if(status!=='PASS')process.exitCode=1;
}
main().catch(error=>{console.error('QA_ERROR '+error.stack);writeFileSync(path.join(out,'TEMPLATE_GALLERY_QA_ERROR.txt'),error.stack+'\n');process.exitCode=2}).finally(()=>{try{socket?.close()}catch{}chrome.kill();try{rmSync(profile,{recursive:true,force:true,maxRetries:2})}catch{}});