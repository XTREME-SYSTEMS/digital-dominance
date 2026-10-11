// Local preview server only. No remote interfaces, telemetry, uploads, API calls or credentials.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const permitted=Object.freeze({'/':'index.html','/index.html':'index.html',
 '/intake-engine.mjs':'intake-engine.mjs',
 '/business-research-policy.mjs':'business-research-policy.mjs',
 '/browser-worker-bridge.mjs':'browser-worker-bridge.mjs'});
const app=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const relative=permitted[url.pathname];
 if(req.method!=='GET'||!relative){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');return;}
 try{
  const data=await readFile(join(root,relative));
  res.writeHead(200,{'Content-Type':relative.endsWith('.mjs')?'text/javascript; charset=utf-8':'text/html; charset=utf-8',
    'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; style-src 'unsafe-inline' 'self'; script-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
  res.end(data);
 }catch{res.writeHead(500);res.end('Preview asset unavailable');}
});
const port=Number(process.env.EDEN_LOCAL_PORT||8179);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid local port');
app.listen(port,'127.0.0.1',()=>process.stdout.write('Eden local preview: http://127.0.0.1:'+String(port)+'/\n'));
