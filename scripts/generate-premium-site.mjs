#!/usr/bin/env node
/**
 * Digital Dominance V2: local, deterministic website compiler.
 * Zero npm dependencies. Emits NOINDEX development sites, never publishes.
 * Examples:
 * node scripts/generate-site.mjs --template=argent --brand="Acme Legal" --headline="Guidance for your next chapter." --accent="#b59970" --out=generated/acme-legal
 * node scripts/generate-site.mjs --packet=path/to/BUILD_PACKET_DRAFT.json --out=generated/brand-preview
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE=path.join(REPO,'public','premium');
const tplAssets={argent:['argent-architecture.svg'],monolith:['monolith-marble.jpg'],atelier:['atelier-organic.jpg']};
const DEFAULT={argent:{brand:'ARGENT & VALE',headline:'Clarity in complexity.',accent:'#b59970'},monolith:{brand:'MONOLITH',headline:'BEYOND THE ORDINARY.',accent:'#e4c18c'},atelier:{brand:'ATELIER SEREIN',headline:'Beauty in the pause.',accent:'#93735d'}};
function args(){const values={};for(const arg of process.argv.slice(2)){if(!arg.startsWith('--')||!arg.includes('='))throw new Error(`Unknown argument: ${arg}. Expected --key=value`);const i=arg.indexOf('=');values[arg.slice(2,i)]=arg.slice(i+1)}return values}
function sha(file){return createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
function stop(message){console.error('BUILD BLOCKED:',message);process.exitCode=1}
try{
 const opts=args();let packet=null;
 if(opts.packet){packet=JSON.parse(fs.readFileSync(path.resolve(opts.packet),'utf8'));if(!packet||!packet.template||!packet.configuration)throw new Error('Invalid build packet: template and configuration required')}
 const id=opts.template||packet?.source?.template_id||packet?.template?.template_id;
 if(!Object.hasOwn(tplAssets,id))throw new Error('Template must be argent, monolith or atelier.');
 const config={...DEFAULT[id],...packet?.configuration};for(const key of ['brand','headline','accent'])if(opts[key]!==undefined)config[key]=opts[key];
 for(const key of ['brand','headline']){if(typeof config[key]!=='string'||!config[key].trim()||config[key].length>90)throw new Error(`${key} must be a 1–90 character string`)}
 if(!/^#[0-9a-fA-F]{6}$/.test(config.accent))throw new Error('accent must be #RRGGBB');
 const slug=config.brand.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,45)||id;
 const dest=path.resolve(opts.out||path.join(REPO,'premium-generated',slug));
 if(dest===BASE||dest===REPO||dest===path.parse(dest).root)throw new Error('Unsafe output path');
 if(fs.existsSync(dest)&&fs.readdirSync(dest).length&&!opts.overwrite)throw new Error('Output folder is not empty; provide a new --out= path (or explicit --overwrite=true)');
 fs.mkdirSync(path.join(dest,'assets'),{recursive:true});
 let html=fs.readFileSync(path.join(BASE,'templates',id,'index.html'),'utf8');
 html=html.replaceAll('../../assets/template-shared.css','assets/template-shared.css').replaceAll('href="style.css"','href="assets/style.css"').replaceAll('../../assets/templates.js','assets/templates.js');
 html=html.replace(/<title>[^<]+<\/title>/,`<title>${config.brand.replace(/&/g,'&amp;').replace(/</g,'&lt;')} | Development Preview</title>`);
 const bootstrap=JSON.stringify(config).replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026');
 html=html.replace('<script src="assets/templates.js"></script>',`<script>window.DD_INITIAL_CONFIG=${bootstrap};</script><script src="assets/templates.js"></script>`);
 html=html.replace('<head>','<head><meta name="robots" content="noindex,nofollow">');
 fs.writeFileSync(path.join(dest,'index.html'),html,'utf8');
 let style=fs.readFileSync(path.join(BASE,'templates',id,'style.css'),'utf8').replaceAll('../../assets/','');
 fs.writeFileSync(path.join(dest,'assets','style.css'),style,'utf8');
 for(const filename of ['template-shared.css','templates.js',...tplAssets[id]])fs.copyFileSync(path.join(BASE,'assets',filename),path.join(dest,'assets',filename));
 const manifest={schema:'digital-dominance.generated-development-site.v2',status:'DRAFT_NO_INDEX_NOT_APPROVED',created_at:new Date().toISOString(),template_id:id,config,entrypoint:'index.html',preview_only:true,production_approved:false,robots:'noindex,nofollow',original_assets:tplAssets[id],files:{}};
 for(const filename of ['index.html','assets/style.css','assets/template-shared.css','assets/templates.js',...tplAssets[id].map(x=>'assets/'+x)])manifest.files[filename]=sha(path.join(dest,filename));
 fs.writeFileSync(path.join(dest,'BUILD_RECEIPT.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',output:dest,files:Object.keys(manifest.files).length+1,template:id,robots:'noindex,nofollow',production_approved:false},null,2));
}catch(err){stop(err?.message||String(err))}