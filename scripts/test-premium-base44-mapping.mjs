// Contract tests for real connected Base44 TemplateLibrary entity fields.
// No network, keys, customer data, Base44 mutations, live publishing or cost.
import assert from 'node:assert/strict';
import {buildTemplateLibraryDraft,validateDraftAgainstTemplateLibrarySchema,TEMPLATE_LIBRARY_CATEGORIES} from './premium-base44-template-mapping.mjs';
import {DESTINATIONS,SOURCE_SHA,SOURCE_REPO} from './premium-promotion-policy.mjs';
const master={id:'forge-roofing',industry:'Roofing',layout:'forge',name:'FORGE ROOFING'};
const html='<!doctype html><html lang="en"><head><meta name="robots" content="noindex,nofollow,noarchive"></head><body><h1>PREMIUM DESIGN STUDY</h1><p>'+('Synthetic, non-public artwork and service content. '.repeat(275))+'</p></body></html>';
assert.ok(html.length>10000&&html.length<50000);
const base={
 master,brand:'APEX SYNTHETIC CONCEPT',html,
 source_sha:SOURCE_SHA,source_repo:SOURCE_REPO,idempotency_key:'d'.repeat(64),
 independent_reviewer:'independent-test-validator'
};
assert.equal(TEMPLATE_LIBRARY_CATEGORIES.length,18);
const expected={
 marketing_website:'homepage',
 lead_generation_funnel:'estimate_funnel',
 ecommerce_frontend:'landing_page',
 client_portal_frontend:'custom',
 saas_dashboard_frontend:'custom',
 pwa_shell:'custom',
 training_portal_frontend:'custom'
};
for(const kind of Object.keys(DESTINATIONS)){
 const entity=buildTemplateLibraryDraft({...base,target_kind:kind});
 assert.equal(validateDraftAgainstTemplateLibrarySchema(entity),true);
 assert.equal(entity.category,expected[kind]);
 assert.equal(entity.status,'draft');
 assert.equal(entity.is_active,false);
 assert.equal(entity.is_default,false);
 assert.match(entity.slug,/^apex-premium-forge-roofing-/);
 assert.ok(entity.tags.includes('noindex'));
 assert.equal(entity.content,html);
 assert.equal(entity.preview_image_url,'');
 assert.equal(entity.sections[0].config.target_kind,kind);
 assert.equal(entity.sections[0].config.source_commit_sha,SOURCE_SHA);
 assert.equal(entity.sections[0].config.production_release_allowed,false);
 assert.equal(entity.sections[0].config.payment_provider_bound,false);
 assert.ok(entity.description.includes(SOURCE_SHA));
}
const entity=buildTemplateLibraryDraft({...base,target_kind:'lead_generation_funnel'});
for(const [label,change] of [
 ['unsafe-status',{...entity,status:'active'}],
 ['unsafe-is-active',{...entity,is_active:true}],
 ['unsafe-default',{...entity,is_default:true}],
 ['unknown-field',{...entity,source_git_sha:SOURCE_SHA}],
 ['wrong-category',{...entity,category:'premium_candidate'}],
 ['invalid-content',{...entity,content:'<html>NOT NOINDEX</html>'.repeat(4000)}]
]){
 assert.throws(()=>validateDraftAgainstTemplateLibrarySchema(change),label);
}
assert.throws(()=>buildTemplateLibraryDraft({...base,source_sha:'0'.repeat(40),target_kind:'fake'}));
assert.throws(()=>buildTemplateLibraryDraft({...base,html:html.slice(0,500),target_kind:'marketing_website'}));
assert.throws(()=>buildTemplateLibraryDraft({...base,html:html.repeat(8),target_kind:'marketing_website'}));
assert.throws(()=>buildTemplateLibraryDraft({...base,independent_reviewer:'generator',target_kind:'marketing_website'}));
assert.throws(()=>buildTemplateLibraryDraft({...base,source_repo:'bad/internal',target_kind:'marketing_website'}));
console.log('PASS VALID BASE44 TEMPLATE MAPPING '+JSON.stringify({target_kinds:Object.keys(DESTINATIONS).length,valid_category_enum:true,imported_to_base44:false,default_status:'draft',active:false,content_bound:true,provenance_in_declared_sections:true,negative_cases:11,customer_messages:0,production:false}));
