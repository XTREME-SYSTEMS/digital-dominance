import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { invokeIndependentAi } from '../../shared/independentCore.ts';
import { secrets } from "base44:runtime";

// ============================================================
// Domain Gold Rush — UNIVERSAL Digital Dominance Intelligence
// ============================================================
// Actions:
//   search              — generate candidates, check real availability, score
//   score               — score a single domain
//   researchSearchTerms — LLM + web search: top searches, volumes, lost clicks, TLD patterns
//   generateBusinessNames — name gen + domain availability + business name availability
//   runSimulation       — parallel predictions with economic + psychology data
//   generateStrategy    — exhaustive programmatic strategy for URL purchase + swarm
//   generateContent     — SEO/AEO/AI-optimized content meeting Google requirements
//   generateFunnel      — psychology-based multi-template funnel
//   generateDominancePlan — every method for first-page Google domination
//   generateFormFlood   — mass form-filling plan using cloud browser + agents
// ============================================================

const TLD_VALUE: Record<string, number> = {
  com: 100, net: 80, org: 70, co: 65, io: 60, ai: 55, us: 50, pro: 55,
  biz: 40, info: 35, online: 45, site: 40, store: 45, xyz: 30,
};

const PATTERN_INTENT: Record<string, number> = {
  near_me: 100, near_you: 95, near_me_city: 98, city_state: 90,
  cost: 85, best: 88, affordable: 82, local: 80, pro: 78,
};

function slugify(s: string): string {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
}

function generateCandidates(
  keyword: string, pattern: string, city: string, state: string,
  tlds: string[], count: number
): string[] {
  const kw = slugify(keyword);
  const c = city ? slugify(city) : "";
  const st = state ? state.toLowerCase().trim() : "";
  const namePatterns: string[] = [];

  switch (pattern) {
    case "near_me":
      namePatterns.push(`${kw}nearme`);
      if (c) { namePatterns.push(`${kw}nearme${c}`); namePatterns.push(`${c}${kw}nearme`); }
      namePatterns.push(`best${kw}nearme`, `top${kw}nearme`, `pro${kw}nearme`);
      break;
    case "near_you":
      namePatterns.push(`${kw}nearyou`);
      if (c) namePatterns.push(`${kw}nearyou${c}`);
      namePatterns.push(`best${kw}nearyou`);
      break;
    case "near_me_city":
      if (c) {
        namePatterns.push(`${kw}nearme${c}`, `${c}${kw}nearme`, `${kw}${c}nearme`, `${kw}in${c}`, `${c}${kw}`, `${kw}${c}`);
      } else {
        namePatterns.push(`${kw}nearme`);
      }
      break;
    case "city_state":
      if (c) {
        namePatterns.push(`${kw}${c}`, `${c}${kw}`);
        if (st) namePatterns.push(`${kw}${c}${st}`, `${c}${st}${kw}`);
      }
      break;
    case "cost":
      namePatterns.push(`${kw}cost`, `costof${kw}`, `${kw}prices`, `${kw}pricing`, `affordable${kw}`);
      break;
    case "best":
      namePatterns.push(`best${kw}`, `top${kw}`, `best${kw}nearme`, `toprated${kw}`);
      break;
    case "affordable":
      namePatterns.push(`affordable${kw}`, `cheap${kw}`, `budget${kw}`);
      break;
    case "local":
      namePatterns.push(`local${kw}`, `${kw}local`);
      if (c) namePatterns.push(`local${kw}${c}`);
      break;
    case "pro":
      namePatterns.push(`${kw}pro`, `pro${kw}`, `${kw}pros`, `expert${kw}`);
      break;
    default:
      namePatterns.push(kw);
  }

  namePatterns.push(kw);
  if (c) namePatterns.push(`${kw}${c}`);

  const domains = new Set<string>();
  for (const p of namePatterns) {
    if (!p) continue;
    for (const tld of tlds) {
      domains.add(`${p}.${tld}`);
    }
  }
  return Array.from(domains).slice(0, count);
}

const RDAP_SERVERS: Record<string, string> = {
  com: "https://rdap.verisign.com/com/v1/domain/",
  net: "https://rdap.verisign.com/net/v1/domain/",
  org: "https://rdap.publicinterestregistry.org/rdap/domain/",
  co: "https://rdap.nic.co/domain/",
  io: "https://rdap.identitydigital.services/rdap/domain/",
  ai: "https://rdap.nic.ai/domain/",
  us: "https://rdap.nic.us/domain/",
  biz: "https://rdap.nic.biz/domain/",
  info: "https://rdap.nic.info/domain/",
  pro: "https://rdap.afilias-srs.net/pro/domain/",
  online: "https://rdap.centralnic.com/online/domain/",
  site: "https://rdap.centralnic.com/site/domain/",
  store: "https://rdap.centralnic.com/store/domain/",
  xyz: "https://rdap.centralnic.com/xyz/domain/",
};

async function checkAvailability(domain: string): Promise<{
  available: boolean; status: number; registrar?: string; error?: string;
}> {
  const tld = domain.split(".").pop() || "";
  const rdapUrl = RDAP_SERVERS[tld] || `https://rdap.org/domain/`;

  try {
    const res = await fetch(`${rdapUrl}${domain}`, {
      headers: {
        "Accept": "application/rdap+json, application/json",
        "User-Agent": "XtremeAI-DomainRush/1.0 (https://epoxyquotenearme.com)",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 404) return { available: true, status: 404 };
    if (res.status === 200) {
      try {
        const data: any = await res.json();
        const registrar = data.entities
          ?.find((e: any) => e.roles?.includes("registrar"))
          ?.vcardArray?.[1]?.find((v: any) => v[0] === "fn")?.[3];
        return { available: false, status: 200, registrar };
      } catch {
        return { available: false, status: 200 };
      }
    }
    if (res.status === 403) {
      try {
        const fallback = await fetch(`https://rdap.org/domain/${domain}`, {
          headers: { "Accept": "application/rdap+json", "User-Agent": "XtremeAI-DomainRush/1.0" },
          signal: AbortSignal.timeout(12000),
        });
        if (fallback.status === 404) return { available: true, status: 404 };
        if (fallback.status === 200) return { available: false, status: 200 };
        return { available: false, status: fallback.status, error: `Fallback status ${fallback.status}` };
      } catch (e2: any) {
        return { available: false, status: 403, error: "RDAP blocked" };
      }
    }
    return { available: false, status: res.status, error: `Status ${res.status}` };
  } catch (e: any) {
    return { available: false, status: 0, error: e.message };
  }
}

function scoreDomain(
  domain: string, keyword: string, pattern: string, city: string
): { score: number; breakdown: Record<string, { value: number; max: number; label: string }> } {
  const parts = domain.split(".");
  const name = parts[0];
  const tld = parts.slice(1).join(".");
  const kw = slugify(keyword);
  const c = city ? slugify(city) : "";

  let keywordMatch = 0;
  if (!kw) keywordMatch = 15;
  else if (name === kw) keywordMatch = 30;
  else if (name.startsWith(kw) || name.endsWith(kw)) keywordMatch = 25;
  else if (name.includes(kw)) keywordMatch = 20;
  else if (kw.includes(name) && name.length > 4) keywordMatch = 10;

  const tldVal = TLD_VALUE[tld] || 25;
  const tldScore = Math.round((tldVal / 100) * 20);

  const intentScore = Math.round(((PATTERN_INTENT[pattern] || 50) / 100) * 20);

  const len = name.length;
  let lengthScore = 15;
  if (len > 10) lengthScore = 12;
  if (len > 15) lengthScore = 9;
  if (len > 20) lengthScore = 6;
  if (len > 25) lengthScore = 3;

  let cityScore = 0;
  if (c) {
    cityScore = name.includes(c) ? 10 : 0;
  } else {
    cityScore = 5;
  }

  let cleanScore = 5;
  if (name.includes("-")) cleanScore -= 2;
  if (/\d/.test(name)) cleanScore -= 2;
  cleanScore = Math.max(0, cleanScore);

  const total = keywordMatch + tldScore + intentScore + lengthScore + cityScore + cleanScore;

  return {
    score: total,
    breakdown: {
      keywordMatch: { value: keywordMatch, max: 30, label: "Keyword Match" },
      tldScore: { value: tldScore, max: 20, label: "TLD Value" },
      intentScore: { value: intentScore, max: 20, label: "Search Intent" },
      lengthScore: { value: lengthScore, max: 15, label: "Length" },
      cityScore: { value: cityScore, max: 10, label: "City Match" },
      cleanScore: { value: cleanScore, max: 5, label: "Cleanliness" },
    },
  };
}

// ── Business name generation ──
function generateBusinessNames(keyword: string, city: string, count: number = 30): string[] {
  const kw = keyword.toLowerCase().trim().replace(/\s+/g, "");
  const kwSpaced = keyword.toLowerCase().trim();
  const c = city ? city.toLowerCase().trim().replace(/\s+/g, "") : "";
  const cSpaced = city ? city.trim() : "";

  const prefixes = ["Pro", "Elite", "Prime", "Apex", "Summit", "Peak", "Top", "Best", "Expert", "Master", "Quick", "Rapid", "Swift", "Instant", "24/7", "Express", "Direct", "On Demand", "Now", "Today", "Immediate", "Emergency", "Urgent", "Fast", "Reliable", "Trusted", "Premier", "First", "Choice", "Preferred", "Advanced", "Complete", "Total", "Full", "All Star", "All American", "National", "Local", "Hometown", "Community", "Metro", "Capital", "Central"];
  const suffixes = ["Pro", "Pros", "Experts", "Specialists", "Masters", "Team", "Group", "Co", "Company", "Services", "Solutions", "Systems", "Works", "Tech", "Force", "Crew", "Partners", "Associates", "Brothers", "Family", "Plus", "HQ", "Hub", "Center", "Studio", "Lab", "Zone", "Spot", "Place", "Point", "Way", "Path", "Line", "Link", "Edge", "Core", "Base", "Source", "One", "First", "24/7", "Now", "Express", "Direct"];
  const tailWords = ["Near Me", "Near You", "Nearby", "Local", "Now", "Today", "24/7", "Express", "Direct", "Pro"];

  const names = new Set<string>();

  // Pattern 1: Prefix + Keyword (with proper spacing)
  for (const p of prefixes) {
    names.add(`${p} ${kwSpaced}`);
    if (cSpaced) names.add(`${p} ${kwSpaced} ${cSpaced}`);
  }

  // Pattern 2: Keyword + Suffix
  for (const s of suffixes) {
    names.add(`${kwSpaced} ${s}`);
    if (cSpaced) names.add(`${kwSpaced} ${cSpaced} ${s}`);
  }

  // Pattern 3: City + Keyword
  if (cSpaced) {
    names.add(`${cSpaced} ${kwSpaced}`);
    names.add(`${cSpaced} ${kwSpaced} Pro`);
    names.add(`${cSpaced} ${kwSpaced} Experts`);
  }

  // Pattern 4: Keyword + Tail Word
  for (const t of tailWords) {
    names.add(`${kwSpaced} ${t}`);
    if (cSpaced) names.add(`${kwSpaced} ${cSpaced} ${t}`);
  }

  // Pattern 5: "The" + Keyword
  names.add(`The ${kwSpaced} Pro`);
  names.add(`The ${kwSpaced} Experts`);
  if (cSpaced) names.add(`The ${cSpaced} ${kwSpaced}`);

  // Pattern 6: Keyword + "of" + City
  if (cSpaced) {
    names.add(`${kwSpaced} of ${cSpaced}`);
    names.add(`${kwSpaced} of ${cSpaced} County`);
  }

  return Array.from(names).slice(0, count);
}

// ── Check business name availability via state business registry search ──
// Uses a simple web search approach via the LLM to check if a business name is in use.
async function checkBusinessNameAvailability(
  base44: any, name: string, state: string
): Promise<{ available: boolean; conflictingBusinesses: string[]; source: string }> {
  try {
    const result = await invokeIndependentAi(base44, {
      prompt: `Search the web for businesses named "${name}"${state ? ` in ${state}` : ""}. 

Check:
1. Is there an existing business with this exact or very similar name?
2. Is this name trademarked (check USPTO)?
3. Is there a prominent business using this name on Google, Yelp, BBB, or social media?

Return JSON with:
- name_taken: boolean (true if a real business with this name exists)
- conflicting_businesses: array of up to 3 business names that conflict
- confidence: "high" | "medium" | "low"
- source: what you checked (google, yelp, uspto, etc.)

Be conservative — if you find a real, active business with this exact name, mark it taken.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          name_taken: { type: "boolean" },
          conflicting_businesses: { type: "array", items: { type: "string" } },
          confidence: { type: "string" },
          source: { type: "string" },
        },
      },
    });

    return {
      available: !result.name_taken,
      conflictingBusinesses: result.conflicting_businesses || [],
      source: result.source || "web_search",
    };
  } catch (e: any) {
    return { available: false, conflictingBusinesses: [], source: `error: ${e.message}` };
  }
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ── SEARCH (existing) ──
    if (action === "search") {
      const { keyword, pattern, city, state, tlds, count, queueResults, niche } = body;
      if (!keyword) return Response.json({ error: "keyword is required" }, { status: 400 });

      const tldList = tlds && tlds.length ? tlds : ["com", "net", "co"];
      const maxCount = Math.min(count || 40, 100);

      const candidates = generateCandidates(keyword, pattern || "near_me", city || "", state || "", tldList, maxCount);

      const results = [];
      const batchSize = 6;
      for (let i = 0; i < candidates.length; i += batchSize) {
        const batch = candidates.slice(i, i + batchSize);
        const checks = await Promise.all(batch.map(async (domain) => {
          const avail = await checkAvailability(domain);
          const scoring = scoreDomain(domain, keyword, pattern || "near_me", city || "");
          return {
            domain,
            available: avail.available,
            registrar: avail.registrar,
            checkStatus: avail.status,
            checkError: avail.error,
            score: scoring.score,
            breakdown: scoring.breakdown,
          };
        }));
        results.push(...checks);
      }

      results.sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        return b.score - a.score;
      });

      let queued = 0;
      if (queueResults) {
        for (const r of results.filter(r => r.available)) {
          try {
            await base44.entities.DomainStrategy.create({
              domain: r.domain,
              niche: niche || "epoxy_garage",
              keyword_pattern: pattern || "near_me",
              target_city: city || null,
              target_state: state || null,
              status: "available",
              competition_level: r.score >= 80 ? "low" : r.score >= 60 ? "medium" : "high",
            });
            queued++;
          } catch (e) { }
        }
      }

      return Response.json({
        ok: true, keyword, pattern, city, state,
        totalChecked: results.length,
        availableCount: results.filter(r => r.available).length,
        takenCount: results.filter(r => !r.available && !r.checkError).length,
        errorCount: results.filter(r => !!r.checkError).length,
        results, queued,
      });
    }

    // ── SCORE (existing) ──
    if (action === "score") {
      const { domain, keyword, pattern, city } = body;
      if (!domain) return Response.json({ error: "domain is required" }, { status: 400 });
      const scoring = scoreDomain(domain, keyword || "", pattern || "near_me", city || "");
      return Response.json({ ok: true, domain, ...scoring });
    }

    // ── RESEARCH SEARCH TERMS (NEW) ──
    // Uses LLM + web search to find top searches, search volumes, lost clicks, TLD patterns
    if (action === "researchSearchTerms") {
      const { keyword, city, state, niche } = body;
      if (!keyword) return Response.json({ error: "keyword is required" }, { status: 400 });

      const result = await invokeIndependentAi(base44, {
        prompt: `You are a search intelligence analyst. Research the keyword "${keyword}"${city ? ` in ${city}, ${state || ""}` : ""} for a digital dominance strategy.

Find and return:
1. TOP_SEARCHES: The top 20 Google search queries related to "${keyword}" that include location modifiers (near me, near you, nearby, in my area, close to me, etc.). For each, include the estimated monthly search volume and competition level.

2. LOST_CLICKS: Identify the top 10 search queries where businesses are LOSING clicks — meaning high search volume but poor results / no good providers / thin content. These are opportunity gaps.

3. TAIL_WORD_ANALYSIS: Which tail words (nearme, nearyou, nearby, local, now, today, 247, emergency, sameday) have the highest search volume for this niche? Rank them by estimated search share.

4. TLD_PATTERNS: Which domain patterns (keyword+nearme.com, city+keyword.com, etc.) are most commonly registered by competitors? Which patterns are still available?

5. COMPETITOR_ANALYSIS: Who are the top 5 organic competitors for "${keyword} near me"? What domains do they use? What's their estimated traffic?

6. OTHER_PLATFORMS: What other platforms besides Google have search data we can leverage? (YouTube, Bing, Amazon, Yelp, Facebook, TikTok, Reddit, Quora, etc.) — for each, note what search data is available.

7. SEARCH_INTENT_BREAKDOWN: What percentage of searches are transactional (ready to buy) vs informational (researching) vs navigational (looking for specific business)?

Return as structured JSON.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            top_searches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  monthly_volume: { type: "string" },
                  competition: { type: "string" },
                  intent: { type: "string" },
                },
              },
            },
            lost_clicks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  volume: { type: "string" },
                  gap_reason: { type: "string" },
                  opportunity_score: { type: "number" },
                },
              },
            },
            tail_word_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tail_word: { type: "string" },
                  search_share: { type: "number" },
                  intent: { type: "string" },
                },
              },
            },
            tld_patterns: {
              type: "object",
              properties: {
                most_registered: { type: "array", items: { type: "string" } },
                likely_available: { type: "array", items: { type: "string" } },
              },
            },
            competitor_analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  domain: { type: "string" },
                  est_traffic: { type: "string" },
                  ranking_keywords: { type: "number" },
                },
              },
            },
            other_platforms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  platform: { type: "string" },
                  data_available: { type: "string" },
                  relevance: { type: "string" },
                },
              },
            },
            search_intent_breakdown: {
              type: "object",
              properties: {
                transactional: { type: "number" },
                informational: { type: "number" },
                navigational: { type: "number" },
              },
            },
          },
        },
      });

      return Response.json({ ok: true, keyword, city, state, research: result });
    }

    // ── GENERATE BUSINESS NAMES (NEW) ──
    if (action === "generateBusinessNames") {
      const { keyword, city, state, tlds, count, checkBusinessNames: doCheckBiz } = body;
      if (!keyword) return Response.json({ error: "keyword is required" }, { status: 400 });

      const tldList = tlds && tlds.length ? tlds : ["com", "net", "co"];
      const maxNames = Math.min(count || 30, 50);
      const names = generateBusinessNames(keyword, city || "", maxNames);

      // For each name, generate domain candidates and check availability
      const results = [];
      const batchSize = 5;
      for (let i = 0; i < names.length; i += batchSize) {
        const batch = names.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(async (name) => {
          const domainBase = slugify(name);
          const domainCandidates = tldList.map((tld) => `${domainBase}.${tld}`);

          // Check domain availability for all TLDs
          const domainChecks = await Promise.all(
            domainCandidates.map(async (domain) => {
              const avail = await checkAvailability(domain);
              return { domain, available: avail.available, registrar: avail.registrar };
            })
          );

          const availableDomains = domainChecks.filter((d) => d.available);
          const bestDomain = availableDomains[0]?.domain || domainCandidates[0];

          return {
            business_name: name,
            domains: domainChecks,
            best_available_domain: availableDomains.length > 0 ? bestDomain : null,
            all_domains_taken: availableDomains.length === 0,
          };
        }));
        results.push(...batchResults);
      }

      // Optionally check business name availability (slower — LLM web search)
      // Only check top 10 to avoid excessive API calls
      if (doCheckBiz) {
        const topNames = results.slice(0, 10);
        for (const r of topNames) {
          if (r.best_available_domain) {
            const bizCheck = await checkBusinessNameAvailability(base44, r.business_name, state || "");
            r.business_name_available = bizCheck.available;
            r.conflicting_businesses = bizCheck.conflictingBusinesses;
            r.business_name_source = bizCheck.source;
          }
        }
      }

      // Sort: domain available first, then shortest name
      results.sort((a, b) => {
        if (!!a.best_available_domain !== !!b.best_available_domain) {
          return a.best_available_domain ? -1 : 1;
        }
        return a.business_name.length - b.business_name.length;
      });

      return Response.json({
        ok: true, keyword, city, state,
        totalGenerated: results.length,
        withAvailableDomain: results.filter((r) => r.best_available_domain).length,
        results,
      });
    }

    // ── RUN SIMULATION (NEW) ──
    if (action === "runSimulation") {
      const { keyword, city, state, domain, niche, scenarios, iterations } = body;
      if (!keyword) return Response.json({ error: "keyword is required" }, { status: 400 });

      const numScenarios = Math.min(scenarios || 5, 10);
      const numIterations = Math.min(iterations || 100, 500);

      // Run multiple simulation scenarios in parallel via LLM
      const scenarioPromises = Array.from({ length: numScenarios }, (_, i) =>
        invokeIndependentAi(base44, {
          prompt: `You are a business simulation engine. Run a deterministic Monte Carlo simulation for a digital dominance strategy.

BUSINESS: ${keyword} service business
LOCATION: ${city || "National"}, ${state || "US"}
DOMAIN: ${domain || "keyword-nearme.com"}
NICHE: ${niche || "service"}

Run ${Math.floor(numIterations / numScenarios)} iterations of a simulation considering:
1. SEARCH_VOLUME: Estimated monthly searches for "${keyword} near me" in this area
2. CLICK_THROUGH_RATE: Expected CTR based on ranking position (position 1 = 30%, 2 = 15%, 3 = 10%, etc.)
3. CONVERSION_RATE: Expected lead conversion rate (industry avg 2-5% for emergency, 5-15% for scheduled)
4. CLOSE_RATE: Expected sales close rate (20-40% for service businesses)
5. AVERAGE_ORDER_VALUE: Based on the niche
6. CUSTOMER_LIFETIME_VALUE: Repeat business + referrals
7. COMPETITION_LEVEL: Number of competing businesses and their SEO strength
8. TIME_TO_RANK: Months to achieve page 1 ranking
9. MONTHLY_COSTS: SEO, content, hosting, tools, ads
10. PSYCHOLOGY_FACTOR: How urgency/emergency affects conversion (emergency = higher conversion, lower price sensitivity)

For this scenario, vary these parameters:
- Scenario variant ${i + 1} of ${numScenarios}
- Use different assumptions for CTR, conversion, and competition levels

Return JSON with:
- scenario_name: a descriptive name for this scenario
- assumptions: the key assumptions used
- probability_of_success: 0-100 (probability of achieving page 1 ranking within 12 months)
- estimated_monthly_traffic: number
- estimated_monthly_leads: number
- estimated_monthly_revenue: number
- estimated_annual_revenue: number
- estimated_profit_margin: percentage
- time_to_break_even: months
- roi_12_month: percentage
- confidence_level: "high" | "medium" | "low"
- key_risks: array of top 3 risks
- key_opportunities: array of top 3 opportunities`,
          add_context_from_internet: true,
          model: "gemini_3_flash",
          response_json_schema: {
            type: "object",
            properties: {
              scenario_name: { type: "string" },
              assumptions: { type: "string" },
              probability_of_success: { type: "number" },
              estimated_monthly_traffic: { type: "number" },
              estimated_monthly_leads: { type: "number" },
              estimated_monthly_revenue: { type: "number" },
              estimated_annual_revenue: { type: "number" },
              estimated_profit_margin: { type: "number" },
              time_to_break_even: { type: "number" },
              roi_12_month: { type: "number" },
              confidence_level: { type: "string" },
              key_risks: { type: "array", items: { type: "string" } },
              key_opportunities: { type: "array", items: { type: "string" } },
            },
          },
        })
      );

      const scenarios_result = await Promise.all(scenarioPromises);

      // Calculate aggregate stats
      const avgProb = scenarios_result.reduce((sum, s) => sum + (s.probability_of_success || 0), 0) / scenarios_result.length;
      const avgRevenue = scenarios_result.reduce((sum, s) => sum + (s.estimated_annual_revenue || 0), 0) / scenarios_result.length;
      const bestScenario = scenarios_result.reduce((best, s) =>
        (s.estimated_annual_revenue || 0) > (best?.estimated_annual_revenue || 0) ? s : best, scenarios_result[0]);

      return Response.json({
        ok: true, keyword, city, domain,
        scenarios: scenarios_result,
        aggregate: {
          avg_probability: Math.round(avgProb),
          avg_annual_revenue: Math.round(avgRevenue),
          best_scenario_revenue: bestScenario?.estimated_annual_revenue || 0,
          best_scenario_name: bestScenario?.scenario_name || "",
          iterations_simulated: numIterations,
        },
      });
    }

    // ── GENERATE STRATEGY (NEW) ──
    if (action === "generateStrategy") {
      const { keyword, city, state, domain, niche, numSites } = body;
      if (!keyword) return Response.json({ error: "keyword is required" }, { status: 400 });

      const result = await invokeIndependentAi(base44, {
        prompt: `You are a digital dominance strategist. Create an exhaustive, programmatic strategy for dominating Google search for "${keyword}" ${city ? `in ${city}, ${state}` : "nationally"}.

DOMAIN: ${domain || "keyword-nearme.com"}
TARGET SITES: ${numSites || 100} strategic websites

Create a strategy that includes:

1. URL_PURCHASE_PLAN: Step-by-step plan for purchasing the domain(s), including which registrar to use, DNS setup, and SSL.

2. TIMELINE: A month-by-month timeline for the first 12 months, with specific milestones for each month.

3. SWARM_STRATEGY: How to deploy ${numSites || 100} strategic websites across the US, including:
   - Which cities to target first (top 50 by population + search volume)
   - Domain naming pattern for each site
   - Content strategy for each site
   - Interlinking strategy
   - How to avoid Google penalties

4. CONTENT_GENERATION: How to generate content that meets Google's 100+ programmatic website requirements:
   - E-E-A-T signals
   - Core Web Vitals
   - Structured data (Schema.org)
   - Content depth and quality
   - Internal linking
   - Mobile-first
   - Page speed
   - Security headers
   - Canonical tags
   - XML sitemaps
   - robots.txt
   - And all other technical SEO requirements

5. AI_TECHNIQUES: Every AI and technology technique to dominate digitally:
   - LLM-powered content generation
   - Automated SEO optimization
   - AEO (Answer Engine Optimization) for ChatGPT, Claude, Perplexity
   - AI image generation for visual content
   - Automated link building
   - Social media automation
   - Voice search optimization
   - Video generation
   - And more

6. PROVISIONING: How to provision through Vercel and other platforms:
   - Vercel project setup
   - Environment configuration
   - Domain attachment
   - SSL provisioning
   - CDN configuration
   - Multiplier strategy (how to scale from 1 to 1000+ sites)

7. TRIGGER_SYSTEM: Autonomous triggers to keep the system running 24/7:
   - Scheduled content generation
   - Automated indexing
   - Health monitoring
   - Auto-repair

Return as structured JSON with each section as a detailed array of steps or objects.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            url_purchase_plan: { type: "array", items: { type: "string" } },
            timeline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  milestones: { type: "array", items: { type: "string" } },
                  kpi_targets: { type: "array", items: { type: "string" } },
                },
              },
            },
            swarm_strategy: {
              type: "object",
              properties: {
                target_cities: { type: "array", items: { type: "string" } },
                naming_pattern: { type: "string" },
                content_strategy: { type: "string" },
                interlinking: { type: "string" },
                penalty_avoidance: { type: "string" },
              },
            },
            content_generation: { type: "array", items: { type: "string" } },
            ai_techniques: { type: "array", items: { type: "string" } },
            provisioning: { type: "array", items: { type: "string" } },
            trigger_system: { type: "array", items: { type: "string" } },
          },
        },
      });

      return Response.json({ ok: true, keyword, city, domain, strategy: result });
    }

    // ── GENERATE CONTENT (NEW) ──
    if (action === "generateContent") {
      const { keyword, city, state, domain, contentType, targetEngine } = body;
      if (!keyword) return Response.json({ error: "keyword is required" }, { status: 400 });

      const result = await invokeIndependentAi(base44, {
        prompt: `You are an SEO/AEO/AI search content generator. Create content optimized for "${keyword}" ${city ? `in ${city}, ${state}` : "nationally"}.

TARGET: ${targetEngine || "google"} (optimize for Google SEO, AEO for AI engines like ChatGPT/Claude/Perplexity, and voice search)
CONTENT TYPE: ${contentType || "landing_page"}

Create content that meets 100+ Google programmatic website requirements:
- E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
- Core Web Vitals compliant
- Schema.org structured data (LocalBusiness, Service, FAQ, HowTo, Review)
- Semantic HTML5
- Mobile-first responsive
- Accessible (WCAG 2.1)
- Optimized meta tags (title, description, canonical)
- Open Graph + Twitter Card
- FAQ section (for featured snippets)
- How-to section (for rich results)
- Local SEO signals (NAP, Google Business Profile)
- Internal linking structure
- Image alt text strategy
- Content depth (2000+ words for pillar pages)
- Natural keyword density (1-2%)
- LSI keywords and semantic variations
- Question optimization (People Also Ask)
- Answer-first format (for AEO)
- Citation-worthy content (for AI engines)

Return JSON with:
- title: SEO-optimized page title (under 60 chars)
- meta_description: (under 160 chars)
- h1: main heading
- content: the full page content in markdown (2000+ words)
- schema_markup: JSON-LD structured data
- faq: array of {question, answer} pairs
- internal_links: suggested internal link anchors
- meta_tags: additional meta tags
- og_tags: Open Graph tags
- aeo_summary: a concise answer for AI search engines (under 50 words)`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            meta_description: { type: "string" },
            h1: { type: "string" },
            content: { type: "string" },
            schema_markup: { type: "string" },
            faq: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  answer: { type: "string" },
                },
              },
            },
            internal_links: { type: "array", items: { type: "string" } },
            meta_tags: { type: "array", items: { type: "string" } },
            og_tags: { type: "array", items: { type: "string" } },
            aeo_summary: { type: "string" },
          },
        },
      });

      return Response.json({ ok: true, keyword, city, contentType, targetEngine, content: result });
    }

    // ── GENERATE FUNNEL (NEW) ──
    if (action === "generateFunnel") {
      const { keyword, city, state, niche, template, psychologyProfile } = body;
      if (!keyword) return Response.json({ error: "keyword is required" }, { status: 400 });

      const result = await invokeIndependentAi(base44, {
        prompt: `You are a conversion funnel architect specializing in human psychology. Create a high-converting funnel for "${keyword}" ${city ? `in ${city}, ${state}` : "nationally"}.

PSYCHOLOGY PROFILE: ${psychologyProfile || "PANIC_URGENCY"} (understand the emotional driver behind the search)
FUNNEL TEMPLATE: ${template || "emergency_service"}

Create a multi-step funnel designed based on human psychology:

1. LANDING_PAGE: The entry page — designed to match the search intent and emotional state. Include:
   - Headline that addresses the emotional driver (fear, aspiration, urgency)
   - Sub-headline that builds trust
   - Hero section with clear CTA
   - Trust signals (reviews, certifications, years in business)
   - Problem/solution framing
   - Urgency elements (for emergency niches)
   - Social proof
   - FAQ to handle objections
   - Final CTA

2. LEAD_CAPTURE: The form/page where the visitor becomes a lead:
   - Minimal friction (fewest fields possible)
   - Progressive disclosure (ask for more info later)
   - Trust microcopy
   - Submit button copy optimized for psychology

3. THANK_YOU: Post-conversion page:
   - Confirmation
   - Next steps
   - Additional trust building
   - Upsell/cross-sell if appropriate

4. FOLLOW_UP: Email/SMS sequence:
   - Immediate auto-response
   - Nurture sequence (3-5 messages)
   - Re-engagement if no response

5. PSYCHOLOGY_TRIGGERS: Specific psychological techniques used at each step:
   - Scarcity, urgency, social proof, authority, reciprocity, commitment, liking

6. CONVERSION_OPTIMIZATION: A/B test suggestions and expected conversion rates

Return as structured JSON.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            landing_page: {
              type: "object",
              properties: {
                headline: { type: "string" },
                subheadline: { type: "string" },
                hero_cta: { type: "string" },
                trust_signals: { type: "array", items: { type: "string" } },
                problem_solution: { type: "string" },
                urgency_elements: { type: "array", items: { type: "string" } },
                social_proof: { type: "array", items: { type: "string" } },
                faq_objections: { type: "array", items: { type: "string" } },
                final_cta: { type: "string" },
              },
            },
            lead_capture: {
              type: "object",
              properties: {
                fields: { type: "array", items: { type: "string" } },
                submit_button: { type: "string" },
                trust_microcopy: { type: "string" },
              },
            },
            thank_you: {
              type: "object",
              properties: {
                confirmation: { type: "string" },
                next_steps: { type: "array", items: { type: "string" } },
                upsell: { type: "string" },
              },
            },
            follow_up: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "string" },
                  timing: { type: "string" },
                  channel: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
            psychology_triggers: { type: "array", items: { type: "string" } },
            conversion_optimization: { type: "array", items: { type: "string" } },
            expected_conversion_rate: { type: "number" },
          },
        },
      });

      return Response.json({ ok: true, keyword, city, template, psychologyProfile, funnel: result });
    }

    // ── GENERATE DOMINANCE PLAN (NEW) ──
    if (action === "generateDominancePlan") {
      const { keyword, numMethods } = body;
      if (!keyword) return Response.json({ error: "keyword is required" }, { status: 400 });

      const result = await invokeIndependentAi(base44, {
        prompt: `You are a digital domination strategist. Create an exhaustive plan for making a business show up on EVERY first page of Google when someone searches for "${keyword} near me", "${keyword} near you", or related tail words.

List EVERY technologically capable and possible method using AI, automation, and autonomous systems:

1. ORGANIC_SEO: Every organic SEO technique
2. LOCAL_SEO: Google Business Profile, local citations, NAP consistency, review generation
3. PAID_SEARCH: Google Ads, Bing Ads, retargeting
4. CONTENT_MARKETING: Blog, pillar pages, topic clusters
5. VIDEO_SEO: YouTube optimization, video embeds
6. SOCIAL_SEO: Social signals, social profiles ranking
7. DIRECTORY_SEO: Every relevant directory (Yelp, BBB, Angi, HomeAdvisor, Thumbtack, etc.)
8. PR_SEO: Press releases, news mentions, HARO
9. LINK_BUILDING: Every link building technique (white hat only)
10. AI_SEARCH: Optimization for ChatGPT, Claude, Perplexity, Google SGE, Copilot
11. VOICE_SEARCH: Optimization for Alexa, Google Assistant, Siri
12. IMAGE_SEO: Google Images, visual search
13. MAP_SEO: Google Maps, Apple Maps, Bing Maps
14. APP_SEO: App store optimization if applicable
15. PODCAST_SEO: Podcast appearances and optimization
16. FORUM_SEO: Reddit, Quora, industry forums
17. REVIEW_SEO: Review platforms and review generation
18. SCHEMA_MARKUP: Every schema type applicable
19. TECHNICAL_SEO: Every technical optimization
20. AUTONOMOUS_SYSTEMS: AI agents, scraping, monitoring, auto-optimization

For each method, provide:
- technique: the specific technique
- implementation: how to implement it
- automation_level: "fully_autonomous" | "semi_autonomous" | "manual"
- impact_score: 1-10 (expected impact on first-page ranking)
- time_to_results: estimated time to see results
- tools_needed: AI tools or platforms needed

Return as structured JSON with at least ${numMethods || 50} distinct methods.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            methods: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  technique: { type: "string" },
                  implementation: { type: "string" },
                  automation_level: { type: "string" },
                  impact_score: { type: "number" },
                  time_to_results: { type: "string" },
                  tools_needed: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      });

      return Response.json({ ok: true, keyword, dominance_plan: result });
    }

    // ── GENERATE FORM FLOOD PLAN (NEW) ──
    if (action === "generateFormFlood") {
      const { keyword, businessName, domain } = body;
      if (!keyword) return Response.json({ error: "keyword is required" }, { status: 400 });

      const result = await invokeIndependentAi(base44, {
        prompt: `You are a digital growth automation strategist. Create a plan to use cloud browsers, form-filling agents, and AI to join EVERY relevant digital platform for a "${keyword}" business named "${businessName || "Business Name"}" with domain ${domain || "keyword-nearme.com"}.

List every platform, directory, social media, forum, and group the business should join, with:

1. DIGITAL_AGENCIES: Every digital agency platform (Angi, HomeAdvisor, Thumbtack, TaskRabbit, Bark, etc.)
2. ONLINE_DIRECTORIES: Every business directory (Google Business Profile, Yelp, BBB, Yellow Pages, Manta, etc.)
3. SOCIAL_MEDIA: Every social platform (Facebook, Instagram, Twitter/X, LinkedIn, TikTok, YouTube, Pinterest, Nextdoor, etc.)
4. REVIEW_PLATFORMS: Every review platform (Google Reviews, Yelp, Trustpilot, BBB, ConsumerAffairs, etc.)
5. FORUMS: Every relevant forum (Reddit subreddits, Quora spaces, industry forums, etc.)
6. GROUPS: Facebook groups, LinkedIn groups, Nextdoor groups, community groups
7. INDUSTRY_PLATFORMS: Niche-specific platforms
8. LOCAL_PLATFORMS: Local chambers, community sites, local news
9. VIDEO_PLATFORMS: YouTube, TikTok, Instagram Reels, etc.
10. PODCAST_DIRECTORIES: If applicable

For each platform, provide:
- platform_name
- url
- signup_difficulty: "easy" | "medium" | "hard"
- automation_possible: boolean (can it be automated with cloud browser?)
- form_fields_needed: what info is required
- verification_needed: what verification is required
- seo_value: 1-10 (how much SEO value does a profile here provide?)
- growth_potential: 1-10 (how much growth can this drive?)

Return at least 50 platforms.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            platforms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  platform_name: { type: "string" },
                  url: { type: "string" },
                  signup_difficulty: { type: "string" },
                  automation_possible: { type: "boolean" },
                  form_fields_needed: { type: "array", items: { type: "string" } },
                  verification_needed: { type: "string" },
                  seo_value: { type: "number" },
                  growth_potential: { type: "number" },
                },
              },
            },
          },
        },
      });

      return Response.json({ ok: true, keyword, businessName, form_flood_plan: result });
    }

    return Response.json({ error: "Unknown action. Use search, score, researchSearchTerms, generateBusinessNames, runSimulation, generateStrategy, generateContent, generateFunnel, generateDominancePlan, or generateFormFlood." }, { status: 400 });
  } catch (error) {
    console.error("domainGoldRush error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}