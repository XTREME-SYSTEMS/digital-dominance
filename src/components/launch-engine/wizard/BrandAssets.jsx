import React, { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Field, Choice } from './wizardFields';

const RECOMMENDATIONS = 'Use 1920×1080 or larger, JPG / PNG / WebP, under 5 MB each. Landscape (16:9) works best for hero and gallery slots.';

export default function BrandAssets({ value, set }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const photos = value.photos || [];

  const upload = async (files, kind) => {
    if (!files || !files.length) return;
    setBusy(kind);
    setError(null);
    try {
      const urls = (await Promise.all(Array.from(files).map(async file => {
        const res = await base44.integrations.Core.UploadPublicFile({ file });
        return res?.file_url || null;
      }))).filter(Boolean);
      if (!urls.length) throw new Error('The upload did not return a file address.');
      if (kind === 'logo') set({ logo_url: urls[0] });
      else set({
        photos: [...photos, ...urls.map(url => ({ name: decodeURIComponent(url.split('/').pop() || 'photo'), url }))],
        image_plan: 'own_photos',
      });
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  const dropPhoto = url => set({ photos: photos.filter(photo => photo.url !== url) });

  return (
    <div className="space-y-3">
      <Field label="Your existing logo" hint="Upload the logo you already use. PNG or WebP with a transparent background looks best.">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={e => upload(e.target.files, 'logo')}
            className="block w-full max-w-xs text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#00a2ff] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
          />
          {busy === 'logo' && <Loader2 className="h-4 w-4 animate-spin text-[#00a2ff]" />}
          {value.logo_url && (
            <span className="flex items-center gap-2 rounded-lg border border-gray-200 p-1">
              <Image src={value.logo_url} alt="Uploaded logo" className="h-10 w-16 object-contain" />
              <button type="button" aria-label="Remove logo" onClick={() => set({ logo_url: '' })} className="text-gray-400 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      </Field>

      <Field label="Your own photos" hint={RECOMMENDATIONS}>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => upload(e.target.files, 'photos')}
            className="block w-full max-w-xs text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#00a2ff] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
          />
          {busy === 'photos' && <Loader2 className="h-4 w-4 animate-spin text-[#00a2ff]" />}
        </div>
        {photos.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {photos.map(photo => (
              <span key={photo.url} className="relative overflow-hidden rounded-lg border border-gray-200">
                <Image src={photo.url} alt={photo.name} className="h-16 w-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove ${photo.name}`}
                  onClick={() => dropPhoto(photo.url)}
                  className="absolute right-1 top-1 rounded bg-black/70 p-0.5 text-white hover:bg-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Field>

      <Field label="Imagery source">
        <div className="grid gap-2 sm:grid-cols-2">
          <Choice
            checked={value.image_plan === 'own_photos'}
            onClick={() => set({ image_plan: 'own_photos' })}
            title="Use my photos"
            desc="Your uploaded photos fill the hero, service and gallery slots."
          />
          <Choice
            checked={value.image_plan === 'ai_generated'}
            onClick={() => set({ image_plan: 'ai_generated' })}
            title="Generate new images for me"
            desc="AI creates the imagery in the studio, which you review before publishing."
          />
        </div>
        {value.image_plan === 'ai_generated' && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-800">
            <Upload className="mt-0.5 h-3 w-3 shrink-0" />
            All generated images are AI-created illustrations. Review every one before publishing and never present a generated image as a photo of real completed work.
          </p>
        )}
      </Field>

      {error && <p role="alert" className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}