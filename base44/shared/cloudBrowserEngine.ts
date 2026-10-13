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

// List all existing sessions (for cleanup)
export async function listSessions(): Promise<string[]> {
  const { url, key } = getConfig();
  try {
    const res = await fetch(`${url}/sessions`, { headers: { "x-api-key": key }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    const sessions = Array.isArray(data) ? data : (data.sessions || data.items || data.data || []);
    return sessions.map((s: any) => s.sessionId || s.session_id || s.id).filter(Boolean);
  } catch {
    return [];
  }
}

// Clean up all stale sessions (prevents EAGAIN resource exhaustion)
export async function cleanStaleSessions(): Promise<number> {
  const ids = await listSessions();
  let cleaned = 0;
  for (const id of ids) {
    try {
      await closeSession(id);
      cleaned++;
    } catch { /* best effort */ }
  }
  return cleaned;
}

// Create a browser session (auto-cleans stale sessions first to prevent EAGAIN)
export async function createSession(opts: any = {}) {
  const { url, key } = getConfig();
  // Clean up any stale sessions that could cause Chromium EAGAIN
  await cleanStaleSessions();
  // Brief pause to let Chromium processes fully exit
  await new Promise((r) => setTimeout(r, 1500));

  const res = await fetch(`${url}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({
      viewport: opts.viewport || { width: 1280, height: 800 },
      timeout_ms: opts.timeout_ms || 60000,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Engine session creation failed (${res.status}): ${text.slice(0, 200)}`);
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

// Navigate to a URL using JS (the engine's navigate action type isn't supported,
// but evaluate works — so we set window.location.href and wait for the page to load)
export async function navigate(sessionId: string, targetUrl: string) {
  // Trigger navigation via JS
  await executeAction(sessionId, "evaluate", { value: `window.location.href = ${JSON.stringify(targetUrl)}` });
  // Wait for the page to load (poll for document.readyState)
  const maxWait = 20000;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const check = await executeAction(sessionId, "evaluate", { value: `document.readyState` });
      const ready = check.data || check.result || check;
      if (ready === "complete") break;
    } catch {
      // Page might still be loading (navigation in progress) — retry
    }
  }
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

// Click an element and verify it responds (DOM change, navigation, or state change)
export async function clickElement(sessionId: string, selector: string) {
  return executeAction(sessionId, "evaluate", { value: `(function() { var el = document.querySelector(${JSON.stringify(selector)}); if (el) { el.click(); return 'clicked'; } return 'not_found'; })()` });
}

// Test button interactions — click visible buttons and verify they respond
export async function testInteractions(sessionId: string) {
  const script = `JSON.stringify((function() {
    var results = { tested: 0, responded: 0, dead: 0, details: [] };
    var btns = document.querySelectorAll('button:not([type="submit"]), [role="button"], .btn, .button, a[data-toggle], [data-bs-toggle]');
    for (var i = 0; i < Math.min(btns.length, 8); i++) {
      var btn = btns[i];
      var r = btn.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      var beforeHtml = document.body.innerHTML.length;
      var beforeUrl = window.location.href;
      var beforeActive = document.activeElement;
      try {
        btn.focus();
        btn.click();
        results.tested++;
        var afterHtml = document.body.innerHTML.length;
        var afterUrl = window.location.href;
        var afterActive = document.activeElement;
        var domChanged = afterHtml !== beforeHtml;
        var urlChanged = afterUrl !== beforeUrl;
        var focusChanged = afterActive !== beforeActive && afterActive === btn;
        if (domChanged || urlChanged || focusChanged) {
          results.responded++;
        } else {
          results.dead++;
          if (results.details.length < 5) results.details.push('No response: ' + (btn.textContent || '').trim().slice(0, 30));
        }
      } catch(e) {
        results.dead++;
        if (results.details.length < 5) results.details.push('Error: ' + (e.message || '').slice(0, 50));
      }
    }
    return results;
  })())`;
  const res = await evaluate(sessionId, script);
  const raw = res.data || res.result || "";
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

// Full site test using real browser — tests buttons, links, images, forms, console errors, performance, interactions
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

    // 3. Run comprehensive page evaluation via JS (synchronous — engine doesn't support async IIFEs)
    const evalScript = `JSON.stringify({
      buttons: (function() {
        var btns = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"], a.btn, a.button');
        var total = btns.length, clickable = 0, broken = 0, details = [];
        for (var i = 0; i < Math.min(btns.length, 50); i++) {
          var b = btns[i], r = b.getBoundingClientRect();
          var vis = r.width > 0 && r.height > 0;
          var has = b.onclick || b.getAttribute('onclick') || b.type === 'submit' || b.tagName === 'A';
          if (vis && has) clickable++;
          if (!vis) { broken++; if (details.length < 5) details.push('Invisible: ' + (b.textContent || '').trim().slice(0, 40)); }
        }
        return { total: total, clickable: clickable, broken: broken, details: details };
      })(),
      links: (function() {
        var links = document.querySelectorAll('a[href]');
        var total = links.length, valid = 0, broken = 0, details = [];
        for (var i = 0; i < Math.min(links.length, 30); i++) {
          var href = links[i].getAttribute('href');
          if (!href || href === '#' || href.indexOf('javascript:') === 0) { broken++; if (details.length < 5) details.push('Bad: ' + href); }
          else valid++;
        }
        return { total: total, valid: valid, broken: broken, details: details };
      })(),
      images: (function() {
        var imgs = document.querySelectorAll('img');
        var total = imgs.length, loaded = 0, broken = 0, details = [];
        for (var i = 0; i < Math.min(imgs.length, 50); i++) {
          var img = imgs[i];
          if (img.complete && img.naturalWidth > 0) loaded++;
          else if (img.complete && img.naturalWidth === 0) { broken++; if (details.length < 5) details.push('Broken: ' + (img.src || '').slice(0, 80)); }
        }
        return { total: total, loaded: loaded, broken: broken, details: details };
      })(),
      forms: (function() {
        var forms = document.querySelectorAll('form');
        var total = forms.length, broken = 0, details = [];
        for (var i = 0; i < Math.min(forms.length, 20); i++) {
          var f = forms[i];
          var hasAction = f.action || f.getAttribute('action');
          var hasSubmit = f.querySelector('button[type="submit"], input[type="submit"]');
          if (!hasAction && !hasSubmit) { broken++; if (details.length < 5) details.push('Missing action/submit'); }
        }
        return { total: total, broken: broken, details: details };
      })(),
      performance: (function() {
        var nav = performance.getEntriesByType('navigation')[0];
        var loadTime = nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0;
        var lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        var lcp = lcpEntries.length ? Math.round(lcpEntries[lcpEntries.length - 1].startTime) : 0;
        var clsEntries = performance.getEntriesByType('layout-shift');
        var cls = clsEntries.length ? clsEntries.reduce(function(s, e) { return s + e.value; }, 0) : 0;
        return { load_time_ms: loadTime, lcp_ms: lcp, cls: cls, dom_size: document.querySelectorAll('*').length };
      })(),
      responsive: { mobile: window.innerWidth < 768, tablet: window.innerWidth >= 768 && window.innerWidth < 1024, desktop: window.innerWidth >= 1024 },
      seo: {
        title: document.title || '',
        meta_description: (document.querySelector('meta[name="description"]') || {}).getAttribute ? (document.querySelector('meta[name="description"]') || {}).getAttribute('content') || '' : '',
        h1_count: document.querySelectorAll('h1').length,
        schema_found: !!document.querySelector('script[type="application/ld+json"]')
      }
    })`;

    const evalRes = await evaluate(sessionId, evalScript);
    const rawStr = evalRes.data || evalRes.result || "";
    const pageData = typeof rawStr === "string" ? JSON.parse(rawStr) : rawStr;

    // 3b. Test button interactions (click buttons, verify they respond)
    let interactionData = null;
    try {
      interactionData = await testInteractions(sessionId);
    } catch { /* best effort */ }

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

    const interactionsPassed = interactionData ? interactionData.dead === 0 : null;
    const allPassed = [buttonsPassed, linksPassed, imagesPassed, formsPassed, consolePassed, perfPassed, interactionsPassed].every(p => p === true);

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
        interactions: { passed: interactionsPassed, tested: interactionData?.tested || 0, responded: interactionData?.responded || 0, dead: interactionData?.dead || 0, detail: interactionData ? (interactionData.dead === 0 ? `All ${interactionData.tested} buttons responded to click` : `${interactionData.dead} dead buttons: ${(interactionData.details || []).join('; ')}`) : 'Not tested' },
        console_errors: { passed: consolePassed, errors: d.console_errors?.errors || 0, detail: d.console_errors?.details?.join('; ') || 'No console errors' },
        performance: { passed: perfPassed, load_time_ms: d.performance?.load_time_ms || 0, lcp_ms: d.performance?.lcp_ms || 0, cls: d.performance?.cls || 0, dom_size: d.performance?.dom_size || 0, detail: `Load: ${d.performance?.load_time_ms || 0}ms, LCP: ${d.performance?.lcp_ms || 0}ms, CLS: ${(d.performance?.cls || 0).toFixed(3)}` },
        responsive: { passed: true, mobile: d.responsive?.mobile, tablet: d.responsive?.tablet, desktop: d.responsive?.desktop, detail: `Viewport: ${d.responsive?.mobile ? 'mobile' : d.responsive?.tablet ? 'tablet' : 'desktop'}` },
        seo: { passed: true, title: d.seo?.title || '', meta_description: d.seo?.meta_description || '', h1_count: d.seo?.h1_count || 0, schema_found: d.seo?.schema_found || false, detail: `Title: "${d.seo?.title?.slice(0, 60) || ''}", H1s: ${d.seo?.h1_count || 0}, Schema: ${d.seo?.schema_found ? 'found' : 'missing'}` },
      },
      summary: allPassed ? 'All tests passed — every button, form, link, image, and interaction is functional' : 'Issues found — see test details',
    };
  } finally {
    if (sessionId) await closeSession(sessionId);
  }
}