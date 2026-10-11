// Eden Skye progressive intake V2. Pure client-safe policy. No network calls or personal profiling.
export const INTAKE_VERSION="eden-intake-v2.0.0";
export const QUESTIONS=Object.freeze([
  {id:"identity",title:"Let's get acquainted",hint:"Only the contact details you'd like to share."},
  {id:"business",title:"Tell me where you're starting",hint:"We will not research your business unless you choose to allow it."},
  {id:"vision",title:"What should we bring to life?",hint:"Describe the outcome, not the technology."},
  {id:"audience",title:"Who will it help?",hint:"Understanding your customers makes the end result more useful."},
  {id:"capabilities",title:"What must it actually do?",hint:"We'll discover missing requirements before building."},
  {id:"identity_style",title:"Make it feel like you",hint:"Your stated colors, tone and references become the design brief."},
  {id:"delivery",title:"Set comfortable boundaries",hint:"A useful first phase should fit real-world constraints."},
  {id:"permission",title:"Review your vision and permissions",hint:"Choose exactly what research, if any, you want."}
]);
export const STAGES=Object.freeze(["new_idea","starting_business","established","improving_existing"]);
export const INTENTS=Object.freeze(["website","app","automation","agent","data","consulting","other"]);
export const RESEARCH_SCOPES=Object.freeze(["business_website","business_social","public_market","competitors"]);
export const EMPTY_ANSWERS=()=>({
 identity:{fullName:"",email:"",phone:"",contactPreference:"email"},
 business:{stage:"new_idea",businessName:"",website:"",businessSocialUrls:[],serviceArea:""},
 vision:{description:"",successMetric:""},
 audience:{customers:"",problemSolved:"",services:""},
 capabilities:{intent:"app",mustHaves:"",existingTools:"",hasSensitiveData:"unsure"},
 identity_style:{tone:[],preferredColors:"",avoidColors:"",referenceUrls:[],brandAssets:""},
 delivery:{budget:"unsure",timeline:"flexible",ongoingSupport:"unsure",launchConstraints:""},
 permission:{researchConsent:false,researchScopes:[],contactConsent:false,marketingConsent:false,authorityConfirmed:false}
});
export const BUDGETS=Object.freeze(["under_1000","1000_5000","5000_15000","15000_50000","over_50000","unsure"]);
export function stepFor(index,answers){
 if (!Number.isInteger(index)||index<0||index>=QUESTIONS.length) throw new Error("STEP_INVALID");
 const q=QUESTIONS[index];const stage=answers?.business?.stage;
 if(q.id==="business"&&stage==="new_idea")return {...q,hint:"No company or website yet? That's completely fine."};
 if(q.id==="capabilities"&&answers?.capabilities?.intent==="website")return {...q,hint:"Think booking, forms, SEO, galleries, payments and lead notifications."};
 if(q.id==="capabilities"&&answers?.capabilities?.intent==="app")return {...q,hint:"Think user accounts, dashboards, permissions, integrations and workflows."};
 if(q.id==="identity_style"&&answers?.business?.website)return {...q,hint:"We can learn from your existing brand once you approve business research."};
 return q;
}
const txt=(x,n=4000)=>typeof x==="string"&&x.trim().length<=n;
const filled=(x,n=4000)=>txt(x,n)&&x.trim().length>0;
const validUrl=(raw)=>{
 try{
  if(!filled(raw,350))return false;
  const u=new URL(raw);
  return u.protocol==="https:" && !u.username && !u.password && !u.port && !!u.hostname &&
  u.hostname.includes(".") && !/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(u.hostname) &&
  !/^\d+(?:\.\d+){3}$/.test(u.hostname) && !u.hostname.includes(":");
 }catch{return false;}
};
export const validateBusinessUrl=validUrl;
const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateStep(index,answers){
 if(!answers||typeof answers!=="object")return ["ANSWERS_REQUIRED"];
 const obj=answers[QUESTIONS[index]?.id]||{};
 const errors=[];
 switch(index){
  case 0:
   if(!filled(obj.fullName,100))errors.push("FULL_NAME_REQUIRED");
   if(!filled(obj.email,180)||!emailRe.test(obj.email))errors.push("VALID_EMAIL_REQUIRED");
   if(obj.phone && (!/^[+()\d\s.-]{7,24}$/.test(obj.phone)))errors.push("PHONE_INVALID");
   if(!["email","phone"].includes(obj.contactPreference))errors.push("CONTACT_PREFERENCE_INVALID");
   if(obj.contactPreference==="phone"&&!filled(obj.phone,24))errors.push("PHONE_REQUIRED_FOR_CALLS");
   break;
  case 1:
   if(!STAGES.includes(obj.stage))errors.push("BUSINESS_STAGE_INVALID");
   if(obj.stage==="established"&&!filled(obj.businessName,140))errors.push("BUSINESS_NAME_REQUIRED");
   if(obj.website&&!validUrl(obj.website))errors.push("BUSINESS_URL_INVALID");
   if(!Array.isArray(obj.businessSocialUrls)||obj.businessSocialUrls.length>5||!obj.businessSocialUrls.every(validUrl))errors.push("SOCIAL_URL_INVALID");
   break;
  case 2:
   if(!filled(obj.description,3500))errors.push("VISION_REQUIRED");
   if(!txt(obj.successMetric,500))errors.push("SUCCESS_METRIC_TOO_LONG");
   break;
  case 3:
   if(!filled(obj.customers,900))errors.push("CUSTOMER_DESCRIPTION_REQUIRED");
   if(!filled(obj.problemSolved,1100))errors.push("PROBLEM_TO_SOLVE_REQUIRED");
   break;
  case 4:
   if(!INTENTS.includes(obj.intent))errors.push("SOLUTION_TYPE_INVALID");
   if(!filled(obj.mustHaves,1600))errors.push("MUST_HAVES_REQUIRED");
   if(!["no","yes","unsure"].includes(obj.hasSensitiveData))errors.push("SENSITIVE_DATA_ANSWER_REQUIRED");
   break;
  case 5:
   if(!Array.isArray(obj.tone)||obj.tone.length>5||!obj.tone.every(x=>filled(x,45)))errors.push("TONE_INVALID");
   if(!txt(obj.preferredColors,120)||!txt(obj.avoidColors,120))errors.push("COLORS_INVALID");
   if(!Array.isArray(obj.referenceUrls)||obj.referenceUrls.length>4||!obj.referenceUrls.every(validUrl))errors.push("REFERENCE_URL_INVALID");
   break;
  case 6:
   if(!BUDGETS.includes(obj.budget))errors.push("BUDGET_INVALID");
   if(!["asap","month","quarter","flexible"].includes(obj.timeline))errors.push("TIMELINE_INVALID");
   if(!["yes","no","unsure"].includes(obj.ongoingSupport))errors.push("SUPPORT_INVALID");
   break;
  case 7:
   if(typeof obj.researchConsent!=="boolean"||typeof obj.contactConsent!=="boolean"||typeof obj.marketingConsent!=="boolean"||typeof obj.authorityConfirmed!=="boolean")errors.push("CONSENT_BOOLEAN_REQUIRED");
   if(!Array.isArray(obj.researchScopes)||obj.researchScopes.length>4||obj.researchScopes.some(x=>!RESEARCH_SCOPES.includes(x)))errors.push("RESEARCH_SCOPE_INVALID");
   if(obj.researchScopes.length>0 && (!obj.researchConsent||!obj.authorityConfirmed))errors.push("RESEARCH_AUTHORITY_REQUIRED");
   // A person may download a local brief without accepting follow-up contact.
   break;
  default: errors.push("STEP_INVALID");
 }
 return errors;
}
export function validateAll(answers){
 return QUESTIONS.flatMap((x,i)=>validateStep(i,answers).map(code=>({step:x.id,code})));
}
export function nextStep(index,answers){
 const errors=validateStep(index,answers);
 return {canContinue:errors.length===0,errors,index:index+1,question:index+1<8?stepFor(index+1,answers):null};
}
export function buildBrief(answers){
 const errors=validateAll(answers);
 if(errors.length)throw Object.assign(new Error("INTAKE_INCOMPLETE"),{code:"INTAKE_INCOMPLETE",errors});
 const p=answers.permission;
 return {
  contract:INTAKE_VERSION,status:"DRAFT_NOT_SENT_OR_PROVISIONED",
  client:{fullName:answers.identity.fullName.trim(),email:answers.identity.email.trim(),phone:answers.identity.phone.trim(),contactPreference:answers.identity.contactPreference},
  business:{stage:answers.business.stage,name:answers.business.businessName.trim(),website:answers.business.website.trim(),socialLinks:[...answers.business.businessSocialUrls],serviceArea:answers.business.serviceArea.trim()},
  objective:{vision:answers.vision.description.trim(),successMetric:answers.vision.successMetric.trim(),audience:answers.audience.customers.trim(),problem:answers.audience.problemSolved.trim(),services:answers.audience.services.trim()},
  build:{intent:answers.capabilities.intent,mustHaves:answers.capabilities.mustHaves.trim(),tools:answers.capabilities.existingTools.trim(),sensitiveData:answers.capabilities.hasSensitiveData},
  brand:{tone:[...answers.identity_style.tone],preferredColors:answers.identity_style.preferredColors.trim(),avoidColors:answers.identity_style.avoidColors.trim(),referenceUrls:[...answers.identity_style.referenceUrls],assetNote:answers.identity_style.brandAssets.trim()},
  delivery:{...answers.delivery},
  consent:{research:p.researchConsent,researchScopes:p.researchScopes.filter(x=>RESEARCH_SCOPES.includes(x)),authorityConfirmed:p.authorityConfirmed,contact:p.contactConsent,marketing:p.marketingConsent},
  evidence:[],inferences:[],profileStatus:"SELF_REPORTED_UNVERIFIED",quoteStatus:"NOT_QUOTED",buildAuthorized:false,productionAuthorized:false,customerContactAuthorized:false
 };
}
