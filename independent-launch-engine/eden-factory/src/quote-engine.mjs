import { SERVICE_CATALOG, CATALOG_VERSION, FEATURE_HOURS, RESTRICTED_REVIEW } from './service-catalog.mjs';

// Not a marketplace price feed. Versioned INITIAL INTERNAL UNIT-ECONOMICS ASSUMPTIONS ONLY.
export const ASSUMPTIONS = Object.freeze({
  version:'cost-policy-2026-10-11-DRAFT',
  hourlyDeliveryCostUSD:45,
  overheadFactor:1.2,
  minimumGrossMargin:0.30,
  quoteUpperFactor:1.30,
  quoteExpiryDays:14,
  status:'INTERNAL_ESTIMATE_UNVALIDATED',
  currency:'USD'
});
const MODES = Object.freeze({ standard:1, advanced:1.35, enterprise:1.8 });
const isNonEmpty = (v,max=4000) => typeof v==='string' && v.trim().length>0 && v.trim().length<=max;
const moneyUp = n => Math.ceil(n/25)*25;
export class EdenQuoteError extends Error { constructor(code){ super(code); this.code=code; this.name='EdenQuoteError'; } }
function guard(ok,code){if(!ok)throw new EdenQuoteError(code);}
function digest(obj){
  // Deterministic local-preview fingerprint only, NOT a cryptographic authorization signature.
  let h=2166136261;
  for(const char of JSON.stringify(obj)){h=Math.imul(h^char.charCodeAt(0),16777619)>>>0;}
  return 'preview-'+h.toString(16).padStart(8,'0');
}

/** Returns an indicative cost-backed estimate, never an accepted offer or automatically dispatched job. */
export function quoteVision(input, policy=ASSUMPTIONS){
  guard(input && typeof input==='object' && !Array.isArray(input),'INPUT_REQUIRED');
  guard(isNonEmpty(input.vision,3500),'VISION_REQUIRED');
  guard(Object.hasOwn(SERVICE_CATALOG,input.serviceKey),'UNKNOWN_SERVICE');
  guard(Object.hasOwn(MODES,input.complexity),'COMPLEXITY_INVALID');
  guard(Array.isArray(input.features) && input.features.length<=20,'FEATURES_INVALID');
  guard(input.features.every(f=>Object.hasOwn(FEATURE_HOURS,f)),'FEATURE_INVALID');
  guard(new Set(input.features).size===input.features.length,'DUPLICATE_FEATURE');
  guard(Number.isInteger(input.integrationCount)&&input.integrationCount>=0&&input.integrationCount<=12,'INTEGRATIONS_INVALID');
  guard(Array.isArray(input.complianceFlags) && input.complianceFlags.length<=RESTRICTED_REVIEW.length,'COMPLIANCE_INVALID');
  guard(input.complianceFlags.every(f=>RESTRICTED_REVIEW.includes(f)),'COMPLIANCE_INVALID');
  guard(Number.isFinite(policy.hourlyDeliveryCostUSD)&&policy.hourlyDeliveryCostUSD>0,'INVALID_COST_POLICY');
  guard(Number.isFinite(policy.overheadFactor)&&policy.overheadFactor>=1,'INVALID_COST_POLICY');
  guard(Number.isFinite(policy.minimumGrossMargin)&&policy.minimumGrossMargin>=0.15&&policy.minimumGrossMargin<=0.6,'INVALID_MARGIN_POLICY');
  guard(Number.isFinite(policy.quoteUpperFactor)&&policy.quoteUpperFactor>=1&&policy.quoteUpperFactor<=2,'INVALID_RANGE_POLICY');
  guard(isNonEmpty(policy.version,100),'INVALID_COST_POLICY');
  const service = SERVICE_CATALOG[input.serviceKey];
  const featureHours=input.features.reduce((sum,key)=>sum+FEATURE_HOURS[key],0);
  const integrationsHours=input.integrationCount*10;
  const estimatedHours=Math.ceil((service.hours+featureHours+integrationsHours)*MODES[input.complexity]);
  const totalEstimatedDeliveryCost=estimatedHours*policy.hourlyDeliveryCostUSD*policy.overheadFactor;
  const minimumQuote=moneyUp(totalEstimatedDeliveryCost/(1-policy.minimumGrossMargin));
  const highQuote=moneyUp(minimumQuote*policy.quoteUpperFactor);
  const riskFlags=[...new Set(input.complianceFlags)];
  const discoveryNeeded=service.requiresDiscovery||riskFlags.length>0||input.integrationCount>=5||input.complexity==='enterprise';
  const result={
    quoteStatus:discoveryNeeded?'DISCOVERY_REQUIRED':'INDICATIVE_ONLY',
    commercialStatus:'NOT_BINDING_NOT_APPROVED',
    serviceKey:input.serviceKey, serviceName:service.title, family:service.family,
    scopeSummary:input.vision.trim().slice(0,360),
    effortHours:estimatedHours, estimatedCostUSD:Math.round(totalEstimatedDeliveryCost),
    indicativeRangeUSD:{low:minimumQuote,high:highQuote},
    includedFeatures:[...input.features], integrationCount:input.integrationCount,
    complexity:input.complexity, complianceReviewFlags:riskFlags,
    catalogVersion:CATALOG_VERSION,costPolicyVersion:policy.version,
    pricingBasis:'INTERNAL_COST_ASSUMPTIONS_NOT_MARKET_BENCHMARKED',
    nextStep:discoveryNeeded?'REVIEW_FEASIBILITY_AND_CONSENT':'FREEZE_SCOPE_AND_VALIDATE_FEASIBILITY',
    actualPaymentAuthorized:false, provisionAuthorized:false,customerMessageAuthorized:false,
    notes:['Indicative range only, not a fixed-price offer or market-lowest guarantee.',
           'No customer data is stored or sent by this pure calculation.',
           'An approved signed scope and cost estimate are required before contract or build.']
  };
  return Object.freeze({...result,quoteFingerprint:digest(result)});
}

/** A lower-cost path that still acknowledges what the first engagement can realistically deliver. */
export function recommendAffordableStart(input){
  if(!input || !Object.hasOwn(SERVICE_CATALOG,input.serviceKey))throw new EdenQuoteError('UNKNOWN_SERVICE');
  return input.serviceKey==='idea_sprint' ?
    {serviceKey:'idea_sprint',scope:'Validate the idea, deliver a blueprint and milestone quote.'} :
    {serviceKey:'idea_sprint',scope:'Start with an affordable discovery sprint, prototype boundaries and a fixed-scope implementation roadmap. Do not imply the full application is included.'};
}

export function suggestServices(vision){
  guard(isNonEmpty(vision),'VISION_REQUIRED');
  const x=vision.toLowerCase();
  const rules=[['ecommerce',/shop|store|sells? products|checkout|ecommerce/],['website_funnel',/website|landing page|lead generation|seo|funnel/],['voice_assistant',/voice|telephone|phone assistant|receptionist/],['ai_agent',/agent|chatbot|ai assistant/],['data_dashboard',/analytics|dashboard|reporting|charts/],['data_pipeline',/data integration|data pipeline|sync data/],['workflow_automation',/automate|workflow|zapier|manual process/],['app_mvp',/app|software|saas|platform/]];
  const result=rules.filter(([_,re])=>re.test(x)).map(([key])=>key);
  return result.length ? [...new Set(result)].slice(0,3) : ['custom'];
}

export const demoRequest=Object.freeze({
  vision:'An easy client booking app that sends reminders and shows progress',
  serviceKey:'app_mvp',complexity:'standard',features:['user_accounts','bookings'],
  integrationCount:0,complianceFlags:[]
});
