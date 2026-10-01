import React, { useState, useEffect } from 'react';
import { HardDrive, Loader2, CheckCircle2, AlertCircle, RefreshCw, FileJson, FileSpreadsheet } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TOTAL_BATCHES = 4;

export default function DriveBackup() {
  const [loading, setLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.functions.invoke('driveSystemBackup', { action: 'status' })
      .then((res) => setStatus(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const runBackup = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setBatchProgress(0);

    let allResults = [];
    let totalRecords = 0;
    let totalFiles = 0;
    let totalErrors = 0;
    let allErrorDetails = [];
    let backupFolder = '';

    for (let i = 0; i < TOTAL_BATCHES; i++) {
      setBatchProgress(i);
      try {
        const res = await base44.functions.invoke('driveSystemBackup', {
          action: 'backup',
          batchIndex: i,
          totalBatches: TOTAL_BATCHES,
        });
        const data = res.data;
        backupFolder = data.backupFolder || backupFolder;
        totalRecords += data.totalRecords || 0;
        totalFiles += data.totalFiles || 0;
        totalErrors += data.errors || 0;
        if (data.errorDetails) allErrorDetails.push(...data.errorDetails);
        if (data.results) allResults.push(...data.results);
        setResults([...allResults]);
      } catch (err) {
        setError(`Batch ${i + 1} failed: ${err.response?.data?.error || err.message}`);
        break;
      }
    }

    setBatchProgress(TOTAL_BATCHES);
    setLoading(false);
    // Store summary on last result for the summary card
    if (allResults.length > 0) {
      allResults._summary = { backupFolder, totalRecords, totalFiles, totalErrors, errorDetails: allErrorDetails };
    }
    setResults([...allResults]);
  };

  const summary = results._summary;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3">
            <HardDrive className="h-7 w-7 text-amber-600" />
            Google Drive Backup
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Daily export of all {status?.entityCount || 118} entities to Google Drive as JSON + CSV.
          </p>
        </div>
        <button
          onClick={runBackup}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? `Batch ${batchProgress + 1}/${TOTAL_BATCHES}...` : 'Run Backup Now'}
        </button>
      </div>

      {status && (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-bold text-stone-700 mb-3">Backup Configuration</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide">Entities</p>
              <p className="text-lg font-bold text-stone-900">{status.entityCount}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide">Batches</p>
              <p className="text-lg font-bold text-stone-900">{status.batches}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide">Drive Folder</p>
              <p className="text-sm font-semibold text-stone-900 truncate">{status.rootFolderName}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide">Schedule</p>
              <p className="text-sm font-semibold text-stone-900">{status.schedule}</p>
            </div>
          </div>
        </div>
      )}

      {/* Batch progress */}
      {loading && (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
            <p className="text-sm font-semibold text-stone-700">
              Processing batch {batchProgress + 1} of {TOTAL_BATCHES}...
            </p>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_BATCHES }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < batchProgress ? 'bg-green-500' : i === batchProgress ? 'bg-amber-500' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-900">Backup error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && !loading && (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-sm font-bold text-stone-700">Backup Complete</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide">Records</p>
              <p className="text-lg font-bold text-stone-900">{summary.totalRecords?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide">Files</p>
              <p className="text-lg font-bold text-stone-900">{summary.totalFiles}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide">Errors</p>
              <p className={`text-lg font-bold ${summary.totalErrors > 0 ? 'text-amber-600' : 'text-green-600'}`}>{summary.totalErrors}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide">Folder</p>
              <p className="text-sm font-semibold text-stone-900 truncate">{summary.backupFolder}</p>
            </div>
          </div>
        </div>
      )}

      {/* Entity results */}
      {results.filter((r) => !r._summary).length > 0 && !loading && (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="text-sm font-bold text-stone-700 mb-3">
            Entities Backed Up ({results.filter((r) => !r._summary && (r.records > 0 || r.error)).length})
          </h3>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {results.filter((r) => !r._summary && (r.records > 0 || r.error)).map((r, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-stone-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-stone-700 truncate">{r.entity}</span>
                  {r.error && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-stone-400">{r.records} records</span>
                  {r.jsonId && <FileJson className="h-3.5 w-3.5 text-blue-500" />}
                  {r.csvId && <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />}
                  {r.error && <span className="text-xs text-red-500 truncate max-w-48">{r.error}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error details */}
      {summary?.errorDetails?.length > 0 && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900 mb-2">Errors ({summary.errorDetails.length})</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {summary.errorDetails.map((e, i) => (
              <p key={i} className="text-xs text-amber-700 font-mono">{e}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}