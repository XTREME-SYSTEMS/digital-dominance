import {validateBusinessUrl, buildBrief} from './intake-engine.mjs';
// Server adapter planning contract. NO networking, scraping, personal skip tracing or private profiling.
export const RESEARCH_POLICY_VERSION="eden-consented-business-research-v1";
export const RESEARCH_LIMITS=Object.freeze({maxRoots:8,maxPagesPerRoot:8,maxPagesTotal:28,maxRequestsPerMinute:20,retentionDays:30,timeoutMs:15000,maxDepth:1});
const PRIVATE_PATHS=/(?:\/|^)(?:account|login|signin|settings|private|messages|inbox|members|admin|wp-admin)(?:\/|$)/i;
const isSocial=h=>/(^|\.)facebook\.com$|(^|\.)instagram\.com$|(^|\.)linkedin\.com$|(^|\.)tiktok\.com$|(^|\.)youtube\.com$|(^|\.)x\.com$/.test(h);
const canonical=raw=>{
 if(!validateBusinessUrl(raw))throw new Error("UNSAFE_BUSINESS_URL");
 const u=new URL(raw);
 if(PRIVATE_PATHS.test(u.pathname))throw new Error("PRIVATE_PATH_DENIED");
 u.hash="";u.search="";return u.href.replace(/\/$/,"");
};
export function researchEligibility(brief,context={}){
 const errors=[];
 if(!context.principalVerified||!context.tenantId||!context.sessionOwnerVerified)errors.push("TENANT_IDENTITY_UNVERIFIED");
 if(brief?.consent?.research!==true||brief?.consent?.authorityConfirmed!==true)errors.push("RESEARCH_CONSENT_OR_AUTHORITY_MISSING");
 if(!Array.isArray(brief?.consent?.researchScopes)||!brief.consent.researchScopes.length)errors.push("NO_RESEARCH_SCOPE");
 if(!context.consentReceiptId||!context.consentVersion||!context.consentTimestamp)errors.push("CONSENT_RECEIPT_REQUIRED");
 if(context.consentRevoked===true)errors.push("CONSENT_REVOKED");
 if(context.expiresAt&&new Date(context.expiresAt)<=new Date(context.now??Date.now()))errors.push("CONSENT_EXPIRED");
 return {eligible:errors.length===0,errors};
}
export function compileBusinessResearchJobs(brief,context={}){
 const eligibility=researchEligibility(brief,context);
 if(!eligibility.eligible)return {status:"BLOCKED",errors:eligibility.errors,jobs:[],policyVersion:RESEARCH_POLICY_VERSION};
 const allowed=new Set(brief.consent.researchScopes);
 const roots=[];
 const add=(url,kind)=>{
  try{
   const safe=canonical(url);const host=new URL(safe).hostname.toLowerCase();
   if(kind==="business_website"&&isSocial(host))return;
   if(kind==="business_social"&&!isSocial(host))return;
   if(!roots.some(r=>r.url===safe))roots.push({url:safe,kind,requestedByClient:true});
  }catch{/* invalid or private addresses never enter planning */}
 };
 if(allowed.has("business_website")&&brief.business.website)add(brief.business.website,"business_website");
 if(allowed.has("business_social"))for(const url of brief.business.socialLinks??[])add(url,"business_social");
 if(roots.length>RESEARCH_LIMITS.maxRoots)return {status:"BLOCKED",errors:["ROOT_LIMIT_EXCEEDED"],jobs:[],policyVersion:RESEARCH_POLICY_VERSION};
 const jobs=roots.map((root,index)=>({
  jobKey:"business-intel-"+String(index+1),tenantId:context.tenantId,missionId:context.missionId??null,
  approvedDomain:new URL(root.url).hostname,seedUrl:root.url,sourceType:root.kind,
  mode:"PUBLIC_BUSINESS_PAGES_ONLY",provider:"XTREME_CLOUD_BROWSER",maxPages:RESEARCH_LIMITS.maxPagesPerRoot,maxDepth:RESEARCH_LIMITS.maxDepth,
  requireRobotsAndTermsCheck:true,requireDomainAndDnsIpRevalidation:true,ignorePersonalContacts:true,followExternalLinks:false,
  useAuthenticatedCookies:false,accessPrivateProfiles:false,solveCaptchas:false,
  consentReceiptId:context.consentReceiptId,actionClass:"DRAFT",execute:false
 }));
 if(allowed.has("public_market"))jobs.push({
  jobKey:"industry-market-brief",tenantId:context.tenantId,missionId:context.missionId??null,
  mode:"MARKET_RESEARCH_WITH_SOURCED_AGGREGATES",provider:"APPROVED_RESEARCH_ADAPTER",
  queryScope:{category:brief.build.intent,services:brief.objective.services,serviceArea:brief.business.serviceArea},
  excludePersonalLookup:true,actionClass:"DRAFT",execute:false});
 if(allowed.has("competitors"))jobs.push({
  jobKey:"authorized-competitor-benchmark",tenantId:context.tenantId,missionId:context.missionId??null,
  mode:"COMPETITOR_PUBLIC_BUSINESS_RESEARCH",provider:"APPROVED_RESEARCH_ADAPTER",
  queryScope:{category:brief.build.intent,services:brief.objective.services,serviceArea:brief.business.serviceArea},
  excludePersonalLookup:true,actionClass:"DRAFT",execute:false});
 return {status:"PLANNED_NOT_EXECUTED",policyVersion:RESEARCH_POLICY_VERSION,consentReceiptId:context.consentReceiptId,
  tenantId:context.tenantId,limits:RESEARCH_LIMITS,errors:[],jobs};
}
const sanitize=x=>typeof x==="string"?x.slice(0,1000).trim():"";
export function mergeProfileEvidence(brief,evidence,context={}){
 if(!Array.isArray(evidence)||evidence.length>30)throw new Error("EVIDENCE_LIMIT");
 if(!context.principalVerified||!context.tenantId)throw new Error("TENANT_IDENTITY_UNVERIFIED");
 const allow=new Set(brief?.consent?.researchScopes||[]);
 if(!brief?.consent?.research||!brief.consent.authorityConfirmed||context.consentRevoked)throw new Error("RESEARCH_NOT_AUTHORIZED");
 const accepted=evidence.map(item=>{
  if(!item||!["business_website","business_social","public_market","competitors"].includes(item.sourceType))throw new Error("SOURCE_KIND_INVALID");
  if(!allow.has(item.sourceType))throw new Error("SOURCE_NOT_IN_CONSENT");
  if(item.sourceType==="business_website"||item.sourceType==="business_social"){
   const u=canonical(item.url);const roots=item.sourceType==="business_website"?[brief.business.website]:brief.business.socialLinks;
   if(!roots.some(x=>{try{return new URL(canonical(x)).hostname===new URL(u).hostname}catch{return false}}))throw new Error("UNAUTHORIZED_SOURCE_DOMAIN");
  }
  if(item.containsSensitivePersonalData||item.isPersonSearch||item.personalTraitInference)throw new Error("PERSONAL_PROFILING_REJECTED");
  if(!sanitize(item.observation))throw new Error("EVIDENCE_EMPTY");
  return {sourceType:item.sourceType,url:item.url||null,observation:sanitize(item.observation),capturedAt:sanitize(item.capturedAt),confidence:["HIGH","MEDIUM","LOW"].includes(item.confidence)?item.confidence:"LOW",verified:false};
 });
 return {profileStatus:"PUBLIC_BUSINESS_EVIDENCE_REVIEW_REQUIRED",declaredBrandPreferences:{...brief.brand},
  publicBusinessObservations:accepted,unverifiedClaims:accepted.map(x=>x.observation),
  warnings:["Do not infer personal psychology, protected traits, private contact details or favorite colors.","Client-confirmed brand preferences take precedence over online observations.","Do not publish business claims without verification."],
  consentReceiptId:context.consentReceiptId??null};
}
export function synthesizeBriefFromAnswers(answers,context={}){
 const brief=buildBrief(answers);
 return {brief,researchPlan:compileBusinessResearchJobs(brief,context)};
}
