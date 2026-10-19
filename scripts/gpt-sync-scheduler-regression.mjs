// A scheduled scan must NEVER trigger paid template generation or writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const doc=JSON.parse(fs.readFileSync(new URL('../base44/workflows/GPT Template Sync.jsonc',import.meta.url),'utf8'));
assert.equal(doc.name,'GPT Template Sync');
const cfg=doc.trigger?.config;
assert.equal(cfg.trigger_type,'scheduled');
assert.equal(cfg.interval_value,6);
assert.equal(cfg.interval_unit,'hours');
const steps=doc.definition?.do||[];
assert.equal(steps.length,1);
const step=steps[0].generate_templates;
assert.equal(step.call,'invoke_backend_function');
assert.equal(step.with.function_name,'gptTemplateIngestor');
assert.deepEqual(step.with.args,{action:'status'});
assert.doesNotMatch(JSON.stringify(doc),/"action"\s*:\s*"generate_batch"/);
console.log('PASS GPT SYNC SCHEDULER: 6-hour heartbeat limited to authenticated, read-only inventory action; 21-niche mass generation not scheduled');
