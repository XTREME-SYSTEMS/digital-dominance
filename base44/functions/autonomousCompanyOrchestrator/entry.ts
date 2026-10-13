/**
 * AUTONOMOUS COMPANY ORCHESTRATOR v1.0
 * Backend function entry point for the autonomous software company.
 * Receives natural language commands, routes to agent pipelines, executes autonomously.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CATEGORIES = ['autonomous_coding', 'data_intelligence', 'ai_consulting', 'prediction', 'simulation', 'avatar_video'];

const ROUTING = {
  build: ['vision_architect', 'system_architect', 'code_engineer', 'test_engineer', 'security_auditor', 'deployment_engineer', 'validation_guardian'],
  fix: ['system_monitor', 'recursive_healing_engine', 'validation_guardian'],
  deploy: ['deployment_engineer', 'validation_guardian'],
  research: ['benchmark_scout', 'self_reflection_engine'],
  audit: ['system_auditor', 'self_reflection_engine'],
  optimize: ['godModeOptimizer', 'validation_guardian'],
  evolve: ['benchmark_scout', 'self_reflection_engine', 'system_architect'],
};

function routeIntent(message) {
  const lower = message.toLowerCase();
  if (lower.startsWith('build') || lower.includes('create') || lower.includes('launch')) return 'build';
  if (lower.startsWith('fix') || lower.includes('repair') || lower.includes('heal')) return 'fix';
  if (lower.startsWith('deploy')) return 'deploy';
  if (lower.startsWith('research') || lower.includes('benchmark')) return 'research';
  if (lower.startsWith('audit')) return 'audit';
  if (lower.startsWith('optimize') || lower.includes('improve')) return 'optimize';
  if (lower.startsWith('evolve') || lower.includes('upgrade')) return 'evolve';
  return 'build';
}

export default async function handler(req, res) {
  const { message, tier = 'supervised' } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  const intent = routeIntent(message);
  const pipeline = ROUTING[intent] || ROUTING.build;

  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  const commandRun = await base44.entities.CommandRun.create({
    owner_id: user.id,
    command: message,
    intent,
    pipeline,
    tier,
    status: 'routing',
  });

  return res.json({
    command_id: commandRun.id,
    intent,
    pipeline,
    tier,
    status: 'routed',
    message: `Command routed to ${pipeline.join(' → ')} pipeline. Execute agents in sequence.`,
    next_action: `Invoke agents: ${pipeline.join(', ')}`,
  });
}