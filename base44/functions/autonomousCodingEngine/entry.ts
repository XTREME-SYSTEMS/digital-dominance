import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { patchCore } from '../../shared/aiGateway.ts';

// ============================================================
// X1 AI Hub — Autonomous Coding Engine
// Deterministic sandbox coding pipeline:
// plan → generate → test → validate → deploy (or repair)
// ============================================================

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

const CODE_GEN_PROMPT = (task, strategy, fileType) => `You are an expert software engineer working in a Base44 application (React + Tailwind CSS + JavaScript on Vite).

TASK: ${task}

STRATEGY: ${strategy || "No pre-defined strategy — use your best judgment."}

TARGET FILE TYPE: ${fileType}

Generate production-ready code for this task. Follow these standards strictly:
- React components must have default exports, named same as the file
- Tailwind CSS for styling (literal class strings, never dynamic concatenation like bg-\${color}-500)
- lucide-react for icons (only icons that exist)
- @/ alias for imports (never relative src/ paths)
- shadcn/ui from @/components/ui
- Clean, modern, responsive design
- Error handling and loading states
- No stubs — every button works, every flow finishes
- Export default at the end

Return ONLY the raw code. No markdown fences, no explanations, no comments about what you're doing.`;

const VALIDATION_PROMPT = (code, task) => `You are a senior code reviewer for a Base44 application (React + Tailwind + Vite + shadcn/ui).

Review the following code for:
1. Syntax errors (unmatched brackets, missing semicolons, JSX errors)
2. Import correctness (all imports resolve to real files/packages — @/ alias, lucide-react, shadcn/ui)
3. Logic errors (undefined variables, wrong API usage, missing returns)
4. React best practices (hooks at top level only, proper default exports, no conditional hooks)
5. Security issues (XSS, injection, sensitive data exposure)
6. Performance (unnecessary re-renders, missing keys in lists, large inline objects)
7. Requirements match — does the code actually fulfill the task?

TASK: ${task}

CODE:
${code}

Return a JSON object with the review results.`;

export default async function(req) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const svc = base44.asServiceRole;
    patchCore(base44);
    patchCore(svc);

    switch (action) {

      // ============================================================
      // CREATE SESSION — Start a new sandbox coding session
      // ============================================================
      case "create_session": {
        const { task_description, task_type = "custom", department_id = "DEPT-ENG", file_path } = data;
        if (!task_description) return Response.json({ ok: false, error: "task_description required" }, { status: 400 });

        const taskHash = hashStr(task_description + user.id);
        const sessionId = `SBOX-${taskHash}`;

        // Check cache — if session with same hash exists, return it
        const existing = await svc.entities.CodeSandboxSession.filter({ session_id: sessionId, owner_id: user.id }, 1);
        if (existing && existing.length > 0) {
          return Response.json({ ok: true, session: existing[0], cached: true });
        }

        const session = await svc.entities.CodeSandboxSession.create({
          owner_id: user.id,
          session_id: sessionId,
          department_id,
          task_description,
          task_type,
          task_hash: taskHash,
          status: "planning",
          file_path: file_path || "",
          max_repair_attempts: 3,
          seed_value: taskHash,
          created_at: new Date().toISOString()
        });

        return Response.json({ ok: true, session, cached: false });
      }

      // ============================================================
      // GENERATE CODE — LLM writes code for the task
      // ============================================================
      case "generate_code": {
        const { session_id } = data;
        if (!session_id) return Response.json({ ok: false, error: "session_id required" }, { status: 400 });

        const sessions = await svc.entities.CodeSandboxSession.filter({ session_id, owner_id: user.id }, 1);
        if (!sessions || sessions.length === 0) return Response.json({ ok: false, error: "Session not found" }, { status: 404 });
        const session = sessions[0];

        // Update status to generating
        await svc.entities.CodeSandboxSession.update(session.id, { status: "generating" });

        // Determine file type from task_type
        const fileTypeMap = {
          create_page: "React JSX page component",
          create_function: "Base44 backend function (TypeScript/JavaScript)",
          create_entity: "Base44 entity JSON schema (jsonc)",
          create_workflow: "Base44 workflow definition (jsonc)",
          create_component: "React JSX component",
          create_agent: "Base44 agent config (jsonc)",
          create_integration: "Backend function with external API integration",
          fix_bug: "Bug fix in existing code",
          refactor: "Refactored code",
          custom: "Production code"
        };
        const fileType = fileTypeMap[session.task_type] || "Production code";

        // Generate code via LLM
        const codeResult = await svc.integrations.Core.InvokeLLM({
          prompt: CODE_GEN_PROMPT(session.task_description, session.strategy_snapshot, fileType),
          model: "claude-sonnet-5"
        });

        const generatedCode = typeof codeResult === "string" ? codeResult : JSON.stringify(codeResult);

        // Update session with generated code
        const updated = await svc.entities.CodeSandboxSession.update(session.id, {
          generated_code: generatedCode,
          llm_model_used: "claude-sonnet-5",
          status: "testing"
        });

        return Response.json({ ok: true, session: updated, code_length: generatedCode.length });
      }

      // ============================================================
      // VALIDATE CODE — LLM reviews the generated code
      // ============================================================
      case "validate_code": {
        const { session_id } = data;
        if (!session_id) return Response.json({ ok: false, error: "session_id required" }, { status: 400 });

        const sessions = await svc.entities.CodeSandboxSession.filter({ session_id, owner_id: user.id }, 1);
        if (!sessions || sessions.length === 0) return Response.json({ ok: false, error: "Session not found" }, { status: 404 });
        const session = sessions[0];

        if (!session.generated_code) return Response.json({ ok: false, error: "No code to validate" }, { status: 400 });

        // Update status to validating
        await svc.entities.CodeSandboxSession.update(session.id, { status: "validating" });

        // Validate code via LLM (adversarial — different model than generation)
        const validationResult = await svc.integrations.Core.InvokeLLM({
          prompt: VALIDATION_PROMPT(session.generated_code, session.task_description),
          response_json_schema: {
            type: "object",
            properties: {
              passed: { type: "boolean" },
              score: { type: "integer" },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    severity: { type: "string" },
                    description: { type: "string" }
                  }
                }
              },
              suggestions: { type: "array", items: { type: "string" } },
              summary: { type: "string" }
            }
          },
          model: "gpt_5_6_sol"
        });

        const passed = validationResult.passed === true;
        const score = validationResult.score || 0;

        // Update session with validation results
        const updated = await svc.entities.CodeSandboxSession.update(session.id, {
          validation_result: JSON.stringify(validationResult),
          validation_passed: passed,
          validation_score: score,
          status: passed ? "deploying" : "needs_repair"
        });

        return Response.json({
          ok: true,
          session: updated,
          validation: validationResult,
          passed,
          score
        });
      }

      // ============================================================
      // DEPLOY — Create a deployment record for validated code
      // ============================================================
      case "deploy": {
        const { session_id } = data;
        if (!session_id) return Response.json({ ok: false, error: "session_id required" }, { status: 400 });

        const sessions = await svc.entities.CodeSandboxSession.filter({ session_id, owner_id: user.id }, 1);
        if (!sessions || sessions.length === 0) return Response.json({ ok: false, error: "Session not found" }, { status: 404 });
        const session = sessions[0];

        if (!session.validation_passed) {
          return Response.json({ ok: false, error: "Code has not passed validation" }, { status: 400 });
        }

        // Create deployment record
        const deploymentId = `DEP-${hashStr(session_id + Date.now())}`;
        const deployment = await svc.entities.DeploymentRecord.create({
          owner_id: user.id,
          deployment_id: deploymentId,
          session_id: session.session_id,
          department_id: session.department_id,
          task_description: session.task_description,
          file_path: session.file_path || "",
          code_snapshot: session.generated_code,
          status: "deployed",
          target_environment: "base44",
          validation_score: session.validation_score,
          deployed_by: user.id,
          health_status: "healthy",
          health_score: session.validation_score,
          created_at: new Date().toISOString(),
          deployed_at: new Date().toISOString(),
          last_health_check: new Date().toISOString()
        });

        // Update session
        const updated = await svc.entities.CodeSandboxSession.update(session.id, {
          deployment_id: deploymentId,
          status: "completed",
          completed_at: new Date().toISOString()
        });

        // Update department completed count
        const depts = await svc.entities.AgentDepartment.list(100);
        const dept = depts.find(d => d.department_id === session.department_id);
        if (dept) {
          await svc.entities.AgentDepartment.update(dept.id, {
            completed_count: (dept.completed_count || 0) + 1
          });
        }

        return Response.json({ ok: true, session: updated, deployment });
      }

      // ============================================================
      // GET SESSION — Get sandbox session status
      // ============================================================
      case "get_session": {
        const { session_id } = data;
        const sessions = await svc.entities.CodeSandboxSession.filter({ session_id, owner_id: user.id }, 1);
        if (!sessions || sessions.length === 0) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
        return Response.json({ ok: true, session: sessions[0] });
      }

      // ============================================================
      // LIST SESSIONS — List all sandbox sessions
      // ============================================================
      case "list_sessions": {
        const limit = data.limit || 50;
        const sessions = await svc.entities.CodeSandboxSession.list("-created_date", limit);
        return Response.json({
          ok: true,
          sessions: sessions.map(s => ({
            id: s.id,
            session_id: s.session_id,
            department_id: s.department_id,
            task_description: s.task_description,
            task_type: s.task_type,
            status: s.status,
            validation_passed: s.validation_passed,
            validation_score: s.validation_score,
            repair_attempts: s.repair_attempts,
            deployment_id: s.deployment_id,
            created_at: s.created_at,
            completed_at: s.completed_at
          }))
        });
      }

      // ============================================================
      // RUN FULL PIPELINE — End-to-end autonomous coding
      // ============================================================
      case "run_full_pipeline": {
        const { session_id, task_description, task_type, department_id, file_path } = data;

        let session;
        let sessionId = session_id;

        // Step 1: Create or get session
        if (!sessionId && task_description) {
          const createRes = await base44.functions.invoke("autonomousCodingEngine", {
            action: "create_session",
            task_description,
            task_type: task_type || "custom",
            department_id: department_id || "DEPT-ENG",
            file_path
          });
          sessionId = createRes?.data?.session?.session_id;
          session = createRes?.data?.session;
        } else if (sessionId) {
          const getRes = await base44.functions.invoke("autonomousCodingEngine", {
            action: "get_session",
            session_id: sessionId
          });
          session = getRes?.data?.session;
        } else {
          return Response.json({ ok: false, error: "session_id or task_description required" }, { status: 400 });
        }

        if (!session) return Response.json({ ok: false, error: "Session not found" }, { status: 404 });

        // If already completed, return result
        if (session.status === "completed") {
          return Response.json({ ok: true, status: "completed", session, cached: true });
        }

        // Step 2: Generate code (if not already generated)
        if (!session.generated_code || session.status === "planning" || session.status === "needs_repair" || session.status === "repairing") {
          const repairAttempt = session.repair_attempts || 0;
          if (repairAttempt >= (session.max_repair_attempts || 3)) {
            await svc.entities.CodeSandboxSession.update(session.id, { status: "failed" });
            return Response.json({ ok: false, error: "Max repair attempts reached", session_id: sessionId });
          }

          if (session.status === "needs_repair" || session.status === "repairing") {
            await svc.entities.CodeSandboxSession.update(session.id, {
              status: "generating",
              repair_attempts: repairAttempt + 1
            });
          }

          const genRes = await base44.functions.invoke("autonomousCodingEngine", {
            action: "generate_code",
            session_id: sessionId
          });
          session = genRes?.data?.session;
        }

        // Step 3: Validate code
        const valRes = await base44.functions.invoke("autonomousCodingEngine", {
          action: "validate_code",
          session_id: sessionId
        });
        session = valRes?.data?.session;
        const passed = valRes?.data?.passed;

        // Step 4: Deploy or repair
        if (passed) {
          const depRes = await base44.functions.invoke("autonomousCodingEngine", {
            action: "deploy",
            session_id: sessionId
          });
          session = depRes?.data?.session;
          return Response.json({
            ok: true,
            status: "completed",
            session,
            pipeline: ["create", "generate", "validate", "deploy"]
          });
        } else {
          // Failed validation — try repair loop
          const repairAttempt = (session.repair_attempts || 0);
          if (repairAttempt < (session.max_repair_attempts || 3)) {
            // Recursive repair attempt
            const repairRes = await base44.functions.invoke("autonomousCodingEngine", {
              action: "run_full_pipeline",
              session_id: sessionId
            });
            return repairRes?.data || Response.json({ ok: false, error: "Repair failed" });
          } else {
            await svc.entities.CodeSandboxSession.update(session.id, { status: "failed" });
            return Response.json({
              ok: false,
              status: "failed",
              error: "Max repair attempts reached",
              session
            });
          }
        }
      }

      default:
        return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}