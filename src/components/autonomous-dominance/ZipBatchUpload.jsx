import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

function readZip(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(`data:application/zip;base64,${String(reader.result).split(',')[1]}`);
    reader.onerror = () => reject(new Error('Could not read ZIP file'));
    reader.readAsDataURL(file);
  });
}

export default function ZipBatchUpload({ onComplete }) {
  const [files, setFiles] = useState([]);
  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const upload = async () => {
    setRunning(true);
    const results = [];
    for (const file of files) {
      let row;
      try {
        if (!/\.zip$/i.test(file.name)) throw new Error('ZIP files only');
        if (file.size > 8 * 1024 * 1024) throw new Error('ZIP must be 8 MB or smaller');
        const file_data = await readZip(file);
        const { data } = await base44.functions.invoke('massIngestionEngine', { action: 'zip_upload', filename: file.name, file_data });
        row = { name: file.name, ok: true, message: data.duplicate ? 'Already imported' : data.template ? `Website template imported · ${data.files} source files` : `Archive imported · ${data.files} source files` };
        onComplete();
      } catch (error) {
        row = { name: file.name, ok: false, message: error.response?.data?.error || error.message };
      }
      results.push(row);
      setRows([...results]);
    }
    setRunning(false);
  };
  return <div className="rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-6 space-y-3">
    <label htmlFor="zip-batch" className="block text-sm font-bold text-stone-900">Batch import ZIP archives and website templates</label>
    <p className="text-xs text-stone-500">Select up to 50 ZIPs, 8 MB each. Website source archives appear here and in the Template Library as drafts; files are stored privately. Nothing is deployed automatically.</p>
    <input id="zip-batch" type="file" accept=".zip,application/zip" multiple disabled={running} onChange={e => { setFiles(Array.from(e.target.files).slice(0, 50)); setRows([]); }} className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:font-semibold" />
    <button type="button" onClick={upload} disabled={running || !files.length} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{running ? `Importing ${rows.length + 1} of ${files.length}…` : `Import ${files.length || ''} ZIP${files.length === 1 ? '' : 's'}`}</button>
    {rows.length > 0 && <ul aria-live="polite" className="space-y-1 text-xs">{rows.map((row, i) => <li key={`${row.name}-${i}`} className={row.ok ? 'text-green-700' : 'text-red-700'}>{row.name}: {row.message}</li>)}</ul>}
    {rows.some(row => row.ok && row.message.includes('template')) && <Link to="/admin/templates" className="inline-block text-sm font-semibold text-amber-700 underline">Open Template Library</Link>}
  </div>;
}