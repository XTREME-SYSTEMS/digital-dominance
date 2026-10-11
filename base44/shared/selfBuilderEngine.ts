import { generateText, completeGateway } from './aiGateway.ts';
import { operatorInstructions, operatorEntities, operatorFunctions } from './operatorCatalog.js';

// Minimal tool definitions for the operator (defined locally to avoid cross-module import issues)
const fn = (name: string, description: string, properties: any, required: string[] = []) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required, additionalProperties: false } },
});
const operatorTools = [
  fn('read_entities', 'Read records using a server-side query.', { entity: { type: 'string', enum: operatorEntities }, query: { type: 'object' } }, ['entity']),
  fn('write_entity', 'Create, update, or delete one record.', { entity: { type: 'string', enum: operatorEntities.filter((x: string) => x !== 'User') }, operation: { type: 'string', enum: ['create', 'update', 'delete'] }, id: { type: 'string' }, data: { type: 'object' } }, ['entity', 'operation']),
  fn('invoke_function', 'Execute a backend function with its payload.', { function_name: { type: 'string', enum: Object.keys(operatorFunctions) }, payload: { type: 'object' } }, ['function_name', 'payload']),
];

// ═══════════════════════════════════════════════════════════════════════════
// selfBuilderEngine — The Plan-Execute-Verify-Adjust (PEVA) loop.
//
// This is the "robot that builds robots" engine. It:
//   1. PLAN     — GPT generates a structured plan from the user's prompt
//   2. EXECUTE  — Each step is dispatched to the operator (which routes to agents)
//   3. VERIFY   — After each step, GPT judges the output against expected results
//   4. ADJUST   — If verification fails, the failures become the next prompt
//   5. VALIDATE — Final 100-point validation gate before release
//
// The failures are the fuel. The system feeds its own mistakes back to itself.
// You feed the initial prompt. The system builds itself.
//
// All AI calls route through Vercel AI Gateway (bypasses Base44 credits).
// ═══════════════════════════════════════════════════════════════════════════

const PLANNER_MODEL = 'openai/gpt-5.4';
const VERIFIER_MODEL = 'openai/gpt-5.4';
const OPERATOR_MODEL = 'openai/gpt-5.4';

const MAX_RETRIES_PER_STEP = 2;
const MAX_PLAN_STEPS = 12;
const MAX_TOTAL_ITERATIONS = 30;

// ─── PHASE 1: PLAN ────────────────────────────────────────────────────────
// GPT generates a structured plan. Not hardcoded — dynamic per request,
// but constrained to the universal pipeline pattern.

export async function generatePlan(prompt: string): Promise<any> {
  const systemPrompt = `You are the Universal Plan Generator for an autonomous digital dominance engine.

Given a user's prompt, generate a structured execution plan. The plan must follow this universal pattern but adapt the specific steps to the request:

UNIVERSAL PATTERN (use these phases, skip any that don't apply):
1. RESEARCH — understand the market, competitors, opportunity
2. STRATEGY — generate business strategies, name, positioning
3. BRAND — logo, colors, fonts, tagline, domain
4. DESIGN — visual concepts, layout, hero, sections
5. BUILD — write the actual website/app code
6. CONTENT — all copy, SEO meta, schema
7. SOCIAL — 30-day calendar, videos, images
8. PROVISION — Vercel, GitHub, Supabase, Google, domain
9. DOMINANCE — programmatic SEO, location pages, AEO/GEO
10. VALIDATE — 100-point checklist, 3x pass
11. DEPLOY — ship to production
12. REPORT — email summary with URL and checklist

For each step, specify:
- step_number: sequential
- phase: one of the universal phases above
- title: short name
- agent: which super agent handles this (ApexOrchestrator, BuildFactory, VisualFactory, ProviderAdapters, ScaleFleet, SocialMediaManager, EmailManager, ValidationGuardian, SystemMonitor, BottleneckHunter, BenchmarkScout, SyncGuardian)
- task: the specific instruction for this step
- expected_output: what a successful output looks like
- validation_criteria: how to verify the output is correct
- function_hint: which backend function to call (from the operator catalog)

Rules:
- Be specific. "Build a website" is not a task. "Generate a React hero section with the business name, tagline, and CTA button" is.
- Every step must have measurable validation criteria.
- Order matters — don't build before you design, don't deploy before you validate.
- If the request is simple (e.g., "research competitors"), the plan can be 1-3 steps. If it's complex ("build and deploy a full digital presence"), it can be up to 12.
- Never skip validation. The last execution step before deploy is always VALIDATE.

Return JSON only.`;

  const { parsed } = await generateText({
    prompt,
    system_prompt: systemPrompt,
    model: PLANNER_MODEL,
    response_json_schema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step_number: { type: 'number' },
              phase: { type: 'string' },
              title: { type: 'string' },
              agent: { type: 'string' },
              task: { type: 'string' },
              expected_output: { type: 'string' },
              validation_criteria: { type: 'string' },
              function_hint: { type: 'string' },
            },
          },
        },
      },
    },
  });

  return parsed;
}

// ─── PHASE 2: EXECUTE (single step) ───────────────────────────────────────
// Dispatch one step to the operator. The operator uses its tools to call
// the right backend function. Returns the raw result + receipts.

export async function executeStep(step: any, base44: any): Promise<{ result: any; receipts: any[] }> {
  // Build the operator message from the step
  const operatorMessage = `Execute step ${step.step_number}: ${step.title}

Agent: ${step.agent}
Task: ${step.task}
Expected output: ${step.expected_output}
Suggested function: ${step.function_hint}

Use the invoke_function tool to call the suggested function (or a better one if you judge it fits). Read the function's action/payload from the task description. Return the result.`;

  // Use the operator loop (simplified — single tool call expected)
  const response = await completeGateway({
    model: OPERATOR_MODEL,
    messages: [
      { role: 'system', content: `${operatorInstructions}\n\nYou are executing a single step of a larger plan. Use the tools available. Be concise. Call the function and report the result.` },
      { role: 'user', content: operatorMessage },
    ],
    tools: operatorTools,
    tool_choice: 'auto',
    max_tokens: 5000,
  });

  const assistant = response.choices?.[0]?.message;
  const receipts: any[] = [];

  if (assistant?.tool_calls?.length) {
    for (const call of assistant.tool_calls) {
      const receipt: any = { tool: call.function?.name, status: 'failed', step: step.step_number };
      try {
        const args = JSON.parse(call.function.arguments || '{}');
        let result;
        if (call.function.name === 'invoke_function') {
          result = await base44.functions.invoke(args.function_name, args.payload);
          result = result?.data || result;
        } else if (call.function.name === 'read_entities') {
          const page = await base44.entities[args.entity]?.filter(args.query || {}, { limit: 10 });
          result = page?.items || page || [];
        } else if (call.function.name === 'write_entity') {
          if (args.operation === 'create') result = await base44.entities[args.entity]?.create(args.data);
          else if (args.operation === 'update') result = await base44.entities[args.entity]?.update(args.id, args.data);
          else if (args.operation === 'delete') result = await base44.entities[args.entity]?.delete(args.id);
        }
        receipt.status = 'completed';
        receipt.target = args.function_name || args.entity;
        receipt.detail = typeof result === 'string' ? result.slice(0, 500) : JSON.stringify(result).slice(0, 500);
        receipt.result = result;
      } catch (error: any) {
        receipt.detail = error.message;
      }
      receipts.push(receipt);
    }
  }

  const text = assistant?.content || '';
  return { result: { text, receipts }, receipts };
}

// ─── PHASE 3: VERIFY ──────────────────────────────────────────────────────
// GPT judges whether the step's output meets the expected result.
// Returns { verified: boolean, reason: string, fix_prompt: string|null }

export async function verifyStep(step: any, executionResult: any): Promise<{ verified: boolean; reason: string; fix_prompt: string | null }> {
  const receiptsSummary = executionResult.receipts.map((r: any) =>
    `[${r.status}] ${r.tool}: ${r.target || ''} — ${r.detail || ''}`
  ).join('\n');

  const verifyPrompt = `You are the Verification Guardian. Judge whether this step's execution met its goal.

STEP ${step.step_number}: ${step.title}
Task: ${step.task}
Expected output: ${step.expected_output}
Validation criteria: ${step.validation_criteria}

EXECUTION RESULT:
${receiptsSummary}
${executionResult.result?.text || ''}

Judge:
1. Did the execution produce the expected output? (yes/no)
2. If no, what specifically is missing or wrong?
3. If no, what exact instruction would fix it? (the fix prompt)

Be strict. "Maybe" is a no. A failed tool call is a no. An empty result is a no.
Only "yes" if the receipts show completed operations that match the expected output.

Return JSON: { "verified": boolean, "reason": string, "fix_prompt": string|null }`;

  const { parsed } = await generateText({
    prompt: verifyPrompt,
    model: VERIFIER_MODEL,
    response_json_schema: {
      type: 'object',
      properties: {
        verified: { type: 'boolean' },
        reason: { type: 'string' },
        fix_prompt: { type: 'string' },
      },
    },
  });

  return parsed || { verified: false, reason: 'Verification returned no result', fix_prompt: step.task };
}

// ─── PHASE 4: ADJUST ──────────────────────────────────────────────────────
// If verification fails, the fix_prompt becomes the new task for the step.
// Retry up to MAX_RETRIES_PER_STEP.

// ─── THE FULL PEVA LOOP ───────────────────────────────────────────────────
// This is the self-building engine. Plan → Execute → Verify → Adjust → loop.

export async function runSelfBuilder({
  prompt,
  base44,
  onProgress,
}: {
  prompt: string;
  base44: any;
  onProgress?: (event: any) => void;
}): Promise<any> {
  const emit = (event: any) => onProgress?.(event);
  const log: any[] = [];

  // ── PHASE 1: PLAN ──
  emit({ type: 'planning', message: 'Generating execution plan...' });
  const plan = await generatePlan(prompt);
  emit({ type: 'plan_ready', plan });

  if (!plan?.steps?.length) {
    throw new Error('Plan generation failed — no steps returned');
  }

  const steps = plan.steps.slice(0, MAX_PLAN_STEPS);
  let totalIterations = 0;

  // ── PHASE 2-4: EXECUTE → VERIFY → ADJUST each step ──
  for (const step of steps) {
    let currentTask = step.task;
    let stepVerified = false;
    let attempt = 0;

    while (!stepVerified && attempt <= MAX_RETRIES_PER_STEP && totalIterations < MAX_TOTAL_ITERATIONS) {
      totalIterations++;
      emit({
        type: 'step_start',
        step: step.step_number,
        title: step.title,
        agent: step.agent,
        attempt: attempt + 1,
        task: currentTask,
      });

      // EXECUTE
      const execResult = await executeStep({ ...step, task: currentTask }, base44);
      emit({
        type: 'step_executed',
        step: step.step_number,
        attempt: attempt + 1,
        receipts: execResult.receipts,
      });

      // VERIFY
      const verification = await verifyStep(step, execResult);
      emit({
        type: 'step_verified',
        step: step.step_number,
        attempt: attempt + 1,
        verified: verification.verified,
        reason: verification.reason,
      });

      log.push({
        step: step.step_number,
        title: step.title,
        attempt: attempt + 1,
        task: currentTask,
        receipts: execResult.receipts,
        verified: verification.verified,
        reason: verification.reason,
      });

      if (verification.verified) {
        stepVerified = true;
        emit({ type: 'step_done', step: step.step_number });
      } else {
        // ADJUST — the fix prompt becomes the new task
        if (verification.fix_prompt && attempt < MAX_RETRIES_PER_STEP) {
          currentTask = verification.fix_prompt;
          emit({
            type: 'step_adjust',
            step: step.step_number,
            attempt: attempt + 1,
            fix_prompt: verification.fix_prompt,
          });
        } else {
          // Max retries reached — move on but mark as failed
          emit({
            type: 'step_failed',
            step: step.step_number,
            reason: verification.reason,
          });
          break;
        }
      }
    }
  }

  // ── PHASE 5: FINAL REPORT ──
  const passedSteps = log.filter((l) => l.verified).length;
  const failedSteps = log.filter((l) => !l.verified).length;
  const summary = {
    plan_summary: plan.summary,
    total_steps: steps.length,
    passed_steps: passedSteps,
    failed_steps: failedSteps,
    total_iterations: totalIterations,
    is_complete: failedSteps === 0,
    log,
  };

  emit({ type: 'complete', summary });
  return summary;
}