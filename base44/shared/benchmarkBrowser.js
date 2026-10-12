import { secrets } from 'base44:runtime';
export async function openBenchmarkBrowser() {
 const response=await fetch('https://api.browserbase.com/v1/sessions',{method:'POST',headers:{'Content-Type':'application/json','X-BB-API-Key':secrets.get('BROWSERBASE_API_KEY')},body:JSON.stringify({timeout:180,keepAlive:false,browserSettings:{viewport:{width:1200,height:900}}}),signal:AbortSignal.timeout(15000)});
 if(!response.ok) throw new Error(`Browser capture unavailable (${response.status})`);
 const session=await response.json();
 const socket=new WebSocket(session.connectUrl);
 let counter=0;const pending=new Map();
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);const request=pending.get(message.id);if(request){pending.delete(message.id);clearTimeout(request.timer);message.error?request.reject(new Error(message.error.message)):request.resolve(message.result);}});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Browser connection timed out')),15000);socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});socket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Browser connection failed'));},{once:true});});
 const command=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++counter;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Browser operation timed out: ${method}`));},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 const target=await command('Target.createTarget',{url:'about:blank'});
 const attached=await command('Target.attachToTarget',{targetId:target.targetId,flatten:true});
 const call=(method,params)=>command(method,params,attached.sessionId);
 await call('Page.enable');await call('Runtime.enable');
 return {call,evaluate:async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error('Browser extraction failed');return result.result?.value;},close:()=>socket.close()};
}
export async function screenshotFile(browser, width=1200) {
 await browser.call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 const shot=await browser.call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width,height:900,scale:1}});
 const bytes=Uint8Array.from(atob(shot.data),char=>char.charCodeAt(0));
 return new File([bytes],`homepage-${width}.png`,{type:'image/png'});
}
export async function loadStockDocument(browser, html) {
 const tree=await browser.call('Page.getFrameTree');
 await browser.call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html});
 await browser.evaluate(`Promise.all(Array.from(document.images).map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.onload=resolve;image.onerror=resolve;setTimeout(resolve,10000)}))).then(()=>true)`);
 const broken=await browser.evaluate('Array.from(document.images).filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)');
 if(broken.length)throw new Error('Stock photograph did not load; thumbnail not published');
}