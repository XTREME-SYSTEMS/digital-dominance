/** Return a UTF-8 safe SVG data URL, including non-Latin1 labels. */
export function svgToDataUri(svg) {
  if (typeof svg !== 'string' || !svg.trimStart().startsWith('<svg')) throw new Error('SVG_REQUIRED');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
