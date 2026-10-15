/**
 * Base44 is the existing Digital Dominance V.1 identity/data backend.
 *
 * Vercel hosts the Vite frontend, not Base44's /api routes. External SDK
 * requests must go to Base44's official API origin.
 *
 * The app ID is a PUBLIC identifier verified against the connected Base44
 * app registry, not a credential or an authentication/authorization grant.
 * An explicit build-time app ID is allowed for reviewed deployments.
 * Never accept an app ID or backend hostname from query params/localStorage.
 */
/**
 * Preserve the already-working first-party /api proxy on the established
 * production custom domain and native Base44 hosts. Vercel previews have
 * no /api backend and use the official platform origin instead.
 */
export function resolveBase44ApiOrigin(hostname = "") {
  const host = String(hostname).toLowerCase();
  const hasFirstPartyBackend =
    host === "unlimitedwebsites.net" ||
    host === "www.unlimitedwebsites.net" ||
    host.endsWith(".base44.app");
  return hasFirstPartyBackend ? "" : "https://base44.app";
}
export const BASE44_API_ORIGIN = resolveBase44ApiOrigin(
  typeof window !== "undefined" ? window.location.hostname : ""
);
export const BASE44_CANONICAL_APP_ID = "6a77f4491f0bf92de9a3ed8b";
const configuredAppId = import.meta.env?.VITE_BASE44_APP_ID;
export const BASE44_APP_ID =
  typeof configuredAppId === "string" && /^[a-f0-9]{24}$/i.test(configuredAppId)
    ? configuredAppId
    : BASE44_CANONICAL_APP_ID;
