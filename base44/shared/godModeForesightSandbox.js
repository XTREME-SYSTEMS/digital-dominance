/**
 * Staging-only GOD MODE + Lead Asset Foresight numerical canary.
 * Based on synthetic scenario contract. No Search Console, live buyer offers
 * or verified market data. NEVER use to make release or spending decisions.
 * Canonical live God Mode simulation remains godModeSimulationEngine.
 */
export const FORESIGHT_STATUS = "SIMULATED_UNCALIBRATED_NOT_BUYER_BACKED";
export const FORESIGHT_STRATEGIES = Object.freeze([
  ["S01", "Single flagship authority site", 1.0, 1.0, 1.0],
  ["S02", "Focused service subfolders", 1.08, 1.07, 1.1],
  ["S03", "Verified local service pages", 1.18, 1.18, 1.07],
  ["S04", "Buyer co-branded acquisition", 1.15, 1.44, 1.25],
  ["S05", "High-intent paid landing page", 1.45, 1.65, 1.02],
  ["S06", "Adjacent services hub", 1.17, 1.11, 1.11],
  ["S07", "Interactive pricing calculator", 1.35, 1.35, 1.18],
  ["S08", "Separate differentiated brands", 1.23, 1.72, 1.05],
  ["S09", "Regional authority hub", 1.15, 1.08, 1.06],
  ["S10", "Adaptive evidence portfolio", 1.26, 1.2, 1.19],
]);
const assumptions = Object.freeze({
  monthly_visitors: {low:100, mode:250, high:600},
  visitor_to_lead: {low:0.01, mode:0.03, high:0.06},
  lead_to_qualified: {low:0.3, mode:0.5, high:0.75},
  buyer_acceptance: {low:0.5, mode:0.7, high:0.9},
  accepted_lead_price: {low:25, mode:60, high:110},
  monthly_fixed_cost: {low:200, mode:350, high:700},
  cost_per_visit: {low:0, mode:0.05, high:0.2},
  buyer_churn: {low:0, mode:0.05, high:0.2},
  saturation: {low:0, mode:0.05, high:0.15}
});
export const SYNTHETIC_FORESIGHT_ASSUMPTIONS = assumptions;
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function triangular({low,mode,high},r) {
  const u = r();
  const frac = (mode-low)/(high-low || 1);
  return u < frac ? low + Math.sqrt(u*(high-low)*(mode-low)) :
    high-Math.sqrt((1-u)*(high-low)*(high-mode));
}
function percentile(values, percent) {
  const index=(values.length-1)*percent;
  const a=Math.floor(index),b=Math.ceil(index);
  return values[a]+(values[b]-values[a])*(index-a);
}
const cents = x => Math.round(x*100)/100;
export function runSyntheticForesight({seed=20261013,draws=1000,months=12,synthetic=true}={}) {
  if (!synthetic || !Number.isInteger(draws) || draws!==1000 ||
      !Number.isInteger(months) || months!==12 ||
      !Number.isInteger(seed) || seed<1) throw new Error("FORESIGHT_CANARY_SYNTHETIC_ONLY");
  const strategies=FORESIGHT_STRATEGIES.map(([id,name,trafficMult,costMult,conversionMult],strategyIndex)=>{
    const r=rng(seed+strategyIndex*1013);
    const outcomes=[];
    for(let i=0;i<draws;i++){
      const visitors=triangular(assumptions.monthly_visitors,r)*trafficMult;
      const vtl=triangular(assumptions.visitor_to_lead,r)*conversionMult;
      const qualified=triangular(assumptions.lead_to_qualified,r);
      const buyer=triangular(assumptions.buyer_acceptance,r);
      const price=triangular(assumptions.accepted_lead_price,r);
      const fixed=triangular(assumptions.monthly_fixed_cost,r)*costMult;
      const variable=triangular(assumptions.cost_per_visit,r);
      const churn=triangular(assumptions.buyer_churn,r);
      const saturation=triangular(assumptions.saturation,r);
      let net=0;
      for(let m=0;m<months;m++){
        const demand=visitors*Math.max(0.1,1-saturation*m/12);
        const retained=Math.pow(1-churn,m/12);
        net += demand*vtl*qualified*buyer*price*retained - (fixed + demand*variable);
      }
      outcomes.push(net);
    }
    outcomes.sort((a,b)=>a-b);
    return {
      id,name,draws,months,
      net_12mo_p10:cents(percentile(outcomes,.1)),
      net_12mo_p50:cents(percentile(outcomes,.5)),
      net_12mo_p90:cents(percentile(outcomes,.9)),
      probability_positive:cents(outcomes.filter(x=>x>0).length/outcomes.length),
      source_class:FORESIGHT_STATUS,
      decision:"HOLD_BUYER_EVIDENCE_MISSING",
    };
  });
  const ranked=[...strategies].sort((a,b)=>b.net_12mo_p50-a.net_12mo_p50);
  return {
    status:FORESIGHT_STATUS,model:"SYNTHETIC_MONTE_CARLO_TOURNAMENT_V1",
    seed,draws,months,currency:"USD",
    assumptions:JSON.parse(JSON.stringify(assumptions)),
    strategies,ranked_by_hypothetical_median:ranked.map(x=>x.id),
    pricing_evidence:"NONE",traffic_evidence:"NONE",buyer_evidence:"NONE",
    site_fulfillment_proof:"NONE",source_verification:"NONE",
    decision:"HOLD_NOT_DEPLOYABLE",
    customer_messaging:false,paid_launch:false,publish:false
  };
}
