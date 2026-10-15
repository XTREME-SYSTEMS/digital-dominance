async function buildLibrary(){
  const fs=await import('node:fs');
  const path=await import('node:path');
  const crypto=await import('node:crypto');
  const {fileURLToPath}=await import('node:url');
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const input=JSON.parse(fs.readFileSync(path.join(root,'data','apex-universal-creative-library.json'),'utf8'));
  const studio=fs.readFileSync(path.join(root,'studio','apex-universal-library.html'),'utf8');
  const out=path.join(root,'public','premium','libraries');
  const verify=process.argv.includes('--verify');
  if(!out.startsWith(root+path.sep)||path.basename(out)!=='libraries')throw Error('UNSAFE_OUTPUT_PATH');
  if(input.schema!=='apex.universal-creative-library.v1'||input.governance.mass_publish_allowed!==false)throw Error('RELEASE_GATE');
  const sha=(data)=>crypto.createHash('sha256').update(data).digest('hex');
  const esc=(v)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const artifacts=[];
  const write=(rel,contents)=>{
    if(rel.startsWith('/')||rel.includes('..')||rel.includes('\\'))throw Error('PATH_ESCAPE');
    const filename=path.join(out,...rel.split('/'));
    const b=Buffer.from(contents);
    if(verify){if(!fs.existsSync(filename)||sha(fs.readFileSync(filename))!==sha(b))throw Error('ARTIFACT_DRIFT:'+rel)}
    else{fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,b)}
    artifacts.push({path:rel,sha256:sha(b),bytes:b.length});
  };
  if(!verify)fs.rmSync(out,{recursive:true,force:true});
  const pal=id=>{const p=input.brand_palettes.find(p=>p.id===id);if(!p)throw Error('MISSING_PALETTE:'+id);return p};
  const shapes={
    axis:'<path d="M12 148 82 14l22 35-40 72h82l-17 27H12Z" fill="url(#metal)"/><path d="M72 99h74" stroke="currentColor" stroke-width="5"/>',
    aureole:'<circle cx="80" cy="80" r="65" fill="none" stroke="url(#metal)" stroke-width="14"/><circle cx="80" cy="80" r="41" fill="none" stroke="currentColor" stroke-width="3"/><path d="M80 8v46M80 106v46M8 80h46M106 80h46" stroke="url(#metal)" stroke-width="5"/>',
    verge:'<path d="M8 135 61 35l21 33 25-54 45 121H8Z" fill="url(#metal)"/><path d="m8 135 73-61 71 61" fill="none" stroke="currentColor" stroke-width="6"/>',
    cipher:'<path d="M121 33A59 59 0 1 0 121 127M55 27v106m0-53h71" fill="none" stroke="url(#metal)" stroke-width="18" stroke-linecap="round"/><circle cx="80" cy="80" r="11" fill="currentColor"/>',
    arc:'<path d="M16 138V80a64 64 0 0 1 128 0v58" fill="none" stroke="url(#metal)" stroke-width="20"/><path d="M47 138V83a33 33 0 0 1 66 0v55" fill="none" stroke="currentColor" stroke-width="5"/>',
    vector:'<path d="m12 30 136 50-136 50 33-50-33-50Z" fill="url(#metal)"/><path d="M48 80h81" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>',
    pulse:'<path d="M5 88h32l17-45 30 74 20-58 14 29h37" fill="none" stroke="url(#metal)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><circle cx="80" cy="80" r="71" stroke="currentColor" stroke-width="2" fill="none" opacity=".45"/>',
    halo:'<path d="M80 8 98 56l50 24-50 24-18 48-18-48-50-24 50-24L80 8Z" fill="url(#metal)"/><circle cx="80" cy="80" r="21" fill="#101722" stroke="currentColor" stroke-width="3"/>',
    grid:'<rect x="12" y="12" width="54" height="54" rx="9" fill="url(#metal)"/><rect x="94" y="12" width="54" height="54" rx="9" fill="none" stroke="url(#metal)" stroke-width="12"/><rect x="12" y="94" width="54" height="54" rx="9" fill="none" stroke="url(#metal)" stroke-width="12"/><rect x="94" y="94" width="54" height="54" rx="9" fill="url(#metal)"/>',
    crest:'<path d="M80 7 141 36v45c0 45-27 68-61 74C46 149 19 126 19 81V36L80 7Z" fill="none" stroke="url(#metal)" stroke-width="12"/><path d="M43 105 80 48l37 57M59 88h42" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>',
    wave:'<path d="M8 52c22-25 47-25 70 0s48 25 74 0M8 86c22-25 47-25 70 0s48 25 74 0M8 120c22-25 47-25 70 0s48 25 74 0" fill="none" stroke="url(#metal)" stroke-width="10" stroke-linecap="round"/>',
    nova:'<path d="M80 5v150M5 80h150M27 27l106 106M133 27 27 133" stroke="url(#metal)" stroke-width="9" stroke-linecap="round"/><circle cx="80" cy="80" r="27" fill="#101722" stroke="currentColor" stroke-width="6"/>'
  };
  const logo=(x,variant)=>{
    if(!shapes[x.id])throw Error('UNKNOWN_LOGO');
    const icon=variant==='icon',vertical=variant==='stacked',w=icon?640:vertical?960:1500,h=icon?640:vertical?1000:480;
    const centerX=icon?320:vertical?480:245,centerY=icon?310:vertical?300:240;
    const k=icon?2.5:vertical?2.3:1.8;
    const mark=`<g transform="translate(${centerX-80*k} ${centerY-80*k}) scale(${k})" color="${x.accent}">${shapes[x.id]}</g>`;
    const name=icon?'':vertical
      ? `<text x="480" y="735" fill="#F5F3EE" text-anchor="middle" font-family="Arial,sans-serif" font-size="98" font-weight="700" letter-spacing="17">${esc(x.name)}</text><text x="480" y="793" text-anchor="middle" fill="#AFBBC6" font-size="21" font-family="Arial" letter-spacing="11">DESIGN CONCEPT</text>`
      : `<text x="465" y="233" fill="#F5F3EE" font-family="Arial,sans-serif" font-size="111" font-weight="700" letter-spacing="15">${esc(x.name)}</text><text x="471" y="291" fill="#A8B7C5" font-family="Arial,sans-serif" font-size="22" letter-spacing="9">UNIVERSAL IDENTITY SYSTEM</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(x.name)} ${esc(variant)} concept logo" data-source="APEX original synthetic logo"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#111926"/><stop offset="1" stop-color="#05090F"/></linearGradient><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${x.accent}"/><stop offset=".5" stop-color="#F8F4ED"/><stop offset="1" stop-color="${x.accent}"/></linearGradient><radialGradient id="glow"><stop stop-color="${x.accent}" stop-opacity=".15"/><stop offset="1" stop-color="${x.accent}" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" rx="${icon?72:24}" fill="url(#bg)"/><ellipse cx="${centerX}" cy="${centerY}" rx="${w/2.5}" ry="${h/1.7}" fill="url(#glow)"/><path d="M35 ${h-36}H${w-35}" stroke="#FFFFFF" opacity=".12"/><g stroke-linejoin="round">${mark}</g>${name}<text x="${w-36}" y="${h-17}" text-anchor="end" fill="#7F91A3" font-size="12" font-family="Arial" letter-spacing="3">UNAPPROVED • SYNTHETIC</text></svg>`;
  };
  const social=(campaign,channel,idx)=>{
    const p=pal(campaign.palette),w=channel.width,h=channel.height;
    const horizontal=w/h>1.65,marg=Math.round(w*.07),big=Math.round(Math.min(w/10,h/(horizontal?5.1:9.2))),cx=Math.round(w*.66),cy=Math.round(h*.5),r=Math.round(Math.min(w,h)*.37);
    const field={
      launch:`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.accent}" stroke-width="18" opacity=".6"/><circle cx="${cx}" cy="${cy}" r="${Math.round(r*.68)}" fill="none" stroke="${p.accent}" stroke-width="3" opacity=".5"/><path d="M${cx-r} ${cy+r} ${cx+r} ${cy-r}" stroke="${p.accent}" stroke-width="24" opacity=".34"/>`,
      transformation:`<path d="M${Math.round(w*.48)} 0 ${w} 0 ${w} ${h} ${Math.round(w*.71)} ${h}Z" fill="${p.accent}" opacity=".17"/><path d="M${Math.round(w*.38)} 0 ${Math.round(w*.7)} ${h}" stroke="${p.accent}" stroke-width="13" opacity=".7"/>`,
      expertise:`<g stroke="${p.accent}" fill="none" opacity=".47"><rect x="${Math.round(w*.5)}" y="${Math.round(h*.15)}" width="${Math.round(w*.35)}" height="${Math.round(h*.6)}" stroke-width="5"/><path d="M${Math.round(w*.5)} ${Math.round(h*.43)}H${Math.round(w*.85)}M${Math.round(w*.67)} ${Math.round(h*.15)}V${Math.round(h*.75)}" stroke-width="4"/></g>`,
      editorial:`<text x="${Math.round(w*.65)}" y="${Math.round(h*.69)}" fill="${p.accent}" opacity=".18" text-anchor="middle" font-family="Georgia" font-size="${Math.round(Math.min(w,h)*.8)}">“</text>`,
      community:`<g fill="${p.accent}" opacity=".48"><circle cx="${cx-r*.5}" cy="${cy-r*.5}" r="${r*.18}"/><circle cx="${cx+r*.42}" cy="${cy-r*.32}" r="${r*.25}"/><circle cx="${cx+r*.25}" cy="${cy+r*.58}" r="${r*.18}"/><circle cx="${cx-r*.68}" cy="${cy+r*.36}" r="${r*.22}"/></g><path d="M${cx-r*.5} ${cy-r*.5} ${cx+r*.42} ${cy-r*.32} ${cx+r*.25} ${cy+r*.58} ${cx-r*.68} ${cy+r*.36}Z" stroke="${p.accent}" stroke-width="8" fill="none" opacity=".35"/>`,
      product:`<rect x="${cx-r*.37}" y="${cy-r*.65}" width="${r*.8}" height="${r*1.35}" rx="${r*.13}" fill="${p.accent}" opacity=".28"/><rect x="${cx-r*.17}" y="${cy-r*.87}" width="${r*.42}" height="${r*.26}" rx="12" fill="${p.accent}" opacity=".55"/><rect x="${cx-r*.3}" y="${cy-r*.07}" width="${r*.66}" height="${r*.44}" rx="7" fill="${p.fg}" opacity=".6"/>`,
      event:`${Array.from({length:16},(_,i)=>{const angle=i*Math.PI/8;return `<path d="M${cx+Math.cos(angle)*r*.12} ${cy+Math.sin(angle)*r*.12} ${cx+Math.cos(angle)*r} ${cy+Math.sin(angle)*r}" stroke="${p.accent}" stroke-width="7" opacity=".35"/>`}).join('')}`,
      milestone:`<path d="M${cx-r} ${cy+r*.75}l${r*.6}-${r*.38} ${r*.5}-${r*.47} ${r*.62}-${r*.6}" stroke="${p.accent}" stroke-width="20" fill="none" stroke-linecap="round"/><circle cx="${cx+r*.72}" cy="${cy-r*.7}" r="${r*.13}" fill="${p.accent}"/>`
    }[campaign.id]||'';
    const words=campaign.headline.split(' ');
    const split=words.length>3?Math.ceil(words.length/2):words.length;
    const lines=[words.slice(0,split).join(' '),words.slice(split).join(' ')].filter(Boolean);
    const headTop=horizontal?Math.round(h*.35):Math.round(h*.26),headX=marg;
    const headline=lines.map((v,i)=>`<text x="${headX}" y="${headTop+i*big*1.17}" font-family="Georgia,serif" font-size="${big}" fill="${p.fg}" font-weight="600">${esc(v)}</text>`).join('');
    const stampY=h-Math.round(h*.14);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(campaign.name)} ${esc(channel.name)} synthetic social creative"><defs><linearGradient id="back" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${p.bg}"/><stop offset="1" stop-color="#111927"/></linearGradient><linearGradient id="line" x1="0" x2="1"><stop stop-color="${p.accent}"/><stop offset="1" stop-color="${p.muted}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#back)"/><path d="M${marg} ${Math.round(h*.13)}H${w-marg}" stroke="${p.fg}" opacity=".22" stroke-width="2"/>${field}<text x="${marg}" y="${Math.round(h*.09)}" fill="${p.accent}" font-size="${Math.round(Math.min(w,h)*.024)}" font-family="Arial" font-weight="700" letter-spacing="7">APEX / CREATIVE SYSTEM ${String(idx+1).padStart(2,'0')}</text>${headline}<path d="M${marg} ${stampY}h${Math.round(w*.43)}" stroke="url(#line)" stroke-width="3"/><text x="${marg}" y="${stampY+Math.round(h*.046)}" font-family="Arial" fill="${p.fg}" font-weight="600" letter-spacing="3" font-size="${Math.round(Math.min(w,h)*.029)}">${esc(campaign.cta)}</text><text x="${w-marg}" y="${h-Math.round(h*.045)}" text-anchor="end" font-size="${Math.round(Math.min(w,h)*.015)}" font-family="Arial" letter-spacing="3" fill="${p.muted}">DESIGN DRAFT • NO PUBLISHING</text></svg>`;
  };
  const email=(e,i)=>{
    const p=pal(input.brand_palettes[i%input.brand_palettes.length].id);
    const title=esc(e.name),brand='APEX DESIGN CONCEPT';
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} | Email Draft</title></head><body style="margin:0;padding:35px;background:${p.bg};font-family:Arial,sans-serif;color:${p.fg}"><table role="presentation" style="border-collapse:collapse;width:100%;max-width:640px;margin:auto;border:1px solid ${p.accent};background:${p.bg}" cellpadding="0" cellspacing="0"><tr><td style="padding:38px 38px 20px;font-size:11px;letter-spacing:4px;color:${p.accent}">${brand}</td></tr><tr><td style="padding:20px 38px;font-family:Georgia,serif;font-size:40px;line-height:1.2">${title}</td></tr><tr><td style="padding:12px 38px 24px;font-size:16px;line-height:1.8">This is an editable demonstration of a premium ${title.toLowerCase()} email layout. Replace all copy with approved brand language, verified facts and your authorized communication workflow.</td></tr><tr><td style="padding:0 38px 36px"><span style="display:inline-block;border:1px solid ${p.accent};padding:14px 25px;color:${p.fg}">CTA PLACEHOLDER · INACTIVE</span></td></tr><tr><td style="padding:22px 38px;background:#17202d;color:#AAB6C2;font-size:12px;line-height:1.8">DRAFT ONLY. No recipients, tracking pixels, unsubscribe automation, contact list, send action or real customer data are included. Communications require consent and approved integrations.</td></tr></table></body></html>`;
  };
  for(const logoSys of input.logo_systems)for(const v of logoSys.variants)write(`logos/${logoSys.id}-${v}.svg`,logo(logoSys,v));
  input.social_campaigns.forEach((c,i)=>input.social_channels.forEach(ch=>write(`social/${c.id}-${ch.id}.svg`,social(c,ch,i))));
  for(const p of input.brand_palettes)write(`brands/${p.id}.json`,JSON.stringify({schema:"apex.brand.tokens.v1",...p,approval:"DRAFT_ONLY",rights_review:"REQUIRED",timestamp:null},null,2)+'\n');
  input.email_systems.forEach((e,i)=>write(`emails/${e.id}.html`,email(e,i)));
  for(const x of input.website_type_recipes)write(`website-recipes/${x.id}.json`,JSON.stringify({schema:"apex.website.recipe.v1",...x,release:"PENDING_APPROVAL",approval_required:true,noindex:true,import_policy:"Pending review; no production publish or customer claims"},null,2)+'\n');
  const secondary=[["storyboards",input.video_systems],["motion",input.motion_systems],["sections",input.section_systems]];
  for(const [folder,items] of secondary)items.forEach((x,i)=>write(`${folder}/${String(i+1).padStart(2,'0')}-${x.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.json`,JSON.stringify({schema:"apex.pattern.recipe.v1",family:folder,...x,approval:"DRAFT_ONLY",customer_publication:false},null,2)+'\n'));
  const counts={original_logo_motifs:input.logo_systems.length,rendered_logo_svgs:input.logo_systems.reduce((s,x)=>s+x.variants.length,0),social_systems:input.social_campaigns.length,social_placements:input.social_channels.length,rendered_social_svgs:input.social_campaigns.length*input.social_channels.length,brand_packs:input.brand_palettes.length,email_html_drafts:input.email_systems.length,website_type_recipes:input.website_type_recipes.length,source_capability_families:Object.keys(input.legacy_capability_families).length,source_declared_patterns:Object.values(input.legacy_capability_families).reduce((s,x)=>s+x,0),creative_library_families:input.families.length};
  const catalog={...input,generated_counts:counts,site_master_links:{monolith:"/premium/templates/monolith/index.html",argent:"/premium/templates/argent/index.html",atelier:"/premium/templates/atelier/index.html",premium_collection:"/premium/collection/index.html"},status:"NOINDEX_DEVELOPMENT_LIBRARY"};
  write('catalog.json',JSON.stringify(catalog,null,2)+'\n');
  if(!studio.includes('id="library-app"')||!studio.includes("Creative Library"))throw Error("STUDIO_TEMPLATE_INVALID");
  write('index.html',studio);
  const manifest={schema:"apex.creative.asset-manifest.v1",approval:"DRAFT_ONLY",production_release:false,public_social_publish:false,source_catalog_sha256:sha(fs.readFileSync(path.join(root,'data','apex-universal-creative-library.json'))),counts,artifact_count:artifacts.length,artifacts};
  const mText=JSON.stringify(manifest,null,2)+'\n';
  const mFile=path.join(out,'manifest.json');
  if(verify){if(!fs.existsSync(mFile)||sha(fs.readFileSync(mFile))!==sha(mText))throw Error('MANIFEST_DRIFT')}
  else fs.writeFileSync(mFile,mText);
  if(counts.rendered_logo_svgs!==36||counts.rendered_social_svgs!==72||counts.source_declared_patterns!==486||artifacts.length!==233)throw Error('COUNT_CONTRACT_FAILED:'+JSON.stringify({counts,count:artifacts.length}));
  const dup=artifacts.reduce((m,a)=>m.set(a.sha256,(m.get(a.sha256)||0)+1),new Map());
  const duplicated=Array.from(dup.values()).reduce((n,x)=>n+(x>1?x:0),0);
  if(duplicated)throw Error('DUPLICATE_OUTPUT_HASHES:'+duplicated);
  console.log('PASS CREATIVE LIBRARY '+JSON.stringify({mode:verify?'VERIFY':'BUILD',...counts,artifacts:artifacts.length,manifest_sha256:sha(mText),unapproved:true,generated_folder:'public/premium/libraries'}));
}
await buildLibrary();
