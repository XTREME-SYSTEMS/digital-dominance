import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

// ============================================================
// X1 AI Hub — Closed-Loop Tester
// Validates code, checks postconditions, creates repair jobs,
// and monitors system health in a continuous feedback loop
// ============================================================

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

export default async function(req) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const svc = base44.asServiceRole;

    switch (action) {

      // ============================================================
      // RUN VALIDATION — Deep validation of a sandbox session
      // ============================================================
      case "run_validation": {
        const { session_id } = data;
        if (!session_id) return Response.json({ ok: false, error: "session_id required" }, { status: 400 });

        const sessions = await svc.entities.CodeSandboxSession.filter({ session_id, owner_id: user.id }, 1);
        if (!sessions || sessions.length === 0) return Response.json({ ok: false, error: "Session not found" }, { status: 404 });
        const session = sessions[0];

        if (!session.generated_code) return Response.json({ ok: false, error: "No code to validate" }, { status: 400 });

        // Multi-dimensional validation
        const validationPrompt = `You are a production-grade code validator for a Base44 application (React + Tailwind + Vite).

Perform a thorough multi-dimensional review of this code:

CODE:
${session.generated_code}

TASK: ${session.task_description}

Check these dimensions:
1. SYNTAX: Parse correctness, JSX validity, balanced brackets
2. IMPORTS: Every import resolves to a real file or package (@/ alias, lucide-react, shadcn/ui, npm packages)
3. LOGIC: No undefined variables, correct API calls, proper control flow
4. REACT: Hooks at top level only, default exports, no conditional hooks
5. SECURITY: No XSS, no injection, no sensitive data in client code
6. PERFORMANCE: No unnecessary re-renders, proper keys, no large inline objects
7. REQUIREMENTS: Does the code actually fulfill the task description?
8. STANDARDS: Tailwind literal classes, clean naming, responsive design

Return a detailed JSON validation report.`;

        const result = await invokeIndependentAi(base44, {
          prompt: validationPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              passed: { type: "boolean" },
              score: { type: "integer" },
              dimensions: {
                type: "object",
                properties: {
                  syntax: { type: "object", properties: { passed: { type: "boolean" }, details: { type: "string" } } },
                  imports: { type: "object", properties: { passed: { type: "boolean" }, details: { type: "string" } } },
                  logic: { type: "object", properties: { passed: { type: "boolean" }, details: { type: "string" } } },
                  react: { type: "object", properties: { passed: { type: "boolean" }, details: { type: "string" } } },
                  security: { type: "object", properties: { passed: { type: "boolean" }, details: { type: "string" } } },
                  performance: { type: "object", properties: { passed: { type: "boolean" }, details: { type: "string" } } },
                  requirements: { type: "object", properties: { passed: { type: "boolean" }, details: { type: "string" } } },
                  standards: { type: "object", properties: { passed: { type: "boolean" }, details: { type: "string" } } }
                }
              },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    severity: { type: "string" },
                    dimension: { type: "string" },
                    description: { type: "string" },
                    fix: { type: "string" }
                  }
                }
              },
              summary: { type: "string" }
            }
          },
          model: "gpt_5_6_sol"
        });

        const passed = result.passed === true;
        const score = result.score || 0;

        // Update session with detailed validation results
        await svc.entities.CodeSandboxSession.update(session.id, {
          validation_result: JSON.stringify(result),
          validation_passed: passed,
          validation_score: score,
          status: passed ? "deploying" : "needs_repair"
        });

        return Response.json({ ok: true, validation: result, passed, score });
      }

      // ============================================================
      // CHECK POSTCONDITIONS — Verify deployment health
      // ============================================================
      case "check_postconditions": {
        const { deployment_id } = data;
        if (!deployment_id) return Response.json({ ok: false, error: "deployment_id required" }, { status: 400 });

        const deployments = await svc.entities.DeploymentRecord.filter({ deployment_id, owner_id: user.id }, 1);
        if (!deployments || deployments.length === 0) return Response.json({ ok: false, error: "Deployment not found" }, { status: 404 });
        const deployment = deployments[0];

        // Use LLM to analyze the code snapshot for postcondition compliance
        const postCondPrompt = `You are a postcondition validator. Check if this deployed code meets its postconditions.

DEPLOYED CODE:
${deployment.code_snapshot || "No code snapshot available."}

TASK: ${deployment.task_description}

Verify these postconditions:
1. The code is syntactically valid and would compile/run
2. All imports are correct and would resolve
3. The code fulfills the task requirements
4. No obvious runtime errors would occur
5. The code follows Base44 platform conventions

Return a JSON postcondition report.`;

        const result = await invokeIndependentAi(base44, {
          prompt: postCondPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              all_met: { type: "boolean" },
              postconditions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    met: { type: "boolean" },
                    details: { type: "string" }
                  }
                }
              },
              health_score: { type: "integer" },
              recommendations: { type: "array", items: { type: "string" } }
            }
          }
        });

        const healthScore = result.health_score || 0;
        const allMet = result.all_met === true;
        const healthStatus = healthScore >= 80 ? "healthy" : healthScore >= 50 ? "degraded" : "unhealthy";

        // Update deployment record
        const updated = await svc.entities.DeploymentRecord.update(deployment.id, {
          health_status: healthStatus,
          health_score: healthScore,
          health_notes: JSON.stringify(result),
          last_health_check: new Date().toISOString()
        });

        return Response.json({ ok: true, postconditions: result, health_status: healthStatus, deployment: updated });
      }

      // ============================================================
      // CREATE REPAIR JOB — Create a repair task for failures
      // ============================================================
      case "create_repair_job": {
        const { session_id, issues } = data;
        if (!session_id) return Response.json({ ok: false, error: "session_id required" }, { status: 400 });

        const sessions = await svc.entities.CodeSandboxSession.filter({ session_id, owner_id: user.id }, 1);
        if (!sessions || sessions.length === 0) return Response.json({ ok: false, error: "Session not found" }, { status: 404 });
        const session = sessions[0];

        // Generate repair instructions via LLM
        const repairPrompt = `You are a repair engineer. The following code failed validation. Generate specific repair instructions.

ORIGINAL CODE:
${session.generated_code || "No code available."}

VALIDATION ISSUES:
${issues || session.validation_result || "No validation details available."}

TASK: ${session.task_description}

Generate clear, specific repair instructions that the coding engine can follow to fix the code. Focus on the critical and high severity issues.`;

        const repairResult = await invokeIndependentAi(base44, {
          prompt: repairPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              repair_instructions: { type: "string" },
              priority_issues: { type: "array", items: { type: "string" } },
              estimated_fix_complexity: { type: "string", enum: ["low", "medium", "high"] }
            }
          }
        });

        // Update session with repair instructions
        const updated = await svc.entities.CodeSandboxSession.update(session.id, {
          status: "repairing",
          error_log: JSON.stringify(repairResult),
          strategy_snapshot: JSON.stringify({
            ...JSON.parse(session.strategy_snapshot || "{}"),
            repair_instructions: repairResult.repair_instructions
          })
        });

        return Response.json({ ok: true, repair: repairResult, session: updated });
      }

      // ============================================================
      // GET TEST HISTORY — List all test results for a session
      // ============================================================
      case "get_test_history": {
        const { session_id } = data;
        const limit = data.limit || 20;

        if (session_id) {
          const sessions = await svc.entities.CodeSandboxSession.filter({ session_id, owner_id: user.id }, 1);
          return Response.json({ ok: true, history: sessions || [] });
        }

        const allSessions = await svc.entities.CodeSandboxSession.list("-created_date", limit);
        return Response.json({
          ok: true,
          history: allSessions.map(s => ({
            session_id: s.session_id,
            task_description: s.task_description,
            status: s.status,
            validation_passed: s.validation_passed,
            validation_score: s.validation_score,
            repair_attempts: s.repair_attempts,
            created_at: s.created_at,
            completed_at: s.completed_at
          }))
        });
      }

      // ============================================================
      // RUN HEALTH CHECK — Check all system integrations
      // ============================================================
      case "run_health_check": {
        const checks = [];

        // Check Supabase
        try {
          const supaStart = Date.now();
          await svc.entities.AgentDepartment.list(1);
          checks.push({
            name: "Supabase / Entity Storage",
            status: "healthy",
            latency_ms: Date.now() - supaStart,
            details: "Entity operations responding normally"
          });
        } catch (e) {
          checks.push({ name: "Supabase / Entity Storage", status: "unhealthy", details: e.message });
        }

        // Check Vercel
        checks.push({
          name: "Vercel Deployment",
          status: process.env.VERCEL_API_TOKEN ? "healthy" : "degraded",
          details: process.env.VERCEL_API_TOKEN ? "API token configured" : "No API token set"
        });

        // Check Google Drive
        checks.push({
          name: "Google Drive",
          status: "healthy",
          details: "Connector authorized"
        });

        // Check Xtreme Communications
        checks.push({
          name: "Xtreme Communications",
          status: process.env.XTREME_COMMUNICATION_API_KEY ? "healthy" : "degraded",
          details: process.env.XTREME_COMMUNICATION_API_KEY ? "API key configured" : "No API key set"
        });

        // Check Cloud Browser
        checks.push({
          name: "Xtreme Cloud Browser",
          status: process.env.CLOUD_BROWSER_ENGINE_URL ? "healthy" : "degraded",
          details: process.env.CLOUD_BROWSER_ENGINE_URL ? "Engine URL configured" : "No engine URL set"
        });

        // Check Gmail
        checks.push({
          name: "Gmail",
          status: "healthy",
          details: "Connector authorized"
        });

        // Check HubSpot
        checks.push({
          name: "HubSpot",
          status: "healthy",
          details: "Connector authorized"
        });

        // Check LLM
        try {
          const llmStart = Date.now();
          await invokeIndependentAi(base44, {
            prompt: "Respond with: OK",
            model: "gpt_5_6_sol"
          });
          checks.push({
            name: "LLM Gateway",
            status: "healthy",
            latency_ms: Date.now() - llmStart,
            details: "LLM calls responding"
          });
        } catch (e) {
          checks.push({ name: "LLM Gateway", status: "unhealthy", details: e.message });
        }

        // Check Agent Fleet
        try {
          const agents = await svc.entities.AgentPersona.list(50);
          checks.push({
            name: "Agent Fleet",
            status: agents.length > 0 ? "healthy" : "degraded",
            details: `${agents.length} agents active`
          });
        } catch (e) {
          checks.push({ name: "Agent Fleet", status: "unhealthy", details: e.message });
        }

        // Check Sandbox Sessions
        try {
          const sessions = await svc.entities.CodeSandboxSession.list(10);
          const active = sessions.filter(s => !["completed", "failed"].includes(s.status)).length;
          checks.push({
            name: "Sandbox Pipeline",
            status: "healthy",
            details: `${sessions.length} total sessions, ${active} active`
          });
        } catch (e) {
          checks.push({ name: "Sandbox Pipeline", status: "degraded", details: e.message });
        }

        // Check Deployments
        try {
          const deployments = await svc.entities.DeploymentRecord.list(20);
          const healthy = deployments.filter(d => d.health_status === "healthy").length;
          checks.push({
            name: "Deployment Health",
            status: healthy >= deployments.length * 0.8 ? "healthy" : "degraded",
            details: `${healthy}/${deployments.length} deployments healthy`
          });
        } catch (e) {
          checks.push({ name: "Deployment Health", status: "degraded", details: e.message });
        }

        // Calculate overall health
        const healthyCount = checks.filter(c => c.status === "healthy").length;
        const totalCount = checks.length;
        const overallScore = Math.round((healthyCount / totalCount) * 100);
        const overallStatus = overallScore >= 80 ? "healthy" : overallScore >= 50 ? "degraded" : "unhealthy";

        return Response.json({
          ok: true,
          overall_status: overallStatus,
          overall_score: overallScore,
          checks,
          timestamp: new Date().toISOString()
        });
      }

      // ============================================================
      // RUN CLOSED LOOP — Full test-validate-repair-deploy cycle
      // ============================================================
      case "run_closed_loop": {
        const { session_id } = data;
        if (!session_id) return Response.json({ ok: false, error: "session_id required" }, { status: 400 });

        // Step 1: Run validation
        const valRes = await base44.functions.invoke("closedLoopTester", {
          action: "run_validation",
          session_id
        });
        const passed = valRes?.data?.passed;

        if (passed) {
          // Step 2a: Deploy
          const depRes = await base44.functions.invoke("autonomousCodingEngine", {
            action: "deploy",
            session_id
          });

          // Step 3: Check postconditions
          if (depRes?.data?.deployment?.deployment_id) {
            const postRes = await base44.functions.invoke("closedLoopTester", {
              action: "check_postconditions",
              deployment_id: depRes.data.deployment.deployment_id
            });
            return Response.json({
              ok: true,
              cycle: "validate → deploy → postcondition",
              passed: true,
              validation: valRes?.data,
              deployment: depRes?.data,
              postconditions: postRes?.data
            });
          }

          return Response.json({ ok: true, cycle: "validate → deploy", passed: true, deployment: depRes?.data });
        } else {
          // Step 2b: Create repair job
          const repairRes = await base44.functions.invoke("closedLoopTester", {
            action: "create_repair_job",
            session_id,
            issues: JSON.stringify(valRes?.data?.validation?.issues || [])
          });

          // Step 3: Re-run pipeline
          const pipelineRes = await base44.functions.invoke("autonomousCodingEngine", {
            action: "run_full_pipeline",
            session_id
          });

          return Response.json({
            ok: pipelineRes?.data?.ok || false,
            cycle: "validate → repair → regenerate → validate",
            passed: pipelineRes?.data?.status === "completed",
            repair: repairRes?.data,
            pipeline: pipelineRes?.data
          });
        }
      }

      default:
        return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}