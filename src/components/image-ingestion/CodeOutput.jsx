import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Server, Layout, Database, Package } from 'lucide-react';

function CodeBlock({ code, language, filename }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const download = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!code || code.trim() === '') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-stone-400 gap-2">
        <FileCode className="h-8 w-8" />
        <p className="text-sm">No code generated for this section.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 flex gap-1.5 z-10">
        <button
          onClick={copy}
          className="flex items-center gap-1 rounded-lg bg-stone-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-stone-600 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={download}
          className="flex items-center gap-1 rounded-lg bg-stone-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-stone-600 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-stone-900 p-4 pt-12 text-xs leading-relaxed text-stone-200 max-h-[600px] overflow-y-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function CodeOutput({ result }) {
  const [tab, setTab] = useState('frontend');

  if (!result) return null;

  const tabs = [
    { id: 'frontend', label: 'Frontend', icon: Layout, has: !!result.frontend_code },
    { id: 'backend', label: 'Backend', icon: Server, has: !!result.backend_code },
    { id: 'entities', label: 'Entities', icon: Database, has: !!(result.entity_suggestions?.length) },
    { id: 'deps', label: 'Dependencies', icon: Package, has: !!(result.dependencies?.length) },
  ];

  return (
    <div className="space-y-4">
      {/* Analysis summary */}
      <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <FileCode className="h-4 w-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-stone-800">{result.component_name || 'Generated Component'}</h3>
              {result.file_path && (
                <code className="text-xs bg-stone-200 px-2 py-0.5 rounded text-stone-600">{result.file_path}</code>
              )}
              {result.backend_function_name && (
                <code className="text-xs bg-blue-100 px-2 py-0.5 rounded text-blue-700">{result.backend_function_name}/entry.ts</code>
              )}
            </div>
            <p className="text-sm text-stone-600 mt-1.5 whitespace-pre-wrap">{result.analysis}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200">
        {tabs.filter(t => t.has).map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'frontend' && (
        <CodeBlock
          code={result.frontend_code}
          language="jsx"
          filename={`${result.component_name || 'Component'}.jsx`}
        />
      )}
      {tab === 'backend' && (
        <CodeBlock
          code={result.backend_code}
          language="typescript"
          filename="entry.ts"
        />
      )}
      {tab === 'entities' && (
        <div className="space-y-3">
          {result.entity_suggestions?.map((ent, i) => (
            <div key={i} className="rounded-xl border border-stone-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-bold text-stone-800">{ent.name}</h4>
              </div>
              <p className="text-xs text-stone-500 mb-2">{ent.purpose}</p>
              <code className="text-xs bg-stone-100 px-3 py-2 rounded-lg block text-stone-700">{ent.fields}</code>
            </div>
          ))}
        </div>
      )}
      {tab === 'deps' && (
        <div className="rounded-xl border border-stone-200 p-4">
          <p className="text-sm text-stone-600 mb-3">npm packages needed (not already installed):</p>
          <div className="flex flex-wrap gap-2">
            {result.dependencies?.map((dep, i) => (
              <code key={i} className="text-xs bg-stone-100 px-3 py-1.5 rounded-lg text-stone-700">{dep}</code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}