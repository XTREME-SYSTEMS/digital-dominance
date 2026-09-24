import { createClientFromRequest } from "npm:@base44/sdk@0.8.48";
import { runIndependentScan } from './scan.ts';

// ─────────────────────────────────────────────────────────────────────────────
// Opportunity Intelligence Engine
// Live web-search-powered scanner for problem discovery, trend monitoring,
// competitor analysis, and opportunity identification.
// Uses independent web-search providers plus independentAi; no Core integration calls.
// Also fetches Google Calendar events from the connected calendar account.
// ─────────────────────────────────────────────────────────────────────────────

function scanSchema(extraProps: any = {}) {
  return {
    type: "object",
    properties: {
      summary: { type: "string" },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            problem: { type: "string" },
            buyer: { type: "string" },
            evidence: { type: "string" },
            app_idea: { type: "string" },
            monetization: { type: "string" },
            url: { type: "string" },
            score: { type: "number" },
            ...extraProps,
          },
          required: ["title", "description"],
        },
      },
    },
    required: ["findings"],
  };
}

const SCANS: Record<string, { label: string; prompt: string; schema?: any }> = {
  scan_google_trends: {
    label: "Google Trends",
    prompt: `Search Google Trends and identify the top 20 currently trending and breakout topics in the United States right now. For each: (1) What the topic is and why it's trending, (2) What problem or need is driving the trend, (3) Who the buyer is, (4) What app, tool, or SaaS could be built to solve the problem behind this trend, (5) Commercial intent level (high/medium/low). Focus on trends that indicate people NEED solutions — not just news events. Include evidence source URLs.`,
  },
  scan_github_trending: {
    label: "GitHub Top Repos",
    prompt: `Search GitHub trending repositories and identify the top 20 highest-rated and fastest-growing repos across ALL categories (AI, web, mobile, devtools, data, infrastructure, etc). For each: (1) Repo name and URL, (2) What it does, (3) Stars and growth momentum, (4) What problem it solves, (5) What commercial product or SaaS could be built on top of it or inspired by it, (6) The buyer for that commercial product. Include the repo URL.`,
    schema: scanSchema({ repo_url: { type: "string" }, stars: { type: "string" }, language: { type: "string" } }),
  },
  scan_social_media_trends: {
    label: "Social Media Trends",
    prompt: `Search social media platforms (X/Twitter, TikTok, Instagram, LinkedIn, Reddit, Facebook) and identify the top 20 current trending topics, hashtags, and viral discussions where people are complaining about problems or expressing needs. For each: (1) The trend/topic, (2) What people are complaining about or needing, (3) The platform where it's trending, (4) Who the buyer is, (5) What app or tool could solve the problem. Focus on complaints and unmet needs, not just popular content.`,
  },
  scan_construction_trends: {
    label: "Construction Trends",
    prompt: `Search for the top 20 current trends, problems, and opportunities in the construction industry. Look at construction forums, trade publications, social media groups, and industry reports. For each: (1) The trend or problem, (2) What construction professionals are complaining about or needing, (3) Who the buyer is (contractors, builders, developers, etc), (4) What AI tool, app, or SaaS could solve the problem, (5) How to monetize it. Focus on pain points like scheduling, estimating, supply chain, labor, safety, compliance.`,
  },
  scan_real_estate_trends: {
    label: "Real Estate Trends",
    prompt: `Search for the top 20 current trends, problems, and opportunities in the real estate industry. Look at real estate forums, Zillow, Redfin, Realtor communities, BiggerPockets, social media groups. For each: (1) The trend or problem, (2) What agents, investors, or homeowners are complaining about or needing, (3) Who the buyer is, (4) What AI tool, app, or SaaS could solve the problem, (5) How to monetize it. Focus on pain points like lead generation, property analysis, transaction management, tenant screening.`,
  },
  scan_ai_demand: {
    label: "AI Demand by Industry",
    prompt: `Search for the top 20 business industries that are most actively seeking AI tools and services right now. Look at business forums, Gartner reports, industry surveys, LinkedIn discussions, software review sites. For each industry: (1) The industry name, (2) What AI tools/services they're looking for, (3) What problems they want AI to solve, (4) Evidence of demand (surveys, reports, discussions), (5) What specific AI product could be built for this industry, (6) Estimated budget/willingness to pay.`,
  },
  scan_ai_problems: {
    label: "AI Industry Problems",
    prompt: `Search for and identify ALL the major problems, complaints, and pain points in the AI industry right now. Look at AI forums, developer communities, Stack Overflow, GitHub issues, AI Twitter/X, research papers, industry reports. For each problem: (1) What the problem is, (2) Who is affected (developers, users, businesses), (3) How severe and frequent it is, (4) What solution or tool could address it, (5) Whether there's a viable business in solving it. Include AI trust issues, hallucination, cost, speed, integration, deployment, monitoring, etc.`,
  },
  scan_ai_saturation: {
    label: "AI Saturation by Category",
    prompt: `Search for the current state of AI saturation across 20+ product categories. For each category: (1) The category name (e.g., AI writing, AI coding, AI chatbots, AI image gen, AI video, AI agents, AI analytics, AI CRM, AI SEO, etc), (2) How saturated the market is (low/medium/high), (3) Top 3 competitors in the space, (4) What gaps or underserved niches remain, (5) Opportunity score for entering this space (1-10). Focus on identifying UNSATURATED niches where new entrants can still win.`,
    schema: scanSchema({ saturation_level: { type: "string" }, top_competitors: { type: "string" }, gap: { type: "string" } }),
  },
  scan_south_florida_competitors: {
    label: "South Florida Competitors",
    prompt: `Search for the top 20 AI, software development, digital marketing, and technology service companies operating in South Florida from Vero Beach to Miami (including Fort Lauderdale, West Palm Beach, Boca Raton, Pompano Beach, Hollywood FL). For each competitor: (1) Company name and website, (2) What services they offer, (3) Their pricing if available, (4) Their strengths and weaknesses, (5) What services they DON'T offer that we could capitalize on, (6) How we can differentiate. Include web design agencies, app developers, AI consultants, digital marketers, SEO firms.`,
    schema: scanSchema({ company_name: { type: "string" }, website: { type: "string" }, services: { type: "string" }, pricing: { type: "string" }, weaknesses: { type: "string" }, location: { type: "string" } }),
  },
  scan_craigslist: {
    label: "Craigslist Scanner",
    prompt: `Search Craigslist across South Florida cities (Miami, Fort Lauderdale, West Palm Beach, Vero Beach, Boca Raton, Fort Pierce) for gigs and posts where people are looking for: AI developers, website creators, app developers, digital services, software development, automation tools, AI solutions, chatbot development, SEO services, digital marketing. For each post: (1) What they're looking for, (2) The city/category, (3) What problem they need solved, (4) Budget if mentioned, (5) What service we could offer them, (6) The Craigslist URL if findable. Focus on people actively seeking tech/AI services.`,
    schema: scanSchema({ city: { type: "string" }, category: { type: "string" }, budget: { type: "string" }, post_url: { type: "string" } }),
  },
  scan_social_groups: {
    label: "South Florida Social Groups",
    prompt: `Search social media (Facebook groups, LinkedIn groups, Reddit communities, Meetup, X/Twitter) for South Florida business groups, entrepreneur groups, and communities where business owners discuss needing digital services, AI tools, website development, app development, or marketing. For each group: (1) Group name and platform, (2) Member count if available, (3) What members discuss and complain about, (4) What digital services they need, (5) Keywords and pain points mentioned, (6) How to reach them. Focus on groups where people mention needing AI, apps, websites, or digital services.`,
    schema: scanSchema({ platform: { type: "string" }, member_count: { type: "string" }, keywords: { type: "string" }, location: { type: "string" } }),
  },
  scan_construction_demand: {
    label: "Construction Demand",
    prompt: `Search social media, forums, Facebook groups, Reddit, and websites where construction professionals post about needing AI developers, app creators, software tools, automation, estimating tools, project management software, or technology solutions. For each: (1) Where the post was found, (2) What they need, (3) What problem they're trying to solve, (4) Who the buyer is (contractor, builder, developer), (5) What AI/app/tool we could build for them, (6) How to reach them. Focus on people actively asking for tech solutions in construction.`,
  },
  scan_networking_events: {
    label: "Networking Events",
    prompt: `Search for upcoming networking events, conferences, conventions, meetups, and gatherings in South Florida and online related to: business, AI, technology, construction, real estate, chamber of commerce, entrepreneur groups, startup events, tech meetups. For each event: (1) Event name, (2) Date and location, (3) What type of event (conference, meetup, chamber, etc), (4) Who attends, (5) Why we should attend (what opportunities it presents), (6) Registration URL if available. Focus on events in the next 3 months in South Florida (Vero Beach to Miami).`,
    schema: scanSchema({ event_date: { type: "string" }, event_location: { type: "string" }, event_type: { type: "string" }, registration_url: { type: "string" } }),
  },
  restaurant_ai_growth: {
    label: "Restaurant AI Growth",
    prompt: `Search for the top 20 ways AI is being used right now to help restaurants grow, plus the top problems restaurants have that AI could solve. Look at restaurant industry publications, tech reviews, case studies, and restaurant owner forums. For each: (1) The AI use case or problem, (2) What it does for the restaurant, (3) What product/tool enables it, (4) The buyer (restaurant owner, manager, chain), (5) ROI evidence, (6) How to build and sell it. Include areas like: reservations, menu optimization, inventory, staff scheduling, customer feedback, marketing, loyalty, delivery, voice ordering, visual menu, etc.`,
  },
};

async function fetchCalendarEvents(accessToken: string) {
  const calListRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const calList = await calListRes.json();
  const calendars = calList.items || [];

  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const allEvents: any[] = [];
  for (const cal of calendars) {
    try {
      const eventsRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const eventsData = await eventsRes.json();
      for (const ev of eventsData.items || []) {
        allEvents.push({
          id: ev.id,
          summary: ev.summary || "(No title)",
          start: ev.start?.dateTime || ev.start?.date,
          end: ev.end?.dateTime || ev.end?.date,
          calendar: cal.summary,
          calendarId: cal.id,
          location: ev.location,
          description: ev.description,
          attendees: (ev.attendees || []).map((a: any) => a.email),
          hangoutLink: ev.hangoutLink,
        });
      }
    } catch (e) {
      // skip calendar on error
    }
  }

  allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return {
    events: allEvents.slice(0, 50),
    calendars: calendars.map((c: any) => ({ id: c.id, summary: c.summary })),
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const action = body.action || "full_scan";

    // ── Calendar Events ──
    if (action === "calendar_events") {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlecalendar");
        const result = await fetchCalendarEvents(accessToken);
        return Response.json(result);
      } catch (e: any) {
        return Response.json({ error: `Calendar: ${e.message}`, events: [], calendars: [] });
      }
    }

    // ── Full Scan (all scanners sequentially) ──
    if (action === "full_scan") {
      const results: Record<string, any> = {};
      for (const [key, config] of Object.entries(SCANS)) {
        try {
          const result = await runIndependentScan(base44, { ...config, sourceKey: key }, config.schema || scanSchema());
          results[key] = result;
        } catch (e: any) {
          results[key] = { error: e.message, findings: [], summary: `Scan failed: ${e.message}` };
        }
      }
      return Response.json({ results });
    }

    // ── Single Scan ──
    const config = SCANS[action];
    if (!config) {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    const result = await runIndependentScan(base44, { ...config, sourceKey: action }, config.schema || scanSchema());
    return Response.json({ action, ...result });
  } catch (error: any) {
    console.error('[opportunityIntelligenceEngine]', error.name, error.message);
    const message = error.name === 'TimeoutError' || error.name === 'AbortError'
      ? 'Independent web search timed out. Please retry this scanner.' : error.message;
    return Response.json({ error: message }, { status: 500 });
  }
}