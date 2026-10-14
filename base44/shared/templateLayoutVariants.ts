/**
 * Template Layout Variants — 3 structurally distinct layouts
 * so each niche gets a visually unique template, not the same
 * skeleton with different colors.
 *
 * Layout A: "Split Modern" — split-screen hero, alternating service rows, masonry gallery
 * Layout B: "Bold Centered" — centered hero, 2x2 service grid with overlays, large testimonial cards
 * Layout C: "Corporate Sidebar" — utility bar, hero with lead form, numbered services, sitemap footer
 *
 * Each layout receives the niche config (colors, images, copy) and
 * returns a complete, self-contained HTML document with unique CSS.
 */

interface NicheProfile {
  hero: string;
  sub: string;
  cta: string;
  phone: string;
  primary: string;
  primaryDark: string;
  accent: string;
  bgImage: string;
  services: { title: string; desc: string; img: string }[];
  gallery: string[];
  testimonials: { name: string; text: string; avatar: string; rating: number }[];
  stats: { value: string; label: string }[];
  trustBadges: string[];
  serviceName: string;
}

function esc(s: string): string {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function stars(n: number): string {
  return "★★★★★".substring(0, n) + "☆☆☆☆☆".substring(0, 5 - n);
}

// Assign a layout variant per niche for visual variety
export const NICHE_LAYOUT_MAP: Record<string, number> = {
  water_damage: 1, roofing: 2, hvac: 3, plumbing: 1, epoxy: 2,
  electrician: 3, pest_control: 1, landscaping: 2, mold_remediation: 1,
  fire_damage: 1, garage_door: 3, legal: 2, real_estate: 3, remodeling: 2,
  med_spa: 3, dental: 2, chiropractic: 1, solar: 3, automotive: 2,
  cleaning: 1, identity: 3,
};

export function getLayoutForNiche(niche: string): number {
  const key = (niche || "").toLowerCase().replace(/ /g, "_");
  return NICHE_LAYOUT_MAP[key] || ((key.length % 3) + 1);
}

// =====================================================================
// LAYOUT A — "Split Modern"
// Split-screen hero, alternating service rows, masonry gallery
// =====================================================================
function layoutA(c: NicheProfile, brand: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(brand)} — ${esc(c.hero)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,sans-serif;color:#1a1a2e;line-height:1.6;overflow-x:hidden}
img{display:block;max-width:100%}
a{text-decoration:none;color:inherit}
.wrap{max-width:1200px;margin:0 auto;padding:0 24px}

/* Split Header */
.head{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.95);backdrop-filter:blur(12px);border-bottom:2px solid ${c.primary}}
.head .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
.logo{font-size:20px;font-weight:900;color:${c.primary};letter-spacing:-.03em}
.nav{display:flex;gap:24px}
.nav a{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#555;transition:color .2s}
.nav a:hover{color:${c.accent}}
.call-btn{display:flex;align-items:center;gap:8px;padding:10px 20px;border-radius:8px;background:${c.primary};color:#fff;font-size:13px;font-weight:700;border:none;cursor:pointer}

/* Split Hero */
.hero{display:grid;grid-template-columns:1fr 1fr;min-height:560px}
.hero-left{display:flex;flex-direction:column;justify-content:center;padding:60px 48px;background:${c.primaryDark}}
.hero-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:4px;background:rgba(255,255,255,.1);color:${c.accent};font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:20px;width:fit-content}
.hero-left h1{font-size:40px;font-weight:900;line-height:1.05;color:#fff;margin-bottom:16px;letter-spacing:-.02em}
.hero-left p{font-size:16px;color:rgba(255,255,255,.8);margin-bottom:28px}
.hero-cta{display:flex;gap:12px;flex-wrap:wrap}
.btn-solid{padding:14px 28px;border-radius:8px;background:${c.accent};color:#fff;font-size:14px;font-weight:700;border:none;cursor:pointer;transition:transform .15s}
.btn-solid:hover{transform:translateY(-2px)}
.btn-ghost{padding:14px 28px;border-radius:8px;background:transparent;color:#fff;border:2px solid rgba(255,255,255,.3);font-size:14px;font-weight:700;cursor:pointer}
.hero-right{background:url('${c.bgImage}') center/cover no-repeat;position:relative}
.hero-right::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,${c.primaryDark}40,transparent)}

/* Trust strip */
.trust{background:#fff;border-bottom:1px solid #eee;padding:18px 0}
.trust .wrap{display:flex;justify-content:center;gap:40px;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#333}
.trust-check{width:22px;height:22px;border-radius:50%;background:${c.accent}20;color:${c.accent};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900}

/* Alternating Services */
.svc{padding:80px 0}
.svc-head{text-align:center;margin-bottom:56px}
.svc-head h2{font-size:34px;font-weight:900;color:${c.primary};letter-spacing:-.02em;margin-bottom:8px}
.svc-head p{font-size:16px;color:#777}
.svc-row{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:64px}
.svc-row:nth-child(even) .svc-img{order:2}
.svc-row:nth-child(even) .svc-text{order:1}
.svc-img{border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.1)}
.svc-img img{width:100%;aspect-ratio:4/3;object-fit:cover;transition:transform .4s}
.svc-row:hover .svc-img img{transform:scale(1.05)}
.svc-text h3{font-size:24px;font-weight:800;color:${c.primary};margin-bottom:10px}
.svc-text p{font-size:15px;color:#555;margin-bottom:16px}
.svc-num{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:${c.accent};margin-bottom:8px}
.svc-num::before{content:'';width:30px;height:2px;background:${c.accent}}

/* Masonry Gallery */
.gal{padding:80px 0;background:#f8f9fb}
.gal-head{text-align:center;margin-bottom:40px}
.gal-head h2{font-size:34px;font-weight:900;color:${c.primary};margin-bottom:8px}
.gal-grid{columns:3;column-gap:16px}
.gal-grid img{width:100%;border-radius:12px;margin-bottom:16px;break-inside:avoid;transition:transform .3s,box-shadow .3s}
.gal-grid img:hover{transform:scale(1.03);box-shadow:0 8px 30px rgba(0,0,0,.15)}

/* Quote Testimonials */
.test{padding:80px 0}
.test-head{text-align:center;margin-bottom:48px}
.test-head h2{font-size:34px;font-weight:900;color:${c.primary};margin-bottom:8px}
.test-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:32px}
.test-card{position:relative;padding:36px 28px 28px;background:#fff;border-radius:16px;border-left:4px solid ${c.accent};box-shadow:0 4px 20px rgba(0,0,0,.06)}
.test-card::before{content:'"';position:absolute;top:0;right:24px;font-size:80px;color:${c.accent}20;font-family:Georgia,serif;line-height:1}
.test-stars{color:${c.accent};font-size:16px;letter-spacing:2px;margin-bottom:12px}
.test-text{font-size:15px;color:#444;line-height:1.7;font-style:italic;margin-bottom:20px}
.test-author{display:flex;align-items:center;gap:12px}
.test-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover}
.test-name{font-size:14px;font-weight:800;color:${c.primary}}
.test-role{font-size:12px;color:#999}

/* CTA Band */
.cta{background:linear-gradient(135deg,${c.primary},${c.accent});padding:56px 0;text-align:center}
.cta h2{font-size:30px;font-weight:900;color:#fff;margin-bottom:8px}
.cta p{font-size:16px;color:rgba(255,255,255,.85);margin-bottom:24px}
.cta .btn-solid{background:#fff;color:${c.primary}}

/* Contact */
.contact{padding:80px 0;background:#f8f9fb}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.contact-info h2{font-size:28px;font-weight:900;color:${c.primary};margin-bottom:12px}
.contact-info p{font-size:15px;color:#666;margin-bottom:24px}
.contact-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;font-size:15px;font-weight:600;color:#333}
.contact-ico{width:36px;height:36px;border-radius:8px;background:${c.primary}10;display:flex;align-items:center;justify-content:center;font-size:16px}
.form{background:#fff;border-radius:16px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,.06)}
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em}
.field input,.field textarea{width:100%;height:44px;border:1px solid #ddd;border-radius:8px;padding:0 14px;font-size:15px;outline:none;transition:border-color .15s}
.field input:focus,.field textarea:focus{border-color:${c.accent}}
.field textarea{height:100px;padding:12px 14px;resize:vertical}
.form .btn-solid{width:100%;padding:14px}

/* Footer */
.foot{background:${c.primaryDark};color:#94a3b8;padding:48px 0 24px}
.foot .wrap{display:grid;grid-template-columns:2fr 1fr 1fr;gap:40px}
.foot-brand{font-size:22px;font-weight:900;color:#fff;margin-bottom:8px}
.foot p{font-size:14px;margin-bottom:8px}
.foot h4{font-size:13px;font-weight:800;color:#fff;margin-bottom:12px;text-transform:uppercase;letter-spacing:.08em}
.foot a{display:block;font-size:14px;color:#94a3b8;margin-bottom:8px;transition:color .15s}
.foot a:hover{color:#fff}
.foot-bottom{border-top:1px solid rgba(255,255,255,.1);margin-top:32px;padding-top:20px;text-align:center;font-size:13px;color:#64748b}

@media(max-width:768px){
  .nav{display:none}.hero{grid-template-columns:1fr}.hero-right{min-height:240px}
  .hero-left{padding:48px 24px}.hero-left h1{font-size:30px}
  .svc-row{grid-template-columns:1fr;gap:24px}.svc-row:nth-child(even) .svc-img{order:1}.svc-row:nth-child(even) .svc-text{order:2}
  .gal-grid{columns:2}.contact-grid{grid-template-columns:1fr}.foot .wrap{grid-template-columns:1fr}
  .svc-head h2,.gal-head h2,.test-head h2{font-size:26px}
}
</style>
</head>
<body>
<header class="head"><div class="wrap">
  <div class="logo">${esc(brand)}</div>
  <nav class="nav"><a href="#services">Services</a><a href="#gallery">Work</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a></nav>
  <button class="call-btn">📞 ${esc(c.phone)}</button>
</div></header>

<section class="hero">
  <div class="hero-left">
    <span class="hero-badge">★ ${esc(c.stats[2].value)} Rated</span>
    <h1>${esc(c.hero)}</h1>
    <p>${esc(c.sub)}</p>
    <div class="hero-cta">
      <button class="btn-solid">${esc(c.cta)}</button>
      <button class="btn-ghost">See Our Work</button>
    </div>
  </div>
  <div class="hero-right"></div>
</section>

<div class="trust"><div class="wrap">
  ${c.trustBadges.map(b => `<span class="trust-item"><span class="trust-check">✓</span>${esc(b)}</span>`).join("\n  ")}
</div></div>

<section class="svc" id="services"><div class="wrap">
  <div class="svc-head"><h2>What We Do</h2><p>Professional services backed by experience and guaranteed results.</p></div>
  ${c.services.map((s,i) => `<div class="svc-row">
    <div class="svc-img"><img src="${s.img}" alt="${esc(s.title)}" loading="lazy"></div>
    <div class="svc-text">
      <span class="svc-num">0${i+1} — Service</span>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.desc)}</p>
      <button class="btn-solid" style="padding:10px 22px;font-size:13px">Learn More →</button>
    </div>
  </div>`).join("\n  ")}
</div></section>

<section class="gal" id="gallery"><div class="wrap">
  <div class="gal-head"><h2>Recent Projects</h2><p>Real work. Real results. See the difference.</p></div>
  <div class="gal-grid">
    ${c.gallery.map(g => `<img src="${g}" alt="Project" loading="lazy">`).join("\n    ")}
  </div>
</div></section>

<section class="test" id="reviews"><div class="wrap">
  <div class="test-head"><h2>Client Stories</h2><p>Don't take our word for it.</p></div>
  <div class="test-grid">
    ${c.testimonials.map(t => `<div class="test-card">
      <div class="test-stars">${stars(t.rating)}</div>
      <p class="test-text">${esc(t.text)}</p>
      <div class="test-author">
        <img class="test-avatar" src="${t.avatar}" alt="${esc(t.name)}" loading="lazy">
        <div><div class="test-name">${esc(t.name)}</div><div class="test-role">Verified Customer</div></div>
      </div>
    </div>`).join("\n    ")}
  </div>
</div></section>

<section class="cta"><div class="wrap">
  <h2>Ready to Get Started?</h2>
  <p>Call ${esc(c.phone)} or fill out the form below for a free consultation.</p>
  <button class="btn-solid">${esc(c.cta)}</button>
</div></section>

<section class="contact" id="contact"><div class="wrap">
  <div class="contact-grid">
    <div class="contact-info">
      <h2>Get In Touch</h2>
      <p>Fast response, honest pricing, and quality work guaranteed.</p>
      <div class="contact-row"><div class="contact-ico">📞</div>${esc(c.phone)}</div>
      <div class="contact-row"><div class="contact-ico">✉️</div>info@${brand.toLowerCase().replace(/[^a-z0-9]/g,"")}.com</div>
      <div class="contact-row"><div class="contact-ico">⏰</div>Open 24/7 for emergencies</div>
    </div>
    <form class="form" onsubmit="return false">
      <div class="field"><label>Full Name</label><input placeholder="John Smith"></div>
      <div class="field"><label>Phone</label><input type="tel" placeholder="(555) 123-4567"></div>
      <div class="field"><label>Email</label><input type="email" placeholder="john@example.com"></div>
      <div class="field"><label>Message</label><textarea placeholder="Tell us about your project..."></textarea></div>
      <button class="btn-solid">Send Message</button>
    </form>
  </div>
</div></section>

<footer class="foot"><div class="wrap">
  <div><div class="foot-brand">${esc(brand)}</div><p>${esc(c.sub.substring(0,120))}...</p><p style="margin-top:12px">${esc(c.trustBadges.join(" · "))}</p></div>
  <div><h4>Services</h4>${c.services.slice(0,4).map(s => `<a href="#">${esc(s.title)}</a>`).join("")}</div>
  <div><h4>Contact</h4><a href="tel:${c.phone}">${esc(c.phone)}</a><a href="#contact">Get a Quote</a><a href="#">Service Areas</a></div>
</div>
<div class="wrap foot-bottom">&copy; 2026 ${esc(brand)}. All rights reserved.</div></footer>
</body></html>`;
}

// =====================================================================
// LAYOUT B — "Bold Centered"
// Centered hero, 2x2 service grid with overlays, large testimonial cards
// =====================================================================
function layoutB(c: NicheProfile, brand: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(brand)} — ${esc(c.hero)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,sans-serif;color:#1a1a2e;line-height:1.6;overflow-x:hidden}
img{display:block;max-width:100%}
a{text-decoration:none;color:inherit}
.wrap{max-width:1200px;margin:0 auto;padding:0 24px}

/* Centered Header */
.head{position:absolute;top:0;left:0;right:0;z-index:100;padding:20px 0}
.head .wrap{display:flex;align-items:center;justify-content:space-between}
.logo{font-size:22px;font-weight:900;color:#fff;letter-spacing:-.02em;text-shadow:0 2px 8px rgba(0,0,0,.3)}
.nav{display:flex;gap:28px}
.nav a{font-size:14px;font-weight:600;color:rgba(255,255,255,.9);transition:color .2s}
.nav a:hover{color:#fff}
.head-phone{font-size:14px;font-weight:800;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.3)}

/* Full-bleed Centered Hero */
.hero{position:relative;min-height:640px;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:url('${c.bgImage}') center/cover no-repeat}
.hero-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,${c.primaryDark}cc 0%,${c.primaryDark}99 50%,${c.primaryDark}cc 100%)}
.hero-content{position:relative;z-index:1;max-width:760px;padding:120px 24px 80px}
.hero-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:30px;background:rgba(255,255,255,.15);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25);color:#fff;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:24px}
.hero-content h1{font-size:52px;font-weight:900;line-height:1.05;color:#fff;margin-bottom:18px;letter-spacing:-.02em}
.hero-content p{font-size:19px;color:rgba(255,255,255,.9);margin-bottom:32px;max-width:600px;margin-left:auto;margin-right:auto}
.hero-cta{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn-primary{padding:16px 36px;border-radius:12px;background:${c.accent};color:#fff;font-size:16px;font-weight:800;border:none;cursor:pointer;transition:transform .15s,box-shadow .15s;box-shadow:0 8px 24px ${c.accent}44}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 32px ${c.accent}66}
.btn-white{padding:16px 36px;border-radius:12px;background:#fff;color:${c.primary};font-size:16px;font-weight:800;border:none;cursor:pointer;transition:transform .15s}
.btn-white:hover{transform:translateY(-2px)}

/* Stats Bar */
.stats{background:${c.primary};padding:28px 0}
.stats .wrap{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center}
.stat-val{font-size:32px;font-weight:900;color:${c.accent};letter-spacing:-.02em}
.stat-lbl{font-size:13px;color:rgba(255,255,255,.7);font-weight:500;margin-top:2px}

/* 2x2 Service Grid with Overlays */
.svc{padding:80px 0}
.svc-head{text-align:center;max-width:600px;margin:0 auto 48px}
.svc-head h2{font-size:36px;font-weight:900;color:${c.primary};letter-spacing:-.02em;margin-bottom:8px}
.svc-head p{font-size:17px;color:#777}
.svc-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.svc-card{position:relative;border-radius:16px;overflow:hidden;aspect-ratio:16/10;cursor:pointer}
.svc-card img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.svc-card:hover img{transform:scale(1.08)}
.svc-overlay{position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,${c.primaryDark}f0 100%);display:flex;flex-direction:column;justify-content:flex-end;padding:28px}
.svc-overlay h3{font-size:22px;font-weight:800;color:#fff;margin-bottom:6px}
.svc-overlay p{font-size:14px;color:rgba(255,255,255,.8);max-width:400px}

/* Full-width Gallery */
.gal{padding:0;background:#f8f9fb}
.gal-head{text-align:center;padding:64px 0 32px}
.gal-head h2{font-size:36px;font-weight:900;color:${c.primary};margin-bottom:8px}
.gal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
.gal-grid img{width:100%;aspect-ratio:1;object-fit:cover;transition:transform .3s}
.gal-grid img:hover{transform:scale(1.05)}

/* Testimonials */
.test{padding:80px 0}
.test-head{text-align:center;margin-bottom:48px}
.test-head h2{font-size:36px;font-weight:900;color:${c.primary};margin-bottom:8px}
.test-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px}
.test-card{background:#fff;border-radius:20px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,.06);text-align:center}
.test-stars{color:${c.accent};font-size:20px;letter-spacing:3px;margin-bottom:16px}
.test-text{font-size:16px;color:#444;line-height:1.7;font-style:italic;margin-bottom:20px}
.test-avatar{width:56px;height:56px;border-radius:50%;object-fit:cover;margin:0 auto 10px;display:block}
.test-name{font-size:15px;font-weight:800;color:${c.primary}}
.test-role{font-size:12px;color:#999}

/* CTA */
.cta{background:linear-gradient(135deg,${c.primary},${c.accent});padding:64px 0;text-align:center}
.cta h2{font-size:32px;font-weight:900;color:#fff;margin-bottom:8px}
.cta p{font-size:17px;color:rgba(255,255,255,.85);margin-bottom:28px}
.cta .btn-white{background:#fff;color:${c.primary}}

/* Contact */
.contact{padding:80px 0;background:#f8f9fb}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.contact-info h2{font-size:30px;font-weight:900;color:${c.primary};margin-bottom:12px}
.contact-info p{font-size:16px;color:#666;margin-bottom:24px}
.contact-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;font-size:16px;font-weight:600;color:#333}
.contact-ico{width:40px;height:40px;border-radius:10px;background:${c.primary}10;display:flex;align-items:center;justify-content:center;font-size:18px}
.form{background:#fff;border-radius:20px;padding:36px;box-shadow:0 4px 24px rgba(0,0,0,.06)}
.field{margin-bottom:16px}
.field label{display:block;font-size:13px;font-weight:700;color:#555;margin-bottom:6px}
.field input,.field textarea{width:100%;height:46px;border:1px solid #ddd;border-radius:10px;padding:0 14px;font-size:15px;outline:none;transition:border-color .15s}
.field input:focus,.field textarea:focus{border-color:${c.accent}}
.field textarea{height:110px;padding:12px 14px;resize:vertical}
.form .btn-primary{width:100%}

/* Footer */
.foot{background:${c.primaryDark};color:#94a3b8;padding:48px 0 24px}
.foot .wrap{display:grid;grid-template-columns:2fr 1fr 1fr;gap:40px}
.foot-brand{font-size:22px;font-weight:900;color:#fff;margin-bottom:8px}
.foot p{font-size:14px;margin-bottom:8px}
.foot h4{font-size:13px;font-weight:800;color:#fff;margin-bottom:12px;text-transform:uppercase;letter-spacing:.08em}
.foot a{display:block;font-size:14px;color:#94a3b8;margin-bottom:8px;transition:color .15s}
.foot a:hover{color:#fff}
.foot-bottom{border-top:1px solid rgba(255,255,255,.1);margin-top:32px;padding-top:20px;text-align:center;font-size:13px;color:#64748b}

@media(max-width:768px){
  .nav{display:none}.hero-content h1{font-size:34px}.hero-content p{font-size:16px}
  .stats .wrap{grid-template-columns:repeat(2,1fr);gap:16px}.stat-val{font-size:26px}
  .svc-grid{grid-template-columns:1fr}.gal-grid{grid-template-columns:repeat(2,1fr)}
  .contact-grid{grid-template-columns:1fr}.foot .wrap{grid-template-columns:1fr}
  .svc-head h2,.gal-head h2,.test-head h2{font-size:28px}
}
</style>
</head>
<body>
<header class="head"><div class="wrap">
  <div class="logo">${esc(brand)}</div>
  <nav class="nav"><a href="#services">Services</a><a href="#gallery">Work</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a></nav>
  <span class="head-phone">📞 ${esc(c.phone)}</span>
</div></header>

<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-content">
    <span class="hero-badge">★ ${esc(c.stats[2].value)} Rated · ${esc(c.trustBadges[0])}</span>
    <h1>${esc(c.hero)}</h1>
    <p>${esc(c.sub)}</p>
    <div class="hero-cta">
      <button class="btn-primary">${esc(c.cta)}</button>
      <button class="btn-white">View Our Work</button>
    </div>
  </div>
</section>

<section class="stats"><div class="wrap">
  ${c.stats.map(s => `<div><div class="stat-val">${esc(s.value)}</div><div class="stat-lbl">${esc(s.label)}</div></div>`).join("\n  ")}
</div></section>

<section class="svc" id="services"><div class="wrap">
  <div class="svc-head"><h2>Our Services</h2><p>Professional, reliable, and backed by our satisfaction guarantee.</p></div>
  <div class="svc-grid">
    ${c.services.map(s => `<div class="svc-card">
      <img src="${s.img}" alt="${esc(s.title)}" loading="lazy">
      <div class="svc-overlay"><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></div>
    </div>`).join("\n    ")}
  </div>
</div></section>

<section class="gal" id="gallery">
  <div class="gal-head"><h2>Recent Projects</h2><p>See the quality of our work.</p></div>
  <div class="gal-grid">
    ${c.gallery.map(g => `<img src="${g}" alt="Project" loading="lazy">`).join("\n    ")}
  </div>
</section>

<section class="test" id="reviews"><div class="wrap">
  <div class="test-head"><h2>What Our Clients Say</h2><p>Real reviews from real customers.</p></div>
  <div class="test-grid">
    ${c.testimonials.map(t => `<div class="test-card">
      <div class="test-stars">${stars(t.rating)}</div>
      <p class="test-text">"${esc(t.text)}"</p>
      <img class="test-avatar" src="${t.avatar}" alt="${esc(t.name)}" loading="lazy">
      <div class="test-name">${esc(t.name)}</div>
      <div class="test-role">Verified Customer</div>
    </div>`).join("\n    ")}
  </div>
</div></section>

<section class="cta"><div class="wrap">
  <h2>Ready to Get Started?</h2>
  <p>Contact us today for a free consultation. ${esc(c.phone)}</p>
  <button class="btn-white">${esc(c.cta)}</button>
</div></section>

<section class="contact" id="contact"><div class="wrap">
  <div class="contact-grid">
    <div class="contact-info">
      <h2>Get In Touch</h2>
      <p>Call us or fill out the form and we'll get back to you within 1 business hour.</p>
      <div class="contact-row"><div class="contact-ico">📞</div>${esc(c.phone)}</div>
      <div class="contact-row"><div class="contact-ico">✉️</div>info@${brand.toLowerCase().replace(/[^a-z0-9]/g,"")}.com</div>
      <div class="contact-row"><div class="contact-ico">⏰</div>Open 24/7 for emergencies</div>
    </div>
    <form class="form" onsubmit="return false">
      <div class="field"><label>Full Name</label><input placeholder="John Smith"></div>
      <div class="field"><label>Phone</label><input type="tel" placeholder="(555) 123-4567"></div>
      <div class="field"><label>Email</label><input type="email" placeholder="john@example.com"></div>
      <div class="field"><label>How Can We Help?</label><textarea placeholder="Tell us about your project..."></textarea></div>
      <button class="btn-primary">Send Message</button>
    </form>
  </div>
</div></section>

<footer class="foot"><div class="wrap">
  <div><div class="foot-brand">${esc(brand)}</div><p>${esc(c.sub.substring(0,120))}...</p><p style="margin-top:12px">${esc(c.trustBadges.join(" · "))}</p></div>
  <div><h4>Services</h4>${c.services.slice(0,4).map(s => `<a href="#">${esc(s.title)}</a>`).join("")}</div>
  <div><h4>Contact</h4><a href="tel:${c.phone}">${esc(c.phone)}</a><a href="#contact">Get a Quote</a><a href="#">Service Areas</a></div>
</div>
<div class="wrap foot-bottom">&copy; 2026 ${esc(brand)}. All rights reserved.</div></footer>
</body></html>`;
}

// =====================================================================
// LAYOUT C — "Corporate Sidebar"
// Utility bar, hero with lead form, numbered services, sitemap footer
// =====================================================================
function layoutC(c: NicheProfile, brand: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(brand)} — ${esc(c.hero)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',-apple-system,sans-serif;color:#1a1a2e;line-height:1.6;overflow-x:hidden}
img{display:block;max-width:100%}
a{text-decoration:none;color:inherit}
.wrap{max-width:1200px;margin:0 auto;padding:0 24px}

/* Utility Bar */
.util{background:${c.primaryDark};color:rgba(255,255,255,.7);padding:8px 0;font-size:13px}
.util .wrap{display:flex;justify-content:space-between;align-items:center}
.util-left{display:flex;gap:20px}
.util-item{display:flex;align-items:center;gap:6px}
.util-right{display:flex;gap:12px}
.util a{color:rgba(255,255,255,.7);transition:color .15s}
.util a:hover{color:#fff}

/* Main Header */
.head{background:#fff;border-bottom:3px solid ${c.primary};position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.head .wrap{display:flex;align-items:center;justify-content:space-between;height:72px}
.logo{font-size:22px;font-weight:900;color:${c.primary};letter-spacing:-.02em;display:flex;align-items:center;gap:8px}
.logo::before{content:'';width:10px;height:10px;border-radius:2px;background:${c.accent}}
.nav{display:flex;gap:30px}
.nav a{font-size:14px;font-weight:600;color:#444;transition:color .2s}
.nav a:hover{color:${c.primary}}
.head-cta{display:flex;align-items:center;gap:16px}
.head-phone{font-size:16px;font-weight:800;color:${c.primary}}
.btn-quote{padding:11px 24px;border-radius:8px;background:${c.primary};color:#fff;font-size:14px;font-weight:700;border:none;cursor:pointer;transition:background .15s}
.btn-quote:hover{background:${c.primaryDark}}

/* Hero with Lead Form */
.hero{display:grid;grid-template-columns:1.5fr 1fr;min-height:520px;background:${c.primaryDark}}
.hero-bg{position:absolute;inset:0;background:url('${c.bgImage}') center/cover no-repeat;opacity:.25}
.hero-content{position:relative;z-index:1;padding:64px 48px;display:flex;flex-direction:column;justify-content:center}
.hero-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:4px;background:rgba(255,255,255,.1);color:${c.accent};font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:18px;width:fit-content}
.hero-content h1{font-size:38px;font-weight:900;line-height:1.1;color:#fff;margin-bottom:14px;letter-spacing:-.02em}
.hero-content p{font-size:16px;color:rgba(255,255,255,.85);margin-bottom:24px;max-width:480px}
.hero-stats{display:flex;gap:32px;margin-top:16px}
.hero-stat{color:rgba(255,255,255,.9)}
.hero-stat strong{display:block;font-size:28px;font-weight:900;color:${c.accent}}
.hero-stat span{font-size:12px;text-transform:uppercase;letter-spacing:.05em}
.hero-form{position:relative;z-index:1;padding:40px 36px;background:#fff;display:flex;flex-direction:column;justify-content:center}
.hero-form h3{font-size:20px;font-weight:800;color:${c.primary};margin-bottom:6px}
.hero-form p{font-size:13px;color:#777;margin-bottom:20px}
.hero-form .field{margin-bottom:12px}
.hero-form label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px}
.hero-form input,.hero-form textarea,.hero-form select{width:100%;height:42px;border:1px solid #ddd;border-radius:8px;padding:0 12px;font-size:14px;outline:none;transition:border-color .15s}
.hero-form input:focus,.hero-form textarea:focus,.hero-form select:focus{border-color:${c.accent}}
.hero-form textarea{height:80px;padding:10px 12px;resize:vertical}
.hero-form .btn-quote{width:100%;margin-top:6px}
.hero-form .trust{font-size:11px;color:#999;text-align:center;margin-top:12px}

/* Certifications Strip */
.certs{background:#fff;padding:20px 0;border-bottom:1px solid #eee}
.certs .wrap{display:flex;justify-content:center;gap:32px;flex-wrap:wrap}
.cert{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#555}
.cert-ico{width:28px;height:28px;border-radius:6px;background:${c.accent}15;color:${c.accent};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900}

/* Numbered Services */
.svc{padding:80px 0}
.svc-head{text-align:center;max-width:600px;margin:0 auto 48px}
.svc-head h2{font-size:34px;font-weight:900;color:${c.primary};letter-spacing:-.02em;margin-bottom:8px}
.svc-head p{font-size:16px;color:#777}
.svc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.svc-card{background:#fff;border:1px solid #eee;border-radius:12px;padding:28px;transition:border-color .2s,box-shadow .2s,transform .15s}
.svc-card:hover{border-color:${c.accent};box-shadow:0 12px 32px rgba(0,0,0,.08);transform:translateY(-4px)}
.svc-num{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,${c.primary},${c.accent});color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;margin-bottom:16px}
.svc-card h3{font-size:18px;font-weight:800;color:${c.primary};margin-bottom:8px}
.svc-card p{font-size:14px;color:#666;line-height:1.5}
.svc-card img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:8px;margin-top:14px;margin-bottom:0}

/* Before/After Gallery */
.gal{padding:80px 0;background:#f8f9fb}
.gal-head{text-align:center;margin-bottom:40px}
.gal-head h2{font-size:34px;font-weight:900;color:${c.primary};margin-bottom:8px}
.gal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.gal-item{position:relative;border-radius:12px;overflow:hidden;aspect-ratio:1}
.gal-item img{width:100%;height:100%;object-fit:cover;transition:transform .3s}
.gal-item:hover img{transform:scale(1.08)}
.gal-item::after{content:'Before → After';position:absolute;bottom:8px;left:8px;padding:4px 10px;border-radius:4px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;font-weight:700}

/* Testimonials */
.test{padding:80px 0}
.test-head{text-align:center;margin-bottom:48px}
.test-head h2{font-size:34px;font-weight:900;color:${c.primary};margin-bottom:8px}
.test-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}
.test-card{background:#fff;border:1px solid #eee;border-radius:12px;padding:28px;display:flex;gap:16px}
.test-avatar{width:52px;height:52px;border-radius:50%;object-fit:cover;flex-shrink:0}
.test-body{flex:1}
.test-stars{color:${c.accent};font-size:15px;letter-spacing:2px;margin-bottom:8px}
.test-text{font-size:14px;color:#555;line-height:1.6;font-style:italic;margin-bottom:12px}
.test-name{font-size:14px;font-weight:800;color:${c.primary}}
.test-role{font-size:12px;color:#999}

/* CTA with Trust */
.cta{background:linear-gradient(135deg,${c.primary},${c.accent});padding:56px 0;text-align:center}
.cta h2{font-size:30px;font-weight:900;color:#fff;margin-bottom:8px}
.cta p{font-size:16px;color:rgba(255,255,255,.85);margin-bottom:24px}
.cta-trust{display:flex;justify-content:center;gap:24px;margin-top:20px;flex-wrap:wrap}
.cta-trust span{font-size:13px;color:rgba(255,255,255,.8);font-weight:600}
.cta .btn-quote{background:#fff;color:${c.primary};font-size:16px;padding:14px 32px}

/* Contact */
.contact{padding:80px 0;background:#f8f9fb}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.contact-info h2{font-size:28px;font-weight:900;color:${c.primary};margin-bottom:12px}
.contact-info p{font-size:15px;color:#666;margin-bottom:24px}
.contact-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;font-size:15px;font-weight:600;color:#333}
.contact-ico{width:38px;height:38px;border-radius:8px;background:${c.primary}10;display:flex;align-items:center;justify-content:center;font-size:16px}
.hours{margin-top:20px;padding:16px;background:#fff;border-radius:10px;border:1px solid #eee}
.hours h4{font-size:14px;font-weight:800;color:${c.primary};margin-bottom:8px}
.hours-row{display:flex;justify-content:space-between;font-size:13px;color:#666;margin-bottom:4px}
.form{background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,.06)}
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em}
.field input,.field textarea{width:100%;height:44px;border:1px solid #ddd;border-radius:8px;padding:0 14px;font-size:15px;outline:none;transition:border-color .15s}
.field input:focus,.field textarea:focus{border-color:${c.accent}}
.field textarea{height:100px;padding:12px 14px;resize:vertical}
.form .btn-quote{width:100%;padding:14px;font-size:15px}

/* Sitemap Footer */
.foot{background:${c.primaryDark};color:#94a3b8;padding:56px 0 24px}
.foot .wrap{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px}
.foot-brand{font-size:22px;font-weight:900;color:#fff;margin-bottom:8px}
.foot p{font-size:14px;margin-bottom:8px}
.foot h4{font-size:13px;font-weight:800;color:#fff;margin-bottom:12px;text-transform:uppercase;letter-spacing:.08em}
.foot a{display:block;font-size:14px;color:#94a3b8;margin-bottom:8px;transition:color .15s}
.foot a:hover{color:#fff}
.foot-bottom{border-top:1px solid rgba(255,255,255,.1);margin-top:36px;padding-top:20px;text-align:center;font-size:13px;color:#64748b}

@media(max-width:768px){
  .util{display:none}.nav{display:none}.hero{grid-template-columns:1fr}
  .hero-content{padding:48px 24px}.hero-content h1{font-size:28px}
  .hero-form{padding:32px 24px}.head-phone{display:none}
  .svc-head h2,.gal-head h2,.test-head h2{font-size:26px}
  .gal-grid{grid-template-columns:repeat(2,1fr)}.contact-grid{grid-template-columns:1fr}
  .foot .wrap{grid-template-columns:1fr 1fr;gap:24px}
}
</style>
</head>
<body>

<div class="util"><div class="wrap">
  <div class="util-left">
    <span class="util-item">📞 ${esc(c.phone)}</span>
    <span class="util-item">✉️ info@${brand.toLowerCase().replace(/[^a-z0-9]/g,"")}.com</span>
    <span class="util-item">⏰ 24/7 Emergency Service</span>
  </div>
  <div class="util-right"><a href="#">Facebook</a><a href="#">Google</a><a href="#">BBB</a></div>
</div></div>

<header class="head"><div class="wrap">
  <div class="logo">${esc(brand)}</div>
  <nav class="nav"><a href="#services">Services</a><a href="#gallery">Projects</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a></nav>
  <div class="head-cta">
    <span class="head-phone">${esc(c.phone)}</span>
    <button class="btn-quote">Free Quote</button>
  </div>
</div></header>

<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-content">
    <span class="hero-badge">★ ${esc(c.stats[2].value)} Rated · ${esc(c.trustBadges[0])}</span>
    <h1>${esc(c.hero)}</h1>
    <p>${esc(c.sub)}</p>
    <div class="hero-stats">
      ${c.stats.slice(0,3).map(s => `<div class="hero-stat"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join("\n      ")}
    </div>
  </div>
  <form class="hero-form" onsubmit="return false">
    <h3>Get Your Free Quote</h3>
    <p>Fill out the form and we'll call you back within 1 hour.</p>
    <div class="field"><label>Full Name</label><input placeholder="John Smith"></div>
    <div class="field"><label>Phone Number</label><input type="tel" placeholder="(555) 123-4567"></div>
    <div class="field"><label>Service Needed</label><select><option>Select a service...</option>${c.services.map(s => `<option>${esc(s.title)}</option>`).join("")}</select></div>
    <div class="field"><label>Message</label><textarea placeholder="Briefly describe what you need..."></textarea></div>
    <button class="btn-quote">Request My Quote →</button>
    <div class="trust">Your info is secure. No spam, ever.</div>
  </form>
</section>

<div class="certs"><div class="wrap">
  ${c.trustBadges.map(b => `<span class="cert"><span class="cert-ico">✓</span>${esc(b)}</span>`).join("\n  ")}
</div></div>

<section class="svc" id="services"><div class="wrap">
  <div class="svc-head"><h2>Professional Services</h2><p>Comprehensive solutions backed by experience, licensing, and guaranteed work.</p></div>
  <div class="svc-grid">
    ${c.services.map((s,i) => `<div class="svc-card">
      <div class="svc-num">${String(i+1).padStart(2,"0")}</div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.desc)}</p>
      <img src="${s.img}" alt="${esc(s.title)}" loading="lazy">
    </div>`).join("\n    ")}
  </div>
</div></section>

<section class="gal" id="gallery"><div class="wrap">
  <div class="gal-head"><h2>Before & After Gallery</h2><p>See the transformation we deliver.</p></div>
  <div class="gal-grid">
    ${c.gallery.map(g => `<div class="gal-item"><img src="${g}" alt="Project" loading="lazy"></div>`).join("\n    ")}
  </div>
</div></section>

<section class="test" id="reviews"><div class="wrap">
  <div class="test-head"><h2>Customer Reviews</h2><p>Real reviews from verified customers.</p></div>
  <div class="test-grid">
    ${c.testimonials.map(t => `<div class="test-card">
      <img class="test-avatar" src="${t.avatar}" alt="${esc(t.name)}" loading="lazy">
      <div class="test-body">
        <div class="test-stars">${stars(t.rating)}</div>
        <p class="test-text">"${esc(t.text)}"</p>
        <div class="test-name">${esc(t.name)}</div>
        <div class="test-role">Verified Customer</div>
      </div>
    </div>`).join("\n    ")}
  </div>
</div></section>

<section class="cta"><div class="wrap">
  <h2>Ready to Get Started?</h2>
  <p>Contact us today for a free consultation and quote. ${esc(c.phone)}</p>
  <button class="btn-quote">${esc(c.cta)}</button>
  <div class="cta-trust">
    ${c.trustBadges.map(b => `<span>✓ ${esc(b)}</span>`).join("\n    ")}
  </div>
</div></section>

<section class="contact" id="contact"><div class="wrap">
  <div class="contact-grid">
    <div class="contact-info">
      <h2>Get In Touch</h2>
      <p>Call us or fill out the form and we'll get back to you within 1 business hour.</p>
      <div class="contact-row"><div class="contact-ico">📞</div>${esc(c.phone)}</div>
      <div class="contact-row"><div class="contact-ico">✉️</div>info@${brand.toLowerCase().replace(/[^a-z0-9]/g,"")}.com</div>
      <div class="contact-row"><div class="contact-ico">📍</div>Serving the greater area</div>
      <div class="hours">
        <h4>Business Hours</h4>
        <div class="hours-row"><span>Mon - Fri</span><span>7:00 AM - 7:00 PM</span></div>
        <div class="hours-row"><span>Saturday</span><span>8:00 AM - 5:00 PM</span></div>
        <div class="hours-row"><span>Sunday</span><span>Emergency Only</span></div>
      </div>
    </div>
    <form class="form" onsubmit="return false">
      <div class="field"><label>Full Name</label><input placeholder="John Smith"></div>
      <div class="field"><label>Phone Number</label><input type="tel" placeholder="(555) 123-4567"></div>
      <div class="field"><label>Email</label><input type="email" placeholder="john@example.com"></div>
      <div class="field"><label>How Can We Help?</label><textarea placeholder="Tell us about your project..."></textarea></div>
      <button class="btn-quote">Send Message</button>
    </form>
  </div>
</div></section>

<footer class="foot"><div class="wrap">
  <div><div class="foot-brand">${esc(brand)}</div><p>${esc(c.sub.substring(0,120))}...</p><p style="margin-top:12px">${esc(c.trustBadges.join(" · "))}</p></div>
  <div><h4>Services</h4>${c.services.slice(0,4).map(s => `<a href="#">${esc(s.title)}</a>`).join("")}</div>
  <div><h4>Company</h4><a href="#about">About Us</a><a href="#gallery">Projects</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a></div>
  <div><h4>Contact</h4><a href="tel:${c.phone}">${esc(c.phone)}</a><a href="#contact">Get a Quote</a><a href="#">Service Areas</a></div>
</div>
<div class="wrap foot-bottom">&copy; 2026 ${esc(brand)}. All rights reserved. Licensed & Insured.</div></footer>
</body></html>`;
}

// Main export — picks the layout variant and returns complete HTML
export function generateLayoutVariantHtml(
  config: NicheProfile,
  brand: string,
  layoutVariant: number
): string {
  switch (layoutVariant) {
    case 1: return layoutA(config, brand);
    case 2: return layoutB(config, brand);
    case 3: return layoutC(config, brand);
    default: return layoutA(config, brand);
  }
}