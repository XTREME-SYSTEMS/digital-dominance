import fs from 'node:fs';

let failed = 0;
function check(name, ok) { console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`); if (!ok) failed++; }
const swarm = fs.readFileSync('base44/functions/swarmOrchestrator/entry.ts', 'utf8');
const scheduler = JSON.parse(fs.readFileSync('runtime/scheduler-control.json', 'utf8'));
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
check('protected task guard exists', swarm.includes('taskNeedsOperatorApproval'));
check('unknown-risk tasks fail closed', swarm.includes('SAFE_AUTONOMOUS_RISK_CLASSES') && swarm.includes('return !SAFE_AUTONOMOUS_RISK_CLASSES.has(riskClass)'));
check('direct follow-up email autofix removed', !swarm.includes("base44.functions.invoke('sendFollowUpEmail'"));
check('direct social publish autofix removed', !swarm.includes("base44.functions.invoke('socialStudio', { action: 'publishBatch' }"));
check('public indexer submission is approval-gated', !swarm.includes("base44.functions.invoke('submitToIndexers'") && swarm.includes("approval_class: 'PUBLIC_PUBLISH'"));
check('dispatch emits protected-block receipt', swarm.includes('protected_blocked_count') && swarm.includes('protected_blocked: protectedPending.map'));
check('independent cycle validator invoked', swarm.includes("base44.functions.invoke('swarmCycleValidator'"));
check('validator failure blocks cycle', swarm.includes("validatorStatus !== 'PASS'"));
const active = [scheduler.authoritative_scheduler, scheduler.candidate_scheduler].filter((s) => s.active).length;
check('exactly one active heartbeat scheduler during staged cutover', active === 1);
check('candidate heartbeat is 5 minutes', scheduler.candidate_scheduler.schedule === '*/5 * * * *');
check('vercel has one cron', Array.isArray(vercel.crons) && vercel.crons.length === 1);
check('vercel cron path is canonical', vercel.crons?.[0]?.path === '/api/cron/auto-builder');
check('vercel cron cadence is 5 minutes', vercel.crons?.[0]?.schedule === '*/5 * * * *');
if (failed) process.exit(1);
