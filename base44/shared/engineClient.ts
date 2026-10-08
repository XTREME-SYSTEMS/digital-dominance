import { secrets } from "base44:runtime";

// ═══════════════════════════════════════════════
// Engine client — SECURITY HARDENED v5 (multi-engine failover)
// Primary URL: CLOUD_BROWSER_ENGINE_URL or ENGINE_URL secret
// Backup URLs:  ENGINE_URL_2, ENGINE_URL_3 secrets
// API KEY:     ALWAYS from encrypted secrets vault, NEVER from DB
// Failover:    primary → engine 2 → engine 3 on network error or 5xx
// ═══════════════════════════════════════════════

let _cachedConfig = null;

export async function getEngineConfig() {
  if (_cachedConfig) return _cachedConfig;

  // 1. Primary URL: CLOUD_BROWSER_ENGINE_URL (existing secret), fallback ENGINE_URL
  const primaryUrl = secrets.get("CLOUD_BROWSER_ENGINE_URL") || secrets.get("ENGINE_URL");

  // 2. Backup URLs from secrets
  const backupUrls = [
    secrets.get("ENGINE_URL_2"),
    secrets.get("ENGINE_URL_3"),
  ].filter(Boolean);

  // 3. API KEY: ALWAYS from encrypted secrets vault — NEVER from DB
  const key = secrets.get("ENGINE_API_KEY");

  // Build ordered list of candidate base URLs (deduped)
  const urls = [primaryUrl, ...backupUrls]
    .filter(Boolean)
    .map((u) => u.replace(/\/$/, ""));

  if (urls.length === 0 || !key) {
    throw new Error("Browser engine not configured. Set CLOUD_BROWSER_ENGINE_URL and ENGINE_API_KEY in Settings → Secrets.");
  }

  _cachedConfig = { urls, key };
  return _cachedConfig;
}

export async function isEngineConfigured() {
  try {
    await getEngineConfig();
    return true;
  } catch {
    return false;
  }
}

/** Returns the list of configured engine URLs (for health checks / UI). */
export async function getEngineUrls() {
  const { urls } = await getEngineConfig();
  return urls;
}

/** Safe non-reversible fingerprint of the secret-vault key (first 16 hex chars of SHA-256). */
export async function getEngineKeyFingerprint() {
  const key = secrets.get("ENGINE_API_KEY");
  if (!key) return null;
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  const hash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return "sha256:" + hash.slice(0, 16);
}

// Generic authenticated fetch with multi-engine failover.
// Tries each candidate URL in order; on network error or 5xx, falls through to the next.
export async function engineFetch(path: string, options: any = {}, requestId?: string) {
  const { urls, key } = await getEngineConfig();
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": key,
    ...(options.headers || {}),
  };
  if (requestId) baseHeaders["x-request-id"] = requestId;

  const errors: string[] = [];
  for (const baseUrl of urls) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: baseHeaders,
      });
      const text = await res.text();
      let body: any;
      try { body = JSON.parse(text); } catch { body = text; }

      // Failover on 5xx (server error) — try next engine
      if (res.status >= 500) {
        errors.push(`${baseUrl}: ${res.status}`);
        continue;
      }

      if (!res.ok) {
        const errMsg = typeof body === "object" && body?.error ? body.error : `Engine error ${res.status}`;
        throw new Error(errMsg);
      }

      // Detect HTML responses (misconfigured engine serving Vite app shell instead of engine API)
      if (typeof body === "string" && (body.trim().startsWith("<!doctype") || body.trim().startsWith("<html"))) {
        errors.push(`${baseUrl}: returned HTML, not engine API (misconfigured deployment)`);
        continue;
      }

      return body;
    } catch (err: any) {
      // Network error / fetch rejection — record and try next engine
      errors.push(`${baseUrl}: ${err.message}`);
    }
  }

  throw new Error(`All engines failed. Attempts: ${errors.join(" | ")}`);
}

export async function enginePost(path: string, payload?: any, requestId?: string) {
  return engineFetch(path, { method: "POST", body: JSON.stringify(payload || {}) }, requestId);
}

export async function engineDelete(path: string, requestId?: string) {
  return engineFetch(path, { method: "DELETE" }, requestId);
}

export async function engineGet(path: string, requestId?: string) {
  return engineFetch(path, { method: "GET" }, requestId);
}