(()=>{'use strict';
const $=(s)=>document.querySelector(s);const $$=(s)=>[...document.querySelectorAll(s)];
const id=document.body.dataset.template;
const qs=new URLSearchParams(location.search);
const demo={argent:{brand:'ARGENT & VALE',headline:'Clarity in<br><em>complexity.</em>'},monolith:{brand:'MONOLITH',headline:'BEYOND<br>THE <em>ORDINARY.</em>'},atelier:{brand:'ATELIER SEREIN',headline:'Beauty in<br><em>the pause.</em>'}};
let lastFocus;
$$('.mobile-toggle').forEach(btn=>btn.addEventListener('click',()=>{const el=document.getElementById(btn.getAttribute('aria-controls'));if(!el)return;const on=el.classList.toggle('open');btn.setAttribute('aria-expanded',String(on));btn.textContent=on?'×':'☰'}));
$$('nav a').forEach(a=>a.addEventListener('click',()=>{$$('nav.open').forEach(nav=>nav.classList.remove('open'));$$('.mobile-toggle').forEach(b=>{b.setAttribute('aria-expanded','false');b.textContent='☰'})}));
function closeDialog(){const el=$('.modal-backdrop.open');if(!el)return;el.classList.remove('open');document.body.style.overflow='';lastFocus?.focus()}
$$('[data-dialog-open]').forEach(btn=>btn.addEventListener('click',()=>{lastFocus=btn;const el=document.getElementById(btn.dataset.dialogOpen);if(el){el.classList.add('open');document.body.style.overflow='hidden';el.querySelector('button')?.focus()}}));
$$('[data-dialog-close]').forEach(btn=>btn.addEventListener('click',closeDialog));$$('.modal-backdrop').forEach(el=>el.addEventListener('click',e=>{if(e.target===el)closeDialog()}));
$$('[data-demo-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();const feedback=form.querySelector('.live-feedback');feedback.textContent='Preview submitted locally. No information was sent, stored, or recorded.';feedback.classList.add('show');form.reset()}));
if(id==='monolith'){
const area=$('#mo-area'),finish=$('#mo-finish'),condition=$('#mo-condition'),result=$('#mo-result');
function calc(){const v=Number(area.value);if(!Number.isFinite(v)||v<50||v>30000){result.querySelector('strong').textContent='ENTER 50–30,000 SQ FT';result.querySelector('small').textContent='Demo accepts valid positive square footage in this range.';return}const rates={metallic:8.5,pearl:9.5,concrete:7};const base=v*rates[finish.value]*(condition.value==='heavy'?1.35:1);const fmt=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Math.round(n/50)*50);result.querySelector('strong').textContent=fmt(base*.85)+' – '+fmt(base*1.25);result.querySelector('small').textContent=`Illustrative only · ${v.toLocaleString('en-US')} sq ft · ${finish.selectedOptions[0].text}. Not a contractor price.`}
$('#mo-calculate')?.addEventListener('click',calc);$$('[data-finish]').forEach(btn=>btn.addEventListener('click',()=>{finish.value=btn.dataset.finish;document.getElementById('estimate').scrollIntoView({behavior:'smooth'});calc()}));calc();
}
if(id==='atelier'){
const cart=[];const drawer=$('#at-drawer'),scrim=$('#at-drawer-scrim');
function viewCart(){const count=cart.length;$('#at-bag-count').textContent=`(${count})`;const box=$('#at-cart-items');box.replaceChildren();if(!count){box.textContent='Your bag is quietly waiting.'} else {cart.forEach(item=>{const row=document.createElement('div');row.className='at-cart-line';const name=document.createElement('span');name.textContent=item.name;const price=document.createElement('strong');price.textContent='$'+item.price;row.append(name,price);box.appendChild(row)})}$('#at-cart-total').textContent='$'+cart.reduce((sum,i)=>sum+i.price,0)}
function toggleCart(open){drawer.classList.toggle('open',open);scrim.classList.toggle('open',open);drawer.setAttribute('aria-hidden',String(!open));document.body.style.overflow=open?'hidden':'';if(open)$('#at-cart-close')?.focus();else $('#at-cart-open')?.focus()}
$$('[data-product]').forEach(btn=>btn.addEventListener('click',()=>{cart.push({name:btn.dataset.product,price:Number(btn.dataset.price)});viewCart();toggleCart(true)}));$('#at-cart-open')?.addEventListener('click',()=>toggleCart(true));$('#at-cart-close')?.addEventListener('click',()=>toggleCart(false));scrim?.addEventListener('click',()=>toggleCart(false));$('#at-checkout')?.addEventListener('click',()=>{$('#at-cart-feedback').textContent='This concept has no payment integration. Checkout is intentionally disabled.'});viewCart();
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDialog();if(id==='atelier'&&$('#at-drawer')?.classList.contains('open')){$('#at-cart-close')?.click()}}});
// Preview editor applies text-only updates. No remote APIs, eval, or HTML injection.
function applyPreview(cfg){if(!cfg||typeof cfg!=='object')return;if(typeof cfg.brand==='string'&&cfg.brand.trim()){$$('[data-brand]').forEach(el=>{el.textContent=cfg.brand.slice(0,45)})}if(typeof cfg.headline==='string'&&cfg.headline.trim()){$$('[data-headline]').forEach(el=>{el.textContent=cfg.headline.slice(0,90)})}if(typeof cfg.accent==='string'&&/^#[a-fA-F0-9]{6}$/.test(cfg.accent)){document.body.style.setProperty('--preview-accent',cfg.accent);if(id==='monolith')document.body.style.setProperty('--mo-gold',cfg.accent)}}
window.addEventListener('message',e=>{if(e.source!==window.parent)return;if(e.data?.type==='DD_PREVIEW_CONFIG')applyPreview(e.data.config)});
try{const fromUrl=qs.get('preview');if(fromUrl){const obj=JSON.parse(decodeURIComponent(fromUrl));applyPreview(obj)}}catch{}
if(window.DD_INITIAL_CONFIG)applyPreview(window.DD_INITIAL_CONFIG);
window.parent!==window&&window.parent.postMessage({type:'DD_PREVIEW_READY',template:id},'*');
})();
