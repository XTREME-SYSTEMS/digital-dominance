import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import UploadPanel from '@/components/image-ingestion/UploadPanel';
import CodeOutput from '@/components/image-ingestion/CodeOutput';
import { Sparkles, Loader2, Wand2, AlertCircle } from 'lucide-react';

export default function ImageIngestion() {
  const [imageUrl, setImageUrl] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!imageUrl) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('imageIngestion', {
        image_url: imageUrl,
        instructions: instructions.trim() || undefined,
      });
      if (res.data?.error) throw new Error(res.data.error);
      if (!res.data?.ok) throw new Error('Ingestion returned no result');
      setResult(res.data);
    } catch (e) {
      setError(e.message || 'Ingestion failed');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600">
          <Wand2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Image Ingestion → Code</h1>
          <p className="text-sm text-stone-500">Upload a screenshot or design — AI generates the frontend component and backend function</p>
        </div>
      </div>

      {/* Upload + instructions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <UploadPanel onImageUrl={setImageUrl} imageUrl={imageUrl} disabled={loading} />
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-stone-700 mb-1.5 block">Instructions (optional)</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={loading}
              placeholder="e.g. Make this a full admin page with a data table, add filters, use dark mode..."
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:outline-none disabled:bg-stone-100 resize-none"
              rows={5}
            />
            <p className="text-xs text-stone-500 mt-1">Guide the AI on what you want — page type, data needs, style preferences.</p>
          </div>
          <button
            onClick={generate}
            disabled={!imageUrl || loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing image & generating code...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Code from Image
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Ingestion failed</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !result && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-sm text-stone-500">AI is analyzing your image and writing code...</p>
          <p className="text-xs text-stone-400">This can take 30-60 seconds for complex designs</p>
        </div>
      )}

      {/* Results */}
      {result && <CodeOutput result={result} />}
    </div>
  );
}