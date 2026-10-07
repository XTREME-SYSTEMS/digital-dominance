// Maps template sections to live HTML previews using the scoped .uts-screen
// mini-UI kit and brand tokens. Each renderer returns { frame, designW, designH, html }.
import { DEFAULT_CONFIG } from "./studioConfig.js";

const FS = (n) => `font-size:calc(${n}px * var(--uts-font-scale,1))`;
const ctxd = (config) => ({ ...DEFAULT_CONFIG, ...config });

function logo(ctx) {
  if (ctx.logoImage) return `<span class="logo"><img src="${ctx.logoImage}" alt="" /></span>`;
  const parts = String(ctx.logoText || "Brand").trim().split(/\s+/);
  if (parts.length < 2) return `<span class="logo">${parts[0] || ""}</span>`;
  const last = parts.pop();
  return `<span class="logo">${parts.join(" ")} <b>${last}</b></span>`;
}

function nav(ctx, tabs = ["Home", "Systems", "Gallery", "About"]) {
  return `<div class="uts-nav">${logo(ctx)}${tabs.map((t, i) => `<span class="uts-tab ${i === 0 ? "on" : ""}">${t}</span>`).join("")}<span class="phone">${ctx.phone || ""}</span></div>`;
}

function renderHero(section, ctx) {
  const c = section.content || {};
  const badges = (c.trust_badges || []).map((b) => `<span class="badge">${b}</span>`).join("");
  const bg = c.background_image ? `<div class="bg" style="background-image:url('${c.background_image}')"></div>` : "";
  return `<div class="uts-hero">${bg}<div class="content">
    <h1>${c.headline || ctx.heading || "Transform Your Floors"}</h1>
    <p>${c.subheadline || ctx.subtitle || ""}</p>
    <div class="badges">${badges}</div>
    <button class="uts-btn dark">${c.cta_text || "Get Estimate"}</button>
  </div></div>`;
}

function renderStats(section) {
  const items = (section.content?.items || []).slice(0, 4);
  return `<div class="uts-stats">${items.map((i) => `<div class="uts-stat"><div class="v">${i.value}</div><div class="l">${i.label}</div></div>`).join("")}</div>`;
}

function renderShowcase(section) {
  const systems = (section.content?.systems || []).slice(0, 3);
  return `<div class="uts-section"><h2>${section.content?.title || "Our Systems"}</h2><div class="sub">Built for every space</div><div class="uts-grid3">
    ${systems.map((s) => `<div class="uts-tile"><div class="img" style="${s.image ? `background-image:url('${s.image}')` : ""}"></div><div class="body"><div class="n">${s.name}</div><div class="p">${s.price_tier || ""}</div></div></div>`).join("")}
  </div></div>`;
}

function renderTestimonials(section) {
  const reviews = (section.content?.reviews || []).slice(0, 2);
  return `<div class="uts-section"><h2>${section.content?.title || "Testimonials"}</h2><div class="uts-reviews">
    ${reviews.map((r) => `<div class="uts-review"><div class="t">"${r.text}"</div><div class="n">${r.name}</div><div class="r">${r.role}</div></div>`).join("")}
  </div></div>`;
}

function renderCta(section) {
  const c = section.content || {};
  return `<div class="uts-cta"><h2>${c.headline || "Ready to Transform?"}</h2><p>${c.subheadline || ""}</p><span class="btn">${c.cta_text || "Get Estimate"}</span></div>`;
}

function renderProblemSolution(section) {
  const problems = (section.content?.problems || ["Cracked floors", "Oil stains", "Bare concrete"]).slice(0, 2);
  const solutions = (section.content?.solutions || ["Professional prep", "Premium coatings"]).slice(0, 2);
  return `<div class="uts-section"><h2>The Problem → Our Solution</h2><div class="uts-problem">
    <div class="uts-probcard"><div class="h">The Problem</div><div class="b">${problems.join(", ")}</div></div>
    <div class="uts-probcard"><div class="h">Our Solution</div><div class="b">${solutions.join(", ")}</div></div>
  </div></div>`;
}

function renderColorCharts(section) {
  const swatches = (section.content?.swatches || []).slice(0, 8);
  return `<div class="uts-section"><h2>${section.content?.title || "Color Charts"}</h2><div class="sub">Explore our full range</div><div class="uts-colorgrid">
    ${swatches.map((s) => `<div class="uts-swatch" style="${s.image_url ? `background-image:url('${s.image_url}')` : `background:${s.hex || "#ccc"}`}"></div>`).join("")}
  </div></div>`;
}

function renderGallery(section) {
  const images = (section.content?.images || []).slice(0, 6);
  return `<div class="uts-section"><h2>${section.content?.title || "Gallery"}</h2><div class="uts-colorgrid">
    ${images.map((img) => `<div class="uts-swatch" style="${img.url ? `background-image:url('${img.url}')` : `background:var(--brand-muted)`}"></div>`).join("")}
  </div></div>`;
}

function renderFooter(ctx) {
  return `<div class="uts-footer"><div class="n">${ctx.logoText || ctx.brandName || ""}</div><div class="p">${ctx.phone || ""} · ${ctx.tagline || ""}</div></div>`;
}

const SECTION_RENDERERS = {
  hero: renderHero,
  stats: renderStats,
  showcase: renderShowcase,
  testimonials: renderTestimonials,
  cta: renderCta,
  problem_solution: renderProblemSolution,
  color_charts: renderColorCharts,
  gallery: renderGallery,
};

// Main entry: render a full template from its sections + brand config.
export function renderTemplate(sections, config) {
  const ctx = ctxd(config);
  const enabled = (sections || []).filter((s) => s.enabled !== false);
  const body = enabled.map((s) => {
    const fn = SECTION_RENDERERS[s.section_type];
    return fn ? fn(s, ctx) : "";
  }).join("");
  return {
    frame: "browser",
    designW: 760,
    designH: 520,
    html: nav(ctx) + `<div class="uts-scroll" style="flex:1;overflow:auto">${body}</div>` + renderFooter(ctx),
  };
}

// Render a single section in isolation (for the editor preview).
export function renderSection(section, config) {
  const ctx = ctxd(config);
  const fn = SECTION_RENDERERS[section.section_type];
  if (!fn) return { frame: "browser", designW: 760, designH: 200, html: nav(ctx) + `<div class="uts-section">Unknown section</div>` };
  return {
    frame: "browser",
    designW: 760,
    designH: 280,
    html: nav(ctx) + `<div class="uts-scroll" style="flex:1;overflow:auto">${fn(section, ctx)}</div>` + renderFooter(ctx),
  };
}