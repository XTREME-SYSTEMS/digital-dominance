import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// ═══════════════════════════════════════════════════════════════════════════
// nearMeIntelligenceEngine — Deterministic NearMe/NearYou Intelligence System
//
// PHASE 0: Foundation
//   1. Seed all US states + top 50 cities (deterministic geography list)
//   2. For each geo: check nearme.com/nearyou.com domain availability (DNS)
//   3. Find local businesses (Google AI search with web grounding)
//   4. Pull top 200 keywords (Google AI search with web grounding)
//   5. Generate strategic plan (Groq LLM)
//   6. Save intelligence to entity + Google Drive folder
//   7. Calculate market score
//
// Runs daily via workflow in batches to stay within function timeout.
// All AI calls use FREE-tier providers (Google AI, Groq) — no Base44 credits.
// ═══════════════════════════════════════════════════════════════════════════

// ── Deterministic seed data ─────────────────────────────────────────────────

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
  ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
];

const TOP_CITIES = [
  ['New York','NY',8336817],['Los Angeles','CA',3979576],['Chicago','IL',2693976],
  ['Houston','TX',2320268],['Phoenix','AZ',1680992],['Philadelphia','PA',1584064],
  ['San Antonio','TX',1547253],['San Diego','CA',1423851],['Dallas','TX',1343573],
  ['San Jose','CA',1021795],['Austin','TX',978908],['Jacksonville','FL',911507],
  ['Fort Worth','TX',909585],['Columbus','OH',898553],['Charlotte','NC',885708],
  ['San Francisco','CA',881549],['Indianapolis','IN',876384],['Seattle','WA',753675],
  ['Denver','CO',727211],['Boston','MA',692600],['El Paso','TX',681728],
  ['Nashville','TN',670820],['Detroit','MI',670031],['Oklahoma City','OK',655057],
  ['Portland','OR',654741],['Las Vegas','NV',651319],['Memphis','TN',651073],
  ['Louisville','KY',617638],['Baltimore','MD',593490],['Milwaukee','WI',590157],
  ['Albuquerque','NM',560513],['Tucson','AZ',548073],['Fresno','CA',542107],
  ['Sacramento','CA',513624],['Kansas City','MO',495327],['Mesa','AZ',496401],
  ['Atlanta','GA',506811],['Omaha','NE',478192],['Colorado Springs','CO',472688],
  ['Raleigh','NC',467665],['Miami','FL',467963],['Long Beach','CA',462257],
  ['Virginia Beach','VA',459470],['Oakland','CA',433031],['Minneapolis','MN',429606],
  ['Tulsa','OK',401190],['Arlington','TX',398854],['Tampa','FL',399700],
  ['New Orleans','LA',390144],['Wichita','KS',389938],
];

const SERVICES = [
  'epoxy','flooring','concrete','garage-floor',
  'plumber','electrician','hvac','roofing',
  'water-damage','mold-removal','emergency',
  'ai-consulting','automation','data-intelligence','seo',
];

// ── DNS domain check (Google DNS-over-HTTPS, free, no key) ──────────────────

async function checkDomain(domain: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, { signal: controller.signal });
    clearTimeout(timer);
    const data: any = await res.json();
    // Status 0 + Answer = registered; Status 3 (NXDOMAIN) = available
    return data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch {
    return false; // assume not registered on error (don't block the pipeline)
  }
}

async function checkDomainsForGeo(geoName: string, stateCode: string): Promise<{ nearme: any[]; nearyou: any[]; available: string[] }> {
  const slug = geoName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const nearme: any[] = [];
  const nearyou: any[] = [];
  const available: string[] = [];

  // Check {service}nearme.com and {service}nearyou.com for each service
  const domainsToCheck: { domain: string; service: string; type: string }[] = [];
  for (const service of SERVICES) {
    const sslug = service.replace(/-/g, '');
    domainsToCheck.push({ domain: `${sslug}nearme.com`, service, type: 'nearme' });
    domainsToCheck.push({ domain: `${sslug}nearyou.com`, service, type: 'nearyou' });
  }
  // Also check {city}nearme.com and {city}nearyou.com
  domainsToCheck.push({ domain: `${slug}nearme.com`, service: 'city', type: 'nearme' });
  domainsToCheck.push({ domain: `${slug}nearyou.com`, service: 'city', type: 'nearyou' });

  // Check all in parallel (DNS is fast)
  const results = await Promise.all(domainsToCheck.map(async (d) => {
    const registered = await checkDomain(d.domain);
    return { ...d, registered };
  }));

  for (const r of results) {
    const entry = { domain: r.domain, registered: r.registered, service: r.service };
    if (r.type === 'nearme') nearme.push(entry);
    else nearyou.push(entry);
    if (!r.registered) available.push(r.domain);
  }

  return { nearme, nearyou, available };
}

// ── Google AI search (Gemini with google_search tool) ───────────────────────

async function googleAISearch(prompt: string): Promise<string> {
  const key = secrets.get('GOOGLE_AI_API_KEY');
  if (!key) return '';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return '';
    const data: any = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch {
    return '';
  }
}

async function findBusinesses(geoName: string, stateCode: string): Promise<any[]> {
  const prompt = `Search the web and list all epoxy flooring, concrete polishing, garage floor coating, and floor coating businesses in ${geoName}, ${stateCode}. For each business, provide: name, type (epoxy/concrete/flooring), website URL, phone number if available, and Google rating if available. Return as a JSON array. If you cannot find specific businesses, return an empty array. Format: [{"name":"...","type":"...","url":"...","phone":"...","rating":4.5}]`;
  const text = await googleAISearch(prompt);
  if (!text) return [];

  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return [];
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

async function getTopKeywords(geoName: string, stateCode: string): Promise<any[]> {
  const prompt = `What are the top 20 most searched Google keywords for epoxy flooring, garage floor coating, and concrete polishing services in ${geoName}, ${stateCode}? For each keyword provide: the keyword phrase, estimated monthly search volume (number), difficulty score (0-100), search intent (commercial/transactional/informational), and opportunity score (0-100 where higher = better opportunity). Return as a JSON array. Format: [{"keyword":"epoxy flooring near me","volume":1200,"difficulty":45,"intent":"commercial","opportunity":75}]`;
  const text = await googleAISearch(prompt);
  if (!text) return [];

  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) return [];
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

// ── Groq LLM for strategic plan ─────────────────────────────────────────────

async function generateStrategicPlan(geoName: string, stateCode: string, data: any): Promise<string> {
  const key = secrets.get('GROQ_API_KEY');
  if (!key) return '';

  const systemPrompt = `You are a strategic business advisor for the epoxy flooring and home services industry. You analyze market intelligence data and produce actionable strategic plans.`;
  const prompt = `Based on this market intelligence for ${geoName}, ${stateCode}, create a strategic plan:

DOMAINS:
- NearMe domains found (registered): ${(data.nearme || []).filter((d: any) => d.registered).map((d: any) => d.domain).join(', ') || 'none'}
- NearYou domains found (registered): ${(data.nearyou || []).filter((d: any) => d.registered).map((d: any) => d.domain).join(', ') || 'none'}
- Available domains to purchase: ${(data.available || []).slice(0, 10).join(', ') || 'none'}

BUSINESSES FOUND: ${(data.businesses || []).length} businesses
${(data.businesses || []).slice(0, 5).map((b: any) => `- ${b.name} (${b.type})`).join('\n')}

TOP KEYWORDS: ${(data.top_keywords || []).slice(0, 10).map((k: any) => `${k.keyword} (vol:${k.volume}, opp:${k.opportunity})`).join(', ') || 'none'}

Create a strategic plan covering:
1. MARKET OPPORTUNITY — Is this a good market? Why?
2. DOMAIN ACQUISITION — Which available domains should we buy first?
3. PROGRAMMATIC WEBSITE STRATEGY — What sites to build on these domains?
4. KEYWORD TARGETING — Top 5 keywords to target first and why.
5. COMPETITIVE POSITIONING — How to differentiate from existing businesses.
6. REVENUE PROJECTION — Estimated monthly revenue potential.
7. IMMEDIATE ACTIONS — Top 3 things to do THIS WEEK.

Be specific, actionable, and data-driven. Keep it under 800 words.`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return '';
    const result: any = await res.json();
    return result.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

async function generateProactiveInsights(geoName: string, stateCode: string, data: any): Promise<string> {
  const key = secrets.get('GROQ_API_KEY');
  if (!key) return '';

  const prompt = `You are a proactive AI advisor. Based on this intelligence for ${geoName}, ${stateCode}, tell the business owner EXACTLY what to do next. Be direct, specific, and action-oriented. No questions — just instructions.

Available domains: ${(data.available || []).slice(0, 5).join(', ') || 'none'}
Top keywords: ${(data.top_keywords || []).slice(0, 5).map((k: any) => k.keyword).join(', ') || 'none'}
Businesses found: ${data.businesses.length}

Give 3-5 bullet points of IMMEDIATE actions. Start each with a verb. Example: "Buy epoxynearme.com immediately — it's available and gets 1,200 monthly searches."`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return '';
    const result: any = await res.json();
    return result.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

// ── Drive helpers ───────────────────────────────────────────────────────────

function getDriveFolderId(): string {
  const raw = secrets.get('NEARME_DRIVE_FOLDER_ID') || '';
  // Extract folder ID from a Drive URL if the secret was set as a full URL
  const match = raw.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : raw;
}

async function findFolder(token: string, name: string, parentId?: string): Promise<string | null> {
  let q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function createFolder(token: string, name: string, parentId?: string): Promise<string | null> {
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : [] }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id || null;
}

async function findOrCreateFolder(token: string, name: string, parentId?: string): Promise<string | null> {
  const existing = await findFolder(token, name, parentId);
  if (existing) return existing;
  return createFolder(token, name, parentId);
}

async function getOrResolveDriveFolder(token: string): Promise<{ folderId: string; source: string }> {
  // Try the user-provided folder ID first
  const userFolderId = getDriveFolderId();
  if (userFolderId) {
    // Test if we can access it
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${userFolderId}?fields=id`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return { folderId: userFolderId, source: 'user-provided' };
    console.log(`[nearMe] User folder ${userFolderId} not accessible, creating fallback folder`);
  }
  // Fallback: create our own "NearMe Intelligence" folder in the connected account's root
  const folderId = await findOrCreateFolder(token, 'NearMe Intelligence');
  if (!folderId) throw new Error('Could not create Drive folder');
  return { folderId, source: 'auto-created' };
}

async function getDriveToken(base44: any): Promise<string> {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
  if (!accessToken) throw new Error('Google Drive connector not connected');
  return accessToken;
}

async function uploadToDrive(token: string, filename: string, content: string, parentId: string): Promise<string | null> {
  const boundary = 'nearme_' + Math.random().toString(36).slice(2);
  const metadata = JSON.stringify({ name: filename, parents: [parentId] });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Drive upload ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!data.id) throw new Error('Drive upload succeeded but no file ID returned');
  return data.id;
}

// ── Market score calculation ────────────────────────────────────────────────

function calculateMarketScore(data: any, population: number): number {
  let score = 0;
  // Population factor (0-30)
  score += Math.min(30, Math.log10(population || 1) * 4);
  // Available domains factor (0-25)
  score += Math.min(25, data.available.length * 2);
  // Businesses found factor (0-20) — more competitors = bigger market
  score += Math.min(20, data.businesses.length * 2);
  // Keyword opportunity factor (0-25)
  const avgOpp = data.top_keywords.length > 0
    ? data.top_keywords.reduce((sum: number, k: any) => sum + (k.opportunity || 0), 0) / data.top_keywords.length
    : 0;
  score += (avgOpp / 100) * 25;
  return Math.round(Math.min(100, score));
}

// ── Scan a single geography ──────────────────────────────────────────────────

async function scanGeo(base44: any, geo: any, driveToken: string, driveFolderId: string): Promise<any> {
  const { geo_key, geo_type, geo_name, state_code, population } = geo;

  // 1. Check domains
  const domainData = await checkDomainsForGeo(geo_name, state_code);

  // 2. Find businesses
  const businesses = await findBusinesses(geo_name, state_code);

  // 3. Get keywords
  const topKeywords = await getTopKeywords(geo_name, state_code);

  // 4. Calculate market score
  const marketScore = calculateMarketScore({ ...domainData, businesses, top_keywords: topKeywords }, population);

  // 5. Generate strategic plan
  const strategicPlan = await generateStrategicPlan(geo_name, state_code, {
    ...domainData, businesses, top_keywords: topKeywords,
  });

  // 6. Generate proactive insights
  const proactiveInsights = await generateProactiveInsights(geo_name, state_code, {
    ...domainData, businesses, top_keywords: topKeywords,
  });

  // 7. Save to Drive
  let driveFileId: string | null = null;
  let driveError: string | null = null;
  try {
    const intelligenceJson = JSON.stringify({
      geo_key, geo_type, geo_name, state_code, population,
      scanned_at: new Date().toISOString(),
      nearme_domains: domainData.nearme,
      nearyou_domains: domainData.nearyou,
      available_domains: domainData.available,
      businesses,
      top_keywords: topKeywords,
      strategic_plan: strategicPlan,
      proactive_insights: proactiveInsights,
      market_score: marketScore,
    }, null, 2);
    driveFileId = await uploadToDrive(driveToken, `${geo_key}.json`, intelligenceJson, driveFolderId);
    if (!driveFileId) driveError = 'Upload returned null (check folder ID and permissions)';
  } catch (e) {
    driveError = e.message;
    console.error(`[nearMe] Drive save failed for ${geo_key}:`, e.message);
  }

  // 8. Update entity
  const updateData = {
    nearme_domains: domainData.nearme,
    nearyou_domains: domainData.nearyou,
    available_domains: domainData.available,
    businesses,
    top_keywords: topKeywords,
    strategic_plan: strategicPlan,
    proactive_insights: proactiveInsights,
    market_score: marketScore,
    last_scanned_at: new Date().toISOString(),
    scan_status: 'complete',
    ...(driveFileId ? { drive_file_id: driveFileId } : {}),
  };

  // Find existing record by geo_key
  const existing = await base44.asServiceRole.entities.NearMeIntelligence.filter({ geo_key }, { limit: 1 });
  if (existing.items && existing.items.length > 0) {
    await base44.asServiceRole.entities.NearMeIntelligence.update(existing.items[0].id, updateData);
    return { geo_key, updated: true, marketScore, driveFileId, driveError, driveFolderId };
  } else {
    await base44.asServiceRole.entities.NearMeIntelligence.create({
      owner_id: base44.auth?.me?.()?.id || 'system',
      geo_key, geo_type, geo_name, state_code, population,
      ...updateData,
    });
    return { geo_key, created: true, marketScore, driveFileId, driveError, driveFolderId };
  }
}

// ── Main handler ────────────────────────────────────────────────────────────

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'status';

    // ── STATUS ──
    if (action === 'status') {
      const total = await base44.asServiceRole.entities.NearMeIntelligence.count({});
      const complete = await base44.asServiceRole.entities.NearMeIntelligence.count({ scan_status: 'complete' });
      const pending = await base44.asServiceRole.entities.NearMeIntelligence.count({ scan_status: 'pending' });
      const withAvailable = await base44.asServiceRole.entities.NearMeIntelligence.count({
        available_domains: { $exists: true, $ne: [] },
      });
      return Response.json({
        ok: true,
        total, complete, pending, withAvailable,
        driveFolder: getDriveFolderId() || 'not set',
        seedCount: US_STATES.length + TOP_CITIES.length,
      });
    }

    // ── SEED: Create all geography records ──
    if (action === 'seed') {
      const owner = await base44.auth.me().catch(() => ({ id: 'system' }));
      const records: any[] = [];

      // States
      for (const [code, name] of US_STATES) {
        records.push({
          owner_id: owner.id,
          geo_key: `state:${code}`,
          geo_type: 'state',
          geo_name: name,
          state_code: code,
          population: 0,
          scan_status: 'pending',
        });
      }

      // Cities
      for (const [name, state, pop] of TOP_CITIES) {
        records.push({
          owner_id: owner.id,
          geo_key: `city:${state}:${name.replace(/[^a-zA-Z]/g, '')}`,
          geo_type: 'city',
          geo_name: name,
          state_code: state,
          population: pop,
          scan_status: 'pending',
        });
      }

      // Upsert by geo_key
      const result = await base44.asServiceRole.entities.NearMeIntelligence.upsert(records, { key: 'geo_key' });
      return Response.json({
        ok: true,
        seeded: records.length,
        created: result.created,
        updated: result.updated,
        message: `${records.length} geographies seeded (${US_STATES.length} states + ${TOP_CITIES.length} cities)`,
      });
    }

    // ── SCAN BATCH ──
    if (action === 'scanBatch') {
      const batchIndex = body.batchIndex ?? 0;
      const totalBatches = body.totalBatches ?? 10;
      const batchSize = body.batchSize || 5;

      const driveToken = await getDriveToken(base44);
      const { folderId: driveFolderId, source: driveFolderSource } = await getOrResolveDriveFolder(driveToken);

      // Get pending geos for this batch
      const page = await base44.asServiceRole.entities.NearMeIntelligence.filter(
        { scan_status: 'pending' },
        { sort: '-population', limit: batchSize }
      );

      if (!page.items || page.items.length === 0) {
        return Response.json({
          ok: true,
          batchIndex,
          scanned: 0,
          message: 'No pending geographies remaining',
          complete: true,
        });
      }

      const results: any[] = [];
      for (const geo of page.items) {
        try {
          const result = await scanGeo(base44, geo, driveToken, driveFolderId);
          results.push(result);
        } catch (err: any) {
          console.error(`[nearMe] Scan failed for ${geo.geo_key}:`, err.message);
          // Mark as failed so it doesn't get stuck in pending
          try {
            await base44.asServiceRole.entities.NearMeIntelligence.update(geo.id, {
              scan_status: 'failed',
              last_scanned_at: new Date().toISOString(),
            });
          } catch {}
          results.push({ geo_key: geo.geo_key, error: err.message });
        }
      }

      return Response.json({
        ok: true,
        batchIndex,
        totalBatches,
        scanned: results.length,
        results,
        driveFolderSource,
        complete: results.length < batchSize,
      });
    }

    // ── SCAN SINGLE GEO ──
    if (action === 'scanGeo') {
      const geoKey = body.geo_key;
      if (!geoKey) return Response.json({ error: 'geo_key required' }, { status: 400 });

      const driveToken = await getDriveToken(base44);
      const { folderId: driveFolderId } = await getOrResolveDriveFolder(driveToken);
      const page = await base44.asServiceRole.entities.NearMeIntelligence.filter({ geo_key: geoKey }, { limit: 1 });
      if (!page.items || page.items.length === 0) {
        return Response.json({ error: 'Geography not found. Run seed first.' }, { status: 404 });
      }

      const result = await scanGeo(base44, page.items[0], driveToken, driveFolderId);
      return Response.json({ ok: true, ...result });
    }

    // ── REGENERATE INSIGHTS (for already-scanned geos) ──
    if (action === 'refreshInsights') {
      const limit = body.limit || 10;
      const page = await base44.asServiceRole.entities.NearMeIntelligence.filter(
        { scan_status: 'complete' },
        { sort: '-market_score', limit }
      );

      const driveFolderId = getDriveFolderId();
      const driveToken = driveFolderId ? await getDriveToken(base44).catch(() => null) : null;

      let refreshed = 0;
      for (const geo of page.items || []) {
        const insights = await generateProactiveInsights(geo.geo_name, geo.state_code, {
          available: geo.available_domains || [],
          businesses: geo.businesses || [],
          top_keywords: geo.top_keywords || [],
        });
        if (insights) {
          await base44.asServiceRole.entities.NearMeIntelligence.update(geo.id, {
            proactive_insights: insights,
            last_scanned_at: new Date().toISOString(),
          });
          refreshed++;
        }
      }

      return Response.json({ ok: true, refreshed, total: page.items?.length || 0 });
    }

    // ── SYNC GODADDY STATUS (daily automated) ──
    if (action === 'syncGoDaddyStatus') {
      const token = secrets.get('GODADDY_API_KEY');
      if (!token) return Response.json({ error: 'GODADDY_API_KEY not set' }, { status: 400 });

      const gdRes = await fetch('https://api.godaddy.com/v1/domains', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!gdRes.ok) return Response.json({ error: `GoDaddy API error: ${gdRes.status}` }, { status: 502 });
      const gdDomains = await gdRes.json();
      const gdDomainSet = new Set(gdDomains.map((d: any) => d.domain.toLowerCase()));

      // Update NearMeIntelligence records — move purchased domains from available to registered
      const allGeos = await base44.asServiceRole.entities.NearMeIntelligence.filter(
        { available_domains: { $exists: true, $ne: [] } },
        { limit: 100 }
      );

      let updated = 0;
      for (const geo of allGeos.items || []) {
        const stillAvailable = (geo.available_domains || []).filter((d: string) => !gdDomainSet.has(d.toLowerCase()));
        const newlyRegistered = (geo.available_domains || []).filter((d: string) => gdDomainSet.has(d.toLowerCase()));

        if (newlyRegistered.length > 0) {
          const nearmeDomains = (geo.nearme_domains || []).map((d: any) =>
            gdDomainSet.has(d.domain.toLowerCase()) ? { ...d, registered: true } : d
          );
          const nearyouDomains = (geo.nearyou_domains || []).map((d: any) =>
            gdDomainSet.has(d.domain.toLowerCase()) ? { ...d, registered: true } : d
          );

          await base44.asServiceRole.entities.NearMeIntelligence.update(geo.id, {
            available_domains: stillAvailable,
            nearme_domains: nearmeDomains,
            nearyou_domains: nearyouDomains,
          });
          updated++;
        }
      }

      return Response.json({
        ok: true,
        godaddyDomains: gdDomains.length,
        geosUpdated: updated,
      });
    }

    // ── PURCHASE DOMAINS via GoDaddy (manual trigger) ──
    if (action === 'purchaseDomains') {
      const minScore = body.minScore || 50;
      const maxDomains = body.maxDomains || 5;
      const contacts = body.contacts;

      if (!contacts || !contacts.registrant) {
        return Response.json({ error: 'contacts.registrant required (name, email, phone, address, city, state, zip, country)' }, { status: 400 });
      }

      const token = secrets.get('GODADDY_API_KEY');
      if (!token) return Response.json({ error: 'GODADDY_API_KEY not set' }, { status: 400 });

      // Find geos with available domains and high market scores
      const page = await base44.asServiceRole.entities.NearMeIntelligence.filter(
        { scan_status: 'complete', market_score: { $gte: minScore } },
        { sort: '-market_score', limit: 50 }
      );

      const allAvailable: string[] = [];
      for (const geo of page.items || []) {
        allAvailable.push(...(geo.available_domains || []));
      }
      const uniqueDomains = [...new Set(allAvailable)].slice(0, maxDomains);

      const results: any[] = [];
      for (const domain of uniqueDomains) {
        try {
          // Check availability on GoDaddy
          const availRes = await fetch(`https://api.godaddy.com/v1/domains/available?domain=${encodeURIComponent(domain)}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          });
          const availData = await availRes.json();

          if (!availData.available) {
            results.push({ domain, status: 'not_available' });
            continue;
          }

          // Purchase
          const purchaseBody = {
            domain, period: 1,
            nameServers: ['ns1.vercel-dns.com', 'ns2.vercel-dns.com'],
            renewAuto: true, privacy: true,
            contactRegistrant: contacts.registrant,
            contactTech: contacts.tech || contacts.registrant,
            contactAdmin: contacts.admin || contacts.registrant,
            contactBilling: contacts.billing || contacts.registrant,
          };

          const purchaseRes = await fetch('https://api.godaddy.com/v1/domains', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(purchaseBody),
          });

          if (purchaseRes.ok) {
            const purchaseData = await purchaseRes.json();
            results.push({ domain, status: 'purchased', orderId: purchaseData.orderId });
          } else {
            const errText = await purchaseRes.text().catch(() => '');
            results.push({ domain, status: 'failed', error: `${purchaseRes.status}: ${errText.slice(0, 200)}` });
          }
        } catch (err: any) {
          results.push({ domain, status: 'error', error: err.message });
        }
      }

      return Response.json({
        ok: true,
        purchased: results.filter(r => r.status === 'purchased').length,
        checked: uniqueDomains.length,
        results,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[nearMeIntelligenceEngine] Fatal:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}