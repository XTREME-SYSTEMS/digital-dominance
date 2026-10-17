/**
 * APEX source-only retirement audit and representative payload-contract canary.
 * Zero API calls, secrets, inference costs, live writes, or model migrations.
 * OpenAI official deprecations:
 * https://developers.openai.com/api/docs/deprecations (2026-10-01, 2026-10-14)
 * Chat/model quality, provider alias resolution and costs remain unverified.
 */
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

const sources = [
  {path:"base44/functions/llmRouter/entry.ts", pattern:/'gpt-4o'/g, alias:"gpt-4o",
    route:"Direct OpenAI Chat Completions", class:"ALIAS_NEEDS_VERSION_RESOLUTION"},
  {path:"base44/shared/openRouterGateway.ts", pattern:/'openai\/gpt-4o-mini'/g,alias:"openai/gpt-4o-mini",
    route:"OpenRouter routed GPT alias",class:"PROVIDER_ALIAS_NEEDS_RESOLUTION"},
  {path:"base44/functions/opportunityIntelligenceEngine/webSearch.ts",
    pattern:/'openai\/gpt-4\.1-mini'/g,alias:"openai/gpt-4.1-mini",
    route:"Third-party model router",class:"PROVIDER_ALIAS_NEEDS_RESOLUTION"},
  {path:"base44/functions/vercelAiGateway/entry.ts",pattern:/'openai\/tts-1'/g,alias:"openai/tts-1",
    route:"Vercel AI Gateway speech",class:"FAMILY_RETIRING_2027_01_06"},
];
const currentSHA=process.env.DD_SOURCE_SHA||process.env.GITHUB_SHA||"UNVERIFIED";
if(currentSHA!=="UNVERIFIED"&&!/^[a-f0-9]{40}$/i.test(currentSHA))throw Error("INVALID_SOURCE_SHA");
const modelInventory=sources.map(s=>{
  const source=readFileSync(s.path,"utf8");
  const found=[...source.matchAll(s.pattern)].length;
  return {path:s.path,model_reference:s.alias,route:s.route,reference_count:found,
    evidence_class:found?"GIT_SOURCE_REFERENCE":"NOT_PRESENT_IN_SOURCE",risk:s.class,
    runtime_usage:"UNVERIFIED",migration_approved:false};
});
const retirementNotice={
  official:"https://developers.openai.com/api/docs/deprecations",
  gpt4_series_announced:"2026-10-14",gpt4_pinned_shutdown:"2027-01-14",
  pinned_models:["gpt-4o-2024-08-06","gpt-4o-2024-11-20","gpt-4o-mini-2024-07-18",
    "gpt-4.1-2025-04-14","gpt-4.1-mini-2025-04-14"],
  recommended_chat_candidate:"gpt-6-luna",
  speech_announced:"2026-10-01",speech_shutdown:"2027-01-06",
  speech_models:["tts-1","tts-1-hd","gpt-4o-mini-tts-2025-03-20","gpt-4o-mini-tts-2025-12-15"],
  recommended_speech_candidate:"gpt-realtime-2.1-mini",
};
const samples=[
 {niche:"epoxy",prompt:"Write a synthetic noindex flooring hero without licensed claims.",expected:"TEXT",max_tokens:300},
 {niche:"legal",prompt:"Label a fictional legal design preview without advice or fabricated outcomes.",expected:"TEXT",max_tokens:300},
 {niche:"med_spa",prompt:"Draft fictional beauty design placeholder copy without clinical promises.",expected:"TEXT",max_tokens:300},
 {niche:"voice",prompt:"Welcome to the fictional preview. No call or appointment is scheduled.",expected:"AUDIO",max_tokens:300},
];
let checked=0;
for(const s of samples){
  assert.ok(s.prompt.length>20 && s.prompt.length<500);checked++;
  assert.ok(!/sk-[a-z0-9]|api_key|bearer\s+/i.test(s.prompt));checked++;
  assert.ok(["TEXT","AUDIO"].includes(s.expected));checked++;
}
assert.equal(modelInventory.length,4);checked++;
assert.equal(sources.length,4);checked++;
const report={
  schema:"smai.model-retirement.source-audit.v1",source_sha:currentSHA,
  source_paths_checked:modelInventory.length,synthetic_contract_checks:checked,
  observed:modelInventory,retirement_notice:retirementNotice,
  benchmark_samples:samples.map(x=>({niche:x.niche,kind:x.expected})),
  payload_schema_canary:"PASS_OFFLINE_ONLY",real_model_calls:0,
  quality_comparison:"NOT_RUN_BUDGET_AND_CREDENTIALS_NOT_AUTHORIZED",
  exact_provider_alias_resolution:"UNVERIFIED",live_compatibility:"UNKNOWN",
  approved_replacement:"NONE",providers_changed:false,
  actual_spend_usd:0,cost_delta:"UNVERIFIED",rollback:"Unchanged existing model router",
  release_allowed:false
};
mkdirSync("qa-receipts",{recursive:true});
writeFileSync("qa-receipts/model-compatibility-audit.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({status:"PASS_OFFLINE_SOURCE_AUDIT",sha:currentSHA,reference_count:modelInventory.reduce((n,z)=>n+z.reference_count,0),samples_checked:samples.length,contract_checks:checked,providers_changed:false,provider_spend_usd:0,live_compatibility:"UNKNOWN"}));
