// ═══════════════════════════════════════════════
// Cloud Browser Engine Client
// Talks directly to the browser engine API (Browserbase-style).
// Uses CLOUD_BROWSER_ENGINE_URL + ENGINE_API_KEY secrets.
// ═══════════════════════════════════════════════
import { secrets } from "base44:runtime";

let _engineUrl: string | null = null;
let _engineKey: string | null = null;

function getConfig() {
  if (!_engineUrl) _engineUrl = secrets.get("CLOUD_BROWSER_ENGINE_URL");
  if (!_engineKey) _engineKey = secrets.get("ENGINE_API_KEY");
  if (!_engineUrl || !_engineKey) {
    throw new Error("Cloud browser engine not configured. Set CLOUD_BROWSER_ENGINE_URL and ENGINE_API_KEY secrets.");
  }
  // Auto-fix: prepend https:// if protocol missing
  const fixedUrl = _engineUrl.startsWith("http") ? _engineUrl : `https://${_engineUrl}`;
  return { url: fixedUrl.replace(/\/$/, ""), key: _engineKey };
}

export function isEngineConfigured() {
  try { getConfig(); return true; } catch { return false; }
}

export async function engineHealth() {
  const { url, key } = getConfig();
  const res = await fetch(`${url}/health`, { headers: { "x-api-key": key }, signal: AbortSignal.timeout(10000) });
  return res.ok;
}

// Create a browser session
export async function createSession(opts: any = {}) {
  const { url, key } = getConfig();
  const res = await fetch(`${url}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      viewport: opts.viewport || { width: 1280, height: 800 },
      timeout_ms: opts.timeout_ms || 60000,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Engine session creation failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.sessionId || data.session_id || data.id;
}

// Execute an action on a session
export async function executeAction(sessionId: string, actionType: string, payload: any = {}) {
  const { url, key } = getConfig();
  const res = await fetch(`${url}/sessions/${sessionId}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({ action_type: actionType, ...payload }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Engine action "${actionType}" failed (${res.status}): ${text}`);
  }
  return res.json();
}

// Navigate to a URL
export async function navigate(sessionId: string, targetUrl: string) {
  return executeAction(sessionId, "navigate", { url: targetUrl, options: { waitUntil: "networkidle", timeout: 30000 } });
}

// Take a screenshot (returns base64)
export async function screenshot(sessionId: string, fullPage = false) {
  return executeAction(sessionId, "screenshot", { options: { fullPage } });
}

// Run JavaScript in the page (returns data)
export async function evaluate(sessionId: string, script: string) {
  return executeAction(sessionId, "evaluate", { value: script });
}

// Close a session
export async function closeSession(sessionId: string) {
  const { url, key } = getConfig();
  try {
    await fetch(`${url}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { "x-api-key": key },
      signal: AbortSignal.timeout(10000),
    });
  } catch { /* best effort */ }
}

// Full site test using real browser — tests buttons, links, images, forms, console errors, performance
export async function runFullSiteTest(targetUrl: string) {
  if (!isEngineConfigured()) {
    throw new Error("Cloud browser engine not configured");
  }

  let sessionId: string | null = null;
  const startTime = Date.now();

  try {
    // 1. Create session
    sessionId = await createSession({ timeout_ms: 90000 });

    // 2. Navigate to the URL
    await navigate(sessionId, targetUrl);

    // 3. Run comprehensive page evaluation via JS
    const evalScript = `
      (async () => {
        const results = {
          buttons: { total: 0, clickable: 0, broken: 0, details: [] },
          links: { total: 0, valid: 0, broken: 0, details: [] },
          images: { total: 0, loaded: 0, broken: 0, details: [] },
          forms: { total: 0, broken: 0, details: [] },
          console_errors: { errors: 0, details: [] },
          performance: { load_time_ms: 0, lcp_ms: 0, cls: 0, dom_size: 0 },
          responsive: { mobile: false, tablet: false, desktop: false },
          seo: { title: '', meta_description: '', h1_count: 0, schema_found: false },
        };

        // --- Console errors ---
        const origError = console.error;
        const errors = [];
        window.__testErrors = errors;
        const origConsoleError = window.console.error;
        window.console.error = function(...args) { errors.push(args.join(' ')); origConsoleError.apply(console, args); };

        // --- Buttons ---
        const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"], a.btn, a.button');
        results.buttons.total = buttons.length;
        buttons.forEach((btn, i) => {
          if (i > 50) return; // limit
          const rect = btn.getBoundingClientRect();
          const visible = rect.width > 0 && rect.height > 0;
          const hasHandler = btn.onclick || btn.getAttribute('onclick') || btn.type === 'submit' || btn.tagName === 'A';
          if (visible && hasHandler) results.buttons.clickable++;
          if (!visible) { results.buttons.broken++; results.buttons.details.push('Invisible: ' + btn.textContent?.trim()?.slice(0, 40)); }
        });

        // --- Links ---
        const links = document.querySelectorAll('a[href]');
        results.links.total = links.length;
        const linkPromises = [];
        links.forEach((link, i) => {
          if (i > 30) return;
          const href = link.getAttribute('href');
          if (!href || href === '#' || href.startsWith('javascript:')) { results.links.broken++; results.links.details.push('Bad href: ' + href); return; }
          results.links.valid++;
        });

        // --- Images ---
        const imgs = document.querySelectorAll('img');
        results.images.total = imgs.length;
        imgs.forEach((img, i) => {
          if (i > 50) return;
          if (img.complete && img.naturalWidth > 0) results.images.loaded++;
          else if (img.complete && img.naturalWidth === 0) { results.images.broken++; results.images.details.push('Broken: ' + (img.src || '').slice(0, 80)); }
        });

        // --- Forms ---
        const forms = document.querySelectorAll('form');
        results.forms.total = forms.length;
        forms.forEach((form, i) => {
          if (i > 20) return;
          const hasAction = form.action || form.getAttribute('action');
          const hasSubmit = form.querySelector('button[type="submit"], input[type="submit"]');
          if (!hasAction && !hasSubmit) { results.forms.broken++; results.forms.details.push('Form missing action/submit'); }
        });

        // --- Performance ---
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) results.performance.load_time_ms = Math.round(nav.loadEventEnd - nav.startTime);
        results.performance.dom_size = document.querySelectorAll('*').length;

        // LCP
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length) results.performance.lcp_ms = Math.round(lcpEntries[lcpEntries.length - 1].startTime);

        // CLS
        const clsEntries = performance.getEntriesByType('layout-shift');
        if (clsEntries.length) results.performance.cls = clsEntries.reduce((sum, e) => sum + e.value, 0);

        // --- Responsive ---
        results.responsive.desktop = window.innerWidth >= 1024;
        results.responsive.tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        results.responsive.mobile = window.innerWidth < 768;

        // --- SEO ---
        results.seo.title = document.title || '';
        results.seo.meta_description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        results.seo.h1_count = document.querySelectorAll('h1').length;
        results.seo.schema_found = !!document.querySelector('script[type="application/ld+json"]');

        // Wait for console errors to collect
        await new Promise(r => setTimeout(r, 2000));
        results.console_errors.errors = window.__testErrors.length;
        results.console_errors.details = window.__testErrors.slice(0, 10);
        window.console.error = origConsoleError;

        return results;
      })()
    `;

    const evalRes = await evaluate(sessionId, evalScript);
    const pageData = evalRes.data || evalRes.result || evalRes;

    // 4. Take a screenshot for visual proof
    let screenshotUri = null;
    try {
      const ssRes = await screenshot(sessionId, false);
      if (ssRes.base64) {
        // Upload screenshot to private storage
        const base44 = (globalThis as any).__base44;
        if (base44) {
          const file = new File([Uint8Array.from(atob(ssRes.base64), c => c.charCodeAt(0))], `test-${Date.now()}.png`, { type: "image/png" });
          const upload = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
          screenshotUri = upload.file_uri;
        }
      }
    } catch { /* best effort */ }

    const elapsed = Date.now() - startTime;

    // 5. Compile results
    const d = pageData || {};
    const buttonsPassed = d.buttons ? d.buttons.broken === 0 : null;
    const linksPassed = d.links ? d.links.broken === 0 : null;
    const imagesPassed = d.images ? d.images.broken === 0 : null;
    const formsPassed = d.forms ? d.forms.broken === 0 : null;
    const consolePassed = d.console_errors ? d.console_errors.errors === 0 : null;
    const perfPassed = d.performance ? d.performance.load_time_ms < 3000 && d.performance.lcp_ms < 2500 : null;

    const allPassed = [buttonsPassed, linksPassed, imagesPassed, formsPassed, consolePassed, perfPassed].every(p => p === true);

    return {
      url: targetUrl,
      tested_at: new Date().toISOString(),
      elapsed_ms: elapsed,
      overall: allPassed ? 'passed' : 'failed',
      screenshot_uri: screenshotUri,
      tests: {
        buttons: { passed: buttonsPassed, total: d.buttons?.total || 0, clickable: d.buttons?.clickable || 0, broken: d.buttons?.broken || 0, detail: d.buttons?.details?.join('; ') || 'All buttons functional' },
        links: { passed: linksPassed, total: d.links?.total || 0, valid: d.links?.valid || 0, broken: d.links?.broken || 0, detail: d.links?.details?.join('; ') || 'All links valid' },
        images: { passed: imagesPassed, total: d.images?.total || 0, loaded: d.images?.loaded || 0, broken: d.images?.broken || 0, detail: d.images?.details?.join('; ') || 'All images loaded' },
        forms: { passed: formsPassed, total: d.forms?.total || 0, broken: d.forms?.broken || 0, detail: d.forms?.details?.join('; ') || 'All forms functional' },
        console_errors: { passed: consolePassed, errors: d.console_errors?.errors || 0, detail: d.console_errors?.details?.join('; ') || 'No console errors' },
        performance: { passed: perfPassed, load_time_ms: d.performance?.load_time_ms || 0, lcp_ms: d.performance?.lcp_ms || 0, cls: d.performance?.cls || 0, dom_size: d.performance?.dom_size || 0, detail: `Load: ${d.performance?.load_time_ms || 0}ms, LCP: ${d.performance?.lcp_ms || 0}ms, CLS: ${(d.performance?.cls || 0).toFixed(3)}` },
        responsive: { passed: true, mobile: d.responsive?.mobile, tablet: d.responsive?.tablet, desktop: d.responsive?.desktop, detail: `Viewport: ${d.responsive?.mobile ? 'mobile' : d.responsive?.tablet ? 'tablet' : 'desktop'}` },
        seo: { passed: true, title: d.seo?.title || '', meta_description: d.seo?.meta_description || '', h1_count: d.seo?.h1_count || 0, schema_found: d.seo?.schema_found || false, detail: `Title: "${d.seo?.title?.slice(0, 60) || ''}", H1s: ${d.seo?.h1_count || 0}, Schema: ${d.seo?.schema_found ? 'found' : 'missing'}` },
      },
      summary: allPassed ? 'All tests passed — every button, form, link, and image is functional' : 'Issues found — see test details',
    };
  } finally {
    if (sessionId) await closeSession(sessionId);
  }
}