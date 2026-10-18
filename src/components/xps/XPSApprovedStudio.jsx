import React, { useState } from 'react';

// Review-only XPS template chooser. Approved original PNGs are immutable source truth.
// This component is not a validated pixel-parity website generator.
const designs = [
  ['National Epoxy Pros Network','1B2qAtqPE8EREI6fxYEsYW6Y2_f-8Fimx'],
  ['Premium Garage Floor','1ufVke35KRbag8VbyF2aF-5Fe6Jfv-DAq'],
  ['Commercial Performance','11sNQ0UVjGp85xUZ8zJPNGyKdk6B4eLcB'],
  ['Luxury Metallic Studio','15-n4hUtFKdzv6Yd-gtKkJYuE9viGFvMM'],
  ['XPS Coatings and Supply','1B8QFxSMxZhVKnTZ8gUW3-iTIaJFIF1LZ'],
  ['Digital Bid First','1swLZKGBssB_cgEnwNzevN2drIPs2Qdnn'],
  ['Polished Concrete','1R5izjz81YFFxJdoiFGHujrZBx9Vb6XTk'],
  ['Training Academy','1_fn2z8eskaTLM3bK750Qn8sec1UaCpQS'],
  ['Professional Equipment','1BEXGEGSCpPOq4V75qagx6_9MEjzdiomz'],
  ['Contractor Startup Package','1cdsor6_H4JkJAUIQo6vMN-usansNP0JI']
];
const initial = { name:'National Epoxy Pros', headline:'Professional concrete surfaces, built to perform', description:'Quality coatings, polishing, equipment and contractor solutions.', cta:'Request a consultation', phone:'', email:'', serviceArea:'' };
const escapeText = value => String(value || '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const referenceLink = id => 'https://drive.google.com/file/d/' + id + '/view';
const download = (file, text, type) => {
  const u = URL.createObjectURL(new Blob([text], {type}));
  const a = document.createElement('a');
  a.href = u; a.download = file; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
export default function XPSApprovedStudio() {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState('reference');
  const [mobile, setMobile] = useState(false);
  const [values, setValues] = useState(initial);
  const [drafts, setDrafts] = useState({});
  const current = designs[selected];
  const edit = (k, v) => setValues(old => ({...old,[k]:v}));
  const choose = i => {
    setDrafts(old => ({...old,[selected]:values}));
    setSelected(i);
    setValues(drafts[i] || initial);
  };
  const html = '<!doctype html><html><head><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:system-ui;color:#f8f7f5;background:#101820}nav{padding:23px 6%;background:#090f16;display:flex;justify-content:space-between}section{padding:75px 7%;min-height:430px;background:linear-gradient(120deg,#0d1823,#243238)}small{color:#d7b778;letter-spacing:3px;text-transform:uppercase}h1{font-size:clamp(38px,6vw,76px);max-width:900px;line-height:1.08}p{font-size:20px;max-width:690px;color:#cbd3dc;line-height:1.65}a.cta{display:inline-block;padding:17px 23px;margin-top:15px;background:#c8a462;color:#111;text-decoration:none;font-weight:bold}footer{padding:40px 7%}@media(max-width:600px){section{padding:50px 6%}}</style></head><body><nav><strong>'+escapeText(values.name)+'</strong><small>'+escapeText(current[0])+'</small></nav><section><small>XPS PLATFORM / NONPRODUCTION CONCEPT</small><h1>'+escapeText(values.headline)+'</h1><p>'+escapeText(values.description)+'</p><a class="cta" href="#contact">'+escapeText(values.cta)+'</a></section><footer id="contact"><strong>'+escapeText(values.name)+'</strong><p>'+escapeText(values.serviceArea)+'</p><p>'+escapeText(values.phone)+' '+escapeText(values.email)+'</p><small>Demo only: contact workflow is not connected.</small></footer></body></html>';
  const shell = {background:'#0e1724',color:'#edf0f6',minHeight:'100vh',padding:24,fontFamily:'system-ui,sans-serif'};
  return <div style={shell}>
    <header style={{marginBottom:22}}><small style={{color:'#d7b778'}}>DIGITAL DOMINANCE / XPS PLATFORM / NOINDEX</small><h1 style={{fontSize:28}}>Approved XPS Mockup Studio</h1><p>Switch between all ten operator-approved visual references, customize business information and export a draft. The approved reference and working HTML concept are intentionally shown separately.</p></header>
    <div style={{display:'grid',gridTemplateColumns:'minmax(210px,1fr) minmax(230px,1fr) minmax(350px,2fr)',gap:18,alignItems:'start'}}>
      <section aria-label="Template chooser" style={{display:'grid',gap:7}}>
      {designs.map((d,i) => <button key={d[1]} onClick={()=>choose(i)} style={{textAlign:'left',padding:13,border:'1px solid '+(i===selected?'#d8b36c':'#354255'),background:i===selected?'#443b2a':'#1a2839',color:'white',borderRadius:8}}>{String(i+1).padStart(2,'0')} · {d[0]}</button>)}</section>
      <section aria-label="Business editor" style={{background:'#192639',padding:17,borderRadius:10}}>
        <h3>Editable business information</h3>
        {Object.keys(initial).map(k => <label key={k} style={{display:'block',marginBottom:12}}><span style={{display:'block',fontSize:12,marginBottom:4}}>{k}</span><input style={{width:'100%',padding:10,color:'#101820',boxSizing:'border-box'}} value={values[k]} onChange={e=>edit(k,e.target.value)}/></label>)}
        <button onClick={()=>download('xps-'+(selected+1)+'-preview.html',html,'text/html')} style={{padding:12,background:'#d8b36c',border:0}}>Download draft HTML</button>
        <button onClick={()=>download('xps-ten-mockup-manifest.json',JSON.stringify({status:'draft',noindex:true,designs:designs.map((d,i)=>({number:i+1,name:d[0],source:referenceLink(d[1]),settings:i===selected?values:drafts[i]||initial}))},null,2),'application/json')} style={{padding:12,marginTop:7}}>Download batch manifest</button>
      </section>
      <section aria-label="Preview" style={{minWidth:0}}>
        <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:12}}>
          <button onClick={()=>setMode('reference')}>Approved PNG</button><button onClick={()=>setMode('editable')}>Editable concept</button><button onClick={()=>setMobile(!mobile)}>{mobile?'Desktop':'Mobile'} preview</button>
          <a style={{color:'#d8b36c'}} href={referenceLink(current[1])} target="_blank" rel="noreferrer">Open original PNG ↗</a>
        </div>
        <div style={{background:'#fff',margin:'auto',width:mobile?390:'100%',maxWidth:'100%',overflow:'auto'}}>
          {mode==='reference' ? <img alt={'Approved reference: '+current[0]} style={{display:'block',width:'100%'}} src={'https://drive.google.com/thumbnail?id='+current[1]+'&sz=w1600'}/> : <iframe title="Editable nonproduction concept" srcDoc={html} style={{border:0,width:'100%',height:730}} sandbox="allow-same-origin"/>}
        </div>
        <p style={{fontSize:13,color:'#bdc9d7'}}>Reference images may require signed-in Drive access. Editable preview is a draft content shell, not a certified pixel-matched implementation. No bid, CRM, messaging or production publishing occurs.</p>
      </section>
    </div>
  </div>;
}
