// BRAND SITE PAGE PACK RENDERER (shared)
// Pure renderer. Turns a completed BrandProfile discovery dossier plus generated
// imagery into 5-7 linked, deploy-ready HTML pages that share one brand:
// the same palette, logo, business name, contact details and SEO metadata.
// No network calls, no SDK — the caller supplies the profile and image URLs.

export const SITE_PAGE_COUNT = { min: 5, max: 7, default: 7 };

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

const list = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const hex = (value, fallback) => (/^#[0-9a-f]{3,8}$/i.test(String(value || '')) ? value : fallback);

function brandTokens(profile) {
  const p = profile?.palette || {};
  return {
    accent: hex(p.accent, '#126fc8'),
    light: hex(p.accentLight, '#6cc6ff'),
    gradient: typeof p.gradient === 'string' && p.gradient.includes('gradient')
      ? p.gradient : 'linear-gradient(135deg,#126fc8,#0d9488)',
  };
}

function fontStack(name, fallback) {
  const clean = String(name || '').replace(/[^a-z0-9 ]/gi, '').trim();
  return clean ? `'${clean}', ${fallback}` : fallback;
}

function fontTokens(profile) {
  const pair = list(profile?.discovery?.font_pairings)[0] || {};
  const body = 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
  return {
    heading: fontStack(pair.heading, body),
    body: fontStack(pair.body, body),
  };
}

function contactOf(profile) {
  const phone = String(profile?.phone || '').trim();
  const email = String(profile?.email || '').trim();
  const tel = phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : '';
  return { phone, email, tel, mailto: email ? `mailto:${email}` : '' };
}

function sentences(text, count) {
  const parts = String(text || '').split(/(?<=\.)\s+/).slice(0, count);
  return parts.join(' ').trim();
}

const PAGES = {
  home: { title: 'Home', category: 'homepage', preview: 'hero' },
  services: { title: 'Services', category: 'service_page', preview: 'services' },
  'service-area': { title: 'Service Area', category: 'location_page', preview: 'hero' },
  about: { title: 'About Us', category: 'about_page', preview: 'about' },
  gallery: { title: 'Our Work', category: 'gallery_page', preview: 'gallery2' },
  contact: { title: 'Free Estimate', category: 'contact_page', preview: 'hero' },
  quote: { title: 'Request a Quote', category: 'estimate_funnel', preview: 'hero' },
};

function hrefFor(key) {
  return key === 'home' ? '/' : `/${key}`;
}

// Per-page search copy: every page gets its own description, keywords and topic
// line so no two pages share the same metadata.
function descriptionFor(key, profile, d, place, label, business) {
  const services = list(d.services).slice(0, 3).map((s) => s?.name).filter(Boolean);
  const base = {
    home: sentences(d.summary, 1) || `${business} provides ${label} work in ${place || 'your area'} with written quotes and measured work.`,
    services: `Every ${label} service ${business} offers in ${place || 'your area'}${services.length ? `: ${services.join(', ')}` : ''}. Written scope and pricing before work starts.`,
    'service-area': `${label} serving ${place || 'your area'} and the surrounding area. Local conditions, scheduled crews and a written quote first.`,
    about: `The team behind ${business}${place ? ` in ${place}` : ''} — how we work, what we stand behind, and how a ${label} job runs from first call to walkthrough.`,
    gallery: `Recent ${label} work, materials and finishes${place ? ` from ${business} in ${place}` : ''}, showing the preparation as well as the finished surface.`,
    contact: `Request a free ${label} estimate${place ? ` in ${place}` : ''}.${profile.phone ? ` Call ${profile.phone}` : ''}${profile.email ? ` or email ${profile.email}` : ''} — measured visit, written price, no obligation.`,
    quote: `Tell us about your ${label} job${place ? ` in ${place}` : ''} and get a written price back. What to send us, and exactly what happens next.`,
  };
  let text = String(base[key] || base.home).replace(/\s+/g, ' ').trim();
  if (text.length < 40) text = `${text} ${business} — ${label}${place ? ` in ${place}` : ''}, with a written quote before any work starts.`.replace(/\s+/g, ' ').trim();
  return text.length > 160 ? `${text.slice(0, 156).trim()}...` : text;
}

function keywordsFor(key, profile, d, place, label, business) {
  const topics = {
    home: `${label} ${place}`,
    services: `${label} services ${place}`,
    'service-area': `${label} near ${place}`,
    about: `about ${business}`,
    gallery: `${label} project gallery ${place}`,
    contact: `free ${label} estimate ${place}`,
    quote: `${label} quote ${place}`,
  };
  return [...list(d.seo_keywords).slice(0, 6), topics[key] || label, business].filter(Boolean).join(', ');
}

function brandBar(profile, tokens) {
  const initials = String(profile.business_name || '')
    .split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || 'B';
  const mark = profile.logo_url
    ? `<img class="mark" src="${esc(profile.logo_url)}" alt="${esc(profile.business_name)} logo">`
    : `<span class="mark mark-fallback">${esc(initials)}</span>`;
  return `<a class="brand" href="/">${mark}<span>${esc(profile.business_name)}</span></a>`;
}

function navMarkup(keys, current) {
  return keys.map((key) => `<a href="${hrefFor(key)}"${key === current ? ' class="on"' : ''}>${esc(PAGES[key].title)}</a>`).join('');
}

function ctaRow(contact, primary = 'Free estimate', secondaryKey = '/contact') {
  const call = contact.tel
    ? `<a class="btn" href="${esc(contact.tel)}">Call ${esc(contact.phone)}</a>`
    : `<a class="btn" href="${secondaryKey}">${esc(primary)}</a>`;
  const alt = contact.tel
    ? `<a class="btn btn-ghost" href="${secondaryKey}">${esc(primary)}</a>`
    : (contact.mailto ? `<a class="btn btn-ghost" href="${esc(contact.mailto)}">Email us</a>` : '');
  return `<div class="row">${call}${alt}</div>`;
}

function ctaBand(profile, tokens, contact) {
  const line = contact.phone || contact.email || 'Send us a message and we will call you back';
  return `<section class="cta">
    <div class="wrap">
      <h2>Ready for a written price?</h2>
      <p>${esc(line)}</p>
      ${ctaRow(contact, 'Request a quote')}
      <p class="tiny">No obligation. We quote the work in writing before anything starts.</p>
    </div>
  </section>`;
}

// Trust copy is page-specific and rotates through the researched signals, so the
// same list never appears twice on a site.
const TRUST_COPY = {
  home: ['What you can ask us for', 'Any of these, with your quote. You should not have to take our word for it.'],
  services: ['Included with every job', 'The paperwork and the standards that come with the work itself.'],
  about: ['Credentials we can document', 'Ask, and we will send the documents that back any of these up.'],
  contact: ['Before you commit', 'Check any of this before you book, not after.'],
  quote: ['What you will get in writing', 'Your quote names all of this, so nothing about the job is verbal.'],
  gallery: ['Behind the finished surface', 'Every project is worked to these standards, not just the ones we photograph.'],
};

function trustSection(d, page) {
  const signals = list(d.trust_signals);
  if (!signals.length) return '';
  const [heading, lede] = TRUST_COPY[page] || TRUST_COPY.home;
  const windows = Math.max(1, Math.ceil(signals.length / 2));
  const start = (Math.max(0, Object.keys(PAGES).indexOf(page)) % windows) * 2;
  const picked = signals.slice(start, start + 4);
  const items = picked.length ? picked : signals.slice(0, 4);
  const tint = !['services', 'contact', 'quote'].includes(page);
  return `<section class="band${tint ? ' tint' : ''}">
    <div class="wrap">
      <h2>${esc(heading)}</h2>
      <p class="lede">${esc(lede)}</p>
      <ul class="checks">${items.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    </div>
  </section>`;
}

function serviceCards(d, limit, opts = {}) {
  const services = list(d.services);
  if (!services.length) return '';
  const shown = limit ? services.slice(0, limit) : services;
  // Summary cards link through to the services page so the two pages never carry
  // the same service copy.
  const items = shown.map((s) => (opts.link
    ? `<a class="card link" href="/services">
      <h3>${esc(s.name)}</h3>
      <p>${s.buyer_question ? `Most asked: &ldquo;${esc(s.buyer_question)}&rdquo;` : esc(s.description)}</p>
    </a>`
    : `<article class="card">
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.description)}</p>
      ${s.buyer_question ? `<p class="ask">Most asked: &ldquo;${esc(s.buyer_question)}&rdquo;</p>` : ''}
    </article>`)).join('');
  const title = opts.heading || (limit ? 'What we do' : `Every service we offer in ${esc(d.__city || 'your area')}`);
  return `<section class="band">
    <div class="wrap">
      <h2>${opts.heading ? esc(title) : title}</h2>
      ${opts.lede ? `<p class="lede">${esc(opts.lede)}</p>` : ''}
      <div class="grid cols-3">${items}</div>
    </div>
  </section>`;
}

function galleryStrip(images, d, limit = 3) {
  const slots = ['gallery1', 'gallery2', 'gallery3'].map((k) => images[k]).filter(Boolean).slice(0, limit);
  if (!slots.length) return '';
  const prompts = list(d.image_prompts);
  const figs = slots.map((url, i) => `<figure>
      <img src="${esc(url)}" alt="${esc(prompts[i]?.slot || 'Completed project')}" loading="lazy">
      <figcaption>${esc(prompts[i]?.slot || 'Completed project')}</figcaption>
    </figure>`).join('');
  return `<section class="band tint">
    <div class="wrap">
      <h2>Recent work</h2>
      <div class="gallery">${figs}</div>
      <p class="tiny">Concept imagery for this design. Every published site is filled with the operator's own project photos before launch.</p>
    </div>
  </section>`;
}

function askSection(d) {
  const questions = list(d.aeo_questions).slice(0, 4);
  if (!questions.length) return '';
  return `<section class="band">
    <div class="wrap">
      <h2>What buyers ask before booking</h2>
      <ul class="checks">${questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
      <p class="tiny">Call or request a quote and we will answer each one for your property.</p>
    </div>
  </section>`;
}

// The quote funnel carries its own content so it never duplicates the contact page.
function quoteDetailSection(contact) {
  const items = [
    'The address and any access notes, gate codes or parking details',
    'Photos of the area as it looks today',
    'Rough dimensions, or the number of cars for a garage',
    'What you want the finished surface to look like',
  ];
  const steps = [
    ['You send the details', 'Address, photos and rough sizes. That is usually enough for us to price the job.'],
    ['We measure and confirm', 'For anything complex we book a short on-site visit and confirm the exact scope with you.'],
    ['Written price comes back', 'The scope, the price, the materials and the schedule, in writing, before anything starts.'],
  ];
  return `<section class="band">
    <div class="wrap">
      <h2>Send us this and the quote is accurate</h2>
      <ul class="checks">${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      <p class="tiny">Send it to ${esc(contact.email || contact.phone || 'us')} and we will come back with a written range instead of a guess.</p>
    </div>
  </section>
  <section class="band tint">
    <div class="wrap">
      <h2>What happens after you send it</h2>
      <ol class="steps">${steps.map(([t, b]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p></li>`).join('')}</ol>
    </div>
  </section>`;
}

function materialsSection(d, opts = {}) {
  const items = list(d.products_and_tools);
  if (!items.length) return '';
  const { heading = 'Materials and equipment we work with', lede = '', limit = 8, tint = true, offset = 0 } = opts;
  const rotated = [...items.slice(offset), ...items.slice(0, offset)];
  const cards = rotated.slice(0, limit).map((t) => `<article class="card">
      <h3>${esc(t.name)}</h3>
      <p>${esc(t.use)}</p>
      ${t.brand_examples ? `<p class="ask">${esc(t.brand_examples)}</p>` : ''}
    </article>`).join('');
  return `<section class="band${tint ? ' tint' : ''}">
    <div class="wrap">
      <h2>${esc(heading)}</h2>
      ${lede ? `<p class="lede">${esc(lede)}</p>` : ''}
      <div class="grid cols-2">${cards}</div>
    </div>
  </section>`;
}

function processSection() {
  const steps = [
    ['Free on-site assessment', 'We look at the actual conditions, measure, and tell you what the work really needs.'],
    ['Written scope and fixed price', 'You get the full scope and the price in writing before anything starts.'],
    ['The work itself', 'A scheduled crew, protected surroundings, and the method and materials named in your quote.'],
    ['Walkthrough and aftercare', 'A final walkthrough with you, plus care instructions and warranty terms in writing.'],
  ];
  return `<section class="band">
    <div class="wrap">
      <h2>How the job runs</h2>
      <ol class="steps">${steps.map(([t, b]) => `<li><h3>${esc(t)}</h3><p>${esc(b)}</p></li>`).join('')}</ol>
    </div>
  </section>`;
}

function buildPageBody(key, ctx) {
  const { profile, d, images, contact } = ctx;
  const label = profile.industry_label || profile.industry || 'local service';
  const place = [profile.city, profile.state].filter(Boolean).join(', ') || 'your area';

  if (key === 'home') {
    const hook = list(d.hooks)[0] || `${label} in ${place}, done right the first time`;
    return `${hero({
      eyebrow: `${label} — ${place}`,
      title: hook,
      sub: sentences(d.summary, 2) || `${profile.business_name} serves ${place} with measured, written quotes and work we stand behind.`,
      image: images.hero,
      contact,
    })}
    ${trustSection(d, 'home')}
    ${serviceCards(d, 6, { link: true, heading: 'The work we do most', lede: 'Each of these is measured on site and priced in writing. The full service list, with what every job involves, is on the services page.' })}
    ${galleryStrip(images, d)}
    ${askSection(d)}
    ${ctaBand(profile, null, contact)}`;
  }

  if (key === 'services') {
    return `${hero({
      eyebrow: 'Services',
      title: `Everything we do for ${place} properties`,
      sub: `Full scope, written pricing and no surprise line items.`,
      image: images.services,
      contact,
    })}
    ${serviceCards(d, 0)}
    ${materialsSection(d)}
    ${trustSection(d, 'services')}
    ${ctaBand(profile, null, contact)}`;
  }

  if (key === 'service-area') {
    const facts = list(d.geo_facts);
    return `${hero({
      eyebrow: 'Service area',
      title: `${label} in ${place}`,
      sub: `Local conditions, local crews, and a written quote before any work begins.`,
      image: images.hero,
      contact,
    })}
    <section class="band">
      <div class="wrap">
        <h2>How we work in ${esc(place)}</h2>
        <ul class="checks">${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        <p class="lede">Not sure whether your address is inside the area? Call ${esc(contact.phone || 'us')} and we will confirm the same day.</p>
      </div>
    </section>
    ${serviceCards(d, 4, { link: true, heading: `The work we take on around ${place}`, lede: 'If your address is inside the area, one of these is the job you are booking.' })}
    ${ctaBand(profile, null, contact)}`;
  }

  if (key === 'gallery') {
    return `${hero({
      eyebrow: 'Our work',
      title: 'Projects, materials and finishes',
      sub: 'Concept imagery for this design — replaced with the operator’s own project photos before launch.',
      image: images.gallery2 || images.hero,
      contact,
    })}
    ${galleryStrip(images, d, 3)}
    ${materialsSection(d, { heading: 'Finishes and materials you can choose', limit: 4, tint: false, offset: 2, lede: 'What the surface can be made from, and what each finish does for the room it is in.' })}
    ${askSection(d)}
    ${ctaBand(profile, null, contact)}`;
  }

  if (key === 'about') {
    return `${hero({
      eyebrow: 'About us',
      title: `The team behind ${profile.business_name}`,
      sub: `${label} serving ${place}.`,
      image: images.about || images.hero,
      contact,
    })}
    <section class="band">
      <div class="wrap narrow">
        <h2>Who we are</h2>
        <p class="lede">${esc(sentences(d.summary, 4) || `${profile.business_name} is a ${label} company serving ${place}.`)}</p>
      </div>
    </section>
    ${processSection()}
    ${materialsSection(d, { heading: 'The equipment and materials we bring', limit: 3, tint: false, offset: 1, lede: 'The products we put on your job, named in your quote so you can check what is going into the surface.' })}
    ${trustSection(d, 'about')}
    ${ctaBand(profile, null, contact)}`;
  }

  if (key === 'contact' || key === 'quote') {
    const isQuote = key === 'quote';
    const questions = list(d.aeo_questions).slice(0, 8);
    const cards = [
      contact.tel ? `<a class="card link" href="${esc(contact.tel)}"><h3>Call ${esc(contact.phone)}</h3><p>The fastest way to get a price. Tell us the address and what you need done.</p></a>` : '',
      contact.mailto ? `<a class="card link" href="${esc(contact.mailto)}"><h3>Email ${esc(contact.email)}</h3><p>Send photos and measurements and we will reply with a written range.</p></a>` : '',
      `<a class="card link" href="/services"><h3>See the services first</h3><p>Every service we offer, with the questions buyers ask most about each one.</p></a>`,
    ].filter(Boolean).join('');
    return `${hero({
      eyebrow: key === 'quote' ? 'Request a quote' : 'Free estimate',
      title: key === 'quote' ? 'Tell us about the job' : `Get a free estimate in ${place}`,
      sub: 'Measured on site, priced in writing, no obligation.',
      image: images.hero,
      contact,
    })}
    <section class="band">
      <div class="wrap">
        <h2>${isQuote ? 'Send it three ways' : 'Talk to us three ways'}</h2>
        <div class="grid cols-3">${cards}</div>
      </div>
    </section>
    ${isQuote ? quoteDetailSection(contact) : `<section class="band tint">
      <div class="wrap">
        <h2>What we will cover on the call</h2>
        <ul class="checks">${questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
      </div>
    </section>`}
    ${trustSection(d, isQuote ? 'quote' : 'contact')}
    ${ctaBand(profile, null, contact)}`;
  }

  return ctaBand(profile, null, contact);
}

function hero({ eyebrow, title, sub, image, contact }) {
  const media = image
    ? `<img class="hero-img" src="${esc(image)}" alt="${esc(eyebrow)}" loading="eager">`
    : `<div class="hero-img hero-fallback" aria-hidden="true"></div>`;
  return `<section class="hero">
    ${media}
    <div class="hero-copy">
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${esc(title)}</h1>
      <p class="sub">${esc(sub)}</p>
      ${ctaRow(contact, 'Request a quote')}
    </div>
  </section>`;
}

function styles(tokens, fonts) {
  return `
:root{--accent:${tokens.accent};--accent-light:${tokens.light};--grad:${tokens.gradient};--ink:#0b1520;--muted:#54637a;--line:#e3e8ef;--paper:#ffffff;--tint:#f6f8fb;--display:${fonts.heading};--body:${fonts.body}}
*{box-sizing:border-box}
body{margin:0;font-family:var(--body);color:var(--ink);background:var(--paper);line-height:1.6}
h1,h2,h3{font-family:var(--display);line-height:1.15;margin:0 0 10px}
h1{font-size:clamp(30px,4.6vw,54px);letter-spacing:-.02em}
h2{font-size:clamp(22px,2.6vw,34px);letter-spacing:-.01em}
p{margin:0 0 12px}
a{color:var(--accent)}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
.wrap.narrow{max-width:760px}
.band{padding:56px 0}
.band.tint{background:var(--tint)}
.notice{background:#0b1520;color:#c9d6e6;font-size:11px;letter-spacing:.1em;text-transform:uppercase;text-align:center;padding:7px 16px}
header.nav{border-bottom:1px solid var(--line);background:rgba(255,255,255,.94);backdrop-filter:blur(10px);position:sticky;top:0;z-index:40}
.nav-inner{display:flex;align-items:center;gap:18px;max-width:1120px;margin:0 auto;padding:12px 20px}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--display);font-weight:800;font-size:17px;color:var(--ink);text-decoration:none}
.mark{height:36px;width:36px;object-fit:contain;border-radius:9px}
.mark-fallback{display:grid;place-items:center;background:var(--grad);color:#fff;font-size:14px}
.nav-links{display:flex;gap:16px;margin-left:auto;flex-wrap:wrap}
.nav-links a{color:var(--muted);font-weight:600;font-size:14px;text-decoration:none}
.nav-links a.on{color:var(--accent)}
.phone{font-weight:800;color:var(--accent);text-decoration:none;white-space:nowrap}
.hero{position:relative;min-height:clamp(420px,58vh,620px);display:flex;align-items:flex-end;overflow:hidden}
.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero-fallback{background:var(--grad)}
.hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,12,24,.25),rgba(4,12,24,.88))}
.hero-copy{position:relative;max-width:1120px;margin:0 auto;padding:40px 20px 48px;color:#fff;width:100%}
.hero-copy h1{color:#fff;text-shadow:0 2px 20px rgba(0,0,0,.35)}
.sub{font-size:clamp(15px,1.7vw,19px);max-width:640px;color:#e8eef7}
.eyebrow{font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--accent-light);margin-bottom:10px}
.row{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
.btn{display:inline-flex;align-items:center;gap:8px;background:var(--grad);color:#fff!important;font-weight:800;font-size:15px;padding:14px 24px;border-radius:12px;text-decoration:none;box-shadow:0 10px 26px -12px rgba(0,0,0,.6)}
.btn-ghost{background:#fff;color:var(--ink)!important;border:1px solid rgba(255,255,255,.4)}
.band .btn-ghost{background:#fff;border:1px solid var(--line)}
.grid{display:grid;gap:16px}
.cols-2{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.cols-3{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 8px 26px -22px rgba(9,30,60,.5)}
.card h3{font-size:17px;margin-bottom:6px}
.card p{color:var(--muted);font-size:14.5px;margin:0}
.card.link{text-decoration:none;display:block;transition:border-color .15s,transform .15s}
.card.link h3{color:var(--ink)}
.card.link p{color:var(--muted)}
.card.link:hover{border-color:var(--accent);transform:translateY(-2px)}
.ask{margin-top:10px!important;font-size:13px;color:var(--accent)!important;font-weight:600}
.lede{color:var(--muted);font-size:16px}
.tiny{font-size:12px;color:var(--muted)}
.checks{list-style:none;padding:0;margin:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.checks li{position:relative;padding-left:28px;font-size:15px}
.checks li::before{content:'';position:absolute;left:0;top:7px;width:14px;height:14px;border-radius:4px;background:var(--grad)}
.steps{list-style:none;counter-reset:s;padding:0;margin:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.steps li{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;counter-increment:s}
.steps li::before{content:counter(s);display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:var(--grad);color:#fff;font-weight:800;margin-bottom:10px}
.steps p{color:var(--muted);font-size:14.5px;margin:0}
.gallery{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
figure{margin:0;border-radius:16px;overflow:hidden;border:1px solid var(--line);background:#fff}
figure img{width:100%;height:230px;object-fit:cover;display:block}
figcaption{padding:10px 14px;font-size:13px;color:var(--muted);font-weight:600}
.cta{background:var(--grad);color:#fff;padding:56px 0}
.cta h2{color:#fff}
.cta p{color:#eaf1fa}
.cta .tiny{color:#d7e4f2}
footer{background:#0b1520;color:#9fb1c6;padding:40px 0 90px;font-size:14px}
.foot-grid{display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
footer h4{color:#fff;font-family:var(--display);font-size:14px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 10px}
footer a{color:#cfdcec;text-decoration:none;display:block;margin-bottom:6px}
.sticky{position:fixed;left:0;right:0;bottom:0;display:none;gap:10px;padding:10px 14px;background:rgba(255,255,255,.97);border-top:1px solid var(--line);z-index:50}
.sticky .btn{flex:1;justify-content:center;padding:13px 16px}
@media(max-width:720px){.nav-links{display:none}.sticky{display:flex}.band{padding:40px 0}.hero{min-height:78vh}}`;
}

export function buildBrandSitePages({ profile, images = {}, pageCount = SITE_PAGE_COUNT.default }) {
  const tokens = brandTokens(profile);
  const fonts = fontTokens(profile);
  const contact = contactOf(profile);
  const d = { ...(profile?.discovery || {}), __city: profile?.city };
  const count = Math.min(SITE_PAGE_COUNT.max, Math.max(SITE_PAGE_COUNT.min, Number(pageCount) || SITE_PAGE_COUNT.default));

  const keys = ['home', 'services', 'service-area', 'about'];
  if (count >= 6) keys.push('gallery');
  keys.push('contact');
  if (count >= 7) keys.push('quote');

  const css = styles(tokens, fonts);
  const place = [profile.city, profile.state].filter(Boolean).join(', ');

  return keys.map((key) => {
    const meta = PAGES[key];
    const title = `${meta.title} | ${profile.business_name}${place ? ` — ${place}` : ''}`;
    const label = profile.industry_label || profile.industry || 'local service';
    const description = descriptionFor(key, profile, d, place, label, profile.business_name);
    const keywords = keywordsFor(key, profile, d, place, label, profile.business_name);
    const body = buildPageBody(key, { profile, d, images, contact });
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: profile.business_name,
      description,
      serviceType: profile.industry_label || profile.industry,
      areaServed: place || undefined,
      telephone: contact.phone || undefined,
      email: contact.email || undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.city || undefined,
        addressRegion: profile.state || undefined,
        addressCountry: 'US',
      },
    };
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description.slice(0, 160))}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description.slice(0, 160))}">
<meta property="og:type" content="website">
<meta name="robots" content="index,follow">
<style>${css}</style>
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
</head>
<body>
<div class="notice">Original template concept — business details, credentials and claims require verification before publishing</div>
<header class="nav"><div class="nav-inner">
${brandBar(profile, tokens)}
<div class="nav-links">${navMarkup(keys, key)}</div>
${contact.tel ? `<a class="phone" href="${esc(contact.tel)}">${esc(contact.phone)}</a>` : `<a class="phone" href="/contact">Free estimate</a>`}
</div></header>
${body}
<footer><div class="wrap"><div class="foot-grid">
<div>
${brandBar(profile, tokens)}
<p>${esc(profile.industry_label || profile.industry || '')}${place ? ` serving ${esc(place)}` : ''}.</p>
</div>
<div>
<h4>Pages</h4>
${keys.map((k) => `<a href="${hrefFor(k)}">${esc(PAGES[k].title)}</a>`).join('')}
</div>
<div>
<h4>Contact</h4>
${contact.tel ? `<a href="${esc(contact.tel)}">${esc(contact.phone)}</a>` : ''}
${contact.mailto ? `<a href="${esc(contact.mailto)}">${esc(contact.email)}</a>` : ''}
<a href="/contact">Request a quote</a>
${profile.website_url ? `<a href="${esc(profile.website_url)}">Your current site</a>` : ''}
</div>
</div>
<p class="tiny" style="margin-top:24px">Template concept built for ${esc(profile.business_name)}. Replace placeholder imagery and verify all claims before publishing.</p>
</div></footer>
<div class="sticky">
${contact.tel ? `<a class="btn" href="${esc(contact.tel)}">Call now</a>` : ''}
<a class="btn btn-ghost" href="/contact">Free estimate</a>
</div>
</body>
</html>`;

    return {
      key,
      title: meta.title,
      category: meta.category,
      path: hrefFor(key),
      preview_slot: meta.preview,
      description,
      html,
    };
  });
}