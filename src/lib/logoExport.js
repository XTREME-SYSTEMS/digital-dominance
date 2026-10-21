/**
 * LOGO EXPORT
 * Takes a generated logo and exports it at the requested size with the flat
 * background keyed out, so the mark drops cleanly onto any page colour.
 * If the source image cannot be read pixel-by-pixel (cross-origin), the
 * original file is downloaded instead of failing.
 */
export const LOGO_SIZES = [64, 128, 256, 512, 1024];

function triggerDownload(href, filename) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
}

export async function exportLogo(url, size, filename = 'logo.png') {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Could not load that logo'));
    img.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const scale = Math.min(size / img.width, size / img.height);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  ctx.drawImage(img, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);

  let blob;
  try {
    // Key out the near-white plate: full alpha on flat white, softened on halos.
    const data = ctx.getImageData(0, 0, size, size);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const max = Math.max(r, g, b);
      const spread = max - Math.min(r, g, b);
      if (max > 236 && spread < 18) px[i + 3] = 0;
      else if (max > 226 && spread < 26) px[i + 3] = Math.round(px[i + 3] * 0.35);
    }
    ctx.putImageData(data, 0, 0);
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch {
    blob = null;
  }

  if (!blob) {
    triggerDownload(url, filename);
    return { transparent: false };
  }
  const href = URL.createObjectURL(blob);
  triggerDownload(href, filename);
  setTimeout(() => URL.revokeObjectURL(href), 20000);
  return { transparent: true };
}