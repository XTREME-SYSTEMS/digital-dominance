/**
 * Vercel preview HTML must be noindex before JavaScript executes.
 * Production HTML is unchanged. This is not a replacement for independent QA.
 */
export function transformIndexHtmlForEnvironment(html, environment) {
  if (environment !== 'preview') return html;
  const match = /<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?\s*>/i;
  if (!match.test(html)) throw new Error('PREVIEW_ROBOTS_META_MISSING');
  return html.replace(match, '<meta name="robots" content="noindex, nofollow, noarchive" />');
}
