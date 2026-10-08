import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bookmark, CheckCircle2, Loader2 } from 'lucide-react';

export default function SaveButton({ finding, scannerKey, scannerLabel, searchedAt }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      const res = await base44.functions.invoke('saveOpportunityV3', {
        finding,
        scanner_source: scannerKey || 'unknown',
        scanner_label: scannerLabel || scannerKey || '',
        searched_at: searchedAt || new Date().toISOString(),
      });
      if (res?.data?.error) throw new Error(res.data.error);
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['savedOpportunities'] });
    } catch (e) {
      setError(e?.message || 'Save failed');
    }
    setSaving(false);
  }, [finding, scannerKey, scannerLabel, searchedAt, queryClient]);

  if (saved) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600" title="Saved as a hypothesis until evidence scoring validates it">
        <CheckCircle2 className="h-3.5 w-3.5" /> Saved
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bookmark className="h-3.5 w-3.5" />}
        Save
      </button>
      {error && <span className="text-[10px] text-red-600 max-w-44 text-right">{error}</span>}
    </div>
  );
}
