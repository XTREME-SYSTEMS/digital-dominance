import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ChainComposer from '@/components/prompt-chain/ChainComposer';
import ChainStageTable from '@/components/prompt-chain/ChainStageTable';
import ChainScoreboard from '@/components/prompt-chain/ChainScoreboard';
import ChainBrief from '@/components/prompt-chain/ChainBrief';
import ChainRecommendations from '@/components/prompt-chain/ChainRecommendations';
import ChainPackets from '@/components/prompt-chain/ChainPackets';
import ChainHistory from '@/components/prompt-chain/ChainHistory';
import { card, heading, muted, body } from '@/components/prompt-chain/chainStyles';

const EMPTY_FORM = { sentence: '', industry: '', target: 'website', auto_implement: true, artefact_html: '' };

/**
 * Prompt Chain Console.
 *
 * One sentence goes in. The chain transforms it into an exhaustive brief,
 * compiles the implementation packets, has the QA agent and the validation
 * agent score the result, ranks what is still weak, and queues the work.
 * The Vercel cron picks up anything left queued, every fifteen minutes.
 */
export default function PromptChainConsole() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [run, setRun] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      const page = await base44.entities.PromptChainRun.filter({}, {
        sort: '-created_date',
        limit: 20,
        fields: ['run_id', 'source_sentence', 'scores', 'verdict', 'status', 'industry', 'target'],
      });
      setHistory(page.items || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load past runs');
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const invoke = async (payload) => {
    setRunning(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('promptChainRunner', payload);
      if (res.data?.error) throw new Error(res.data.error);
      setRun(res.data);
      setSelected([]);
      await loadHistory();
    } catch (runError) {
      setError(runError.message || 'The chain did not finish');
    } finally {
      setRunning(false);
    }
  };

  const base = {
    sentence: form.sentence,
    industry: form.industry,
    target: form.target,
    artefact_html: form.artefact_html || undefined,
  };

  const toggle = id => setSelected(prev => (prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]));

  const reopen = item => {
    setForm(prev => ({ ...prev, sentence: item.source_sentence || '', industry: item.industry || '', target: item.target || 'website' }));
    setRun(null);
    setSelected([]);
  };

  return (
    <div style={{ padding: '18px' }}>
      <header style={{ ...card, background: 'var(--launch-admin-hero-start)', borderColor: 'var(--launch-admin-hero-border)' }}>
        <h1 style={{ ...heading, fontSize: '19px', color: '#ffffff', marginBottom: '6px' }}>Prompt Chain Console</h1>
        <p style={{ ...body, color: 'var(--launch-admin-hero-text)' }}>
          Transform, implement, QA, validate, score, recommend, queue. The transformer turns one sentence into an exhaustive brief;
          the deterministic core turns that brief into hash-stable implementation packets; the QA agent and the validation agent score
          the result and write a receipt per criterion. Nothing passes on a description: a criterion without evidence earns zero.
        </p>
      </header>

      <ChainComposer form={form} setForm={setForm} running={running} onRun={() => invoke({ ...base, auto_implement: form.auto_implement })} />

      {error && (
        <p role="alert" style={{ ...card, borderColor: 'var(--launch-admin-notice-border)', background: 'var(--launch-admin-notice)', color: 'var(--launch-admin-notice-text)', fontWeight: 700 }}>
          {error}
        </p>
      )}

      {run && (
        <>
          <ChainScoreboard run={run} />
          <ChainBrief run={run} />
          <ChainStageTable stages={run.stages} />
          <ChainRecommendations run={run} />
          <ChainPackets
            run={run}
            selected={selected}
            busy={running}
            onToggle={toggle}
            onQueue={() => invoke({ ...base, auto_implement: true, packet_ids: selected })}
            onQueueAll={() => invoke({ ...base, auto_implement: true })}
          />
        </>
      )}

      <ChainHistory runs={history} onLoad={reopen} busy={running} />

      <p style={{ ...muted, paddingBottom: '8px' }}>
        Queueing writes one enhancement job per packet, keyed by run and criterion, so a second run of the same sentence adds nothing.
      </p>
    </div>
  );
}