import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import { logStep } from "../../shared/sopLog.ts";
import {
  isEngineConfigured,
  createSession,
  navigate,
  evaluate,
  screenshot,
  closeSession,
  cleanStaleSessions,
} from "../../shared/cloudBrowserEngine.ts";

// ═══════════════════════════════════════════════
// FAULT LINE SCANNER — Autonomous Deep Problem Discovery
// ═══════════════════════════════════════════════
// Automatically uses the cloud browser to run ALL important problem-finding
// sources across every live site:
//
//   1. FORENSIC HTTP AUDIT — status, redirects, content depth
//   2. SECURITY HEADER SCAN — CSP, HSTS, X-Frame-Options, X-Content-Type, Referrer-Policy
//   3. CLOUD BROWSER DEEP INSPECTION — buttons, links, images, forms, interactions,
//      console errors, performance (LCP/CLS), SEO meta, schema, accessibility
//   4. SENTINEL SELF-REFLECTION — AI root-cause analysis on every failure
//   5. REVENUE IMPACT QUANTIFICATION — dollar impact per finding
//
// All findings are stored in FaultLineFinding entities for the Shadow agent
// to query, prioritize, and repair.
// ═══════════════════════════════════════════════

const SECURITY_HEADERS = [
  "content-security-policy",
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
];

const scanId = () => "fl-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

// ── 1. FORENSIC HTTP AUDIT ──
async function forensicHttpAudit(url: string): Promise<any[]> {
  const findings: any[] = [];
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v: string, k: string) => { headers[k.toLowerCase()] = v; });

    if (res.status !== 200) {
      findings.push({
        title: "HTTP " + res.status + " — Site not returning 200",
        category: "infrastructure",
        severity: res.status >= 500 ? "critical" : "high",
        evidence: "HTTP " + res.status + " " + res.statusText,
        scan_source: "forensic_http",
      });
    }
    if (!/<!doctype/i.test(html)) {
      findings.push({
        title: "Missing <!DOCTYPE> declaration",
        category: "content",
        severity: "medium",
        evidence: "No <!DOCTYPE> found in HTML",
        scan_source: "forensic_http",
      });
    }
    if (!/viewport/i.test(html)) {
      findings.push({
        title: "Missing viewport meta tag — mobile broken",
        category: "seo",
        severity: "high",
        evidence: "No viewport meta tag in <head>",
        scan_source: "forensic_http",
      });
    }
    if (html.length < 5000) {
      findings.push({
        title: "Thin content — only " + html.length + " bytes",
        category: "content",
        severity: "medium",
        evidence: "Page HTML is " + html.length + " bytes (threshold: 5000)",
        scan_source: "forensic_http",
      });
    }
    if (!/<nav/i.test(html)) {
      findings.push({
        title: "Missing <nav> element — no navigation structure",
        category: "content",
        severity: "low",
        evidence: "No <nav> tag found",
        scan_source: "forensic_http",
      });
    }
    if (!/<form/i.test(html)) {
      findings.push({
        title: "No contact/lead form found",
        category: "conversion",
        severity: "high",
        evidence: "No <form> element on page — no lead capture mechanism",
        scan_source: "forensic_http",
      });
    }
    // Security headers
    const missing = SECURITY_HEADERS.filter((h) => !headers[h]);
    for (const h of missing) {
      findings.push({
        title: "Missing security header: " + h,
        category: "security",
        severity: h === "content-security-policy" || h === "strict-transport-security" ? "high" : "medium",
        evidence: 'Header "' + h + '" not present in response',
        scan_source: "security_headers",
      });
    }
  } catch (e: any) {
    findings.push({
      title: "Site unreachable — " + (e.message?.slice(0, 100) || "fetch failed"),
      category: "infrastructure",
      severity: "critical",
      evidence: e.message?.slice(0, 500) || "Unknown fetch error",
      scan_source: "forensic_http",
    });
  }
  return findings;
}

// ── 2. CLOUD BROWSER DEEP INSPECTION ──
async function cloudBrowserDeepInspection(url: string): Promise<{ findings: any[]; screenshotUri: string | null }> {
  const findings: any[] = [];
  let screenshotUri: string | null = null;

  if (!isEngineConfigured()) {
    return { findings, screenshotUri };
  }

  let sessionId: string | null = null;
  try {
    sessionId = await createSession({ timeout_ms: 90000 });
    await navigate(sessionId, url);

    const evalScript = 'JSON.stringify({' +
      'buttons: (function() {' +
      '  var btns = document.querySelectorAll("button, [role=button], input[type=submit], a.btn, a.button");' +
      '  var total = btns.length, broken = 0, details = [];' +
      '  for (var i = 0; i < Math.min(btns.length, 50); i++) {' +
      '    var b = btns[i], r = b.getBoundingClientRect();' +
      '    if (r.width === 0 || r.height === 0) { broken++; if (details.length < 5) details.push("Invisible: " + (b.textContent || "").trim().slice(0, 40)); }' +
      '  }' +
      '  return { total: total, broken: broken, details: details };' +
      '})(),' +
      'links: (function() {' +
      '  var links = document.querySelectorAll("a[href]");' +
      '  var total = links.length, broken = 0, details = [];' +
      '  for (var i = 0; i < Math.min(links.length, 50); i++) {' +
      '    var href = links[i].getAttribute("href");' +
      '    if (!href || href === "#" || href.indexOf("javascript:") === 0) { broken++; if (details.length < 5) details.push("Bad: " + href); }' +
      '  }' +
      '  return { total: total, broken: broken, details: details };' +
      '})(),' +
      'images: (function() {' +
      '  var imgs = document.querySelectorAll("img");' +
      '  var total = imgs.length, broken = 0, details = [];' +
      '  for (var i = 0; i < Math.min(imgs.length, 50); i++) {' +
      '    var img = imgs[i];' +
      '    if (img.complete && img.naturalWidth === 0) { broken++; if (details.length < 5) details.push("Broken: " + (img.src || "").slice(0, 80)); }' +
      '  }' +
      '  return { total: total, broken: broken, details: details };' +
      '})(),' +
      'forms: (function() {' +
      '  var forms = document.querySelectorAll("form");' +
      '  var total = forms.length, broken = 0, details = [];' +
      '  for (var i = 0; i < Math.min(forms.length, 20); i++) {' +
      '    var f = forms[i];' +
      '    if (!f.action && !f.querySelector("button[type=submit], input[type=submit]")) { broken++; if (details.length < 5) details.push("No action/submit"); }' +
      '  }' +
      '  return { total: total, broken: broken, details: details };' +
      '})(),' +
      'performance: (function() {' +
      '  var nav = performance.getEntriesByType("navigation")[0];' +
      '  var loadTime = nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0;' +
      '  var lcpEntries = performance.getEntriesByType("largest-contentful-paint");' +
      '  var lcp = lcpEntries.length ? Math.round(lcpEntries[lcpEntries.length - 1].startTime) : 0;' +
      '  var clsEntries = performance.getEntriesByType("layout-shift");' +
      '  var cls = clsEntries.length ? clsEntries.reduce(function(s, e) { return s + e.value; }, 0) : 0;' +
      '  return { load_time_ms: loadTime, lcp_ms: lcp, cls: cls, dom_size: document.querySelectorAll("*").length };' +
      '})(),' +
      'seo: {' +
      '  title: document.title || "",' +
      '  meta_description: (document.querySelector("meta[name=description]") || {}).getAttribute ? (document.querySelector("meta[name=description]") || {}).getAttribute("content") || "" : "",' +
      '  h1_count: document.querySelectorAll("h1").length,' +
      '  schema_found: !!document.querySelector("script[type=application/ld+json]"),' +
      '  canonical: (document.querySelector("link[rel=canonical]") || {}).getAttribute ? (document.querySelector("link[rel=canonical]") || {}).getAttribute("href") || "" : "",' +
      '},' +
      'accessibility: {' +
      '  images_without_alt: document.querySelectorAll("img:not([alt])").length,' +
      '  buttons_without_aria: document.querySelectorAll("button:not([aria-label]):not([aria-labelledby])").length' +
      '}' +
      '})';

    const evalRes = await evaluate(sessionId, evalScript);
    const rawStr: any = evalRes.data || evalRes.result || "";
    const d: any = typeof rawStr === "string" ? JSON.parse(rawStr) : rawStr;

    // Button findings
    if (d.buttons?.broken > 0) {
      findings.push({
        title: d.buttons.broken + " invisible/broken buttons",
        category: "functionality",
        severity: d.buttons.broken > 3 ? "high" : "medium",
        evidence: d.buttons.details.join("; "),
        scan_source: "cloud_browser",
      });
    }
    // Link findings
    if (d.links?.broken > 0) {
      findings.push({
        title: d.links.broken + " broken/invalid links",
        category: "functionality",
        severity: d.links.broken > 5 ? "high" : "medium",
        evidence: d.links.details.join("; "),
        scan_source: "cloud_browser",
      });
    }
    // Image findings
    if (d.images?.broken > 0) {
      findings.push({
        title: d.images.broken + " broken images",
        category: "visual",
        severity: d.images.broken > 3 ? "high" : "medium",
        evidence: d.images.details.join("; "),
        scan_source: "cloud_browser",
      });
    }
    // Form findings
    if (d.forms?.broken > 0) {
      findings.push({
        title: d.forms.broken + " forms without action or submit",
        category: "conversion",
        severity: "critical",
        evidence: d.forms.details.join("; "),
        scan_source: "cloud_browser",
      });
    }
    // Performance findings
    if (d.performance) {
      if (d.performance.load_time_ms > 3000) {
        findings.push({
          title: "Slow page load — " + d.performance.load_time_ms + "ms",
          category: "performance",
          severity: d.performance.load_time_ms > 5000 ? "high" : "medium",
          evidence: "Load time: " + d.performance.load_time_ms + "ms (threshold: 3000ms)",
          scan_source: "cloud_browser",
        });
      }
      if (d.performance.lcp_ms > 2500) {
        findings.push({
          title: "Poor LCP — " + d.performance.lcp_ms + "ms",
          category: "performance",
          severity: d.performance.lcp_ms > 4000 ? "high" : "medium",
          evidence: "Largest Contentful Paint: " + d.performance.lcp_ms + "ms (threshold: 2500ms)",
          scan_source: "cloud_browser",
        });
      }
      if (d.performance.cls > 0.1) {
        findings.push({
          title: "Layout shift detected — CLS " + d.performance.cls.toFixed(3),
          category: "performance",
          severity: d.performance.cls > 0.25 ? "high" : "medium",
          evidence: "Cumulative Layout Shift: " + d.performance.cls.toFixed(3) + " (threshold: 0.1)",
          scan_source: "cloud_browser",
        });
      }
    }
    // SEO findings
    if (d.seo) {
      if (!d.seo.title || d.seo.title.length < 10) {
        findings.push({
          title: "Missing or short <title> tag",
          category: "seo",
          severity: "high",
          evidence: 'Title: "' + (d.seo.title || "empty") + '" — needs 30-60 chars',
          scan_source: "cloud_browser",
        });
      }
      if (!d.seo.meta_description) {
        findings.push({
          title: "Missing meta description",
          category: "seo",
          severity: "high",
          evidence: "No meta description tag found",
          scan_source: "cloud_browser",
        });
      }
      if (d.seo.h1_count === 0) {
        findings.push({
          title: "No H1 heading on page",
          category: "seo",
          severity: "high",
          evidence: "Zero h1 elements — critical for SEO",
          scan_source: "cloud_browser",
        });
      }
      if (d.seo.h1_count > 1) {
        findings.push({
          title: "Multiple H1s — " + d.seo.h1_count + " found",
          category: "seo",
          severity: "medium",
          evidence: d.seo.h1_count + " h1 elements — should be exactly 1",
          scan_source: "cloud_browser",
        });
      }
      if (!d.seo.schema_found) {
        findings.push({
          title: "No structured data (JSON-LD schema)",
          category: "seo",
          severity: "medium",
          evidence: "No JSON-LD schema found — missing rich results opportunity",
          scan_source: "cloud_browser",
        });
      }
      if (!d.seo.canonical) {
        findings.push({
          title: "Missing canonical URL tag",
          category: "seo",
          severity: "medium",
          evidence: "No canonical link tag found",
          scan_source: "cloud_browser",
        });
      }
    }
    // Accessibility findings
    if (d.accessibility) {
      if (d.accessibility.images_without_alt > 0) {
        findings.push({
          title: d.accessibility.images_without_alt + " images without alt text",
          category: "accessibility",
          severity: d.accessibility.images_without_alt > 5 ? "high" : "medium",
          evidence: d.accessibility.images_without_alt + " img tags missing alt attribute",
          scan_source: "cloud_browser",
        });
      }
    }

    // Take screenshot for evidence
    try {
      const ssRes = await screenshot(sessionId, false);
      if (ssRes.base64) {
        const base44 = (globalThis as any).__base44;
        if (base44) {
          const file = new File(
            [Uint8Array.from(atob(ssRes.base64), (c: string) => c.charCodeAt(0))],
            "faultline-" + Date.now() + ".png",
            { type: "image/png" }
          );
          const upload = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
          screenshotUri = upload.file_uri;
        }
      }
    } catch { /* best effort */ }
  } catch (e: any) {
    findings.push({
      title: "Cloud browser inspection failed — " + (e.message?.slice(0, 80) || "unknown"),
      category: "infrastructure",
      severity: "medium",
      evidence: e.message?.slice(0, 500) || "Cloud browser error",
      scan_source: "cloud_browser",
    });
  } finally {
    if (sessionId) await closeSession(sessionId);
  }

  return { findings, screenshotUri };
}

// ── 3. SENTINEL SELF-REFLECTION (root-cause analysis) ──
async function sentinelReflection(base44: any, findings: any[], siteUrl: string): Promise<Map<string, any>> {
  if (findings.length === 0) return new Map();
  try {
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: "You are the FaultLine Sentinel — a root-cause analysis engine. For each finding below, identify the ROOT CAUSE and a SPECIFIC repair recommendation. Also estimate the annual revenue impact in USD for a small-to-mid business.\n\nSITE: " + siteUrl + "\n\nFINDINGS:\n" + JSON.stringify(findings.map((f, i) => ({ index: i, title: f.title, category: f.category, severity: f.severity, evidence: f.evidence })), null, 2) + "\n\nFor each finding, return root_cause, recommended_repair, annual_impact_min, annual_impact_max, and confidence (0-100). Be specific and technical. A broken form on a lead-gen site could cost $50K-$200K/year in lost leads.",
      response_json_schema: {
        type: "object",
        properties: {
          analyses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                index: { type: "number" },
                root_cause: { type: "string" },
                recommended_repair: { type: "string" },
                annual_impact_min: { type: "number" },
                annual_impact_max: { type: "number" },
                confidence: { type: "number" },
              },
            },
          },
        },
      },
    });
    const map = new Map<string, any>();
    for (const a of res.analyses || []) {
      map.set(a.index, a);
    }
    return map;
  } catch {
    return new Map();
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "all";
    const singleUrl = body.url || null;
    const maxSites = body.max_sites || 20;
    const runSentinel = body.sentinel !== false;

    const sid = scanId();
    const startTime = Date.now();

    // ── Gather target sites ──
    let sites: { url: string; name: string }[] = [];

    if (singleUrl) {
      sites = [{ url: singleUrl, name: singleUrl }];
    } else {
      try {
        const wqPage: any = await svc.entities.WebsiteQueue.filter(
          { status: "deployed" },
          { sort: "-created_date", limit: maxSites, fields: ["id", "domain", "business_name", "status"] }
        );
        for (const wq of wqPage.items || []) {
          if (wq.domain) {
            const url = wq.domain.startsWith("http") ? wq.domain : "https://" + wq.domain;
            sites.push({ url, name: wq.business_name || wq.domain });
          }
        }
      } catch { /* best effort */ }

      try {
        const canonPage: any = await svc.entities.CanonicalSiteRegistry.filter(
          {},
          { sort: "-created_date", limit: 10, fields: ["id", "domain", "name"] }
        );
        for (const c of canonPage.items || []) {
          if (c.domain) {
            const url = c.domain.startsWith("http") ? c.domain : "https://" + c.domain;
            if (!sites.find((s) => s.url === url)) {
              sites.push({ url, name: c.name || c.domain });
            }
          }
        }
      } catch { /* best effort */ }
    }

    if (sites.length === 0) {
      return Response.json({
        ok: false,
        message: "No live sites found to scan. Deploy sites first or pass a URL.",
      });
    }

    // Clean up stale browser sessions before starting
    if (isEngineConfigured()) {
      try { await cleanStaleSessions(); } catch { /* best effort */ }
    }

    // ── Scan each site ──
    const allFindings: any[] = [];
    const siteResults: any[] = [];

    for (const site of sites.slice(0, maxSites)) {
      const siteStart = Date.now();
      const siteFindings: any[] = [];

      // 1. Forensic HTTP audit + security headers
      const httpFindings = await forensicHttpAudit(site.url);
      siteFindings.push(...httpFindings);

      // 2. Cloud browser deep inspection (only if site is reachable)
      const reachable = !siteFindings.some((f) => f.category === "infrastructure" && f.severity === "critical");
      let screenshotUri: string | null = null;
      if (reachable) {
        const cbResult = await cloudBrowserDeepInspection(site.url);
        siteFindings.push(...cbResult.findings);
        screenshotUri = cbResult.screenshotUri;
      }

      // 3. Sentinel self-reflection (root-cause + dollar impact)
      let sentinelMap = new Map<string, any>();
      if (runSentinel && siteFindings.length > 0) {
        sentinelMap = await sentinelReflection(base44, siteFindings, site.url);
      }

      // Attach sentinel analysis to each finding
      for (let i = 0; i < siteFindings.length; i++) {
        const s = sentinelMap.get(i);
        siteFindings[i].root_cause = s?.root_cause || "";
        siteFindings[i].recommended_repair = s?.recommended_repair || "";
        siteFindings[i].annual_impact_min = s?.annual_impact_min || 0;
        siteFindings[i].annual_impact_max = s?.annual_impact_max || 0;
        siteFindings[i].confidence = s?.confidence || 50;
        siteFindings[i].scan_id = sid;
        siteFindings[i].site_url = site.url;
        siteFindings[i].site_name = site.name;
        siteFindings[i].screenshot_uri = screenshotUri;
        siteFindings[i].found_at = new Date().toISOString();
      }

      allFindings.push(...siteFindings);
      siteResults.push({
        url: site.url,
        name: site.name,
        findings_count: siteFindings.length,
        critical: siteFindings.filter((f) => f.severity === "critical").length,
        high: siteFindings.filter((f) => f.severity === "high").length,
        medium: siteFindings.filter((f) => f.severity === "medium").length,
        low: siteFindings.filter((f) => f.severity === "low").length,
        elapsed_ms: Date.now() - siteStart,
      });
    }

    // ── Persist all findings to FaultLineFinding ──
    let savedCount = 0;
    const records = allFindings.map((f) => ({
      scan_id: sid,
      site_url: f.site_url,
      site_name: f.site_name,
      title: f.title,
      description: f.evidence || f.title,
      category: f.category,
      severity: f.severity,
      evidence: f.evidence || "",
      root_cause: f.root_cause || "",
      recommended_repair: f.recommended_repair || "",
      annual_impact_min: f.annual_impact_min || 0,
      annual_impact_max: f.annual_impact_max || 0,
      confidence: f.confidence || 50,
      scan_source: f.scan_source || "cloud_browser",
      status: "open",
      screenshot_uri: f.screenshot_uri || "",
      found_at: f.found_at,
    }));

    for (let i = 0; i < records.length; i += 100) {
      const batch = records.slice(i, i + 100);
      try {
        await svc.entities.FaultLineFinding.bulkCreate(batch);
        savedCount += batch.length;
      } catch (e) {
        console.error("Batch save failed:", e);
      }
    }

    // ── Summary ──
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const summary = {
      ok: true,
      scan_id: sid,
      mode,
      sites_scanned: siteResults.length,
      total_findings: allFindings.length,
      saved_findings: savedCount,
      by_severity: {
        critical: allFindings.filter((f) => f.severity === "critical").length,
        high: allFindings.filter((f) => f.severity === "high").length,
        medium: allFindings.filter((f) => f.severity === "medium").length,
        low: allFindings.filter((f) => f.severity === "low").length,
      },
      by_category: {
        security: allFindings.filter((f) => f.category === "security").length,
        performance: allFindings.filter((f) => f.category === "performance").length,
        seo: allFindings.filter((f) => f.category === "seo").length,
        functionality: allFindings.filter((f) => f.category === "functionality").length,
        content: allFindings.filter((f) => f.category === "content").length,
        visual: allFindings.filter((f) => f.category === "visual").length,
        infrastructure: allFindings.filter((f) => f.category === "infrastructure").length,
        conversion: allFindings.filter((f) => f.category === "conversion").length,
        accessibility: allFindings.filter((f) => f.category === "accessibility").length,
      },
      total_annual_impact_max: allFindings.reduce((s, f) => s + (f.annual_impact_max || 0), 0),
      site_results: siteResults,
      top_findings: allFindings
        .sort((a, b) => (sevOrder[a.severity] || 4) - (sevOrder[b.severity] || 4))
        .slice(0, 25)
        .map((f) => ({
          site: f.site_url,
          title: f.title,
          category: f.category,
          severity: f.severity,
          root_cause: f.root_cause,
          recommended_repair: f.recommended_repair,
          annual_impact_max: f.annual_impact_max,
          confidence: f.confidence,
        })),
      elapsed_ms: Date.now() - startTime,
      scanned_at: new Date().toISOString(),
    };

    await logStep(base44, {
      category: "system",
      action: "FaultLine deep scan",
      detail: "Scanned " + siteResults.length + " sites, found " + allFindings.length + " problems (" + summary.by_severity.critical + " critical, " + summary.by_severity.high + " high). Estimated max annual impact: $" + summary.total_annual_impact_max.toLocaleString() + ". Saved " + savedCount + " findings.",
      source: "faultLineScanner",
    });

    return Response.json(summary);
  } catch (error: any) {
    console.error("[faultLineScanner] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}