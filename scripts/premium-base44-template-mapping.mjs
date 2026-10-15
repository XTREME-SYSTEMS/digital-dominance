// Authoritative, schema-accurate draft-only TemplateLibrary mapping.
// Source: connected Base44 entity schema (2026-10-15), not a speculative API.
// No Base44 connector calls. The next admin-approved import must verify the
// exact immutable source SHA, registered reviewer signature, and business scope.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const TEMPLATE_LIBRARY_CATEGORIES=Object.freeze([
 'homepage','landing_page','service_page','location_page','blog_post',
 'about_page','contact_page','faq_page','cost_page','gallery_page',
 'reviews_page','estimate_funnel','thank_you_page','error_page',
 'email_template','component','section','custom'
]);
const kindToCategory=Object.freeze({
 marketing_website:'homepage',
 lead_generation_funnel:'estimate_funnel',
 ecommerce_frontend:'landing_page',
 client_portal_frontend:'custom',
 saas_dashboard_frontend:'custom',
 pwa_shell:'custom',
 training_portal_frontend:'custom'
});
const sha=text=>createHash('sha256').update(text).digest('hex');
const slugify=x=>String(x).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,95);
export function buildTemplateLibraryDraft({master,brand,target_kind,html,source_sha,source_repo,idempotency_key,independent_reviewer}){
 assert.ok(master&&/^[a-z0-9-]+$/.test(master.id),'UNKNOWN_MASTER_ID');
 assert.ok(typeof brand==='string'&&brand.length>=5&&brand.length<=72,'INVALID_BRAND_NAME');
 assert.ok(typeof target_kind==='string'&&Object.hasOwn(kindToCategory,target_kind),'UNSUPPORTED_DESTINATION');
 assert.match(source_sha||'',/^[a-f0-9]{40}$/i);
 assert.equal(source_repo,'XTREME-SYSTEMS/digital-dominance');
 assert.match(idempotency_key||'',/^[a-f0-9]{64}$/);
 assert.ok(typeof html==='string'&&html.length>10000&&html.length<=50000,'HTML_EXCEEDS_BASE44_CONTENT_LIMIT');
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/,'NOINDEX_REQUIRED');
 assert.match(html,/PREMIUM DESIGN STUDY/,'SYNTHETIC_PREVIEW_REQUIRED');
 assert.ok(independent_reviewer&&independent_reviewer!=='generator','INDEPENDENT_REVIEWER_REQUIRED');
 const category=kindToCategory[target_kind];
 assert.ok(TEMPLATE_LIBRARY_CATEGORIES.includes(category));
 const html_sha256=sha(html);
 const slug=slugify('apex-premium-'+master.id+'-'+target_kind+'-'+idempotency_key.slice(0,14));
 const name=(brand+' | '+master.industry+' | '+target_kind).slice(0,180);
 const description=[
  'Synthetic noindex premium VISUAL DESIGN DRAFT. Not approved for live customers, SEO, payments, licensed claims, CRM, login, or publication.',
  'Source '+source_repo+'@'+source_sha+'.',
  'Master '+master.id+'; target '+target_kind+'; original HTML SHA256 '+html_sha256+'.',
  'Independent preview reviewer '+independent_reviewer+'; operator-scoped admin import not yet authorized.'
 ].join(' ');
 const record={
  name,slug,category,niche:master.id,description,
  content:html,
  tags:['apex-premium','noindex','synthetic-preview','signed-visual-candidate',
        'admin-import-pending','target-'+target_kind,'master-'+master.id,
        'git-'+source_sha,'sha256-'+html_sha256],
  color_scheme:'custom',
  is_default:false,is_active:false,status:'draft',version:'1.0',
  preview_image_url:'',
  deployed_to:[],deploy_count:0,conversion_rate:0,performance_score:0,
  author:'Strategic Minds AI | independently reviewed preview',
  sections:[{
   section_id:'apex-premium-provenance-v1',
   section_type:'metadata',section_name:'Immutable premium preview source',
   content:'Source and reviewer metadata only, not a published business or working backend',
   config:{
    source_repository:source_repo,source_commit_sha:source_sha,
    master_id:master.id,industry:master.industry,original_layout:master.layout,
    target_kind,html_sha256,independent_reviewer,
    idempotency_key,approval_scope:'REUSABLE_PREVIEW_ONLY',
    production_release_allowed:false,live_customer_inbox:false,
    payment_provider_bound:false,crm_provider_bound:false
   }
  }]
 };
 assert.equal(record.status,'draft');
 assert.equal(record.is_active,false);
 assert.ok(record.description.length<=2000);
 assert.equal(record.content.length,html.length);
 assert.ok(!Object.keys(record).some(x=>x.startsWith('source_')||x==='html_source_sha256'));
 return record;
}
export function validateDraftAgainstTemplateLibrarySchema(record){
 assert.ok(record&&typeof record==='object'&&!Array.isArray(record));
 const allowed=['name','slug','category','niche','description','content','sections','preview_image_url','preview_html','tags','color_scheme','is_default','is_active','version','parent_template_id','deployed_to','deploy_count','conversion_rate','performance_score','author','status','sort_order'];
 for(const k of Object.keys(record))assert.ok(allowed.includes(k),'BASE44_UNDECLARED_FIELD_'+k);
 assert.ok(typeof record.name==='string'&&record.name.trim().length>0);
 assert.match(record.slug,/^[a-z0-9-]+$/);
 assert.ok(TEMPLATE_LIBRARY_CATEGORIES.includes(record.category));
 assert.equal(record.status,'draft');
 assert.equal(record.is_active,false);
 assert.equal(record.is_default,false);
 assert.equal(record.deployed_to.length,0);
 assert.equal(record.deploy_count,0);
 assert.ok(typeof record.content==='string'&&record.content.length<=50000);
 assert.ok(!record.preview_html||record.preview_html.length<=20000);
 assert.ok(Array.isArray(record.tags)&&record.tags.includes('noindex'));
 assert.ok(record.sections[0]?.config?.production_release_allowed===false);
 assert.ok(record.sections[0]?.config?.source_commit_sha?.length===40);
 return true;
}
