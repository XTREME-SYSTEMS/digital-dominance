import assert from 'node:assert/strict';
const base = process.env.SMOKE_SITE;
if (!base || !/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(base)) {
  throw new Error('SMOKE_SITE must be an exact HTTPS Vercel hostname');
}
const check = async route => {
  const url = base + route;
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  const body = await response.text();
  console.log(JSON.stringify({route, status:response.status, contentType:response.headers.get('content-type'), size:body.length}));
  assert.equal(response.status, 200, 'SPA route returned non-200: '+url);
  assert.match(response.headers.get('content-type') || '', /text\/html/i);
  assert.match(body, /id=["']root["']/i);
  assert.match(body, /<script/i);
  return body;
};
await check('/');
const gallery = await check('/templates');
await check('/admin/template-studio');
const scriptUrl = gallery.match(/<script[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
if (scriptUrl?.startsWith('/assets/')) {
  const js = await fetch(base+scriptUrl, {signal:AbortSignal.timeout(15000)});
  console.log(JSON.stringify({asset:scriptUrl,status:js.status,type:js.headers.get('content-type')}));
  assert.equal(js.status,200,'Application JS missing');
}
console.log('STOCK_GALLERY_HTTP_SMOKE_PASS');
