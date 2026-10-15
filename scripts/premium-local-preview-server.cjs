'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..','public'),port=Number(process.env.PORT||4189);
const mime={'.html':'text/html; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.js':'application/javascript','.css':'text/css'};
http.createServer((req,res)=>{
 let file;
 try{const reqPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);file=path.resolve(root,'.'+reqPath);}catch{res.writeHead(400);return res.end('Bad request');}
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('X-Robots-Tag','noindex, nofollow');fs.createReadStream(file).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log('Premium QA test server listening '+port));
