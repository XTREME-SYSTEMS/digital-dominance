import React, { useState, useEffect, useMemo } from 'react';
import { Database, Download, Loader2, CheckCircle2, XCircle, FileJson, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ENTITY_NAMES = [
  'ABTest','AdminProfile','AgentAction','AgentAssignment','AgentDepartment','AgentExecutionLog',
  'AgentIntelligence','AgentMemory','AgentPersona','AgentTemplate','AgentVersion','AiVoiceSession',
  'AlphaPrimeAuditLedger','AlphaPrimeHeartbeat','AlphaPrimeReflectionLedger','AnalyticsSnapshot',
  'ApiKey','AppBuild','AppSettings','Appointment','ApprovalRequest','AuditSystemIntegrityScore',
  'AvatarConfig','BacklinkOpportunity','Base44Purchase','BenchmarkCandidate','BenchmarkCompany',
  'BenchmarkDefinition','BenchmarkResult','BrandTemplate','BrokenTwin','BrowserContext',
  'BuildManifest','BuildSession','BuilderLibrary','CanonicalLocationRegistry','CanonicalSiteRegistry',
  'CaptchaSolveLog','ChatMessage','CitationListing','ClientPackage','ClientPortalConfig',
  'ClientProject','CodeBlock','CodeSandboxSession','CommandRun','Comment','CommsEvent',
  'CompetitorInsight','ContentCalendarItem','ContentMenuCategory','ContentMenuItem',
  'ContractorArchetype','ContractorRecord','ControlLease','ConvergenceCycle','Conversation',
  'ConversationMemory','ConversationMessage','CryptoToken','DeploymentRecord','DiscoveryJob',
  'DomainStrategy','DominanceCampaign','DominanceGoal','DynamicPage','EmailLog','EvidenceReceipt',
  'FailurePattern','FaultLineFinding','FleetHeartbeat','FleetSystem','FunnelEvent','GeneratedPage',
  'HeroMockup','HighLeverageCapability','IdeaProvingRecord','IndustryBenchmark','IngestedWebsite',
  'IntelligenceReport','Investigation','LaunchCampaign','Lead','LeadSource','MaintenancePlan',
  'MandatoryBranding','ManusBenchmark','MarketplaceListing','MassLaunchBatch','MetaSession',
  'OperatorIntent','Opportunity','OptimizationGap','PackArtifact','PackGenerationBundle',
  'PackResearchDossier','PackSyncReceipt','PackValidationRun','PortfolioSimulation','PredictionModel',
  'PredictionResult','ProgrammaticSeoJob','ProgrammaticTarget','ProgressLedger','ProjectUpdate',
  'PromoCode','PromptLibrary','PropertyLookup','QuestionnaireResponse','Rating','RefactorJob',
  'Referral','RegressionTest','RepairJob','SelfReflectionCycle','SeoContent','SeoSimulation',
  'SimulatedVisitor','SimulationTracking','SiteBank','SiteValidationReceipt','SkipTrace',
  'SocialPost','SocialSchedule','Sop','SopLog','SpeechTranscript','StrategicReflectionRecord',
  'StrategyDocument','StrategyTournament','SubscriptionPlan','SwarmAudit','SwarmMessage',
  'SwarmTask','SyncEvent','SystemHealthAudit','SystemLibraryEntry','SystemManifest','SystemMode',
  'TemplateDesign','TemplateLibrary','TestRun','Tool','ToolRegistry','UniversalIndustryTemplate',
  'User','UserLLMConnection','UserWorkspace','ValidationReceipt','VaultEntry','VerifiedBusinessFacts',
  'VisionConversation','VisionMessage','VoiceAssistant','WebsiteQueue','WebsiteTemplate',
  'WorkPacket','WorkflowTemplate'
];

function toCSV(records) {
  if (!records || !records.length) return '';
  const keySet = new Set();
  records.forEach(r => { if (r && typeof r === 'object') Object.keys(r).forEach(k => keySet.add(k)); });
  const headers = Array.from(keySet);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return '"' + JSON.stringify(v).replace(/"/g, '""') + '"';
    return '"' + String(v).replace(/"/g, '""') + '"';
  };
  return [headers.map(h => '"' + h + '"').join(','),
    ...records.map(r => headers.map(h => escape(r?.[h])).join(','))
  ].join('\n');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const S = {
  page: { minHeight: '100vh', background: '#0a1220', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif', padding: '24px' },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
  h1: { fontSize: '26px', fontWeight: '800', color: '#fff', margin: 0 },
  sub: { fontSize: '14px', color: '#94a3b8', margin: '4px 0 0' },
  card: { background: '#0f1c2e', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '20px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' },
  statCard: { background: '#0f1c2e', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '16px' },
  statLabel: { fontSize: '12px', color: '#94a3b8', display: 'block' },
  statVal: { fontSize: '22px', fontWeight: '700', color: '#fff', marginTop: '6px', display: 'block' },
  controls: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '16px' },
  btn: { borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: '1px solid #1e3a5f', background: '#162d4a', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  btnPrimary: { borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: '1px solid #126fc8', background: '#126fc8', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  btnDisabled: { borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'not-allowed', border: '1px solid #1e3a5f', background: '#162d4a', color: '#64748b', opacity: 0.6, display: 'inline-flex', alignItems: 'center', gap: '6px' },
  input: { width: '100%', maxWidth: '400px', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0a1220', color: '#e2e8f0', fontSize: '14px', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 14px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', borderBottom: '1px solid #1e3a5f', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '10px 14px', fontSize: '13px', borderBottom: '1px solid #162d4a' },
  errorBanner: { background: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '8px', padding: '14px', marginBottom: '16px', color: '#fecaca', fontSize: '13px' },
  progressBox: { background: '#0f1c2e', border: '1px solid #126fc8', borderRadius: '8px', padding: '14px', marginBottom: '16px', color: '#e2e8f0', fontSize: '13px' },
  backLink: { color: '#60a5fa', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none' }
};

export default function DataDownload() {
  const [counts, setCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [exportLog, setExportLog] = useState([]);
  const [format, setFormat] = useState('json');
  const [search, setSearch] = useState('');
  const [countError, setCountError] = useState('');

  const fetchCounts = async () => {
    setLoadingCounts(true);
    setCountError('');
    try {
      const res = await base44.functions.invoke('dataExport', { mode: 'counts', entities: ENTITY_NAMES });
      setCounts(res.data?.counts || {});
    } catch (e) {
      setCountError(e?.message || String(e));
    }
    setLoadingCounts(false);
  };

  useEffect(() => { fetchCounts(); }, []);

  const filteredEntities = useMemo(() => {
    if (!search) return ENTITY_NAMES;
    const q = search.toLowerCase();
    return ENTITY_NAMES.filter(n => n.toLowerCase().includes(q));
  }, [search]);

  const entitiesWithData = useMemo(() =>
    ENTITY_NAMES.filter(n => typeof counts[n] === 'number' && counts[n] > 0), [counts]);

  const totalRecords = useMemo(() =>
    Object.values(counts).filter(v => typeof v === 'number' && v > 0).reduce((a, b) => a + b, 0), [counts]);

  const toggle = (name) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(name)) next.delete(name); else next.add(name); return next; });
  };

  const selectAll = () => setSelected(new Set(ENTITY_NAMES));
  const selectNone = () => setSelected(new Set());
  const selectWithData = () => setSelected(new Set(entitiesWithData));

  const handleExport = async () => {
    const toExport = Array.from(selected);
    if (!toExport.length) return;
    setExporting(true);
    setExportLog([]);
    setProgress('Fetching records from ' + toExport.length + ' entities...');
    try {
      const res = await base44.functions.invoke('dataExport', { mode: 'export', entities: toExport, maxRecords: 50000 });
      const data = res.data?.data || {};
      const errors = res.data?.errors || {};
      const entityCount = Object.keys(data).length;
      const recordCount = Object.values(data).reduce((a, r) => a + (r?.length || 0), 0);
      setProgress('Packaging ' + recordCount + ' records from ' + entityCount + ' entities...');
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const manifest = { exported_at: new Date().toISOString(), format, entities: {} };
      let totalExported = 0;
      for (const name of toExport) {
        const records = data[name] || [];
        if (records.length === 0 && errors[name]) {
          manifest.entities[name] = { count: 0, error: errors[name] };
          zip.file(name + '.ERROR.txt', errors[name]);
        } else {
          manifest.entities[name] = { count: records.length };
          if (format === 'json') zip.file(name + '.json', JSON.stringify(records, null, 2));
          else zip.file(name + '.csv', toCSV(records));
          totalExported += records.length;
        }
      }
      zip.file('_manifest.json', JSON.stringify(manifest, null, 2));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      downloadBlob(blob, 'unlimited-websites-export-' + ts + '.zip');
      setProgress('Done — ' + totalExported + ' records exported.');
      setExportLog(prev => [...prev, { type: 'success', msg: 'Exported ' + totalExported + ' records from ' + entityCount + ' entities.' }]);
    } catch (e) {
      setProgress('Export failed: ' + e.message);
      setExportLog(prev => [...prev, { type: 'error', msg: e.message }]);
    }
    setExporting(false);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <Database style={{ width: 28, height: 28, color: '#60a5fa' }} />
        <div>
          <h1 style={S.h1}>Data Export Center</h1>
          <p style={S.sub}>Download all entity records as a ZIP archive</p>
        </div>
        <button style={{ ...S.btn, marginLeft: 'auto' }} onClick={() => window.location.href = '/admin'}>← Back to Admin</button>
      </div>

      {countError && (
        <div style={S.errorBanner}>
          <strong>Failed to load counts:</strong> {countError}<br/>
          You can still select entities by name and export.
        </div>
      )}

      <div style={S.statsGrid}>
        <div style={S.statCard}><span style={S.statLabel}>Total Entities</span><span style={S.statVal}>{ENTITY_NAMES.length}</span></div>
        <div style={S.statCard}><span style={S.statLabel}>Entities With Data</span><span style={{ ...S.statVal, color: '#4ade80' }}>{entitiesWithData.length}</span></div>
        <div style={S.statCard}><span style={S.statLabel}>Total Records</span><span style={S.statVal}>{totalRecords.toLocaleString()}</span></div>
        <div style={S.statCard}><span style={S.statLabel}>Selected</span><span style={{ ...S.statVal, color: '#60a5fa' }}>{selected.size}</span></div>
      </div>

      <div style={{ ...S.card, ...S.controls, marginBottom: '16px' }}>
        <button style={S.btn} onClick={selectAll} disabled={exporting}>Select All</button>
        <button style={S.btn} onClick={selectNone} disabled={exporting}>Select None</button>
        <button style={S.btn} onClick={selectWithData} disabled={exporting}>Select With Data ({entitiesWithData.length})</button>
        <button style={S.btn} onClick={fetchCounts} disabled={exporting || loadingCounts}>
          {loadingCounts ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}Refresh
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Format:</span>
          <button style={format === 'json' ? S.btnPrimary : S.btn} onClick={() => setFormat('json')} disabled={exporting}><FileJson size={14} />JSON</button>
          <button style={format === 'csv' ? S.btnPrimary : S.btn} onClick={() => setFormat('csv')} disabled={exporting}><FileSpreadsheet size={14} />CSV</button>
        </div>
        <button style={selected.size === 0 || exporting ? S.btnDisabled : S.btnPrimary} onClick={handleExport} disabled={selected.size === 0 || exporting}>
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {exporting ? 'Exporting...' : 'Download ZIP'}
        </button>
      </div>

      {(exporting || progress) && (
        <div style={S.progressBox}>
          {exporting && <Loader2 size={14} className="animate-spin" style={{ display: 'inline-block', marginRight: '6px' }} />}
          {progress}
          {exportLog.map((log, i) => (
            <div key={i} style={{ marginTop: '6px', color: log.type === 'error' ? '#f87171' : '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {log.type === 'error' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}{log.msg}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <input type="text" placeholder="Search entities..." value={search} onChange={e => setSearch(e.target.value)} style={S.input} />
      </div>

      <div style={S.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '40px' }}>
                  <input type="checkbox" checked={filteredEntities.length > 0 && filteredEntities.every(n => selected.has(n))} onChange={e => { const next = new Set(selected); if (e.target.checked) filteredEntities.forEach(n => next.add(n)); else filteredEntities.forEach(n => next.delete(n)); setSelected(next); }} />
                </th>
                <th style={S.th}>Entity</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Records</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map(name => {
                const c = counts[name];
                const isSelected = selected.has(name);
                return (
                  <tr key={name} style={{ cursor: 'pointer', background: isSelected ? 'rgba(18,111,200,0.15)' : 'transparent' }} onClick={() => !exporting && toggle(name)}>
                    <td style={S.td}><input type="checkbox" checked={isSelected} onChange={() => toggle(name)} disabled={exporting} /></td>
                    <td style={{ ...S.td, fontWeight: '600', color: '#e2e8f0' }}>{name}</td>
                    <td style={{ ...S.td, textAlign: 'right', color: '#e2e8f0' }}>
                      {loadingCounts ? <Loader2 size={12} className="animate-spin" style={{ display: 'inline-block' }} /> :
                       c === -2 ? 'N/A' : c === -1 ? <span style={{ color: '#f87171' }}>Error</span> :
                       typeof c === 'number' ? c.toLocaleString() : '—'}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      {c > 0 ? <span style={{ fontSize: '10px', fontWeight: '600', color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: '4px' }}>Has Data</span> :
                       c === 0 ? <span style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', background: 'rgba(148,163,184,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Empty</span> :
                       c === -1 ? <AlertCircle size={14} style={{ color: '#f87171', display: 'inline-block' }} /> :
                       <span style={{ fontSize: '10px', fontWeight: '600', color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '2px 8px', borderRadius: '4px' }}>Special</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ marginTop: '12px', fontSize: '11px', color: '#64748b' }}>
        Each entity exports up to 50,000 records. User entity limited to 500. Large exports may take several minutes.
      </p>
    </div>
  );
}