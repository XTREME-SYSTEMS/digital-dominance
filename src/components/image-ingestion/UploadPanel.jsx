import React, { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, X, ImageIcon } from 'lucide-react';
import { uploadFile } from '@/lib/gateway';

export default function UploadPanel({ onImageUrl, imageUrl, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WebP, etc.)');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const { file_url } = await uploadFile(file);
      onImageUrl(file_url);
    } catch (e) {
      setError(`Upload failed: ${e.message}`);
    }
    setUploading(false);
  }, [onImageUrl]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile, disabled]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const clearImage = () => {
    onImageUrl(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {!imageUrl ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-colors ${
            dragging ? 'border-amber-500 bg-amber-50' : 'border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50/50'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
              <p className="text-sm font-medium text-stone-600">Uploading image...</p>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <Upload className="h-7 w-7 text-amber-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-stone-700">Drop a screenshot or design here</p>
                <p className="text-xs text-stone-500 mt-1">or click to browse — PNG, JPG, WebP</p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="relative rounded-2xl border border-stone-200 overflow-hidden bg-stone-100">
          <img src={imageUrl} alt="Uploaded design" className="w-full max-h-96 object-contain" />
          <button
            onClick={clearImage}
            disabled={disabled}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white">
            <ImageIcon className="h-3 w-3" />
            <span>Image ready for ingestion</span>
          </div>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}