import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { patchCore } from '../../shared/aiGateway.ts';

// Meta Architecture — autonomously scans the entire app, audits it, analyzes it,
// identifies capabilities + gaps, generates hardening/optimization/self-operating steps,
// identifies patterns, and generates everything that should exist.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    patchCore(base44);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { action, appStructure, focusArea } = body;

    if (action === 'scan') {
      return await runFullScan(base44, appStructure);
    }
    if (action === 'patterns') {
      return await identifyPatterns(base44, appStructure, focusArea);
    }
    if (action === 'generate') {
      return await generateMissingItems(base44, appStructure);
    }
    if (action === 'checklist') {
      return await generateChecklist(base44, appStructure);
    }

    return Response.json({ error: 'Unknown action: ' + action }, { status: 400 });
  } catch (error) {
    console.error('metaArchitecture error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function runFullScan(base44, appStructure) {
  const structureText = formatAppStructure(appStructure);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a Meta Architecture Scanner. Analyze this entire application structure and produce a comprehensive audit.

APPLICATION STRUCTURE:
${structureText}

Produce a JSON object with these exact fields:
- "capabilities": array of {name, description, category, status} — every capability the app currently has
- "gaps": array of {area, description, severity (critical/high/medium/low), recommendation} — missing capabilities and features
- "hardeningSteps": array of {step, priority, description} — security and reliability improvements
- "optimizationSteps": array of {step, priority, description} — performance and efficiency improvements
- "selfOperatingSteps": array of {step, description, automationLevel (advisory/supervised/autonomous)} — steps to make the system self-operating
- "patterns": array of {type (systematic/programmatic/operational/visual), description, monetizable (boolean), automatable (boolean), autonomous (boolean)} — patterns identified in the system
- "generatedItems": array of {type (function/page/workflow/entity/agent/component/document/setting), name, description, priority} — everything that should exist but doesn't yet
- "overallScore": number 0-100 — system completeness score
- "summary": string — executive summary

Be exhaustive and specific. Every gap must have a concrete recommendation. Every generated item must be actionable.`,
    response_json_schema: {
      type: 'object',
      properties: {
        capabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' },
              recommendation: { type: 'string' },
            },
          },
        },
        hardeningSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              priority: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        optimizationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              priority: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        selfOperatingSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              description: { type: 'string' },
              automationLevel: { type: 'string' },
            },
          },
        },
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              monetizable: { type: 'boolean' },
              automatable: { type: 'boolean' },
              autonomous: { type: 'boolean' },
            },
          },
        },
        generatedItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' },
            },
          },
        },
        overallScore: { type: 'number' },
        summary: { type: 'string' },
      },
    },
  });

  return Response.json({ result });
}

async function identifyPatterns(base44, appStructure, focusArea) {
  const structureText = formatAppStructure(appStructure);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a Pattern Identifier Generator. Look at this system and identify ALL patterns.

APPLICATION STRUCTURE:
${structureText}
${focusArea ? 'FOCUS AREA: ' + focusArea : ''}

Identify patterns across these dimensions:
1. SYSTEMATIC — recurring structural patterns, architecture patterns, data flow patterns
2. PROGRAMMATIC — code patterns, API patterns, integration patterns
3. OPERATIONAL — workflow patterns, process patterns, automation patterns
4. VISUAL — UI patterns, design patterns, layout patterns
5. MONETIZABLE — patterns that generate or could generate revenue
6. AUTOMATABLE — patterns that can be automated
7. AUTONOMOUS — patterns that can run without human intervention

Return a JSON object with:
- "patterns": array of {dimension, patternName, description, evidence, monetizable, automatable, autonomous, opportunity}
- "patternCount": number
- "topOpportunities": array of {pattern, opportunity, estimatedValue, automationEffort}`,
    response_json_schema: {
      type: 'object',
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              patternName: { type: 'string' },
              description: { type: 'string' },
              evidence: { type: 'string' },
              monetizable: { type: 'boolean' },
              automatable: { type: 'boolean' },
              autonomous: { type: 'boolean' },
              opportunity: { type: 'string' },
            },
          },
        },
        patternCount: { type: 'number' },
        topOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              opportunity: { type: 'string' },
              estimatedValue: { type: 'string' },
              automationEffort: { type: 'string' },
            },
          },
        },
      },
    },
  });

  return Response.json({ result });
}

async function generateMissingItems(base44, appStructure) {
  const structureText = formatAppStructure(appStructure);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a Universal Generator. Given this application structure, generate EVERY system function, capability, feature, step, page, workflow, document, and setting that should exist.

APPLICATION STRUCTURE:
${structureText}

Generate a comprehensive list of everything missing. For each item, specify:
- type: function | page | workflow | entity | agent | component | document | setting
- name: the exact name
- description: what it does and why it's needed
- priority: critical | high | medium | low
- dependencies: what it depends on
- estimatedEffort: hours to build
- automationLevel: advisory | supervised | autonomous | full_autonomous

Return JSON with:
- "items": array of the above
- "totalItems": number
- "criticalCount": number
- "estimatedTotalHours": number
- "recommendedBuildOrder": array of item names in dependency order`,
    response_json_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' },
              dependencies: { type: 'string' },
              estimatedEffort: { type: 'string' },
              automationLevel: { type: 'string' },
            },
          },
        },
        totalItems: { type: 'number' },
        criticalCount: { type: 'number' },
        estimatedTotalHours: { type: 'number' },
        recommendedBuildOrder: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  });

  return Response.json({ result });
}

async function generateChecklist(base44, appStructure) {
  const structureText = formatAppStructure(appStructure);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a System Checklist Generator. Given this application structure, generate a comprehensive production-readiness checklist.

APPLICATION STRUCTURE:
${structureText}

Create a checklist with categories:
- Security & Access Control
- Data Integrity & Backup
- Performance & Scalability
- SEO & Discovery
- Compliance & Legal
- User Experience
- Automation & Operations
- Monitoring & Alerting
- Documentation
- Testing & Validation

Return JSON with:
- "categories": array of {name, items: [{item, required, status, evidence}]}
- "totalItems": number
- "passCount": number
- "failCount": number
- "pendingCount": number`,
    response_json_schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    item: { type: 'string' },
                    required: { type: 'boolean' },
                    status: { type: 'string' },
                    evidence: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        totalItems: { type: 'number' },
        passCount: { type: 'number' },
        failCount: { type: 'number' },
        pendingCount: { type: 'number' },
      },
    },
  });

  return Response.json({ result });
}

function formatAppStructure(appStructure) {
  if (!appStructure) return 'No structure provided.';
  const lines = [];
  if (appStructure.pages?.length) {
    lines.push('=== PAGES (' + appStructure.pages.length + ') ===');
    lines.push(appStructure.pages.join(', '));
  }
  if (appStructure.entities?.length) {
    lines.push('=== ENTITIES (' + appStructure.entities.length + ') ===');
    lines.push(appStructure.entities.join(', '));
  }
  if (appStructure.functions?.length) {
    lines.push('=== BACKEND FUNCTIONS (' + appStructure.functions.length + ') ===');
    lines.push(appStructure.functions.join(', '));
  }
  if (appStructure.workflows?.length) {
    lines.push('=== WORKFLOWS (' + appStructure.workflows.length + ') ===');
    lines.push(appStructure.workflows.join(', '));
  }
  if (appStructure.connectors?.length) {
    lines.push('=== CONNECTORS (' + appStructure.connectors.length + ') ===');
    lines.push(appStructure.connectors.join(', '));
  }
  if (appStructure.agents?.length) {
    lines.push('=== AGENTS (' + appStructure.agents.length + ') ===');
    lines.push(appStructure.agents.join(', '));
  }
  return lines.join('\n\n');
}