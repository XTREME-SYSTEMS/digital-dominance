// DETERMINISTIC BRAND WORKFLOW VALIDATOR (shared)
// Scores a generated brand site pack page by page, out of 100 points across 14
// criteria. Fail-closed: a criterion whose evidence is missing earns nothing, and
// the two critical criteria (contact wiring, asset integrity) gate the verdict.
// Pure functions only — no SDK, no network, so the caller supplies the pages.

const CRITERIA = [
  {
    key: 'page_pack',
    label: 'Complete linked page pack',
    points: 8,
    evaluate: (ctx) => {
      const keys = ctx.pages.map((p) => p.key);
      const missing = ['home', 'services', 'contact'].filter((k) => !keys.includes(k));
      const countOk = ctx.pages.length >= 5 && ctx.pages.length <= 7;
      const pathsOk = ctx.pages.every((p) => p.path.startsWith('/'));
      const ok = !missing.length && countOk && pathsOk;
      return {
        ratio: ok ? 1 : 0,
        evidence: ok
          ? `${ctx.pages.length} pages, all routed: ${keys.join(', ')}`
          : `missing ${missing.join(', ') || 'none'}${countOk ? '' : ` · page count ${ctx.pages.length}`}${pathsOk ? '' : ' · bad path'}`,
      };
    },
  },
  {
    key: 'imagery',
    label: 'Imagery on every page',
    points: 8,
    evaluate: (ctx) => {
      const r = ratio(ctx.pages, (p) => {
        const tags = IMG(p.html);
        const hero = tags.find((t) => ATTR(t, 'class').includes('hero-img'));
        return !!hero && tags.length >= 1 && tags.every((t) => /^https:\/\//.test(ATTR(t, 'src')));
      });
      const distinct = new Set(ctx.pages.flatMap((p) => IMG(p.html).map((t) => ATTR(t, 'src'))).filter(Boolean)).size;
      const coverage = Math.min(1, distinct / 5);
      return { ratio: r.ratio * coverage, pages: r.pages, evidence: `${describe(r)} · ${distinct} distinct images in the pack (5+ required)` };
    },
  },
  {
    key: 'contact_wiring',
    label: 'Call and email wiring',
    points: 10,
    critical: true,
    evaluate: (ctx) => {
      const r = ratio(ctx.pages, (p) => {
        const hrefs = HREF(p.html).map((h) => h.replace(/&amp;/g, '&'));
        const tel = hrefs.some((h) => h.replace(/\D/g, '').includes(ctx.phoneDigits)) && p.html.includes(ctx.phoneDigits);
        const mail = ['contact', 'quote'].includes(p.key) ? (ctx.email ? hrefs.some((h) => h.startsWith('mailto:')) : true) : true;
        return tel && mail;
      });
      return { ratio: r.ratio, pages: r.pages, evidence: `${describe(r)} · dials ${ctx.phone || 'no phone on the profile'}` };
    },
  },
  {
    key: 'palette',
    label: 'Brand palette applied',
    points: 6,
    evaluate: (ctx) => {
      const r = ratio(ctx.pages, (p) => {
        const html = p.html.toLowerCase();
        return html.includes(ctx.accent.toLowerCase()) && html.includes('--accent:') && html.includes('--grad:');
      });
      return { ratio: r.ratio, pages: r.pages, evidence: `${describe(r)} · accent ${ctx.accent}` };
    },
  },
  {
    key: 'branding',
    label: 'Business name and logo on every page',
    points: 6,
    evaluate: (ctx) => {
      const r = ratio(ctx.pages, (p) => {
        const named = p.html.toLowerCase().includes(ctx.business.toLowerCase());
        const logo = ctx.logoUrl ? p.html.includes(ctx.logoUrl) : true;
        return named && logo;
      });
      return { ratio: r.ratio, pages: r.pages, evidence: `${describe(r)}${ctx.logoUrl ? ' · selected logo present' : ' · no logo selected, initials mark used'}` };
    },
  },
  {
    key: 'seo_meta',
    label: 'Search metadata',
    points: 10,
    evaluate: (ctx) => {
      const r = ratio(ctx.pages, (p) => {
        const title = pick(p.html, /<title>([\s\S]*?)<\/title>/i);
        const description = pick(p.html, /<meta name="description" content="([^"]*)"/i);
        return title.length > 5 && title.length <= 70 && description.length >= 40 && description.length <= 175
          && p.html.includes('property="og:title"') && p.html.includes('name="robots"');
      });
      const titles = ctx.pages.map((p) => pick(p.html, /<title>([\s\S]*?)<\/title>/i).trim().toLowerCase());
      const unique = new Set(titles).size === titles.length;
      return { ratio: r.ratio * (unique ? 1 : 0.6), pages: r.pages, evidence: `${describe(r)} · titles ${unique ? 'unique' : 'duplicated across pages'}` };
    },
  },
  {
    key: 'structured_data',
    label: 'Local business structured data',
    points: 8,
    evaluate: (ctx) => {
      const r = ratio(ctx.pages, (p) => {
        const block = pick(p.html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (!block) return false;
        try {
          const data = JSON.parse(block);
          return !!(data.name && data.telephone && data.address && data.address.addressLocality);
        } catch { return false; }
      });
      return { ratio: r.ratio, pages: r.pages, evidence: `${describe(r)} · name, telephone and locality present` };
    },
  },
  {
    key: 'internal_links',
    label: 'Links resolve inside the pack',
    points: 8,
    evaluate: (ctx) => {
      const valid = new Set(ctx.pages.map((p) => p.path));
      const internal = ctx.pages.flatMap((p) => HREF(p.html)).filter((h) => h && !/^(https?:|tel:|mailto:|#)/.test(h));
      const broken = [...new Set(internal.filter((h) => !valid.has(h)))];
      const home = ctx.pages.find((p) => p.key === 'home');
      const reachable = ctx.pages.every((p) => p.key === 'home' || (home && HREF(home.html).includes(p.path)));
      const ok = !broken.length && reachable;
      return { ratio: ok ? 1 : 0, evidence: ok ? `every page reachable, no dead internal links (${valid.size} routes)` : `${broken.length ? `dead links: ${broken.slice(0, 5).join(', ')}` : 'some pages are not linked from the home page'}` };
    },
  },
  {
    key: 'copy_depth',
    label: 'Real, unique copy on every page',
    points: 10,
    evaluate: (ctx) => {
      const min = { home: 200, services: 200, 'service-area': 180, about: 200, gallery: 110, contact: 160, quote: 160 };
      const r = ratio(ctx.pages, (p) => {
        const text = TEXT(p.html);
        return text.split(/\s+/).filter(Boolean).length >= (min[p.key] || 150) && !PLACEHOLDER.some((rx) => rx.test(text));
      });
      const similarities = [];
      const sets = ctx.pages.map((p) => new Set(textWords(p.html)));
      for (let i = 0; i < sets.length; i += 1) {
        for (let j = i + 1; j < sets.length; j += 1) similarities.push(jaccard(sets[i], sets[j]));
      }
      const worst = similarities.length ? Math.max(...similarities) : 0;
      return { ratio: r.ratio * (worst < 0.8 ? 1 : 0.6), pages: r.pages, evidence: `${describe(r)} · highest overlap between two pages ${(worst * 100).toFixed(0)}%` };
    },
  },
  {
    key: 'mobile_ready',
    label: 'Mobile ready',
    points: 4,
    evaluate: (ctx) => {
      const r = ratio(ctx.pages, (p) => /name="viewport"[^>]*width=device-width/i.test(p.html) && p.html.includes('@media'));
      return { ratio: r.ratio, pages: r.pages, evidence: describe(r) };
    },
  },
  {
    key: 'aeo_ready',
    label: 'Answer-engine content',
    points: 6,
    evaluate: (ctx) => {
      const questions = ctx.pages.flatMap((p) => TEXT(p.html).match(/[^.!?]{15,140}\?/g) || []);
      const asks = questions.length >= 3;
      const faq = /buyers ask|frequently asked|faq/i.test(ctx.pages.map((p) => TEXT(p.html)).join(' '));
      const services = ctx.pages.find((p) => p.key === 'services');
      const listed = !!services && (services.html.match(/<article class="card"/g) || []).length >= 3;
      const ratioOk = [asks, faq, listed].filter(Boolean).length / 3;
      return { ratio: ratioOk, evidence: `${questions.length} buyer questions answered · question block ${faq ? 'present' : 'missing'} · service list ${listed ? 'present' : 'missing'}` };
    },
  },
  {
    key: 'conversion',
    label: 'Conversion path on every page',
    points: 8,
    evaluate: (ctx) => {
      const r = ratio(ctx.pages, (p) => {
        const hrefs = HREF(p.html).map((h) => h.replace(/&amp;/g, '&'));
        return hrefs.some((h) => h.startsWith('tel:') || h === '/contact' || h === '/quote');
      });
      return { ratio: r.ratio, pages: r.pages, evidence: `${describe(r)} · call or estimate link present on every page` };
    },
  },
  {
    key: 'accessibility',
    label: 'Accessibility basics',
    points: 4,
    evaluate: (ctx) => {
      const r = ratio(ctx.pages, (p) => {
        const alts = IMG(p.html).every((t) => ATTR(t, 'alt').trim().length > 0);
        const h1 = (p.html.match(/<h1[ >]/gi) || []).length === 1;
        const h2s = (p.html.match(/<h2[ >]/gi) || []).length >= 2;
        return alts && h1 && h2s;
      });
      const lang = ctx.pages.every((p) => /<html[^>]+lang="/i.test(p.html));
      return { ratio: r.ratio * (lang ? 1 : 0.5), pages: r.pages, evidence: `${describe(r)} · page language ${lang ? 'declared' : 'missing'}` };
    },
  },
  {
    key: 'asset_integrity',
    label: 'No broken output',
    points: 4,
    critical: true,
    evaluate: (ctx) => {
      const problems = [];
      ctx.pages.forEach((p) => {
        const html = p.html;
        if (html.includes('${')) problems.push(`${p.key}: unrendered template value`);
        if (/src=""/.test(html) || /src="\./.test(html)) problems.push(`${p.key}: relative or empty image source`);
        if (IMG(html).some((t) => !/^https:\/\//.test(ATTR(t, 'src')))) problems.push(`${p.key}: non-absolute image`);
        if (/<script[^>]+src=/i.test(html)) problems.push(`${p.key}: external script`);
        if (html.includes('&amp;amp;')) problems.push(`${p.key}: double-escaped text`);
        if (/ href="#"/.test(html)) problems.push(`${p.key}: placeholder link`);
        if (/\bundefined\b|\bNaN\b|\[object /.test(TEXT(html))) problems.push(`${p.key}: unset value rendered`);
      });
      const unique = [...new Set(problems)];
      return { ratio: unique.length ? 0 : 1, evidence: unique.length ? unique.slice(0, 5).join(' · ') : `all ${ctx.pages.length} pages clean: absolute https assets, no unset values, no external scripts` };
    },
  },
];

const PLACEHOLDER = [/lorem ipsum/i, /\bTODO\b/, /\bXXX\b/, /\[insert/i, /placeholder text/i];
const ESCAPES = /&(amp|lt|gt|quot|#39|nbsp);/gi;

const TEXT = (html) => String(html || '')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(ESCAPES, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const IMG = (html) => [...String(html || '').matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
const HREF = (html) => [...String(html || '').matchAll(/href="([^"]*)"/gi)].map((m) => m[1]);
const ATTR = (tag, name) => (String(tag).match(new RegExp(`${name}="([^"]*)"`, 'i')) || [])[1] || '';
const pick = (html, rx) => (String(html || '').match(rx) || [])[1] || '';
const textWords = (html) => TEXT(html).toLowerCase().split(/\s+/).filter((w) => w.length > 3);

function ratio(pages, fn) {
  const per = {};
  pages.forEach((p) => { per[p.key] = !!fn(p); });
  const values = Object.values(per);
  const ok = values.filter(Boolean).length;
  return { ratio: values.length ? ok / values.length : 0, pages: per, ok, total: values.length };
}

function describe(r) {
  if (r.ratio === 1) return `all ${r.total} pages pass`;
  const failed = Object.entries(r.pages).filter(([, ok]) => !ok).map(([key]) => key);
  return `${r.ok}/${r.total} pages pass · failed on ${failed.join(', ')}`;
}

function jaccard(a, b) {
  const inter = [...a].filter((w) => b.has(w)).length;
  const union = new Set([...a, ...b]).size;
  return union ? inter / union : 0;
}

export function gradeFor(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function scorePack({ pages, profile }) {
  const contactPhone = String(profile?.phone || '');
  const ctx = {
    pages: Array.isArray(pages) ? pages.filter((p) => p && p.html) : [],
    profile,
    phoneDigits: contactPhone.replace(/\D/g, ''),
    phone: contactPhone,
    email: String(profile?.email || ''),
    accent: String(profile?.palette?.accent || '#126fc8'),
    business: String(profile?.business_name || ''),
    logoUrl: String(profile?.logo_url || ''),
  };

  if (!ctx.pages.length) {
    return {
      score: 0,
      grade: 'F',
      checks: CRITERIA.map((c) => ({ key: c.key, label: c.label, points: c.points, earned: 0, ratio: 0, critical: !!c.critical, evidence: 'no pages produced', failed_pages: [] })),
      failures: ['No pages were produced, so nothing could be scored'],
      criticalFailures: ['asset_integrity', 'contact_wiring'],
      pages: [],
    };
  }

  const checks = CRITERIA.map((criterion) => {
    const result = criterion.evaluate(ctx);
    const ratioValue = Math.max(0, Math.min(1, Number(result.ratio) || 0));
    return {
      key: criterion.key,
      label: criterion.label,
      points: criterion.points,
      earned: Math.round(criterion.points * ratioValue * 10) / 10,
      ratio: Math.round(ratioValue * 100) / 100,
      critical: !!criterion.critical,
      evidence: String(result.evidence || '').slice(0, 900),
      failed_pages: Object.entries(result.pages || {}).filter(([, ok]) => !ok).map(([key]) => key),
    };
  });

  const score = Math.round(checks.reduce((sum, c) => sum + c.earned, 0));
  const failures = checks.filter((c) => c.ratio < 1).map((c) => `${c.label} — ${c.evidence}`);
  const criticalFailures = checks.filter((c) => c.critical && c.ratio < 1).map((c) => c.key);

  return {
    score,
    grade: gradeFor(score),
    checks,
    failures,
    criticalFailures,
    pages: ctx.pages.map((p) => ({
      key: p.key,
      title: p.title,
      path: p.path,
      template_id: p.template_id,
      words: TEXT(p.html).split(/\s+/).filter(Boolean).length,
      images: IMG(p.html).length,
      title_tag: pick(p.html, /<title>([\s\S]*?)<\/title>/i),
    })),
  };
}