/** Generated Vercel deployment URLs are not canonical public releases. */
export function isGeneratedVercelPreview(hostname) {
  return typeof hostname === 'string' && /-[a-z0-9]{8,}-[^.]+[.]vercel[.]app$/i.test(hostname);
}
