import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Eye, CheckCircle2, Loader2, History, Trash2, Star } from 'lucide-react';
import HeroMockupIngestor from '@/components/hero-enhancer/HeroMockupIngestor';
import EnhancedHeroPreview from '@/components/hero-enhancer/EnhancedHeroPreview';

export default function HeroEnhancer() {
  const [enhancedHtml, setEnhancedHtml] = useState(null);
  const [mockupId, setMockupId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState(null);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await base44.entities.HeroMockup.filter(
        {},
        { sort: '-created_date', limit: 20, fields: ['title', 'status', 'enhancement_score', 'is_active', 'created_date'] }
      );
      setHistory(res.items || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const onEnhanced = (data) => {
    setEnhancedHtml(data.enhanced_html);
    setMockupId(data.mockup_id);
    setApplyMsg(null);
    loadHistory();
  };

  const applyToHome = async () => {
    if (!mockupId) return;
    setApplying(true);
    setApplyMsg(null);
    try {
      // Deactivate all other mockups
      const all = await base44.entities.HeroMockup.filter({ is_active: true }, { limit: 50, fields: ['id'] });
      if (all.items?.length) {
        await base44.entities.HeroMockup.bulkUpdate(
          all.items.map(m => ({ id: m.id, is_active: false, status: 'enhanced' }))
        );
      }
      // Activate this one
      await base44.entities.HeroMockup.update(mockupId, {
        is_active: true,
        status: 'applied',
        applied_at: new Date().toISOString(),
      });
      setApplyMsg({ type: 'success', text: 'Hero applied to home page. It will show on next visit.' });
      loadHistory();
    } catch (err) {
      setApplyMsg({ type: 'error', text: err.message || 'Failed to apply' });
    } finally {
      setApplying(false);
    }
  };

  const viewHistoryItem = async (id) => {
    try {
      const item = await base44.entities.HeroMockup.get(id);
      setEnhancedHtml(item.enhanced_html);
      setMockupId(item.id);
      setApplyMsg(null);
    } catch {}
  };

  const deleteItem = async (id) => {
    try {
      await base44.entities.HeroMockup.delete(id);
      if (mockupId === id) { setEnhancedHtml(null); setMockupId(null); }
      loadHistory();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <div className="border-b border-white/10 px-4 py-4 md:px-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[#00a2ff]" />
          <h1 className="font-heading text-xl font-extrabold md:text-2xl">Hero Mockup Enhancer</h1>
        </div>
        <p className="mt-1 text-sm text-white/50">Ingest a GPT-created hero mockup, enhance it with AI, and apply it to the home page.</p>
      </div>

      <div className="grid gap-6 p-4 md:grid-cols-2 md:p-8">
        {/* Left: Ingestion */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <HeroMockupIngestor onEnhanced={onEnhanced} />
        </div>

        {/* Right: Preview + Apply */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <EnhancedHeroPreview html={enhancedHtml} />
          </div>

          {enhancedHtml && (
            <Button
              onClick={applyToHome}
              disabled={applying}
              className="w-full bg-gradient-to-r from-[#00a2ff] to-[#0066cc] text-white hover:opacity-90"
            >
              {applying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Applying to home page...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Apply Enhanced Hero to Home Page</>
              )}
            </Button>
          )}

          {applyMsg && (
            <div className={`rounded-lg border p-3 text-sm ${applyMsg.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
              {applyMsg.text}
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="border-t border-white/10 px-4 py-6 md:px-8">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-white/50" />
          <h2 className="font-heading text-lg font-bold">Mockup History</h2>
        </div>
        {loadingHistory ? (
          <div className="flex items-center gap-2 text-white/40"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
        ) : history.length === 0 ? (
          <p className="text-sm text-white/30">No mockups yet. Ingest one above to get started.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {history.map((h) => (
              <div key={h.id} className={`rounded-xl border p-3 ${h.is_active ? 'border-[#00a2ff] bg-[#00a2ff]/10' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{h.title}</p>
                    <p className="text-xs text-white/40">{new Date(h.created_date).toLocaleString()}</p>
                  </div>
                  {h.is_active && <Star className="h-4 w-4 flex-shrink-0 fill-[#00a2ff] text-[#00a2ff]" />}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    h.status === 'applied' ? 'bg-green-500/20 text-green-400' :
                    h.status === 'enhanced' ? 'bg-blue-500/20 text-blue-400' :
                    h.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-white/10 text-white/50'
                  }`}>{h.status}</span>
                  {h.enhancement_score > 0 && (
                    <span className="text-xs text-white/40">Score: {h.enhancement_score}</span>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => viewHistoryItem(h.id)} className="flex items-center gap-1 text-xs text-[#00a2ff] hover:underline">
                    <Eye className="h-3 w-3" /> View
                  </button>
                  <button onClick={() => deleteItem(h.id)} className="flex items-center gap-1 text-xs text-red-400 hover:underline">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}