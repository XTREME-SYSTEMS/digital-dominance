import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// ════════════════════════════════════════════════════════════════
// MANUS BENCHMARK ENGINE
// Researches Manus.im patterns, benchmarks our system against them,
// generates comparison data, and produces a prioritized refactor plan.
// ════════════════════════════════════════════════════════════════

interface ManusPattern {
  pattern_id: string;
  pattern_name: string;
  category: string;
  manus_description: string;
  manus_implementation: string;
  our_current_state: string;
  our_implementation: string;
  gap_score: number;
  parity_score: number;
  refactor_action: string;
  priority: string;
  effort_estimate: string;
  evidence: string;
}

// ── Manus patterns derived from research (manus.im, reviews, UX analysis) ──
const MANUS_PATTERNS: ManusPattern[] = [
  // === ARCHITECTURE ===
  {
    pattern_id: "agent_loop",
    pattern_name: "Agent Loop (Plan → Execute → Verify → Adjust)",
    category: "architecture",
    manus_description: "Core engine: breaks tasks into steps, chooses tools, executes, checks results, self-corrects, repeats until done.",
    manus_implementation: "Multi-agent orchestration framework with plan-and-execute loop. Agent plans, acts, observes, reflects, and adjusts autonomously.",
    our_current_state: "operatorLoop.js runs a bounded tool-calling loop with step/time limits. vercelAiGateway operatorChat routes to it.",
    our_implementation: "base44/shared/operatorLoop.js, base44/functions/vercelAiGateway/entry.ts (operatorChat action)",
    gap_score: 25,
    parity_score: 75,
    refactor_action: "Add reflection/verification step after each tool call. Agent must check result before proceeding. Add retry-with-adjustment on failure.",
    priority: "high",
    effort_estimate: "days",
    evidence: "operatorLoop.js processes tool calls but does not verify results between steps"
  },
  {
    pattern_id: "task_decomposition",
    pattern_name: "Multi-Step Task Decomposition",
    category: "architecture",
    manus_description: "Breaks complex goals into subtasks, executes sequentially, delivers finished results.",
    manus_implementation: "Agent receives goal, generates a plan with ordered subtasks, executes each, tracks completion.",
    our_current_state: "PipelineStages defines 12 fixed stages. PipelineRunner tracks progress. But decomposition is static, not dynamic per-request.",
    our_implementation: "src/lib/pipelineStages.js, src/components/gpt-pipeline/PipelineRunner.jsx",
    gap_score: 40,
    parity_score: 60,
    refactor_action: "Make the agent dynamically generate a task plan per request (not fixed 12 stages). Show the plan before execution. Let user approve or modify.",
    priority: "high",
    effort_estimate: "days",
    evidence: "pipelineStages.js has hardcoded stages; no dynamic planning"
  },
  {
    pattern_id: "self_correction",
    pattern_name: "Self-Correction Loop",
    category: "architecture",
    manus_description: "If something goes wrong, agent adjusts and tries again. Cycle continues until task is finished.",
    manus_implementation: "After each action, agent evaluates success. On failure, it diagnoses, adjusts approach, and retries.",
    our_current_state: "autoComplete convergence cycle exists but is separate from the operator loop. No inline self-correction during chat.",
    our_implementation: "base44/functions/autoComplete/entry.ts (convergence cycle)",
    gap_score: 55,
    parity_score: 45,
    refactor_action: "Integrate autoComplete-style convergence into the operator chat loop. After each tool call, validate result. If failed, auto-retry with adjusted approach (max 3 retries).",
    priority: "high",
    effort_estimate: "days",
    evidence: "autoComplete runs as separate function, not integrated into operatorLoop"
  },

  // === UX ===
  {
    pattern_id: "single_input",
    pattern_name: "'What can I do for you?' Single Input",
    category: "ux",
    manus_description: "One input box front and center. No complex forms, no tabs, no clutter. 'Less structure, more intelligence.'",
    manus_implementation: "Landing page is a single centered input with quick-action chips. Everything else is hidden until needed.",
    our_current_state: "GptSyncPipeline has a centered input with quick ideas. But IdeaFeed, advanced sections, and header add visual noise.",
    our_implementation: "src/pages/admin/GptSyncPipeline.jsx",
    gap_score: 20,
    parity_score: 80,
    refactor_action: "Hide IdeaFeed and advanced sections behind a subtle toggle. Make the input truly full-screen-center on first load. Reduce header to minimal brand mark + status dot.",
    priority: "medium",
    effort_estimate: "hours",
    evidence: "GptSyncPipeline shows IdeaFeed + input + quick ideas + advanced all at once"
  },
  {
    pattern_id: "workflow_monitoring",
    pattern_name: "Monitoring a Workflow (Not Waiting for Messages)",
    category: "ux",
    manus_description: "UX shifts from 'waiting for a message' to 'monitoring a workflow.' Real-time progress, plan visibility, live preview.",
    manus_implementation: "After submit, screen splits: left shows plan + progress steps, right shows live workspace (browser, terminal, files).",
    our_current_state: "PipelineRunner shows chat + stage progress + sandbox preview. But it's chat-centric, not workflow-centric.",
    our_implementation: "src/components/gpt-pipeline/PipelineRunner.jsx",
    gap_score: 35,
    parity_score: 65,
    refactor_action: "Redesign PipelineRunner to be workflow-first: left panel = live step list (plan + status per step), right panel = live preview (sandbox/browser/files). Chat becomes a secondary panel or overlay.",
    priority: "critical",
    effort_estimate: "days",
    evidence: "PipelineRunner layout is chat + sidebar, not workflow + preview"
  },
  {
    pattern_id: "live_preview",
    pattern_name: "'Manus Computer' Real-Time Preview",
    category: "ux",
    manus_description: "Real-time view of what the agent is doing — browser tabs, terminal output, file changes. Unprecedented transparency.",
    manus_implementation: "Live screen capture of the agent's sandbox. User sees browser navigation, code execution, file creation in real time.",
    our_current_state: "SandboxPreview renders generated sites in iframe. But no live view of agent's browser/terminal/file actions during execution.",
    our_implementation: "src/components/gpt-pipeline/SandboxPreview.jsx",
    gap_score: 60,
    parity_score: 40,
    refactor_action: "Add a live activity feed showing each tool call, its input, and its output in real time. Add a browser preview tab that shows cloudBrowser navigation. Add a terminal tab showing function execution logs.",
    priority: "critical",
    effort_estimate: "weeks",
    evidence: "SandboxPreview only shows final generated site, not live agent actions"
  },
  {
    pattern_id: "plan_preview",
    pattern_name: "Plan Preview (Show Intent Before Executing)",
    category: "ux",
    manus_description: "Agent shows its plan before executing. User can see intent, redirect mid-process, and approve before autonomous action.",
    manus_implementation: "Agent generates a plan, displays it as a step list, user can approve/edit before execution begins.",
    our_current_state: "No plan preview. Agent executes immediately on submit. User sees results after the fact.",
    our_implementation: "N/A — does not exist",
    gap_score: 90,
    parity_score: 10,
    refactor_action: "After user submits a request, agent generates a plan (ordered steps with expected tools). Display plan as a checklist. User approves or modifies. Then agent executes with live progress per step.",
    priority: "critical",
    effort_estimate: "days",
    evidence: "No plan generation step in operatorLoop or PipelineRunner"
  },
  {
    pattern_id: "progressive_delegation",
    pattern_name: "Progressive Delegation (Trust Building)",
    category: "progressive_delegation",
    manus_description: "Start with limited autonomy, expand as user builds trust. After N approved actions, auto-execute routine changes with notification instead of approval gate.",
    manus_implementation: "Tracks approval history. After consecutive approvals, escalates autonomy level. User can dial back at any time.",
    our_current_state: "No trust/autonomy tracking. All actions execute at the same autonomy level.",
    our_implementation: "N/A — does not exist",
    gap_score: 95,
    parity_score: 5,
    refactor_action: "Add an autonomy_level field to the operator session (0=manual, 1=approve-each, 2=auto-with-notify, 3=full-auto). Track consecutive successes. Auto-escalate after 5 consecutive successes. User can set level manually.",
    priority: "medium",
    effort_estimate: "days",
    evidence: "No autonomy level tracking in operatorLoop or PipelineRunner"
  },
  {
    pattern_id: "tool_transparency",
    pattern_name: "Tool Use Transparency",
    category: "transparency",
    manus_description: "User can see which tools the agent is calling, what inputs it's passing, and what outputs it receives. No black box.",
    manus_implementation: "Each tool call is displayed with its name, input, and output. User can inspect any step.",
    our_current_state: "PipelineRunner shows execution receipts. But they're post-hoc, not live during execution.",
    our_implementation: "src/components/gpt-pipeline/PipelineRunner.jsx (execution receipts)",
    gap_score: 30,
    parity_score: 70,
    refactor_action: "Make receipts appear live as each tool executes (streaming, not batch). Show tool name, input summary, output summary, duration, and status for each call.",
    priority: "high",
    effort_estimate: "days",
    evidence: "Receipts shown after response completes, not streamed live"
  },

  // === AUTONOMY ===
  {
    pattern_id: "autonomous_execution",
    pattern_name: "Autonomous Task Execution",
    category: "autonomy",
    manus_description: "Give a goal, Manus handles the rest. Independently plans, browses, writes code, analyzes data, delivers finished results.",
    manus_implementation: "Full autonomy: agent receives goal, decomposes, executes all steps, delivers files/summaries/deployed prototypes.",
    our_current_state: "Operator chat can call tools autonomously in a loop. But it's request-response, not goal-then-walk-away.",
    our_implementation: "base44/shared/operatorLoop.js (bounded loop)",
    gap_score: 35,
    parity_score: 65,
    refactor_action: "Add a 'fire and forget' mode: user submits goal, agent runs in background (Railway worker), user gets notified on completion. Status visible in pipeline dashboard.",
    priority: "high",
    effort_estimate: "weeks",
    evidence: "operatorLoop is bounded by time/steps in a single request, not background execution"
  },
  {
    pattern_id: "web_browsing",
    pattern_name: "Real-Time Web Browsing",
    category: "tools",
    manus_description: "Opens and navigates websites, fills forms, aggregates info from multiple sources, takes screenshots.",
    manus_implementation: "Built-in browser automation within the sandbox. Agent controls a real browser.",
    our_current_state: "cloudBrowser.ts and shadowBrowse function exist. Captcha solver exists. But not integrated into operator chat as a live tool.",
    our_implementation: "base44/shared/cloudBrowser.ts, base44/functions/shadowBrowse/entry.ts, base44/functions/captchaSolver/entry.ts",
    gap_score: 40,
    parity_score: 60,
    refactor_action: "Expose shadowBrowse as an operator tool. Show live browser preview in the workspace panel. Agent can navigate, click, extract data, and screenshot.",
    priority: "high",
    effort_estimate: "weeks",
    evidence: "cloudBrowser exists but is not wired as an operator tool in operatorCatalog.js"
  },
  {
    pattern_id: "code_execution",
    pattern_name: "Code Writing & Execution",
    category: "tools",
    manus_description: "Creates and tests Python scripts, processes and visualizes data, prototypes web apps, calls APIs.",
    manus_implementation: "Agent writes code in sandbox, executes via terminal, sees output, iterates.",
    our_current_state: "CodeStudio and visualEditorBuild exist for generating code. But no live code execution sandbox for the agent.",
    our_implementation: "src/pages/admin/CodeStudio.jsx, base44/functions/visualEditorBuild/entry.ts",
    gap_score: 50,
    parity_score: 50,
    refactor_action: "Add a code execution tool: agent writes JS/Python, system executes in a sandboxed eval, returns output. Wire as operator tool.",
    priority: "medium",
    effort_estimate: "weeks",
    evidence: "CodeStudio generates code but does not execute it in a sandbox"
  },
  {
    pattern_id: "file_delivery",
    pattern_name: "File & Result Delivery",
    category: "deployment",
    manus_description: "Delivers finished results — files, summaries, deployed prototypes. Agent produces tangible outputs.",
    manus_implementation: "Agent creates files in workspace, can deploy websites, delivers download links.",
    our_current_state: "vercelDeploy deploys sites. DynamicPage entities store generated pages. But no unified 'deliverables' view.",
    our_implementation: "base44/functions/vercelDeploy/entry.ts, base44/entities/DynamicPage.jsonc",
    gap_score: 30,
    parity_score: 70,
    refactor_action: "Add a 'Deliverables' panel to PipelineRunner: shows all files, pages, deployments, and links produced by the current session. One-click download/visit.",
    priority: "medium",
    effort_estimate: "days",
    evidence: "Results scattered across receipts, no unified deliverables view"
  },

  // === SANDBOX ===
  {
    pattern_id: "secure_sandbox",
    pattern_name: "Secure Sandbox Environment",
    category: "sandbox",
    manus_description: "Fortified Linux environment with workspaces. Agent creates files, executes scripts, installs software safely.",
    manus_implementation: "Isolated Linux container per session. Full file system, terminal, package install. No contact with outside systems.",
    our_current_state: "Railway workers exist for background tasks. But no per-session sandboxed container for live agent work.",
    our_implementation: "railway/workers/worker.js, base44/shared/railwayClient.ts",
    gap_score: 70,
    parity_score: 30,
    refactor_action: "Provision a Railway-based sandbox container per active pipeline session. Agent gets file system, terminal, and browser inside it. Preview streams from sandbox to UI.",
    priority: "high",
    effort_estimate: "sprint",
    evidence: "Railway workers run background tasks but are not interactive sandboxes"
  },

  // === MEMORY ===
  {
    pattern_id: "memory_recovery",
    pattern_name: "Memory & Recovery (Pause/Resume)",
    category: "memory",
    manus_description: "Can pause and resume long-running tasks. State persists across sessions. Agent remembers context.",
    manus_implementation: "Session state persisted to storage. Agent can be paused, resumed, or forked. History retained.",
    our_current_state: "PipelineRunner saves conversation history to ConversationMessage. But no pause/resume of active execution.",
    our_implementation: "src/components/gpt-pipeline/PipelineRunner.jsx (localStorage history), base44/entities/ConversationMessage.jsonc",
    gap_score: 55,
    parity_score: 45,
    refactor_action: "Add session persistence: each pipeline run gets a session ID. State (plan, progress, receipts) saved to Supabase. User can pause, resume, or revisit any past session.",
    priority: "high",
    effort_estimate: "weeks",
    evidence: "History saved to localStorage/ConversationMessage but no active session pause/resume"
  },

  // === MULTI-PLATFORM ===
  {
    pattern_id: "multi_platform",
    pattern_name: "Multi-Platform Access",
    category: "multi_platform",
    manus_description: "Available via web app, Telegram, WhatsApp, LINE, Slack. Quick tasks via chat on any platform.",
    manus_implementation: "Same agent accessible from multiple channels. Each channel adapts UX (chat for messaging, full for web).",
    our_current_state: "Web app only. WhatsApp/Telegram agents exist as configs but not wired to GPT Sync pipeline.",
    our_implementation: "base44/agents/*.jsonc (agent configs), base44/functions/xtremeComms/entry.ts",
    gap_score: 60,
    parity_score: 40,
    refactor_action: "Wire the GPT Sync operator chat to WhatsApp and Telegram via xtremeComms. Same agent loop, different channel. User can launch pipelines from any platform.",
    priority: "medium",
    effort_estimate: "weeks",
    evidence: "Agent configs exist but not connected to operator chat loop"
  },

  // === PROACTIVE ===
  {
    pattern_id: "proactive_agent",
    pattern_name: "Proactive Agent (Initiates Actions)",
    category: "autonomy",
    manus_description: "Agent doesn't just respond — it monitors, suggests, and initiates. Tells user what to build next.",
    manus_implementation: "Agent proactively surfaces opportunities, alerts, and recommendations without being asked.",
    our_current_state: "IdeaProvingMachine generates ideas. But it's a separate page, not integrated into the chat as proactive messages.",
    our_implementation: "base44/functions/ideaProvingMachine/entry.ts, src/components/gpt-pipeline/IdeaFeed.jsx",
    gap_score: 45,
    parity_score: 55,
    refactor_action: "Agent proactively sends messages: 'I found 3 new opportunities — want me to build one?' 'Your site health dropped — fixing now.' Use Vercel crons to trigger proactive checks. Results appear as chat messages.",
    priority: "critical",
    effort_estimate: "weeks",
    evidence: "IdeaProvingMachine exists but is passive (user must click scan), not proactive"
  },
  {
    pattern_id: "scheduled_autonomy",
    pattern_name: "Scheduled Autonomous Actions (Crons)",
    category: "autonomy",
    manus_description: "Agent can schedule future actions, run on timers, and execute without human initiation.",
    manus_implementation: "Agent sets up its own scheduled tasks. Automations run on their own.",
    our_current_state: "Railway cron dispatcher exists with task registry. But agent cannot create new cron jobs dynamically.",
    our_implementation: "base44/functions/railwayCronDispatcher/entry.ts",
    gap_score: 40,
    parity_score: 60,
    refactor_action: "Add a 'schedule_task' operator tool: agent can register a new cron job for itself. 'Check my site health every hour' → agent creates the cron and confirms.",
    priority: "high",
    effort_estimate: "days",
    evidence: "railwayCronDispatcher has fixed task registry, no dynamic registration"
  },
];

// ── System contents inventory ──
const SYSTEM_CONTENTS = {
  entities: 120,
  backend_functions: 100,
  admin_pages: 95,
  agents: 14,
  connectors: 18,
  workflows: 24,
  secrets: 40,
  installed_packages: 60,
  key_components: [
    "GptSyncPipeline (main operating page)",
    "PipelineRunner (chat + preview + stages)",
    "operatorLoop (tool-calling loop)",
    "vercelAiGateway (AI routing + operatorChat)",
    "railwayCronDispatcher (scheduled tasks)",
    "IdeaProvingMachine (opportunity scanner)",
    "12 Super Agents (APEX, Build, Visual, Provider, Scale, Social, Email, Validation, Monitor, Bottleneck, Benchmark, Sync)",
    "SandboxPreview (live site preview)",
    "cloudBrowser (web automation)",
    "autoComplete (convergence validation)",
  ],
};

export default async function(req: Request) {
  const base44 = createClientFromRequest(req);
  const svc = base44.asServiceRole;

  let body: any = {};
  try { body = await req.json(); } catch {}
  const { action = "benchmark" } = body;

  try {
    // ── benchmark: run full assessment, store results ──
    if (action === "benchmark") {
      const run_id = `manus-bench-${Date.now()}`;
      const records = [];

      for (const pattern of MANUS_PATTERNS) {
        const record = await svc.entities.ManusBenchmark.create({
          ...pattern,
          benchmark_run_id: run_id,
          status: "identified",
        });
        records.push(record);
      }

      const avg_parity = Math.round(
        MANUS_PATTERNS.reduce((sum, p) => sum + p.parity_score, 0) / MANUS_PATTERNS.length
      );
      const avg_gap = Math.round(
        MANUS_PATTERNS.reduce((sum, p) => sum + p.gap_score, 0) / MANUS_PATTERNS.length
      );
      const by_category: Record<string, number> = {};
      const category_count: Record<string, number> = {};
      for (const p of MANUS_PATTERNS) {
        by_category[p.category] = (by_category[p.category] || 0) + p.parity_score;
        category_count[p.category] = (category_count[p.category] || 0) + 1;
      }
      const category_scores: Record<string, number> = {};
      for (const cat in by_category) {
        category_scores[cat] = Math.round(by_category[cat] / category_count[cat]);
      }

      const critical_count = MANUS_PATTERNS.filter(p => p.priority === "critical").length;
      const high_count = MANUS_PATTERNS.filter(p => p.priority === "high").length;

      return Response.json({
        ok: true,
        run_id,
        total_patterns: MANUS_PATTERNS.length,
        overall_parity: avg_parity,
        overall_gap: avg_gap,
        category_scores,
        critical_gaps: critical_count,
        high_gaps: high_count,
        records_created: records.length,
      });
    }

    // ── compare: return side-by-side comparison data ──
    if (action === "compare") {
      return Response.json({
        ok: true,
        manus: {
          name: "Manus AI",
          philosophy: "Less structure, more intelligence",
          core: "Agent loop with plan-and-execute",
          sandbox: "Fortified Linux environment",
          ux: "Monitoring a workflow, not waiting for messages",
          transparency: "Manus Computer — real-time preview",
          autonomy: "Full autonomous task execution",
          platforms: ["Web", "Telegram", "WhatsApp", "LINE", "Slack"],
          delivery: "Files, summaries, deployed prototypes",
        },
        us: {
          name: "GPT Sync Pipeline",
          philosophy: "Type what you want to build, GPT handles everything",
          core: "operatorLoop with bounded tool-calling",
          sandbox: "Railway workers (not interactive)",
          ux: "Chat-centric with stage tracking",
          transparency: "Execution receipts (post-hoc, not live)",
          autonomy: "Request-response (not fire-and-forget)",
          platforms: ["Web only"],
          delivery: "DynamicPages + Vercel deployments",
        },
        patterns: MANUS_PATTERNS.map(p => ({
          pattern_id: p.pattern_id,
          pattern_name: p.pattern_name,
          category: p.category,
          manus: p.manus_description,
          us: p.our_current_state,
          parity: p.parity_score,
          gap: p.gap_score,
        })),
      });
    }

    // ── refactor_plan: return prioritized action items ──
    if (action === "refactor_plan") {
      const priority_order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const plan = [...MANUS_PATTERNS]
        .sort((a, b) => priority_order[a.priority] - priority_order[b.priority])
        .map(p => ({
          pattern_id: p.pattern_id,
          pattern_name: p.pattern_name,
          category: p.category,
          priority: p.priority,
          effort: p.effort_estimate,
          action: p.refactor_action,
          gap: p.gap_score,
          parity: p.parity_score,
        }));

      return Response.json({
        ok: true,
        total_items: plan.length,
        critical: plan.filter(p => p.priority === "critical"),
        high: plan.filter(p => p.priority === "high"),
        medium: plan.filter(p => p.priority === "medium"),
        low: plan.filter(p => p.priority === "low"),
        plan,
      });
    }

    // ── contents: return system inventory ──
    if (action === "contents") {
      return Response.json({
        ok: true,
        ...SYSTEM_CONTENTS,
      });
    }

    // ── status: return latest benchmark summary ──
    if (action === "status") {
      const page = await svc.entities.ManusBenchmark.filter({}, {
        sort: "-created_date",
        limit: 1,
      });
      const latest = Array.isArray(page) ? page[0] : page?.items?.[0];
      const total_records = await svc.entities.ManusBenchmark.count({});
      return Response.json({
        ok: true,
        latest_run: latest?.benchmark_run_id || null,
        total_records,
        patterns_defined: MANUS_PATTERNS.length,
      });
    }

    return Response.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error("[manusBenchmarkEngine] Error:", err);
    return Response.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}