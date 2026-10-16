/** Preview-only tenant isolation. Preserve current production behavior until its binding is independently audited. */
import { isGeneratedVercelPreview } from './previewHost.js';
export function isValidBase44AppId(value) {
  return typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
}
export function shouldUseBase44Backend(appId, hostname) {
  if (isValidBase44AppId(appId)) return true;
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return false;
  return !isGeneratedVercelPreview(hostname);
}
export const hasRuntimeBase44AppId = shouldUseBase44Backend(
  import.meta.env?.VITE_BASE44_APP_ID,
  typeof window === 'undefined' ? '' : window.location.hostname
);
