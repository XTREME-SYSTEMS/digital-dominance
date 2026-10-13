import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Eye, CheckCircle2, AlertCircle, Loader2, FileCode } from 'lucide-react';

export default function HeroMockupIngestor({ onEnhanced }) {
  const [mockup, setMockup] = useState('');
  const [format, setFormat] = useState('html');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const enhance = async () => {
    if (!mockup.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('heroMockupEnhancer', {
        mockup,
        format,
        title: title || 'GPT Hero Mockup',
      });
      setResult(res.data);
      if (onEnhanced) onEnhanced(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Enhancement failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileCode className="h-5 w-5 text-[#00a2ff]" />
        <h2 className="font-heading text-lg font-bold text-white">Ingest GPT Hero Mockup</h2>
      </div>
      <p className="text-sm text-white/50">
        Paste the HTML, JSX, or design description that GPT generated for the hero section. The AI will analyze it and produce an enhanced, production-ready version.
      </p>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Mockup title (e.g. 'GPT Hero v1 — Blue Glow')"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#00a2ff]"
      />

      <div className="flex gap-2">
        {['html', 'jsx', 'markdown', 'description'].map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase transition ${
              format === f
                ? 'bg-[#00a2ff] text-white'
                : 'border border-white/10 bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Textarea
        value={mockup}
        onChange={(e) => setMockup(e.target.value)}
        placeholder={`Paste the ${format.toUpperCase()} mockup here...\n\nExample (HTML):\n<section class="hero">\n  <h1>Build Websites Faster</h1>\n  <p>Launch in days, not months.</p>\n  <button>Get Started</button>\n</section>`}
        className="min-h-[240px] resize-y border-white/10 bg-white/5 font-mono text-sm text-white placeholder-white/30"
      />

      <Button
        onClick={enhance}
        disabled={loading || !mockup.trim()}
        className="w-full bg-[#00a2ff] text-white hover:bg-[#0090e0]"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Enhancing with AI...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Enhance Hero Mockup
          </>
        )}
      </Button>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="font-bold text-green-400">Enhancement Complete</span>
            <span className="ml-auto rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
              Score: {result.enhancement_score}/100
            </span>
          </div>
          <div className="text-sm text-white/60">
            <p className="mb-1 font-semibold text-white/80">What changed:</p>
            <pre className="whitespace-pre-wrap text-xs text-white/50">{result.enhancement_notes}</pre>
          </div>
        </div>
      )}
    </div>
  );
}