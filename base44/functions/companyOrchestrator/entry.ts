import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { patchCore } from '../../shared/aiGateway.ts';

// ============================================================
// X1 AI Hub — Company Orchestrator
// Routes goals to departments, manages the autonomous company
// ============================================================

const DEPARTMENTS = [
  {
    department_id: "DEPT-EXEC",
    name: "Executive",
    department_type: "executive",
    description: "Strategic direction, company vision, and convergence oversight",
    lead_agent_config: "alpha_prime_orchestrator",
    agent_config_names: ["alpha_prime_orchestrator"],
    responsibilities: ["Set company goals", "Approve major decisions", "Convergence oversight", "Strategic planning"],
    integrations: ["supabase", "vercel"],
    kpi_targets: { convergence_score: 100, system_readiness: 95 }
  },
  {
    department_id: "DEPT-ENG",
    name: "Engineering",
    department_type: "engineering",
    description: "Code generation, system building, architecture, and bug fixing",
    lead_agent_config: "shadow",
    agent_config_names: ["shadow", "site_factory_manager"],
    responsibilities: ["Write code", "Build features", "Fix bugs", "System architecture", "Code review"],
    integrations: ["vercel", "supabase", "drive", "cloud_browser"],
    kpi_targets: { code_quality: 90, deployment_success_rate: 95, bug_fix_time_hours: 4 }
  },
  {
    department_id: "DEPT-QA",
    name: "Quality Assurance",
    department_type: "qa",
    description: "Testing, validation, benchmarks, and regression testing",
    lead_agent_config: "alpha_prime_orchestrator",
    agent_config_names: ["alpha_prime_orchestrator"],
    responsibilities: ["Run tests", "Validate code", "Check benchmarks", "Regression testing", "Postcondition validation"],
    integrations: ["supabase", "cloud_browser"],
    kpi_targets: { test_coverage: 90, validation_pass_rate: 95, regression_count: 0 }
  },
  {
    department_id: "DEPT-MKT",
    name: "Marketing",
    department_type: "marketing",
    description: "SEO, content creation, social media management, and brand building",
    lead_agent_config: "seo_manager",
    agent_config_names: ["seo_manager", "social_manager"],
    responsibilities: ["SEO optimization", "Content creation", "Social media management", "Brand building", "Lead magnets"],
    integrations: ["drive", "xtreme_comms"],
    kpi_targets: { seo_score: 85, content_volume: 50, social_engagement: 70 }
  },
  {
    department_id: "DEPT-SALES",
    name: "Sales",
    department_type: "sales",
    description: "Lead generation, outreach, conversion, and pipeline management",
    lead_agent_config: "lead_orchestrator",
    agent_config_names: ["lead_orchestrator"],
    responsibilities: ["Generate leads", "Follow up", "Convert prospects", "Pipeline management", "CRM sync"],
    integrations: ["xtreme_comms", "hubspot"],
    kpi_targets: { lead_count: 100, conversion_rate: 15, response_time_minutes: 5 }
  },
  {
    department_id: "DEPT-COMMS",
    name: "Communications",
    department_type: "communications",
    description: "SMS, email, voice, and multi-channel customer communication",
    lead_agent_config: "comms_manager",
    agent_config_names: ["comms_manager"],
    responsibilities: ["Send SMS/emails", "Manage voice", "Customer comms", "Follow-up automation", "Notification routing"],
    integrations: ["xtreme_comms", "gmail"],
    kpi_targets: { delivery_rate: 99, response_rate: 40, automation_coverage: 80 }
  },
  {
    department_id: "DEPT-REP",
    name: "Reputation",
    department_type: "reputation",
    description: "Review monitoring, reputation management, and customer satisfaction",
    lead_agent_config: "reputation_manager",
    agent_config_names: ["reputation_manager"],
    responsibilities: ["Monitor reviews", "Request reviews", "Manage reputation", "Customer satisfaction", "Sentiment analysis"],
    integrations: ["xtreme_comms"],
    kpi_targets: { review_count: 50, avg_rating: 4.5, response_rate: 90 }
  },
  {
    department_id: "DEPT-OPS",
    name: "Operations",
    department_type: "operations",
    description: "System orchestration, convergence, monitoring, and infrastructure",
    lead_agent_config: "swarm_orchestrator",
    agent_config_names: ["swarm_orchestrator", "system_operator"],
    responsibilities: ["Orchestrate swarm", "Monitor systems", "Ensure convergence", "Infrastructure management", "Health checks"],
    integrations: ["supabase", "vercel", "cloud_browser", "xtreme_comms"],
    kpi_targets: { uptime: 99.9, convergence_score: 100, incident_count: 0 }
  }
];

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
    patchCore(base44);
    patchCore(svc);

    switch (action) {

      // ============================================================
      // SEED DEPARTMENTS — Create default company org chart
      // ============================================================
      case "seed_departments": {
        const existing = await svc.entities.AgentDepartment.list(100);
        const existingIds = new Set(existing.map(d => d.department_id));
        const created = [];

        for (const dept of DEPARTMENTS) {
          if (!existingIds.has(dept.department_id)) {
            const rec = await svc.entities.AgentDepartment.create({
              ...dept,
              owner_id: user.id,
              active: true,
              created_at: new Date().toISOString()
            });
            created.push(rec);
          }
        }

        return Response.json({
          ok: true,
          seeded: created.length,
          total_departments: existing.length + created.length,
          created: created.map(d => ({ id: d.id, name: d.name, type: d.department_type }))
        });
      }

      // ============================================================
      // GET DEPARTMENTS — List all departments with stats
      // ============================================================
      case "get_departments": {
        const departments = await svc.entities.AgentDepartment.list(100);
        return Response.json({
          ok: true,
          departments: departments.map(d => ({
            id: d.id,
            department_id: d.department_id,
            name: d.name,
            type: d.department_type,
            description: d.description,
            lead: d.lead_agent_config,
            agents: d.agent_config_names,
            responsibilities: d.responsibilities,
            integrations: d.integrations,
            kpi_targets: d.kpi_targets,
            task_count: d.task_count || 0,
            completed_count: d.completed_count || 0,
            active: d.active
          }))
        });
      }

      // ============================================================
      // ANALYZE VISION — Orchestrator generates strategy options
      // ============================================================
      case "analyze_vision": {
        const { vision } = data;
        if (!vision) return Response.json({ ok: false, error: "Vision required" }, { status: 400 });

        const llmResult = await svc.integrations.Core.InvokeLLM({
          prompt: `You are the X1 AI Hub Orchestrator for Strategic Minds AI LLC — an autonomous AI company with specialized departments.
A user has submitted a vision. Analyze it and generate 3 distinct strategy options for achieving it.

Company departments:
${DEPARTMENTS.map(d => "- " + d.name + " (" + d.department_id + "): " + d.description + " — Capabilities: " + d.responsibilities.join(", ")).join("\n")}

Vision: "${vision}"

Generate 3 strategy options with genuinely different approaches:
1. AGILE — Fast, minimal viable execution, fewest steps
2. COMPREHENSIVE — Thorough, multi-department, high-quality
3. INNOVATIVE — Creative, experimental, cutting-edge

Each strategy must specify which departments are involved, the key phases, and the expected outcome.
Return a JSON object with the vision summary and an array of 3 strategies.`,
          response_json_schema: {
            type: "object",
            properties: {
              vision_summary: { type: "string" },
              strategies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    strategy_id: { type: "string" },
                    name: { type: "string" },
                    approach: { type: "string", enum: ["agile", "comprehensive", "innovative"] },
                    description: { type: "string" },
                    departments: { type: "array", items: { type: "string" } },
                    phases: { type: "array", items: { type: "string" } },
                    estimated_steps: { type: "integer" },
                    timeline: { type: "string" },
                    risk_level: { type: "string", enum: ["low", "medium", "high"] },
                    expected_outcome: { type: "string" }
                  }
                }
              }
            }
          }
        });

        return Response.json({
          ok: true,
          vision,
          vision_summary: llmResult.vision_summary,
          strategies: llmResult.strategies || []
        });
      }

      // ============================================================
      // EXECUTE STRATEGY — Orchestrator routes chosen strategy to departments
      // ============================================================
      case "execute_strategy": {
        const { vision, strategy } = data;
        if (!strategy) return Response.json({ ok: false, error: "Strategy required" }, { status: 400 });

        const llmResult = await svc.integrations.Core.InvokeLLM({
          prompt: `You are the X1 AI Hub Orchestrator. The user has chosen a strategy to execute.
Break it down into specific department tasks and route each to the appropriate department.

Vision: "${vision}"
Chosen Strategy: "${strategy.name}" — ${strategy.description}
Approach: ${strategy.approach}
Departments to involve: ${(strategy.departments || []).join(", ")}

For each department involved, create a specific actionable task with sub-tasks.
Return a JSON object with the execution plan and department tasks.`,
          response_json_schema: {
            type: "object",
            properties: {
              execution_plan: { type: "string" },
              department_tasks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    department_id: { type: "string" },
                    department_name: { type: "string" },
                    task_description: { type: "string" },
                    sub_tasks: { type: "array", items: { type: "string" } },
                    priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                    task_type: { type: "string" }
                  }
                }
              },
              total_tasks: { type: "integer" }
            }
          }
        });

        // Create sandbox sessions for each department task
        const sessions = [];
        const allDepts = await svc.entities.AgentDepartment.list(100);
        for (const task of (llmResult.department_tasks || [])) {
          const dept = DEPARTMENTS.find(d => d.department_id === task.department_id || d.name === task.department_name);
          const finalDeptId = dept ? dept.department_id : "DEPT-OPS";

          const session = await svc.entities.CodeSandboxSession.create({
            owner_id: user.id,
            session_id: "SBOX-" + hashStr(task.task_description + user.id + Date.now()),
            department_id: finalDeptId,
            task_description: task.task_description,
            task_type: task.task_type || "custom",
            task_hash: hashStr(task.task_description),
            status: "planning",
            strategy_snapshot: JSON.stringify({ vision, strategy, task }),
            created_at: new Date().toISOString()
          });
          sessions.push({ session_id: session.session_id, department: dept?.name || "Operations", task: task.task_description, priority: task.priority });

          const deptRec = allDepts.find(d => d.department_id === finalDeptId);
          if (deptRec) {
            await svc.entities.AgentDepartment.update(deptRec.id, {
              task_count: (deptRec.task_count || 0) + 1
            });
          }
        }

        return Response.json({
          ok: true,
          execution_plan: llmResult.execution_plan,
          department_tasks: llmResult.department_tasks,
          total_tasks: llmResult.total_tasks,
          sessions
        });
      }

      // ============================================================
      // GET COMPANY STATUS — Overall company health and metrics
      // ============================================================
      case "get_company_status": {
        const departments = await svc.entities.AgentDepartment.list(100);
        const sessions = await svc.entities.CodeSandboxSession.list("-created_date", 50);
        const deployments = await svc.entities.DeploymentRecord.list("-created_date", 20);

        const activeSessions = sessions.filter(s => !["completed", "failed"].includes(s.status));
        const completedSessions = sessions.filter(s => s.status === "completed");
        const failedSessions = sessions.filter(s => s.status === "failed");
        const deployedCount = deployments.filter(d => d.status === "deployed").length;
        const healthyDeployments = deployments.filter(d => d.health_status === "healthy").length;

        const totalTasks = departments.reduce((sum, d) => sum + (d.task_count || 0), 0);
        const totalCompleted = departments.reduce((sum, d) => sum + (d.completed_count || 0), 0);

        const integrations = {
          supabase: { connected: true, label: "Supabase" },
          vercel: { connected: !!process.env.VERCEL_API_TOKEN, label: "Vercel" },
          drive: { connected: true, label: "Google Drive" },
          xtreme_comms: { connected: !!process.env.XTREME_COMMUNICATION_API_KEY, label: "Xtreme Communications" },
          cloud_browser: { connected: !!process.env.CLOUD_BROWSER_ENGINE_URL, label: "Xtreme Cloud Browser" },
          gmail: { connected: true, label: "Gmail" },
          hubspot: { connected: true, label: "HubSpot" }
        };

        return Response.json({
          ok: true,
          company: {
            total_departments: departments.length,
            active_departments: departments.filter(d => d.active).length,
            total_agents: departments.reduce((sum, d) => sum + (d.agent_config_names?.length || 0), 0),
            total_tasks: totalTasks,
            completed_tasks: totalCompleted,
            completion_rate: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0
          },
          pipeline: {
            active_sessions: activeSessions.length,
            completed_sessions: completedSessions.length,
            failed_sessions: failedSessions.length,
            total_deployments: deployments.length,
            deployed: deployedCount,
            healthy: healthyDeployments
          },
          integrations
        });
      }

      // ============================================================
      // RUN COMPANY CYCLE — Process pending tasks autonomously
      // ============================================================
      case "run_company_cycle": {
        const sessions = await svc.entities.CodeSandboxSession.list(50);
        const pending = sessions.filter(s => ["planning", "needs_repair", "repairing"].includes(s.status));

        const results = [];
        for (const session of pending) {
          try {
            const result = await base44.functions.invoke("autonomousCodingEngine", {
              action: "run_full_pipeline",
              session_id: session.session_id
            });
            results.push({
              session_id: session.session_id,
              status: result?.data?.status || "unknown",
              department: session.department_id
            });
          } catch (e) {
            results.push({
              session_id: session.session_id,
              status: "error",
              error: e.message
            });
          }
        }

        return Response.json({
          ok: true,
          processed: pending.length,
          results
        });
      }

      default:
        return Response.json({ ok: false, error: "Unknown action: " + action }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}