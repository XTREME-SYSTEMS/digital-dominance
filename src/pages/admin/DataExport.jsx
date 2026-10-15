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

export default function DataExport() {
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
    ENTITY_NAMES.filter(n => typeof counts[n] === 'number' && counts[n] > 0),
  [counts]);

  const totalRecords = useMemo(() =>
    Object.values(counts).filter(v => typeof v === 'number' && v > 0).reduce((a, b) => a + b, 0),
  [counts]);

  const toggle = (name) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
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
      const res = await base44.functions.invoke('dataExport', {
        mode: 'export',
        entities: toExport,
        maxRecords: 50000
      });
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
          if (format === 'json') {
            zip.file(name + '.json', JSON.stringify(records, null, 2));
          } else {
            zip.file(name + '.csv', toCSV(records));
          }
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

  // Styles — hardcoded fallbacks ensure visibility even if CSS variables aren't set
  const canvas = { background: '#f4f8fd', minHeight: '100vh', padding: '32px' };
  const cardStyle = { background: '#ffffff', border: '1px solid #dce6f1', borderRadius: '13px', padding: '20px' };
  const btn = { borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: '1px solid var(--launch-admin-border, #dce6f1)', background: 'var(--launch-admin-surface, #fff)', color: 'var(--launch-admin-text, #112940)', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' };
  const btnPrimary = { ...btn, background: 'var(--launch-admin-primary, #126fc8)', color: '#fff', borderColor: 'var(--launch-admin-primary, #126fc8)' };
  const btnDisabled = { ...btn, opacity: 0.5, cursor: 'not-allowed' };

  return (
    <div className="wle-content" style={canvas}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Database style={{ width: 28, height: 28, color: '#126fc8' }} />
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#06213b', margin: 0, letterSpacing: '-0.03em' }}>
            Data Export Center
          </h1>
          <p style={{ fontSize: '15px', color: '#5b7288', margin: '4px 0 0' }}>
            Download all entity records as a ZIP archive for external system integration
          </p>
        </div>
      </div>

      {/* Error banner */}
      {countError && (
        <div style={{ ...cardStyle, marginBottom: '24px', borderColor: '#fecaca', background: '#fef2f2' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> Failed to load counts: {countError}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#991b1b' }}>
            You can still select entities by name and export. Counts will show as "—" until the connection is restored.
          </p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={cardStyle}>
          <small style={{ fontSize: '13px', color: 'var(--launch-admin-muted, #5b7288)' }}>Total Entities</small>
          <strong style={{ display: 'block', fontSize: '24px', fontWeight: '700', color: 'var(--launch-admin-stat-text, #06355f)', marginTop: '8px' }}>{ENTITY_NAMES.length}</strong>
        </div>
        <div style={cardStyle}>
          <small style={{ fontSize: '13px', color: 'var(--launch-admin-muted, #5b7288)' }}>Entities With Data</small>
          <strong style={{ display: 'block', fontSize: '24px', fontWeight: '700', color: '#059669', marginTop: '8px' }}>{entitiesWithData.length}</strong>
        </div>
        <div style={cardStyle}>
          <small style={{ fontSize: '13px', color: 'var(--launch-admin-muted, #5b7288)' }}>Total Records</small>
          <strong style={{ display: 'block', fontSize: '24px', fontWeight: '700', color: 'var(--launch-admin-stat-text, #06355f)', marginTop: '8px' }}>{totalRecords.toLocaleString()}</strong>
        </div>
        <div style={cardStyle}>
          <small style={{ fontSize: '13px', color: 'var(--launch-admin-muted, #5b7288)' }}>Selected</small>
          <strong style={{ display: 'block', fontSize: '24px', fontWeight: '700', color: 'var(--launch-admin-primary, #126fc8)', marginTop: '8px' }}>{selected.size}</strong>
        </div>
      </div>

      {/* Controls */}
      <div style={{ ...cardStyle, marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <button style={btn} onClick={selectAll} disabled={exporting}>Select All</button>
        <button style={btn} onClick={selectNone} disabled={exporting}>Select None</button>
        <button style={btn} onClick={selectWithData} disabled={exporting}>Select With Data ({entitiesWithData.length})</button>
        <button style={btn} onClick={fetchCounts} disabled={exporting || loadingCounts}>
          {loadingCounts ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh Counts
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '13px', color: 'var(--launch-admin-muted, #5b7288)' }}>Format:</span>
          <button style={format === 'json' ? btnPrimary : btn} onClick={() => setFormat('json')} disabled={exporting}>
            <FileJson size={14} /> JSON
          </button>
          <button style={format === 'csv' ? btnPrimary : btn} onClick={() => setFormat('csv')} disabled={exporting}>
            <FileSpreadsheet size={14} /> CSV
          </button>
        </div>
        <button
          style={selected.size === 0 || exporting ? btnDisabled : btnPrimary}
          onClick={handleExport}
          disabled={selected.size === 0 || exporting}
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {exporting ? 'Exporting...' : 'Download ZIP'}
        </button>
      </div>

      {/* Progress */}
      {(exporting || progress) && (
        <div style={{ ...cardStyle, marginBottom: '24px', borderColor: 'var(--launch-admin-primary, #126fc8)' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--launch-admin-text, #112940)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {exporting && <Loader2 size={16} className="animate-spin" style={{ color: 'var(--launch-admin-primary, #126fc8)' }} />}
            {progress}
          </p>
          {exportLog.map((log, i) => (
            <p key={i} style={{ margin: '6px 0 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
              color: log.type === 'error' ? '#dc2626' : '#059669' }}>
              {log.type === 'error' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
              {log.msg}
            </p>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search entities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', maxWidth: '400px', height: '40px', padding: '0 14px',
            borderRadius: '8px', border: '1px solid var(--launch-admin-border, #dce6f1)',
            background: 'var(--launch-admin-surface, #fff)', fontSize: '14px',
            color: 'var(--launch-admin-text, #112940)', outline: 'none'
          }}
        />
      </div>

      {/* Entity Table */}
      <div style={cardStyle}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--launch-admin-muted, #5b7288)', borderBottom: '1px solid var(--launch-admin-border, #dce6f1)', textTransform: 'uppercase', letterSpacing: '0.05em', width: '40px' }}>
                  <input type="checkbox" checked={filteredEntities.length > 0 && filteredEntities.every(n => selected.has(n))} onChange={e => { const next = new Set(selected); if (e.target.checked) filteredEntities.forEach(n => next.add(n)); else filteredEntities.forEach(n => next.delete(n)); setSelected(next); }} />
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--launch-admin-muted, #5b7288)', borderBottom: '1px solid var(--launch-admin-border, #dce6f1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entity</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--launch-admin-muted, #5b7288)', borderBottom: '1px solid var(--launch-admin-border, #dce6f1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Records</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'var(--launch-admin-muted, #5b7288)', borderBottom: '1px solid var(--launch-admin-border, #dce6f1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntities.map(name => {
                const c = counts[name];
                const isSelected = selected.has(name);
                return (
                  <tr key={name} style={{ cursor: 'pointer', background: isSelected ? 'rgba(18,111,200,0.05)' : 'transparent' }}
                    onClick={() => !exporting && toggle(name)}>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--launch-admin-task-border, #e4edf5)' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggle(name)} disabled={exporting} />
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: 'var(--launch-admin-text, #112940)', borderBottom: '1px solid var(--launch-admin-task-border, #e4edf5)' }}>{name}</td>
                    <td style={{ padding: '10px 16px', fontSize: '14px', textAlign: 'right', color: 'var(--launch-admin-text, #112940)', borderBottom: '1px solid var(--launch-admin-task-border, #e4edf5)' }}>
                      {loadingCounts ? <Loader2 size={12} className="animate-spin" style={{ display: 'inline-block' }} /> :
                       c === -2 ? 'N/A' :
                       c === -1 ? <span style={{ color: '#dc2626' }}>Error</span> :
                       typeof c === 'number' ? c.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', borderBottom: '1px solid var(--launch-admin-task-border, #e4edf5)' }}>
                      {c > 0 ? <span style={{ fontSize: '11px', fontWeight: '600', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>Has Data</span> :
                       c === 0 ? <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', background: '#f8fafc', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>Empty</span> :
                       c === -1 ? <AlertCircle size={14} style={{ color: '#dc2626', display: 'inline-block' }} /> :
                       <span style={{ fontSize: '11px', fontWeight: '600', color: '#b45309', background: '#fffbeb', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>Special</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--launch-admin-muted, #5b7288)' }}>
        Note: Each entity exports up to 50,000 records. The User entity is included but limited to 500 records due to platform restrictions. Large exports may take several minutes.
      </p>
    </div>
  );
}