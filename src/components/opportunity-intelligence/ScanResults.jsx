import React from 'react';
import { Loader2, ExternalLink, TrendingUp, AlertCircle } from 'lucide-react';
import SaveButton from './SaveButton';
import ScanEvidence from '@/components/opportunity-intelligence/ScanEvidence';

function ScoreBadge({ score }) {
  if (!score && score !== 0) return null;
  const color = score >= 8 ? 'bg-green-100 text-green-700' : score >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600';
  return (
    <span
      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${color}`}
      title="AI hypothesis only. V3 decision score is calculated after evidence is saved and classified."
    >
      AI hypothesis {score}/10
    </span>
  );
}

function FindingCard({ finding, scannerKey, scannerLabel, searchedAt }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-300 transition">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-bold text-stone-900 flex-1">{finding.title}</h4>
        <div className="flex items-center gap-2 shrink-0">
          <SaveButton finding={finding} scannerKey={scannerKey} scannerLabel={scannerLabel} searchedAt={searchedAt} />
          <ScoreBadge score={finding.score} />
        </div>
      </div>
      {finding.description && (
        <p className="text-xs text-stone-600 mb-2">{finding.description}</p>
      )}
      {finding.problem && (
        <div className="mb-2">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Problem</span>
          <p className="text-xs text-stone-600 mt-0.5">{finding.problem}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {finding.buyer && (
          <div><span className="font-bold text-stone-500">Buyer:</span> <span className="text-stone-700">{finding.buyer}</span></div>
        )}
        {finding.app_idea && (
          <div><span className="font-bold text-stone-500">App:</span> <span className="text-stone-700">{finding.app_idea}</span></div>
        )}
        {finding.monetization && (
          <div><span className="font-bold text-stone-500">Monetization:</span> <span className="text-stone-700">{finding.monetization}</span></div>
        )}
        {finding.evidence && (
          <div><span className="font-bold text-stone-500">Evidence:</span> <span className="text-stone-700">{finding.evidence}</span></div>
        )}
        {finding.saturation_level && (
          <div><span className="font-bold text-stone-500">Saturation:</span> <span className="text-stone-700">{finding.saturation_level}</span></div>
        )}
        {finding.location && (
          <div><span className="font-bold text-stone-500">Location:</span> <span className="text-stone-700">{finding.location}</span></div>
        )}
        {finding.event_date && (
          <div><span className="font-bold text-stone-500">Date:</span> <span className="text-stone-700">{finding.event_date}</span></div>
        )}
        {finding.repo_url && (
          <div><span className="font-bold text-stone-500">Repo:</span> <a href={finding.repo_url} target="_blank" rel="noopener" className="text-blue-500 hover:underline flex items-center gap-1">{finding.repo_url} <ExternalLink className="h-3 w-3" /></a></div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 mt-2">
        {(finding.citations || (finding.url ? [{ url: finding.url, title: 'Source' }] : [])).map(source => (
          <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <ExternalLink className="h-3 w-3" /> {source.title}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function ScanResults({ results, loading, activeScan, fullScanProgress }) {
  if (loading && !results) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm text-stone-500">Scanning the web for live data...</p>
      </div>
    );
  }

  if (!results) return null;

  // Full scan results
  if (results.results) {
    return (
      <div className="space-y-6">
        {results.stoppedReason && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{results.stoppedReason}</p>}
        {Object.entries(results.results).map(([key, data]) => {
          if (!data) return null;
          const scanner = fullScanProgress?.find((s) => s.key === key);
          const label = scanner?.label || key;
          return (
            <div key={key} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                {scanner?.icon && <scanner.icon className="h-5 w-5 text-amber-600" />}
                <h3 className="text-sm font-black text-stone-900">{label}</h3>
                <span className="text-xs text-stone-400 ml-auto">{data.error ? 'Unavailable' : `${data.findings?.length || 0} findings`}</span>
              </div>
              {data.error ? (
                <div className="flex items-center gap-2 text-xs text-red-500">
                  <AlertCircle className="h-4 w-4" /> {data.error}
                </div>
              ) : (
                <>
                  <ScanEvidence data={data} />
                  {data.summary && <p className="text-xs text-stone-500 mb-3">{data.summary}</p>}
                  {!data.findings?.length && <p className="text-xs text-muted-foreground">No source-backed findings met this scanner’s criteria.</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(data.findings || []).map((f, i) => (
                      <FindingCard key={i} finding={f} scannerKey={key} scannerLabel={label} searchedAt={data.searched_at} />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Single scan results
  const findings = results.findings || [];
  return (
    <div className="space-y-4">
      <ScanEvidence data={results} />
      {results.summary && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-2">
          <TrendingUp className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{results.summary}</p>
        </div>
      )}
      {results.error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" /> {results.error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {findings.map((f, i) => (
          <FindingCard key={i} finding={f} scannerKey={activeScan} scannerLabel={activeScan} searchedAt={results.searched_at} />
        ))}
      </div>
      {findings.length === 0 && !results.error && (
        <p className="text-center text-sm text-stone-400 py-8">No source-backed findings met this scanner’s criteria. Try another scan.</p>
      )}
    </div>
  );
}