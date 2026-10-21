import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ShieldCheck, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import WorkflowAuditResult from '@/components/template-studio/brand/WorkflowAuditResult';

const STATUS_CLASS = {
  pass: 'text-[#16a34a]',
  fail: 'text-destructive',
  blocked: 'text-amber-600',
};

// Runs the whole brand -> website workflow on a disposable test brand and scores
// it twice: the deterministic validator, then an independent AI QA review.
export default function WorkflowAuditPanel() {
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const loadHistory = async () => {
    try {
      const rows = await base44.entities.PackValidationRun.list('-created_date', 5);
      setHistory(Array.isArray(rows) ? rows : rows?.items || []);
    } catch (e) {
      console.warn('Audit history unavailable:', e.message);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('brandWorkflowValidator', { page_count: 7 });
      setResult(res.data);
      loadHistory();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'The workflow audit could not run');
    } finally {
      setRunning(false);
    }
  };

  const openPage = async (page) => {
    if (!page.template_id) return;
    try {
      const record = await base44.entities.TemplateLibrary.get(page.template_id);
      setPreview({ title: page.title, html: record.content });
    } catch (e) {
      setError(e.message || 'That audit page is no longer stored');
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#00a2ff]" />
        <h3 className="text-sm font-extrabold">Full workflow audit</h3>
        <p className="w-full text-xs text-muted-foreground sm:w-auto">
          Builds a throwaway test brand from scratch — profile, industry discovery, logo concepts, a 7-page site and posed photos — then scores the result.
        </p>
      </header>

      <Button onClick={run} disabled={running} style={{ background: 'linear-gradient(135deg,#126fc8,#0d9488)', color: '#fff' }}>
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {running ? 'Running the whole pipeline and scoring it…' : 'Run full workflow audit'}
      </Button>
      <p className="mt-2 text-[11px] text-muted-foreground">Takes about a minute and uses image and AI credits. Keeps one audit site at a time.</p>

      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      <WorkflowAuditResult result={result} onPreview={openPage} />

      {!!history.length && (
        <div className="mt-4">
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Recent audits</h4>
          <ul className="space-y-1">
            {history.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-xs">
                <span className={`font-extrabold uppercase ${STATUS_CLASS[row.status] || ''}`}>{row.status}</span>
                <span className="font-bold">Validator {row.operational_score ?? '—'}</span>
                <span className="font-bold">QA {row.visual_score ?? '—'}</span>
                <span className="text-muted-foreground">Grade {row.grade || '—'}</span>
                <span className="ml-auto text-muted-foreground">{row.completed_at ? new Date(row.completed_at).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader><DialogTitle>{preview?.title} — audit build</DialogTitle></DialogHeader>
          {preview && (
            <iframe title={preview.title} className="h-[70vh] w-full rounded-lg border border-border" srcDoc={preview.html} sandbox="" referrerPolicy="no-referrer" />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}