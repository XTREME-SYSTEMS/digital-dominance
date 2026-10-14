// Admin-only, staged bulk importer for the existing AgentIntelligence entity.
// No schema migrations, public publishing, queue creation, or agent execution.
// Each version is immutable after staging; approval is a distinct operator action.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";

const MAX_BATCH = 20;
const shaPattern = /^[0-9a-f]{64}$/;
const idPattern = /^PB-[0-9]{3}$/;
const versionPattern = /^[0-9]+\.[0-9]+\.[0-9]+$/;
const secretPatterns = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}/, /\bghp_[A-Za-z0-9]{20,}/, /\bxoxb-[A-Za-z0-9-]{20,}/];
function fail(message, status = 400) {
  return Response.json({ok:false, error:message}, {status});
}
function clean(v) { return typeof v === "string" ? v.trim() : ""; }
async function hashText(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2,"0")).join("");
}
async function validateBatch(prompts) {
  if (!Array.isArray(prompts) || prompts.length < 1 || prompts.length > MAX_BATCH) {
    return {error:"Submit 1 to 20 prompts per batch"};
  }
  const ids = new Set(), normalized = [];
  for (const p of prompts) {
    const id = clean(p?.prompt_id), version = clean(p?.version);
    const title = clean(p?.title), category = clean(p?.category);
    const text = typeof p?.prompt_text === "string" ? p.prompt_text : "";
    const declared = clean(p?.prompt_sha256).toLowerCase();
    if (!idPattern.test(id) || !versionPattern.test(version) || !title || !category ||
        !text.trim() || text.length > 40000 || !shaPattern.test(declared)) {
      return {error:"Prompt ID, version, title, category, text or SHA is invalid for " + (id || "unknown")};
    }
    if (secretPatterns.some(pattern => pattern.test(text))) {
      return {error:"Potential secret material in " + id + "; hold for review"};
    }
    const key = id + "@" + version;
    if (ids.has(key)) return {error:"Duplicate ID/version in batch: " + key};
    ids.add(key);
    const calculated = await hashText(text);
    if (calculated !== declared) return {error:"SHA mismatch for " + key};
    normalized.push({
      prompt_id:id, version, title, category,
      prompt_text:text, prompt_sha256:calculated,
      approval_status:"PENDING_REVIEW",
      priority:clean(p.priority), first_mode:clean(p.first_mode),
      required_context:clean(p.required_context),
      expected_result:clean(p.expected_result),
      approval_gate:clean(p.approval_gate),
      acceptance_criterion:clean(p.acceptance_criterion),
      // Unprovided capability/phase/agent assignments remain empty until review.
      intents:Array.isArray(p.intents)?p.intents:[],
      phases:Array.isArray(p.phases)?p.phases:[],
      agent_roles:Array.isArray(p.agent_roles)?p.agent_roles:[],
      system_types:Array.isArray(p.system_types)?p.system_types:[],
      triggers:Array.isArray(p.triggers)?p.triggers:[],
      risk_class:clean(p.risk_class)||"DRAFT",
    });
  }
  return {normalized};
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return fail("Unauthorized",401);
    if (user.role !== "admin") return fail("Forbidden: admin only",403);
    const svc = base44.asServiceRole;
    const body = await req.json().catch(()=>({}));
    const action = clean(body.action) || "preview";
    if (action === "preview" || action === "stage") {
      const result = await validateBatch(body.prompts);
      if (result.error) return fail(result.error);
      if (action === "preview") return Response.json({
        ok:true, action:"preview", status:"VALIDATED_NOT_IMPORTED",
        count:result.normalized.length,
        ids:result.normalized.map(p=>p.prompt_id+"@"+p.version),
      });
      if (body.confirm_staging_only !== true) return fail("confirm_staging_only must be true");
      const created=[], duplicates=[], conflicts=[];
      // Existing records with same ID/version are immutable; conflicts are not overwritten.
      for (const p of result.normalized) {
        const intelligenceId = p.prompt_id+"@"+p.version;
        const prior = await svc.entities.AgentIntelligence.filter({
          owner_id:user.id, intelligence_id:intelligenceId,
        }, "-created_date", 2);
        if (prior && prior.length) {
          const matched = prior.some(record=>{
            try{return JSON.parse(record.content).prompt_sha256===p.prompt_sha256;}catch{return false;}
          });
          (matched ? duplicates : conflicts).push(intelligenceId);
          continue;
        }
        const content = JSON.stringify({...p,tenant_id:user.id});
        await svc.entities.AgentIntelligence.create({
          owner_id:user.id, intelligence_id:intelligenceId,
          title:p.title, category:"custom", content,
          version:p.version, source:"DIGITAL_DOMINANCE_PROMPT_PACK_160",
          file_type:"application/json", assigned_agents:[],
          assigned_categories:[p.category], is_shared:false,
          access_level:"owner_only", confidence:1,
          tags:["prompt_registry","pending_review","source:160-pack"],
          auto_refresh:false, active:false,
        });
        created.push(intelligenceId);
      }
      return Response.json({
        ok:conflicts.length===0, action:"stage", status:conflicts.length?"PARTIAL_CONFLICT":"STAGED_PENDING_REVIEW",
        staged:created, duplicates, conflicts,
        executable:0, note:"Staging does not enable or execute prompts",
      });
    }
    if (action === "approve") {
      if (!clean(body.approval_reference) || body.confirm_approval !== true)
        return fail("Explicit approval reference and confirm_approval are required",403);
      if (!Array.isArray(body.prompt_ids) || !body.prompt_ids.length || body.prompt_ids.length>MAX_BATCH)
        return fail("1-20 exact prompt IDs required");
      const approved=[], blocked=[];
      for (const key of body.prompt_ids) {
        if (!/^PB-[0-9]{3}@[0-9]+\.[0-9]+\.[0-9]+$/.test(key)) {blocked.push(key);continue;}
        const found = await svc.entities.AgentIntelligence.filter({
          owner_id:user.id,intelligence_id:key,
        }, "-created_date", 2);
        if (!found || found.length !== 1) {blocked.push(key);continue;}
        const record=found[0];
        let payload;
        try{payload=JSON.parse(record.content);}catch{blocked.push(key);continue;}
        if (payload.approval_status!=="PENDING_REVIEW") {blocked.push(key);continue;}
        const currentHash=await hashText(payload.prompt_text || "");
        if (currentHash!==payload.prompt_sha256) {blocked.push(key);continue;}
        payload.approval_status="APPROVED";
        payload.approval_reference=clean(body.approval_reference);
        await svc.entities.AgentIntelligence.update(record.id,{
          content:JSON.stringify(payload),active:true,
          tags:["prompt_registry","approved","source:160-pack"],
        });
        approved.push(key);
      }
      return Response.json({
        ok:blocked.length===0, status:blocked.length?"PARTIAL_APPROVAL":"APPROVED_ELIGIBLE",
        approved, blocked, note:"Approval makes prompts eligible for routing; no agent job has executed",
      });
    }
    if (action === "status") {
      const found=await svc.entities.AgentIntelligence.filter({
        owner_id:user.id, category:"custom",
      }, "-created_date", 250);
      const records=(found||[]).filter(x=>Array.isArray(x.tags)&&x.tags.includes("prompt_registry"));
      return Response.json({
        ok:true,status:"READ_ONLY",count:records.length,
        approved:records.filter(x=>x.active===true).length,
        pending:records.filter(x=>x.active!==true).length,
        prompts:records.map(x=>({id:x.intelligence_id,title:x.title,active:x.active})),
      });
    }
    return fail("Unsupported action: "+action);
  } catch (err) {
    return fail("Import failed without promoting prompts: "+String(err?.message||"unknown"),500);
  }
}
