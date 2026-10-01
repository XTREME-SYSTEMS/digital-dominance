import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ═══════════════════════════════════════════════════════════════════════════
// driveSystemBackup — Dumps ALL entity records to Google Drive as JSON + CSV.
//
// - Machine-readable: one .json file per entity (full fidelity)
// - Human-readable:   one .csv file per entity (flattened, spreadsheet-friendly)
// - Organized in: EpoxyQuoteNearMe System Backups / YYYY-MM-DD_HH-MM-SS
//
// Uses the authorized googledrive connector (SHARED mode — builder's account).
// Admin-only when invoked from the UI; workflow invocations proceed without
// a user (the platform is trusted).
// ═══════════════════════════════════════════════════════════════════════════

const ROOT_FOLDER_NAME = 'EpoxyQuoteNearMe System Backups';
const MAX_PAGES_PER_ENTITY = 10; // 10 × 500 = 5000 records cap per entity
const PAGE_SIZE = 500;

const ENTITIES = [
  'AppSettings','IngestedWebsite','TemplateLibrary','AgentPersona','Opportunity',
  'RefactorJob','DominanceGoal','SelfReflectionCycle','BenchmarkCompany','Lead',
  'CodeSandboxSession','AgentDepartment','DeploymentRecord','AgentIntelligence',
  'AgentMemory','AgentAction','BuildSession','BuildManifest','Conversation','CryptoToken',
  'AgentExecutionLog','PredictionResult','PredictionModel','AgentVersion','ToolRegistry',
  'SubscriptionPlan','UserLLMConnection','WorkflowTemplate','ConversationMessage','UserWorkspace',
  'DominanceCampaign','ProgressLedger','SystemManifest','BrokenTwin','ConvergenceCycle',
  'WorkPacket','CommandRun','ApprovalRequest','MetaSession','ValidationReceipt',
  'DiscoveryJob','BuilderLibrary','VaultEntry','FleetSystem','SkipTrace',
  'BenchmarkDefinition','RepairJob','BenchmarkResult','EvidenceReceipt','RegressionTest',
  'OptimizationGap','AuditSystemIntegrityScore','ContractorArchetype','AdminProfile','SimulatedVisitor',
  'ControlLease','VisionMessage','VisionConversation','FleetHeartbeat','OperatorIntent',
  'SwarmAudit','SwarmTask','SystemMode','BenchmarkCandidate','AlphaPrimeReflectionLedger',
  'AlphaPrimeAuditLedger','StrategicReflectionRecord','FailurePattern','VerifiedBusinessFacts','CanonicalLocationRegistry',
  'AlphaPrimeHeartbeat','CanonicalSiteRegistry','SiteValidationReceipt','LeadSource','ContractorRecord',
  'StrategyDocument','MarketplaceListing','SeoSimulation','Investigation','SystemHealthAudit',
  'WebsiteQueue','VoiceAssistant','DomainStrategy','DynamicPage','CodeBlock',
  'PropertyLookup','SwarmMessage','SocialPost','ApiKey','AiVoiceSession',
  'TestRun','LaunchCampaign','AppBuild','WebsiteTemplate','ClientPackage',
  'IntelligenceReport','AgentTemplate','AnalyticsSnapshot','MaintenancePlan','QuestionnaireResponse',
  'Base44Purchase','Tool','Referral','ClientProject','ProjectUpdate',
  'ChatMessage','Rating','Comment','PromoCode','SopLog',
  'GeneratedPage','Sop','EmailLog','SeoContent','CompetitorInsight',
  'FunnelEvent','Appointment','User',
];

// ── CSV helpers ────────────────────────────────────────────────────────────

function flattenValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function recordsToCsv(records: any[]): string {
  if (!records.length) return '';
  const keySet = new Set<string>();
  const flatRows = records.map((r) => {
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      flat[k] = flattenValue(v);
      keySet.add(k);
    }
    return flat;
  });
  const keys = Array.from(keySet);
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = keys.map(esc).join(',');
  const rows = flatRows.map((r) => keys.map((k) => esc(r[k] ?? '')).join(','));
  return [header, ...rows].join('\n');
}

// ── Drive API helpers ──────────────────────────────────────────────────────

async function driveFetch(token: string, path: string, opts: RequestInit = {}) {
  return fetch(`https://www.googleapis.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

async function findFolder(token: string, name: string, parentId?: string) {
  let q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  const res = await driveFetch(token, `/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  if (!res.ok) throw new Error(`Drive folder search failed: ${res.status}`);
  const data = await res.json();
  return data.files?.[0]?.id;
}

async function createFolder(token: string, name: string, parentId?: string) {
  const res = await driveFetch(token, '/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    }),
  });
  if (!res.ok) throw new Error(`Drive folder create failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

async function findOrCreateFolder(token: string, name: string, parentId?: string) {
  const existing = await findFolder(token, name, parentId);
  if (existing) return existing;
  return createFolder(token, name, parentId);
}

async function uploadTextFile(token: string, name: string, content: string, mimeType: string, parentId: string) {
  const boundary = 'base44backup_' + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({ name, parents: [parentId] });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n${content}\r\n--${boundary}--`;
  const res = await driveFetch(token, '/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Drive upload failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.id;
}

// ── Entity fetch ────────────────────────────────────────────────────────────

async function fetchAllRecords(entityName: string, base44: any) {
  const entity = base44.asServiceRole.entities[entityName];
  if (!entity) throw new Error(`Entity not found: ${entityName}`);

  const allRecords: any[] = [];
  let cursor: string | undefined;
  let pages = 0;

  while (pages < MAX_PAGES_PER_ENTITY) {
    const page = await entity.filter({}, { limit: PAGE_SIZE, cursor });
    allRecords.push(...(page.items || []));
    if (!page.has_more || !page.next_cursor) break;
    cursor = page.next_cursor;
    pages++;
  }

  return allRecords;
}

// ── Main handler ────────────────────────────────────────────────────────────

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: admin-only when called from UI; workflow calls have no user
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'backup';

    if (action === 'status') {
      return Response.json({
        ok: true,
        entityCount: ENTITIES.length,
        rootFolderName: ROOT_FOLDER_NAME,
        schedule: 'Daily at 2:00 AM ET via workflow',
      });
    }

    // ── Get Drive token ──
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    if (!accessToken) {
      return Response.json({ error: 'Google Drive connector not connected' }, { status: 400 });
    }

    // ── Create folder structure ──
    const rootId = await findOrCreateFolder(accessToken, ROOT_FOLDER_NAME);
    const now = new Date();
    const ts = now.toISOString().slice(0, 19).replace(/[T:]/g, '-').split('-').slice(0, 4).join('-') + '_' +
               now.toISOString().slice(11, 16).replace(':', '-');
    const dateFolder = `${now.toISOString().slice(0, 10)}_${now.toISOString().slice(11, 16).replace(':', '-')}`;
    const backupId = await createFolder(accessToken, dateFolder, rootId);

    // ── Process each entity ──
    const results: { entity: string; records: number; jsonId?: string; csvId?: string; error?: string }[] = [];
    let totalRecords = 0;
    let totalFiles = 0;
    const errors: string[] = [];

    for (const entityName of ENTITIES) {
      const result: any = { entity: entityName, records: 0 };
      try {
        const records = await fetchAllRecords(entityName, base44);
        result.records = records.length;
        totalRecords += records.length;

        if (records.length > 0) {
          // Upload JSON (machine-readable)
          const jsonContent = JSON.stringify(records, null, 2);
          const jsonId = await uploadTextFile(accessToken, `${entityName}.json`, jsonContent, 'application/json', backupId);
          result.jsonId = jsonId;
          totalFiles++;

          // Upload CSV (human-readable)
          const csvContent = recordsToCsv(records);
          if (csvContent) {
            const csvId = await uploadTextFile(accessToken, `${entityName}.csv`, csvContent, 'text/csv', backupId);
            result.csvId = csvId;
            totalFiles++;
          }
        }
      } catch (err: any) {
        result.error = err.message;
        errors.push(`${entityName}: ${err.message}`);
        console.error(`[driveSystemBackup] ${entityName} failed:`, err.message);
      }
      results.push(result);
    }

    // ── Upload manifest ──
    const manifest = {
      backupDate: now.toISOString(),
      rootFolder: ROOT_FOLDER_NAME,
      dateFolder,
      entityCount: ENTITIES.length,
      totalRecords,
      totalFiles,
      errors: errors.length,
      results,
    };
    try {
      await uploadTextFile(accessToken, '_manifest.json', JSON.stringify(manifest, null, 2), 'application/json', backupId);
      totalFiles++;
    } catch (err: any) {
      errors.push(`manifest: ${err.message}`);
    }

    return Response.json({
      ok: true,
      backupFolder: dateFolder,
      rootFolderId: rootId,
      backupFolderId: backupId,
      entityCount: ENTITIES.length,
      totalRecords,
      totalFiles,
      errors: errors.length,
      errorDetails: errors.slice(0, 20),
      results: results.filter((r) => r.records > 0 || r.error),
    });
  } catch (error) {
    console.error('[driveSystemBackup] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}