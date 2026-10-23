import React from 'react';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';

const STATUS = {
  pass: { label: 'PASS', className: 'bg-[#16a34a]/10 text-[#16a34a]' },
  fail: { label: 'FAIL', className: 'bg-destructive/10 text-destructive' },
  blocked: { label: 'BLOCKED', className: 'bg-amber-500/15 text-amber-600' },
};

function ScoreTile({ title, scorer, score, note }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-extrabold">{score}<span className="text-sm font-bold text-muted-foreground">/100</span></p>
      <p className="text-[11px] text-muted-foreground">{scorer}</p>
      {note && <p className="mt-1 text-xs">{note}</p>}
    </div>
  );
}

// Everything one audit run produced: both scores, the pipeline stages, the scored
// criteria and the QA reviewer's findings.
export default function WorkflowAuditResult({ result, onPreview }) {
  if (!result) return null;
  const status = STATUS[result.status] || STATUS.fail;
  const checks = result.validator?.checks || [];

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${status.className}`}>{status.label}</span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold">Grade {result.validator?.grade}</span>
        <p className="text-xs text-muted-foreground">{result.verdict}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ScoreTile title="Validator score" scorer="Deterministic rule set, 14 criteria" score={result.validator?.score ?? 0} />
        <ScoreTile title="QA reviewer score" scorer="Independent AI review of the built pages" score={result.qa?.score ?? 0} note={result.qa?.verdict} />
      </div>

      <div>
        <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Pipeline stages</h4>
        <ul className="space-y-1">
          {(result.stages || []).map((stage) => (
            <li key={stage.name} className="flex items-start gap-2 text-xs">
              {stage.status === 'pass'
                ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#16a34a]" />
                : <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive" />}
              <span className="font-bold">{stage.name}</span>
              <span className="text-muted-foreground">{stage.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Scored criteria</h4>
        <ul className="space-y-1.5">
          {checks.map((check) => (
            <li key={check.key} className="rounded-lg border border-border p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold">
                  {check.label}
                  {check.critical && <span className="ml-1.5 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">critical</span>}
                </span>
                <span className={`text-xs font-extrabold ${check.earned === check.points ? 'text-[#16a34a]' : 'text-destructive'}`}>
                  {check.earned}/{check.points}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full" style={{ width: `${Math.round((check.ratio || 0) * 100)}%`, background: check.earned === check.points ? '#16a34a' : '#dc2626' }} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{check.evidence}</p>
            </li>
          ))}
        </ul>
      </div>

      {!!(result.qa?.pages || []).length && (
        <div>
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">QA reviewer, page by page</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.qa.pages.map((page) => (
              <div key={page.key} className="rounded-lg border border-border p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{page.key}</span>
                  <span className={`font-extrabold ${page.score >= 85 ? 'text-[#16a34a]' : 'text-destructive'}`}>{page.score}/100</span>
                </div>
                {page.strengths && <p className="mt-1 text-muted-foreground">+ {page.strengths}</p>}
                {page.weaknesses && <p className="mt-1 text-muted-foreground">− {page.weaknesses}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!!(result.qa?.critical_issues || []).length && (
        <div>
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">QA critical issues</h4>
          <ul className="space-y-1 text-xs">
            {result.qa.critical_issues.map((issue, index) => (
              <li key={index} className="flex gap-2"><XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive" /><span>{issue}</span></li>
            ))}
          </ul>
        </div>
      )}

      {!!(result.qa?.improvements || []).length && (
        <div>
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">QA reviewer improvements</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {result.qa.improvements.map((item, index) => <li key={index}>• {item}</li>)}
          </ul>
        </div>
      )}

      {!!(result.pages || []).length && (
        <div>
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Pages the audit built</h4>
          <div className="flex flex-wrap gap-1.5">
            {result.pages.map((page) => (
              <button
                key={page.key}
                onClick={() => onPreview?.(page)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs font-bold hover:border-[#00a2ff]"
              >
                <Eye className="h-3 w-3" /> {page.title}
                <span className="font-normal text-muted-foreground">{page.words} words</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}