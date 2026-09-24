import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Radar, Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export default function RefactorScanner() {
  const queryClient = useQueryClient();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const scanMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('autonomousRefactorEngine', { action: 'scan' });
      return res.data;
    },
    onSuccess: (data) => {
      setScanResult(data);
      queryClient.invalidateQueries({ queryKey: ['refactorJobs'] });
      queryClient.invalidateQueries({ queryKey: ['refactorStats'] });
    },
    onError: (err) => setError(err.message),
  });

  const fullCycleMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      setProgress('Running read-only checks...');
      const res = await base44.functions.invoke('autonomousRefactorEngine', { action: 'full_cycle' });
      const scan = res.data;
      if (!scan.ok) throw new Error(scan.error || 'Scan failed');
      const processed = [];
      for (const [index, job] of (scan.jobs || []).slice(0, 5).entries()) {
        setProgress(`Reviewing finding ${index + 1} of ${Math.min(scan.jobs.length, 5)}...`);
        try {
          await base44.functions.invoke('autonomousRefactorEngine', { action: 'plan', job_id: job.job_id });
          await base44.functions.invoke('autonomousRefactorEngine', { action: 'execute', job_id: job.job_id });
          const validation = await base44.functions.invoke('autonomousRefactorEngine', { action: 'validate', job_id: job.job_id });
          processed.push({ ...job, validated: validation.data.validation?.passed, score: validation.data.validation?.score });
        } catch (err) {
          processed.push({ ...job, error: err.response?.data?.error || err.message });
        }
        setScanResult({ ...scan, processed });
        queryClient.invalidateQueries({ queryKey: ['refactorJobs'] });
      }
      setProgress('');
      return { ...scan, processed };
    },
    onSuccess: (data) => {
      setScanResult(data);
      queryClient.invalidateQueries({ queryKey: ['refactorJobs'] });
      queryClient.invalidateQueries({ queryKey: ['refactorStats'] });
    },
    onError: (err) => { setProgress(''); setError(err.response?.data?.error || err.message); },
  });

  const isScanning = scanMutation.isPending;
  const isCycling = fullCycleMutation.isPending;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Radar className="h-5 w-5 text-amber-500" />
        <h2 className="font-bold text-stone-900">Phase 1 — System Scan</h2>
      </div>
      <p className="text-sm text-stone-500">
        Checks only backend actions confirmed read-only. Unverified functions are not called. Findings show response failures and latency; AI review does not inspect source code or deploy changes.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => scanMutation.mutate()}
          disabled={isScanning || isCycling}
          className="px-4 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-bold flex items-center gap-2 hover:bg-stone-800 disabled:opacity-50"
        >
          {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          {isScanning ? 'Scanning...' : 'Run Scan Only'}
        </button>
        <button
          onClick={() => fullCycleMutation.mutate()}
          disabled={isScanning || isCycling}
          className="px-4 py-2.5 rounded-lg bg-amber-500 text-stone-950 text-sm font-bold flex items-center gap-2 hover:bg-amber-400 disabled:opacity-50"
        >
          {isCycling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {isCycling ? 'Running Full Cycle...' : 'Run Full Autonomous Cycle'}
        </button>
      </div>

      {progress && <p role="status" className="text-sm text-stone-600">{progress}</p>}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {scanResult && (
        <div className="space-y-3">
          {scanResult.scan_stats && (
            <div className="grid grid-cols-4 gap-3">
              <ScanStat label="Tested" value={scanResult.scan_stats.total_tested} color="text-stone-700" />
              <ScanStat label="OK" value={scanResult.scan_stats.successful} color="text-emerald-600" />
              <ScanStat label="Failed" value={scanResult.scan_stats.failed} color="text-red-600" />
              <ScanStat label="Not checked" value={scanResult.scan_stats.not_tested} color="text-stone-500" />
            </div>
          )}
          {scanResult.scan && (
            <div className="grid grid-cols-4 gap-3">
              <ScanStat label="Tested" value={scanResult.scan.total_tested} color="text-stone-700" />
              <ScanStat label="OK" value={scanResult.scan.successful} color="text-emerald-600" />
              <ScanStat label="Failed" value={scanResult.scan.failed} color="text-red-600" />
              <ScanStat label="Not checked" value={scanResult.scan.not_tested} color="text-stone-500" />
            </div>
          )}
          {scanResult.summary && (
            <div className="p-3 bg-stone-50 rounded-lg text-sm text-stone-700">
              <span className="font-bold">AI Summary: </span>{scanResult.summary}
            </div>
          )}
          {scanResult.processed && scanResult.processed.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold tracking-wide text-stone-500 uppercase">Processed Jobs</h3>
              {scanResult.processed.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-stone-50 rounded-lg text-sm">
                  {p.validated ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : p.error ? (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <span className="font-mono text-xs text-stone-700">{p.target}</span>
                  <span className="text-xs text-stone-500 capitalize">{p.issue}</span>
                  {p.score !== undefined && (
                    <span className="ml-auto text-xs font-bold text-stone-700">Score: {p.score}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScanStat({ label, value, color }) {
  return (
    <div className="bg-stone-50 rounded-lg p-3 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}