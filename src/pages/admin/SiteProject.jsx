import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MapPin, ExternalLink, CheckCircle2, AlertCircle, Loader2, ArrowLeft, FileText, Shield, Globe } from 'lucide-react';

export default function SiteProject() {
  const { id } = useParams();
  const [site, setSite] = useState(null);
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try DeploymentRecord first, then WebsiteQueue
      let record = null;
      try {
        record = await base44.entities.DeploymentRecord.get(id);
      } catch (e) {
        try {
          record = await base44.entities.WebsiteQueue.get(id);
        } catch (e2) {
          record = null;
        }
      }
      setSite(record);

      // Load validation receipts
      try {
        const receipts = await base44.entities.SiteValidationReceipt.filter({ site_id: id }, { sort: '-validated_at', limit: 10 });
        setValidations(receipts.items || []);
      } catch (e) { /* entity may not exist */ }
    } catch (e) { /* noop */ }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const runValidation = async () => {
    if (!site?.url && !site?.deployment_url) return;
    setValidating(true);
    try {
      await base44.functions.invoke('headlessSiteValidator', {
        url: site.url || site.deployment_url,
        site_id: id,
      });
      await load();
    } catch (e) { /* noop */ }
    setValidating(false);
  };

  if (loading) return <div className="min-h-screen bg-[#050508] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white/40" /></div>;
  if (!site) return (
    <div className="min-h-screen bg-[#050508] p-6">
      <div className="mx-auto max-w-3xl">
        <Link to="/admin" className="flex items-center gap-2 text-sm text-white/60 hover:text-white mb-4"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>
        <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-white/60">Site not found.</p>
        </div>
      </div>
    </div>
  );

  const siteUrl = site.url || site.deployment_url || site.domain || '';
  const location = site.location || site.city || site.target_location || '';
  const variations = site.variations || site.compliance_changes || site.variables_changed || [];
  const status = site.status || site.deployment_status || 'unknown';

  return (
    <div className="min-h-screen bg-[#050508] p-4 md:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <Link to="/admin" className="flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>

        {/* Site Header */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a1220] to-[#0d1a2e] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white mb-1">{site.name || site.title || 'Site Project'}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {location && (
                  <span className="flex items-center gap-1.5 text-white/60"><MapPin className="h-4 w-4 text-[#00a2ff]" /> {location}</span>
                )}
                <span className={`flex items-center gap-1.5 ${status === 'deployed' || status === 'live' || status === 'active' ? 'text-green-400' : 'text-amber-400'}`}>
                  {status === 'deployed' || status === 'live' || status === 'active' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {status}
                </span>
              </div>
            </div>
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[#00a2ff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0090e0] transition">
                <ExternalLink className="h-4 w-4" /> Visit Site
              </a>
            )}
          </div>
        </div>

        {/* Location & Variations */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-5 w-5 text-[#00a2ff]" />
              <h3 className="text-sm font-bold text-white">Location & Targeting</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-white/40">Location:</span><span className="font-semibold text-white">{location || 'Not specified'}</span></div>
              <div className="flex justify-between"><span className="text-white/40">URL:</span><span className="font-semibold text-white truncate ml-2">{siteUrl || 'Not deployed'}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Template:</span><span className="font-semibold text-white">{site.template_name || site.template_key || '—'}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-[#00a2ff]" />
              <h3 className="text-sm font-bold text-white">Compliance Variations</h3>
            </div>
            {Array.isArray(variations) && variations.length > 0 ? (
              <div className="space-y-2">
                {variations.map((v, i) => (
                  <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-2.5 text-xs text-white/70">
                    {typeof v === 'string' ? v : v.field ? `${v.field}: ${v.value}` : JSON.stringify(v)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40">No compliance variations recorded.</p>
            )}
          </div>
        </div>

        {/* Validation Status */}
        <div className="rounded-2xl border border-white/10 bg-[#0a1220] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              <h3 className="text-sm font-bold text-white">Validation Status</h3>
            </div>
            <button onClick={runValidation} disabled={validating || !siteUrl}
              className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-50">
              {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />} Run Validation
            </button>
          </div>
          {validations.length === 0 ? (
            <p className="text-xs text-white/40">No validation runs yet. Click "Run Validation" to verify this site is live and functional.</p>
          ) : (
            <div className="space-y-2">
              {validations.map((v, i) => (
                <div key={v.id || i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${v.status === 'passed' ? 'text-green-400' : v.status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>
                      {v.status === 'passed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      {v.status?.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-white/40">{v.validated_at ? new Date(v.validated_at).toLocaleString() : ''}</span>
                  </div>
                  <p className="text-xs text-white/60">{v.summary || ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Site Link */}
        {siteUrl && (
          <div className="rounded-2xl border border-green-400/20 bg-green-500/5 p-5 text-center">
            <a href={siteUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-green-400 hover:text-green-300">
              <ExternalLink className="h-4 w-4" /> Click here to check the live site: {siteUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}