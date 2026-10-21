import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Loader2, AlertCircle, Upload, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';

// The imagery slots the page builder fills. A photo posed here replaces the
// generated image on every page that uses the slot.
const SLOTS = [
  { key: 'hero', label: 'Hero banner', where: 'Top of every page' },
  { key: 'services', label: 'Services & process', where: 'Services and estimate pages' },
  { key: 'about', label: 'Team photo', where: 'About us page' },
  { key: 'gallery1', label: 'Before & after', where: 'First gallery image' },
  { key: 'gallery2', label: 'Project gallery', where: 'Gallery and about pages' },
  { key: 'gallery3', label: 'Materials & detail', where: 'Last gallery image' },
];

// Pose your own team, vehicle and finished-work photos into the built pages.
export default function PhotoPosePanel({ profile, onBuilt }) {
  const [photos, setPhotos] = useState(profile?.photos || []);
  const [selected, setSelected] = useState('');
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => { setPhotos(profile?.photos || []); }, [profile?.id]);

  const slotPhoto = (key) => photos.find((photo) => photo.slot === key);
  const library = photos.filter((photo) => !photo.slot);

  const place = (url, slot) => {
    if (!url) return;
    setPhotos((prev) => prev.map((photo) => (
      photo.url === url
        ? { ...photo, slot }
        : (photo.slot === slot ? { ...photo, slot: '' } : photo)
    )));
    setStatus('');
  };

  const clear = (slot) => setPhotos((prev) => prev.map((photo) => (photo.slot === slot ? { ...photo, slot: '' } : photo)));

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const added = [];
      for (const file of files) {
        const res = await base44.integrations.Core.UploadPublicFile({ file });
        if (res?.file_url) added.push({ name: file.name, url: res.file_url, slot: '' });
      }
      setPhotos((prev) => [...prev, ...added]);
      setStatus(added.length ? `${added.length} photo${added.length === 1 ? '' : 's'} ready to pose. Drag one onto a slot below.` : 'Nothing was uploaded.');
    } catch (e) {
      setError(e.message || 'Could not upload that photo');
    } finally {
      setUploading(false);
    }
  };

  const onDragEnd = (result) => {
    const target = result.destination?.droppableId || '';
    if (!result.destination || result.source.droppableId !== 'photo-library' || !target.startsWith('slot-')) return;
    const index = Number(String(result.draggableId).replace('photo-', ''));
    place(library[index]?.url, target.replace('slot-', ''));
  };

  const apply = async () => {
    setApplying(true);
    setError(null);
    setStatus('');
    try {
      await base44.entities.BrandProfile.update(profile.id, { photos });
      const pageCount = Math.min(7, Math.max(5, profile?.pages?.length || 7));
      const res = await base44.functions.invoke('pagePackGenerator', { profile_id: profile.id, page_count: pageCount });
      onBuilt?.(res.data.pages || []);
      setStatus(`Your photos are now live on ${res.data.pages?.length || pageCount} pages.`);
    } catch (e) {
      setError(`Your photos were saved, but the pages could not be rebuilt: ${e.response?.data?.error || e.message}`);
    } finally {
      setApplying(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <Upload className="h-4 w-4 text-[#00a2ff]" />
        <h3 className="text-sm font-extrabold">Your own photos</h3>
        <p className="w-full text-xs text-muted-foreground sm:w-auto">
          Drag your team, vehicle and finished-work photos onto the slots they should fill.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:border-[#00a2ff]">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? 'Uploading…' : 'Upload photos'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={upload} disabled={uploading} />
        </label>
        <span className="text-[11px] text-muted-foreground">JPEG or PNG. Stored publicly — anyone with the link can open them.</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {!!library.length && (
          <Droppable droppableId="photo-library" direction="horizontal">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {library.map((photo, index) => (
                  <Draggable key={photo.url} draggableId={`photo-${index}`} index={index}>
                    {(drag, snapshot) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        {...drag.dragHandleProps}
                        className={`relative w-24 flex-shrink-0 cursor-grab rounded-xl border p-1 ${selected === photo.url ? 'border-[#00a2ff] ring-2 ring-[#00a2ff]/25' : 'border-border'} ${snapshot.isDragging ? 'opacity-80' : ''}`}
                      >
                        <Image src={photo.url} alt={photo.name || 'Your photo'} className="h-16 w-full rounded-lg object-cover" onClick={() => setSelected(photo.url)} />
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">{selected === photo.url ? 'Now tap a slot' : photo.name}</p>
                        <button
                          type="button"
                          aria-label={`Remove ${photo.name || 'photo'}`}
                          onClick={() => setPhotos((prev) => prev.filter((item) => item.url !== photo.url))}
                          className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SLOTS.map((slot) => {
            const photo = slotPhoto(slot.key);
            return (
              <Droppable droppableId={`slot-${slot.key}`} key={slot.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    onClick={() => selected && place(selected, slot.key)}
                    className={`rounded-xl border p-2 transition ${snapshot.isDraggingOver || (selected && !photo) ? 'border-[#00a2ff] bg-[#00a2ff]/5' : 'border-border'} ${selected ? 'cursor-pointer' : ''}`}
                  >
                    {photo ? (
                      <div className="relative">
                        <Image src={photo.url} alt={`${slot.label} photo`} className="h-24 w-full rounded-lg object-cover" />
                        <button
                          type="button"
                          aria-label={`Clear ${slot.label}`}
                          onClick={(e) => { e.stopPropagation(); clear(slot.key); }}
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded-full bg-[#00a2ff] px-2 py-0.5 text-[10px] font-bold text-white">
                          <Check className="h-3 w-3" /> Posed
                        </span>
                      </div>
                    ) : (
                      <div className="grid h-24 place-items-center rounded-lg border border-dashed border-border text-[11px] text-muted-foreground">
                        Drag a photo here
                      </div>
                    )}
                    <p className="mt-2 text-xs font-bold">{slot.label}</p>
                    <p className="text-[11px] text-muted-foreground">{slot.where}</p>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={apply} disabled={applying || !photos.length} style={{ background: 'linear-gradient(135deg,#126fc8,#0d9488)', color: '#fff' }}>
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {applying ? 'Putting your photos on the pages…' : 'Apply photos to my site'}
        </Button>
        {!!library.length && (
          <Button variant="outline" size="sm" onClick={() => setPhotos((prev) => prev.filter((photo) => photo.slot))}>
            <Trash2 className="h-3.5 w-3.5" /> Clear unused photos
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
      {status && !error && <p className="mt-3 text-sm text-muted-foreground">{status}</p>}
    </section>
  );
}