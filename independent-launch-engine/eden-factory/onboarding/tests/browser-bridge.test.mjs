import test from "node:test";
import assert from "node:assert/strict";
import {executeApprovedBrowserResearch} from "../browser-worker-bridge.mjs";
import {compileBusinessResearchJobs} from "../business-research-policy.mjs";
import {buildBrief,EMPTY_ANSWERS} from "../intake-engine.mjs";
const ctx={tenantId:"00000000-0000-0000-0000-000000000001",principalVerified:true,sessionOwnerVerified:true,
 consentReceiptId:"consent-123",consentVersion:"2026-10-11",consentTimestamp:"2026-10-11T05:00:00Z"};
const fake={
 jobKey:"business-intel-1",tenantId:ctx.tenantId,missionId:"synthetic",approvedDomain:"example.com",
 seedUrl:"https://example.com",sourceType:"business_website",provider:"XTREME_CLOUD_BROWSER",
 mode:"PUBLIC_BUSINESS_PAGES_ONLY",maxPages:8,maxDepth:1,requireRobotsAndTermsCheck:true,
 requireDomainAndDnsIpRevalidation:true,ignorePersonalContacts:true,followExternalLinks:false,
 useAuthenticatedCookies:false,accessPrivateProfiles:false,solveCaptchas:false,
 consentReceiptId:"consent-123",actionClass:"DRAFT",execute:false
};
const auth={verifiedByServer:true,sessionOwnerVerified:true,tenantId:ctx.tenantId,
 consentReceiptId:"consent-123",consentReceiptVerified:true,consentRevoked:false,
 scope:"business_public_research",maxCloudSpendCents:0,quotaAvailable:true,rateLimitAvailable:true,
 approvedProviderId:"XTREME_CLOUD_BROWSER"};
const calls=[];
const dispatch=async packet=>{calls.push(packet);return {status:"ACCEPTED",receiptId:"receipt-001"}};
async function expectReject(jobPatch,authPatch,code){
 await assert.rejects(executeApprovedBrowserResearch({...fake,...jobPatch},{...auth,...authPatch},dispatch),e=>e.code===code);
}
test("verified business job yields queued receipt not scrape completion",async()=>{
 const result=await executeApprovedBrowserResearch(fake,auth,dispatch);
 assert.equal(result.status,"QUEUED_FOR_PUBLIC_BUSINESS_RESEARCH");
 assert.equal(result.evidenceStatus,"PENDING_INDEPENDENT_VERIFICATION");
});
test("dispatch packet does not contain client email/name/phone",()=>{
 const pack=calls.at(-1);assert.ok(!JSON.stringify(pack).match(/morgan|example@|555/));
});
test("reject no consent verification",async()=>expectReject({},{consentReceiptVerified:false},"CONSENT_NOT_VALID"));
test("reject revoked consent",async()=>expectReject({},{consentRevoked:true},"CONSENT_NOT_VALID"));
test("reject another tenant",async()=>expectReject({tenantId:"00000000-0000-0000-0000-000000000002"},{},"TENANT_SCOPE_MISMATCH"));
test("reject missing scoped provider",async()=>expectReject({},{approvedProviderId:"UNKNOWN"},"APPROVED_PROVIDER_NOT_BOUND"));
test("reject cookie scraping",async()=>expectReject({useAuthenticatedCookies:true},{},"PRIVATE_ACCESS_DENIED"));
test("reject captcha bypass",async()=>expectReject({solveCaptchas:true},{},"PRIVATE_ACCESS_DENIED"));
test("reject too many pages",async()=>expectReject({maxPages:100},{},"CRAWL_SCOPE_EXCEEDED"));
test("reject unverified DNS safeguard",async()=>expectReject({requireDomainAndDnsIpRevalidation:false},{},"SOURCE_SAFETY_CHECKS_REQUIRED"));
test("reject non-zero authority spend",async()=>expectReject({},{maxCloudSpendCents:5},"SPEND_POLICY_NOT_ZERO"));
test("reject offsite links",async()=>expectReject({followExternalLinks:true},{},"PERSONAL_DATA_OR_OFFSITE_DENIED"));
test("reject stale consent receipt",async()=>expectReject({consentReceiptId:"another"},{},"CONSENT_RECEIPT_MISMATCH"));
test("reject wrong domain",async()=>expectReject({approvedDomain:"other.example"},{},"DOMAIN_SCOPE_MISMATCH"));
test("provider mere exception doesn't count as completed",async()=>{
 await assert.rejects(executeApprovedBrowserResearch(fake,auth,async()=>({status:"DONE"})),e=>e.code==="PROVIDER_ACCEPTANCE_UNVERIFIED");
});
