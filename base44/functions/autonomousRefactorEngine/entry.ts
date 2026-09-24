import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

// ============================================================
// AUTONOMOUS REFACTOR ENGINE
// 5-Phase Cycle: SCAN → PLAN → EXECUTE → VALIDATE → CONVERGE
// ============================================================

const KNOWN_FUNCTIONS = [
  "agentBuilderEngine", "agentRouter", "agentRunner", "aiAssist", "alphaPrimeAudit",
  "alphaPrimeBenchmarkGenerator", "alphaPrimeHeartbeat", "alphaPrimeOptimizationCycle",
  "alphaPrimeRepairFactory", "apiKeyManager", "autoComplete", "autonomousCodingEngine",
  "autonomousSeoDominance", "autonomousSprint", "bookEstimate", "builderLibrarySeeder",
  "calculateDistanceTo100", "canonicalizeRepairBacklog", "checkGoogleStatus",
  "checkQuestionnaireCompliance", "closedLoopTester", "companyIntel", "companyOrchestrator",
  "convergenceEngine", "cryptoCreator", "dailyLeadEngine", "digitalDominanceCompiler",
  "domainGoldRush", "dominanceEngine", "enrichLead", "fetchCoreWebVitals", "fillContentGaps",
  "fleetAlphaPrime", "generateRss", "generateSeoPage", "generateSitemap", "generateSop",
  "githubSync", "godaddyApi", "googleAnalytics", "googleVerifierConnectUrl",
  "googleVerifierExchange", "googleWorkspaceSync", "graphEngine", "intelligenceSync",
  "intentRouter", "independentAi", "llmRouter", "massIngestionEngine", "memoryRouter", "metaAgent",
  "metaArchitecture", "notifySeoUpdates", "optimizeSeo", "phase9Proof", "pingIndexNow",
  "postconditionValidator", "predictionEngine", "propertyLookup", "pullSearchConsoleData",
  "pushLeadToHubspot", "ragPipeline", "railwayScraper", "rebrandGenerator", "rebrandStudio",
  "recursiveHealingEngine", "regressionTestSuite", "runContractorSimulation",
  "runtimeAcceptanceMission", "scanCompetitors", "selfReflectionEngine", "sendEstimateEmail",
  "sendFollowUpEmail", "sendReviewRequest", "seoAeoSimulator", "seoGenerator", "seoSimSync",
  "shadowBrowse", "siteHealthChecker", "skipTrace", "socialStudio", "strategicMindsSetup",
  "submitToIndexers", "supabaseConcurrencyTest", "supabaseMigrationDeploy", "supabaseUpload",
  "swarmOrchestrator", "syncContentCalendar", "syncContractorWorkflow", "syncFleetSystemState",
  "syncLeadToSheet", "syncWorkflowToSwarm", "syntheticWorker", "systemAuditor",
  "systemOrchestrator", "telnyxAutonomousSetup", "telnyxManager", "topSitesBenchmarkScanner",
  "tradeCrystalBall", "vercelAiGateway", "vercelDeploy", "vercelManager", "verifySearchConsole",
  "visionCortexRouter", "visionEngine", "voiceAssistant", "xtremeComms",
  "xtremeUniversalGeneratorBridge"
];

// Only actions whose handlers have been reviewed as read-only may run in an automatic scan.
const SAFE_PROBES: Record<string, any> = {
  autonomousRefactorEngine: { action: 'status' },
  independentAi: { action: 'status' },
  llmRouter: { action: 'list_connections' },
};

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// PHASE 1: SCAN
// ============================================================
async function scanSystem(base44: any, ownerId: string): Promise<any> {
  const cycleId = genId('cycle');
  const results: any[] = [];
  const errors: any[] = [];
  const slow: any[] = [];

  for (const [funcName, payload] of Object.entries(SAFE_PROBES)) {
    const start = Date.now();
    try {
      await base44.functions.invoke(funcName, payload);
      const elapsed = Date.now() - start;
      results.push({ function: funcName, elapsed_ms: elapsed });
      if (elapsed > 3000) slow.push({ function: funcName, elapsed_ms: elapsed });
    } catch (err: any) {
      errors.push({ function: funcName, error: String(err?.message || err).slice(0, 500), elapsed_ms: Date.now() - start });
    }
  }

  const summary = { total_tested: results.length + errors.length, successful: results.length, failed: errors.length, slow_count: slow.length, not_tested: Math.max(0, KNOWN_FUNCTIONS.length - Object.keys(SAFE_PROBES).filter(name => KNOWN_FUNCTIONS.includes(name)).length) };
  const observations = [...errors.map(e => ({ target_name: e.function, issue_type: 'test_failure', issue_description: `Read-only probe failed: ${e.error}`, severity: 'high', priority: 'high' })),
    ...slow.map(s => ({ target_name: s.function, issue_type: 'performance', issue_description: `Read-only probe took ${s.elapsed_ms}ms. Investigate before changing code.`, severity: 'medium', priority: 'normal' }))];
  const jobs = observations.length ? await base44.entities.RefactorJob.bulkCreate(observations.map(o => ({
    ...o, owner_id: ownerId, job_id: genId('refactor'), cycle_id: cycleId, job_type: 'scan', target_type: 'backend_function', status: 'identified', created_at: new Date().toISOString(), scan_data: JSON.stringify({ probe: SAFE_PROBES[o.target_name], cycle_id: cycleId }),
  }))) : [];

  let analysis = 'Read-only checks completed. Failures require investigation; unverified functions were not called.';
  try {
    const ai = await invokeIndependentAi(base44, { prompt: `Summarize these read-only runtime probe results in one sentence. Do not claim source-code analysis or that untested functions are healthy: ${JSON.stringify({ summary, errors, slow })}`, max_tokens: 300 });
    if (typeof ai === 'string' && ai.trim()) analysis = ai;
  } catch (err: any) {
    analysis += ' AI summary unavailable.';
  }

  return { ok: true, cycle_id: cycleId, summary: analysis, scan_stats: summary, jobs_created: jobs.length,
    jobs: jobs.map(j => ({ id: j.id, job_id: j.job_id, target: j.target_name, issue: j.issue_type, severity: j.severity })) };
}

// ============================================================
// PHASE 2: PLAN
// ============================================================
async function planRefactor(base44: any, jobId: string): Promise<any> {
  const svc = base44.asServiceRole;
  const jobs = await svc.entities.RefactorJob.filter({ job_id: jobId });
  if (!jobs || jobs.length === 0) throw new Error("RefactorJob not found: " + jobId);
  const job = jobs[0];

  await svc.entities.RefactorJob.update(job.id, { status: "planning" });

  const planResponse = await invokeIndependentAi(base44, {
    prompt: `You are an autonomous refactoring planner. Generate a detailed refactoring plan for this issue:

TARGET: ${job.target_name} (${job.target_type})
ISSUE TYPE: ${job.issue_type}
SEVERITY: ${job.severity}
ISSUE DESCRIPTION: ${job.issue_description}
SCAN DATA: ${job.scan_data || "N/A"}

Generate a specific, actionable refactoring plan. Return a JSON object with:
{
  "plan_summary": "1-2 sentence summary",
  "steps": ["step 1", "step 2", ...],
  "files_to_modify": ["file path 1", ...],
  "files_to_create": [{"path": "file path", "purpose": "what it does"}],
  "estimated_improvement": "what improves",
  "risk_level": "low | medium | high",
  "rollback_strategy": "how to undo"
}`,
    response_json_schema: {
      type: "object",
      properties: {
        plan_summary: { type: "string" },
        steps: { type: "array", items: { type: "string" } },
        files_to_modify: { type: "array", items: { type: "string" } },
        files_to_create: { type: "array", items: { type: "object", properties: { path: { type: "string" }, purpose: { type: "string" } } } },
        estimated_improvement: { type: "string" },
        risk_level: { type: "string" },
        rollback_strategy: { type: "string" },
      },
    },
  });

  const plan = planResponse as any;
  await svc.entities.RefactorJob.update(job.id, { status: "planned", refactor_plan: JSON.stringify(plan) });
  return { ok: true, job_id: jobId, plan };
}

// ============================================================
// PHASE 3: EXECUTE
// ============================================================
async function executeRefactor(base44: any, jobId: string): Promise<any> {
  const svc = base44.asServiceRole;
  const jobs = await svc.entities.RefactorJob.filter({ job_id: jobId });
  if (!jobs || jobs.length === 0) throw new Error("RefactorJob not found: " + jobId);
  const job = jobs[0];
  if (!job.refactor_plan) throw new Error("No plan found. Run plan phase first.");

  await svc.entities.RefactorJob.update(job.id, { status: "executing" });

  const codeResponse = await invokeIndependentAi(base44, {
    prompt: `You are an autonomous code refactoring executor. Based on this refactoring plan, generate the refactored code.

TARGET: ${job.target_name} (${job.target_type})
ISSUE: ${job.issue_type} — ${job.issue_description}
PLAN: ${job.refactor_plan}

Generate the complete refactored code. Return a JSON object:
{
  "primary_file_path": "the main file path",
  "refactored_code": "the complete refactored code",
  "new_files": [{"path": "file path", "code": "the code"}],
  "changes_summary": "brief summary",
  "lines_before": 0,
  "lines_after": 0
}`,
    response_json_schema: {
      type: "object",
      properties: {
        primary_file_path: { type: "string" },
        refactored_code: { type: "string" },
        new_files: { type: "array", items: { type: "object", properties: { path: { type: "string" }, code: { type: "string" } } } },
        changes_summary: { type: "string" },
        lines_before: { type: "number" },
        lines_after: { type: "number" },
      },
    },
  });

  const code = codeResponse as any;
  await svc.entities.RefactorJob.update(job.id, {
    status: "executed",
    refactored_code: (code.refactored_code || "").slice(0, 50000),
    new_files: JSON.stringify(code.new_files || []),
  });
  return { ok: true, job_id: jobId, changes_summary: code.changes_summary, lines_before: code.lines_before, lines_after: code.lines_after };
}

// ============================================================
// PHASE 4: VALIDATE
// ============================================================
async function validateRefactor(base44: any, jobId: string): Promise<any> {
  const svc = base44.asServiceRole;
  const jobs = await svc.entities.RefactorJob.filter({ job_id: jobId });
  if (!jobs || jobs.length === 0) throw new Error("RefactorJob not found: " + jobId);
  const job = jobs[0];
  if (!job.refactored_code) throw new Error("No refactored code found. Run execute phase first.");

  await svc.entities.RefactorJob.update(job.id, { status: "validating" });

  const validationResponse = await invokeIndependentAi(base44, {
    prompt: `You are an autonomous code validation engine. Validate this refactored code.

ORIGINAL ISSUE: ${job.issue_type} — ${job.issue_description}
REFACTORED CODE (first 8000 chars):
${(job.refactored_code || "").slice(0, 8000)}

Return:
{
  "passed": true/false,
  "score": 0-100,
  "syntax_valid": true/false,
  "functionality_preserved": true/false,
  "issue_resolved": true/false,
  "issues_found": ["issue 1", ...],
  "improvements": ["improvement 1", ...],
  "recommendation": "deploy | needs_revision | reject"
}`,
    response_json_schema: {
      type: "object",
      properties: {
        passed: { type: "boolean" },
        score: { type: "number" },
        syntax_valid: { type: "boolean" },
        functionality_preserved: { type: "boolean" },
        issue_resolved: { type: "boolean" },
        issues_found: { type: "array", items: { type: "string" } },
        improvements: { type: "array", items: { type: "string" } },
        recommendation: { type: "string" },
      },
    },
  });

  const validation = validationResponse as any;
  await svc.entities.RefactorJob.update(job.id, {
    status: validation.recommendation === "deploy" ? "validated" : "failed",
    validation_result: JSON.stringify(validation),
    validation_passed: validation.passed || false,
    validation_score: validation.score || 0,
    improvement_score: validation.score || 0,
  });
  return { ok: true, job_id: jobId, validation };
}

// ============================================================
// PHASE 5: FULL CYCLE
// ============================================================
async function fullCycle(base44: any, ownerId: string): Promise<any> {
  // Return promptly; the UI runs each job phase in a separate bounded request.
  const scanResult = await scanSystem(base44, ownerId);
  return { ok: true, scan: { ...scanResult.scan_stats, jobs_created: scanResult.jobs_created }, jobs: scanResult.jobs, processed: [], summary: scanResult.summary };
}

// ============================================================
// STATUS
// ============================================================
async function getStatus(base44: any): Promise<any> {
  const svc = base44.asServiceRole;
  const allJobs = await svc.entities.RefactorJob.list("-created_date", 500);

  const byStatus: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const byIssueType: Record<string, number> = {};
  for (const job of allJobs) {
    byStatus[job.status] = (byStatus[job.status] || 0) + 1;
    bySeverity[job.severity] = (bySeverity[job.severity] || 0) + 1;
    byIssueType[job.issue_type] = (byIssueType[job.issue_type] || 0) + 1;
  }

  const validated = allJobs.filter((j: any) => j.status === "validated");
  const avgScore = validated.length > 0
    ? Math.round(validated.reduce((sum: number, j: any) => sum + (j.validation_score || 0), 0) / validated.length)
    : 0;

  return {
    ok: true,
    total_jobs: allJobs.length,
    by_status: byStatus,
    by_severity: bySeverity,
    by_issue_type: byIssueType,
    validated_count: validated.length,
    avg_validation_score: avgScore,
    recent_jobs: allJobs.slice(0, 10).map((j: any) => ({
      id: j.id, job_id: j.job_id, target: j.target_name, issue: j.issue_type, severity: j.severity, status: j.status, score: j.validation_score,
    })),
  };
}

// ============================================================
// MAIN HANDLER
// ============================================================
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';
    const jobId = body.job_id;

    let result: any;
    switch (action) {
      case 'scan': result = await scanSystem(base44, user.id); break;
      case 'plan': result = await planRefactor(base44, jobId); break;
      case 'execute': result = await executeRefactor(base44, jobId); break;
      case 'validate': result = await validateRefactor(base44, jobId); break;
      case 'full_cycle': result = await fullCycle(base44, user.id); break;
      case 'status': result = await getStatus(base44); break;
      default: result = { ok: false, error: 'Unknown action: ' + action };
    }
    return Response.json(result);
  } catch (err: any) {
    return Response.json({
      ok: false,
      error: err.message || String(err),
      stack: err.stack?.split('\n').slice(0, 5).join('\n'),
    }, { status: 500 });
  }
}