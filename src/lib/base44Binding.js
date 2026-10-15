/**
 * Never infer a Base44 tenant from an image URL, query string, or localStorage.
 * A backend can only be used when the build has a provider-supplied app ID.
 * Production data access still requires normal user/session authorization.
 */
export function isValidBase44AppId(value) {
  return typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
}
export const hasRuntimeBase44AppId = isValidBase44AppId(import.meta.env?.VITE_BASE44_APP_ID);
