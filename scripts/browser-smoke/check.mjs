import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = process.env.LIVE_SITE || 'https://digital-dominance-jade.vercel.app';
const views = [
  {name:'desktop',width:1440,height:900},
  {name:'mobile',width:390,height:844}
];
await mkdir('scripts/browser-smoke/artifacts', {recursive:true});
const browser = await chromium.launch({headless:true,args:['--no-sandbox']});
let success=0;
try {
  for(const view of views) {
    const page=await browser.newPage({viewport:{width:view.width,height:view.height},deviceScaleFactor:1});
    const requestFailures=[];
    page.on('response',response=>{
      if(response.status()>=400&&requestFailures.length<12) requestFailures.push({code:response.status(),url:response.url().slice(0,180)});
    });
    const response=await page.goto(base+'/templates',{waitUntil:'domcontentloaded',timeout:35000});
    if(response?.status()!==200) throw new Error(view.name+': /templates status '+response?.status());
    await page.getByRole('heading',{name:/Choose Your Real Template/i}).waitFor({timeout:35000});
    await page.getByText(/matching stock templates/i).waitFor({timeout:35000});
    const count=(await page.locator('button').filter({hasText:'Preview this template'}).count());
    if(count<1) {
      const alert=await page.locator('[role="alert"]').allTextContents();
      throw new Error(view.name+': no template cards; alerts='+JSON.stringify(alert));
    }
    const text=await page.locator('body').innerText();
    if(text.includes('Unable to load templates:'))throw new Error(view.name+': original error still displayed');
    if(requestFailures.some(req => /\/api\/apps\/null\/entities\/TemplateLibrary/.test(req.url))) {
      throw new Error(view.name+': gallery still calls missing Base44 app ID: '+JSON.stringify(requestFailures));
    }
    await page.locator('button').filter({hasText:'Preview this template'}).first().click();
    const dialog=page.getByRole('dialog');
    await dialog.waitFor({timeout:12000});
    const iframe=dialog.locator('iframe');
    await iframe.waitFor({timeout:12000});
    const html=await iframe.getAttribute('srcdoc');
    if(!html||!/<html/i.test(html)||!/<h1>/i.test(html))throw new Error(view.name+': full-page HTML preview missing');
    const size=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:window.innerWidth}));
    await page.screenshot({path:'scripts/browser-smoke/artifacts/gallery-'+view.name+'.png',fullPage:true});
    console.log(JSON.stringify({view:view.name,status:200,visibleTemplateCards:count,fullPagePreviewBytes:html.length,scrollWidth:size.body,viewportWidth:size.viewport,failedRequests:requestFailures}));
    await page.close();
    success++;
  }
} finally {
  await browser.close();
}
if(success!==views.length)throw new Error('Only '+success+'/'+views.length+' views passed');
console.log('BROWSER_GALLERY_DESKTOP_MOBILE_PASS');
