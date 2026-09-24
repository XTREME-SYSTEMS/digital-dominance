import React from 'react';

export default function ScanEvidence({ data }) {
  if (!data?.independent) return null;
  return (
    <div className="space-y-2 mb-3 text-xs text-muted-foreground">
      <p>{data.provider} · {data.sources?.length || 0} sources · {data.searched_at ? new Date(data.searched_at).toLocaleString() : ''}</p>
      <p>{data.coverage}</p>
      {data.search_suggestions_html && (
        <iframe title="Google Search suggestions" srcDoc={data.search_suggestions_html} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" className="w-full h-40 border-0 rounded-lg bg-background" />
      )}
    </div>
  );
}