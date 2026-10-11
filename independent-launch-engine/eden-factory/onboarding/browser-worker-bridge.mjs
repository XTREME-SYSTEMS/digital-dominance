import {RESEARCH_LIMITS} from './business-research-policy.mjs';

// Server-only integration boundary. Production must bind this to the ALREADY EXISTING
// Xtreme Cloud Browser worker, after trusted session, consent and tenant identity.
// This does not import Base44, make network calls, handle secrets or start browsers.
export class ResearchDispatchError extends Error {
 constructor(code){super(code);this.code=code;this.name="ResearchDispatchError";}
}
function guard(condition,code){if(!condition)throw new ResearchDispatchError(code);}
export async function executeApprovedBrowserResearch(job,authority,dispatcher){
 guard(authority?.verifiedByServer===true&&authority?.sessionOwnerVerified===true,"VERIFIED_SESSION_REQUIRED");
 guard(authority?.tenantId&&job?.tenantId===authority.tenantId,"TENANT_SCOPE_MISMATCH");
 guard(authority?.consentReceiptVerified===true&&authority?.consentRevoked!==true,"CONSENT_NOT_VALID");
 guard(job?.consentReceiptId&&job.consentReceiptId===authority.consentReceiptId,"CONSENT_RECEIPT_MISMATCH");
 guard(authority?.scope==="business_public_research","ACTION_SCOPE_DENIED");
 guard(authority?.maxCloudSpendCents===0,"SPEND_POLICY_NOT_ZERO");
 guard(authority?.quotaAvailable===true&&authority?.rateLimitAvailable===true,"BROWSER_QUOTA_UNAVAILABLE");
 guard(job?.provider==="XTREME_CLOUD_BROWSER"&&job?.mode==="PUBLIC_BUSINESS_PAGES_ONLY","PROVIDER_OR_ACTION_DENIED");
 guard(job?.actionClass==="DRAFT"&&job.execute===false,"JOB_CONTRACT_INVALID");
 guard(job.maxPages<=RESEARCH_LIMITS.maxPagesPerRoot&&job.maxDepth<=RESEARCH_LIMITS.maxDepth,"CRAWL_SCOPE_EXCEEDED");
 guard(job.useAuthenticatedCookies===false&&job.accessPrivateProfiles===false&&job.solveCaptchas===false,"PRIVATE_ACCESS_DENIED");
 guard(job.requireRobotsAndTermsCheck===true&&job.requireDomainAndDnsIpRevalidation===true,"SOURCE_SAFETY_CHECKS_REQUIRED");
 guard(job.ignorePersonalContacts===true&&job.followExternalLinks===false,"PERSONAL_DATA_OR_OFFSITE_DENIED");
 guard(typeof dispatcher==="function"&&authority.approvedProviderId==="XTREME_CLOUD_BROWSER","APPROVED_PROVIDER_NOT_BOUND");
 guard(typeof job.seedUrl==="string"&&new URL(job.seedUrl).protocol==="https:"&&new URL(job.seedUrl).hostname===job.approvedDomain,"DOMAIN_SCOPE_MISMATCH");
 // The provider adapter must do hostname re-resolution/IP denial (SSRF), robots/ToS checks,
 // network quotas, session expiry and enforce public HTML allowlist at EVERY navigation.
 const result=await dispatcher({
  tenantId:authority.tenantId,missionId:job.missionId,consentReceiptId:job.consentReceiptId,
  provider:"XTREME_CLOUD_BROWSER",operation:"PUBLIC_BUSINESS_CRAWL",
  seedUrl:job.seedUrl,allowedDomain:job.approvedDomain,
  maxPages:job.maxPages,maxDepth:job.maxDepth,timeoutMs:RESEARCH_LIMITS.timeoutMs,
  disableCookies:true,disableLogin:true,disableCaptchaSolving:true,
  respectRobots:true,denyPrivateIps:true,stripPersonalIdentifiers:true,
  persistRawHtml:false
 });
 guard(result&&result.status==="ACCEPTED"&&result.receiptId,"PROVIDER_ACCEPTANCE_UNVERIFIED");
 return {status:"QUEUED_FOR_PUBLIC_BUSINESS_RESEARCH",tenantId:authority.tenantId,provider:"XTREME_CLOUD_BROWSER",
   consentReceiptId:job.consentReceiptId,providerReceiptId:result.receiptId,
   evidenceStatus:"PENDING_INDEPENDENT_VERIFICATION"};
}
