import React, { useState, useEffect } from 'react';
import { HardDrive, Loader2, CheckCircle2, AlertCircle, RefreshCw, FolderOpen, FileJson, FileSpreadsheet } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DriveBackup() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.functions.invoke('driveSystemBackup', { action: 'status' })
      .then((res) => setStatus(res.data))
      .catch((err) => setError(err.message))
      .finally(() => {});
  }, []);

  const runBackup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('driveSystemBackup', { action: 'backup' });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3">
            <HardDrive className="h-7 w-7 text-amber-600" />
            Google Drive Backup
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Daily export of every entity to Google Drive as JSON (machine-readable) + CSV (human-readable).
          </p>
        </div>
        <button
          onClick={runBackup}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? 'Backing up...' : 'Run Backup Now'}
        </button>
      </div>

      {/* Status card */}
      {status && (
        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-bold text-stone-700 mb-3">Backup Configuration</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide">Entities</p>
              <p className="text-lg font-bold text-stone-900">{status.entityCount}</p>
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

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-900">Backup failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h2 className="text-sm font-bold text-stone-700">Backup Complete</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Records</p>
                <p className="text-lg font-bold text-stone-900">{result.totalRecords?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Files</p>
                <p className="text-lg font-bold text-stone-900">{result.totalFiles}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Errors</p>
                <p className={`text-lg font-bold ${result.errors > 0 ? 'text-amber-600' : 'text-green-600'}`}>{result.errors}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Folder</p>
                <p className="text-sm font-semibold text-stone-900 truncate">{result.backupFolder}</p>
              </div>
            </div>
          </div>

          {/* Entity results */}
          {result.results?.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <h3 className="text-sm font-bold text-stone-700 mb-3">Entities Backed Up ({result.results.length})</h3>
              <div className="max-h-96 overflow-y-auto space-y-1">
                {result.results.map((r, i) => (
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

          {/* Errors */}
          {result.errorDetails?.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900 mb-2">Errors ({result.errorDetails.length})</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.errorDetails.map((e, i) => (
                  <p key={i} className="text-xs text-amber-700 font-mono">{e}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && !result && (
        <div className="rounded-xl border border-stone-200 bg-white p-12 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
          <p className="text-sm text-stone-500">Reading all entities and uploading to Drive...</p>
          <p className="text-xs text-stone-400">This may take a few minutes for large datasets.</p>
        </div>
      )}
    </div>
  );
}