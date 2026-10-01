import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, Loader2, AlertCircle, RefreshCw, ChevronDown, ChevronRight, ExternalLink, Server, Shield } from 'lucide-react';

export default function GoDaddyDomainManager() {
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState([]);
  const [error, setError] = useState(null);
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [dnsRecords, setDnsRecords] = useState({});
  const [loadingDns, setLoadingDns] = useState(null);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('godaddyApi', { action: 'listDomains' });
      const list = res.data?.result || [];
      list.sort((a, b) => new Date(a.expires) - new Date(b.expires));
      setDomains(list);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadDomains(); }, []);

  const toggleDns = async (domain) => {
    if (expandedDomain === domain) {
      setExpandedDomain(null);
      return;
    }
    setExpandedDomain(domain);
    if (!dnsRecords[domain]) {
      setLoadingDns(domain);
      try {
        const res = await base44.functions.invoke('godaddyApi', { action: 'getDnsRecords', domain });
        setDnsRecords(prev => ({ ...prev, [domain]: res.data?.result || [] }));
      } catch {
        setDnsRecords(prev => ({ ...prev, [domain]: [] }));
      }
      setLoadingDns(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-red-700 font-semibold">Failed to load GoDaddy domains</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const expiringSoon = domains.filter(d => {
    const days = (new Date(d.expires) - now) / (1000 * 60 * 60 * 24);
    return days < 30;
  });
  const active = domains.filter(d => d.status === 'ACTIVE');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
          <p className="text-2xl font-black text-stone-900">{domains.length}</p>
          <p className="text-xs text-stone-400 uppercase tracking-wide">Total</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
          <p className="text-2xl font-black text-green-600">{active.length}</p>
          <p className="text-xs text-stone-400 uppercase tracking-wide">Active</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-3 text-center">
          <p className="text-2xl font-black text-amber-600">{expiringSoon.length}</p>
          <p className="text-xs text-stone-400 uppercase tracking-wide">Expiring &lt;30d</p>
        </div>
      </div>

      {/* Domain table */}
      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
            <Globe className="h-4 w-4 text-purple-600" />
            All GoDaddy Domains
          </h3>
          <button
            onClick={loadDomains}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-amber-600 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
        <div className="divide-y divide-stone-100 max-h-[500px] overflow-y-auto">
          {domains.map((d, i) => {
            const expanded = expandedDomain === d.domain;
            const daysToExpiry = Math.round((new Date(d.expires) - now) / (1000 * 60 * 60 * 24));
            const expiring = daysToExpiry < 30;
            return (
              <div key={i}>
                <button
                  onClick={() => toggleDns(d.domain)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition"
                >
                  {expanded ? <ChevronDown className="h-4 w-4 text-stone-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-stone-400 shrink-0" />}
                  <span className="font-mono text-sm font-semibold text-stone-800 flex-1 truncate">{d.domain}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    d.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {d.status}
                  </span>
                  {d.renewAuto && <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                  <span className={`text-xs ${expiring ? 'text-amber-600 font-bold' : 'text-stone-400'} hidden sm:inline`}>
                    {daysToExpiry}d
                  </span>
                </button>
                {expanded && (
                  <div className="px-4 pb-4 bg-stone-50/50 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-stone-400">Expires:</span>{' '}
                        <span className="font-semibold text-stone-700">{new Date(d.expires).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-stone-400">Auto-renew:</span>{' '}
                        <span className={`font-semibold ${d.renewAuto ? 'text-green-600' : 'text-red-500'}`}>
                          {d.renewAuto ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400">Privacy:</span>{' '}
                        <span className={`font-semibold ${d.privacy ? 'text-green-600' : 'text-stone-500'}`}>
                          {d.privacy ? 'On' : 'Off'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400">Nameservers:</span>{' '}
                        <span className="font-mono text-stone-600">{d.nameServers?.length || 0} NS</span>
                      </div>
                    </div>
                    {/* DNS Records */}
                    <div>
                      <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Server className="h-3.5 w-3.5" /> DNS Records
                      </p>
                      {loadingDns === d.domain ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                          <span className="text-xs text-stone-400">Loading DNS records...</span>
                        </div>
                      ) : (dnsRecords[d.domain] || []).length > 0 ? (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {(dnsRecords[d.domain] || []).map((r, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs font-mono bg-white border border-stone-200 rounded px-2 py-1">
                              <span className="font-bold text-blue-600 w-12">{r.type}</span>
                              <span className="text-stone-500 w-24 truncate">{r.name}</span>
                              <span className="text-stone-700 flex-1 truncate">{r.data}</span>
                              <span className="text-stone-400">{r.ttl}s</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400 py-2">No DNS records found</p>
                      )}
                    </div>
                    <a
                      href={`https://dcc.godaddy.com/manage/${d.domain}/dns`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Manage in GoDaddy
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}