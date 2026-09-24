import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { COMPANY_FACTS, COMMS_TEMPLATES, TEMPLATE_CATEGORIES } from '../../shared/companyIntel.ts';
import { invokeIndependentAi } from '../../shared/independentCore.ts';

const BROWSERBASE_API_KEY = () => secrets.get('BROWSERBASE_API_KEY');

async function simpleScrape(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { url, content: text.slice(0, 30000) };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;
    const generateText = async (options) => ({ parsed: await invokeIndependentAi(base44, options) });

    switch (action) {
      case 'getCompanyIntel': {
        return Response.json({ ok: true, company: COMPANY_FACTS, templates: COMMS_TEMPLATES, categories: TEMPLATE_CATEGORIES });
      }

      case 'chat': {
        const { message, conversation, context } = body;
        if (!message) return Response.json({ error: 'message is required' }, { status: 400 });

        const [leads, projects, templates, strategies, agents, intelReports] = await Promise.all([
          base44.asServiceRole.entities.Lead.list('-created_date', 20).catch(() => []),
          base44.asServiceRole.entities.ClientProject.list('-created_date', 10).catch(() => []),
          base44.asServiceRole.entities.WebsiteTemplate.list().catch(() => []),
          base44.asServiceRole.entities.StrategyDocument.filter({ status: 'active' }).catch(() => []),
          base44.asServiceRole.entities.AgentTemplate.filter({ is_active: true }).catch(() => []),
          base44.asServiceRole.entities.IntelligenceReport.filter({ report_type: 'company_audit' }, '-created_date', 1).catch(() => []),
        ]);

        const latestIntel = intelReports[0];
        const appContext = {
          totalLeads: leads.length,
          activeProjects: projects.length,
          templates: templates.length,
          strategies: strategies.map((s) => ({ title: s.title, type: s.type, summary: s.summary })),
          agents: agents.map((a) => ({ name: a.name, category: a.category })),
          recentLeads: leads.slice(0, 5).map((l) => ({ name: l.first_name, status: l.status, estimate: l.estimate_mid })),
          userContext: context || {},
        };

        const systemPrompt = `You are the Xtreme AI Assistant for EpoxyGarageFloorEstimates.com, a scalable website factory and SaaS platform for garage floor coating contractors. You have FULL access to the app's backend, entities, integrations, and capabilities. You are the central intelligence connecting all systems.

CURRENT APP STATE:
- Total Leads: ${appContext.totalLeads}
- Active Projects: ${appContext.activeProjects}
- Website Templates: ${appContext.templates}
- Active Strategy Documents: ${appContext.strategies.length}
- Active Agent Templates: ${appContext.agents.length}

STRATEGY DOCUMENTS: ${JSON.stringify(appContext.strategies)}
ACTIVE AGENTS: ${JSON.stringify(appContext.agents)}
RECENT LEADS: ${JSON.stringify(appContext.recentLeads)}

CANONICAL COMPANY FACTS (ground truth — never invent beyond these):
${JSON.stringify(COMPANY_FACTS, null, 2)}

${latestIntel ? `LATEST SCRAPED COMPANY INTELLIGENCE REPORT (summary): ${latestIntel.summary || ''}` : 'No scraped intelligence report yet — suggest running the companyIntel scraper.'}

APPROVED COMMUNICATION TEMPLATES — when a homeowner asks about appointments, colors, pricing, process, ratings, rebuttals, or escalation, recommend the matching template by id rather than improvising. This eliminates hallucination and ambiguity:
${JSON.stringify(COMMS_TEMPLATES.map((t) => ({ id: t.id, category: t.category, channel: t.channel, label: t.label, body: t.body })), null, 2)}

Your capabilities: full entity access, AI floor visualizer, cloud browser research, SEO generation, multi-channel comms (SMS/WhatsApp/Voice/Email), website factory, agent management, analytics and predictive modeling. When a homeowner asks a question that maps to a template, cite the template id and fill its variables. When a question needs a human (complex pricing dispute, complaint, scheduling conflict), recommend the escalate_to_human template. Respond with actionable, specific guidance.`;

        const fullPrompt = `${systemPrompt}\n\nConversation:\n${(conversation || []).map((m) => `${m.role}: ${m.content}`).join('\n')}\n\nuser: ${message}`;

        const { parsed: llmRes } = await generateText({
          prompt: fullPrompt,
          model: 'claude-sonnet-5',
          response_json_schema: {
            type: 'object',
            properties: {
              response: { type: 'string' },
              suggested_actions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    action: { type: 'string' },
                    description: { type: 'string' },
                    system: { type: 'string' },
                  },
                },
              },
              confidence: { type: 'number' },
            },
          },
        });

        return Response.json({ ok: true, result: llmRes });
      }

      case 'research': {
        const { query, urls, sector } = body;
        if (!query && !urls) return Response.json({ error: 'query or urls required' }, { status: 400 });

        const targetUrls = urls || [];
        const scraped = [];
        for (const url of targetUrls.slice(0, 5)) {
          try {
            const result = await simpleScrape(url);
            scraped.push(result);
          } catch (e) {
            scraped.push({ url, error: e.message });
          }
        }

        const { parsed: analysisRes } = await generateText({
          prompt: `You are a world-renowned trend analyst, statistician, and economist specializing in the decorative concrete and epoxy flooring industry.

Research Query: ${query}
Sector: ${sector || 'all'}

Scraped Content:
${scraped.map((s) => `URL: ${s.url}\nContent: ${(s.content || '').slice(0, 5000) || s.error || 'N/A'}`).join('\n\n---\n\n')}

Provide a comprehensive analysis: key findings, pricing data, market trends, customer sentiment, demographic patterns, competitive landscape, opportunities. Format as structured JSON.`,
          response_json_schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              findings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    insight: { type: 'string' },
                    data_point: { type: 'string' },
                    confidence: { type: 'string' },
                  },
                },
              },
              pricing: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    service: { type: 'string' },
                    low: { type: 'number' },
                    high: { type: 'number' },
                    avg: { type: 'number' },
                    unit: { type: 'string' },
                  },
                },
              },
              trends: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    metric: { type: 'string' },
                    direction: { type: 'string' },
                    prediction: { type: 'string' },
                  },
                },
              },
              sentiment: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    demographic: { type: 'string' },
                    positive: { type: 'array', items: { type: 'string' } },
                    negative: { type: 'array', items: { type: 'string' } },
                    buying_signal: { type: 'number' },
                  },
                },
              },
            },
          },
          add_context_from_internet: true,
          model: 'gemini_3_1_pro',
        });

        const report = await base44.asServiceRole.entities.IntelligenceReport.create({
          title: `Research: ${query}`,
          report_type: 'industry_research',
          sector: sector || 'all',
          findings: (analysisRes.findings || []).map((f) => ({
            insight: f.insight,
            data_point: f.data_point,
            source: targetUrls.join(', '),
            confidence: f.confidence || 'medium',
          })),
          pricing_data: analysisRes.pricing || [],
          sentiment_data: analysisRes.sentiment || [],
          sources: targetUrls,
          summary: analysisRes.summary || '',
          status: 'complete',
        });

        return Response.json({ ok: true, report, analysis: analysisRes });
      }

      case 'generateAgent': {
        const { role, description } = body;
        if (!role) return Response.json({ error: 'role is required' }, { status: 400 });

        const { parsed: agentRes } = await generateText({
          prompt: `Create a comprehensive AI agent template for the role: ${role}. Description: ${description || 'General purpose agent for epoxy flooring business'}. This is for EpoxyGarageFloorEstimates.com — a scalable website factory and SaaS platform for garage floor coating contractors. Generate a detailed system prompt, recommended capabilities, recommended model, key responsibilities. Format as JSON.`,
          response_json_schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              system_prompt: { type: 'string' },
              capabilities: { type: 'array', items: { type: 'string' } },
              model: { type: 'string' },
              description: { type: 'string' },
              icon: { type: 'string' },
            },
          },
          model: 'claude-sonnet-5',
        });

        return Response.json({ ok: true, agent: agentRes });
      }

      case 'simulateOutcome': {
        const { scenario, strategyIds, timeframe } = body;
        if (!scenario) return Response.json({ error: 'scenario is required' }, { status: 400 });

        const strategies = strategyIds?.length
          ? await Promise.all(strategyIds.map((id) => base44.asServiceRole.entities.StrategyDocument.get(id).catch(() => null)))
          : await base44.asServiceRole.entities.StrategyDocument.filter({ status: 'active' });

        const strategyContext = strategies.filter(Boolean).map((s) => ({
          title: s.title,
          type: s.type,
          content: (s.content || '').slice(0, 2000),
          key_objectives: s.key_objectives,
        }));

        const { parsed: simRes } = await generateText({
          prompt: `You are a predictive analytics engine for EpoxyGarageFloorEstimates.com. SCENARIO: ${scenario}. TIMEFRAME: ${timeframe || '90 days'}. ACTIVE STRATEGIES: ${JSON.stringify(strategyContext)}. Based on the active strategy documents, simulate the outcome. Include projected metrics (leads, revenue, conversion rate, ROI), confidence intervals (low, mid, high), key assumptions, risk factors, and which strategies most influence this outcome. Format as JSON.`,
          response_json_schema: {
            type: 'object',
            properties: {
              projected: {
                type: 'object',
                properties: {
                  leads: { type: 'number' },
                  revenue: { type: 'number' },
                  conversion_rate: { type: 'number' },
                  roi: { type: 'number' },
                },
              },
              confidence: {
                type: 'object',
                properties: {
                  low: { type: 'object' },
                  mid: { type: 'object' },
                  high: { type: 'object' },
                },
              },
              assumptions: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } },
              strategy_impact: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    strategy: { type: 'string' },
                    impact: { type: 'number' },
                  },
                },
              },
              recommendation: { type: 'string' },
            },
          },
          model: 'claude-sonnet-5',
        });

        return Response.json({ ok: true, simulation: simRes });
      }

      case 'gatherIntelligence': {
        const { serviceCategory, sector } = body;

        const { parsed: intelRes } = await generateText({
          prompt: `You are a world-renowned construction industry analyst and economist. Conduct exhaustive intelligence gathering for: Service Category: ${serviceCategory || 'epoxy flooring, decorative concrete, stained concrete, countertops, patios, pool decks, driveways, walkways, garages, bathroom vanity, epoxy art, installation training, franchise ownership'}. Sector: ${sector || 'residential, commercial, government'}. Research: current market state, pricing analysis, customer sentiment, demographic analysis, competitive landscape, trend forecast, government contracting, technology trends, seasonal patterns, opportunities. Format as structured JSON.`,
          response_json_schema: {
            type: 'object',
            properties: {
              market_state: { type: 'string' },
              market_size: { type: 'string' },
              growth_rate: { type: 'string' },
              pricing: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    service: { type: 'string' },
                    low: { type: 'number' },
                    high: { type: 'number' },
                    avg: { type: 'number' },
                    unit: { type: 'string' },
                  },
                },
              },
              sentiment: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    demographic: { type: 'string' },
                    positive: { type: 'array', items: { type: 'string' } },
                    negative: { type: 'array', items: { type: 'string' } },
                    buying_signal: { type: 'number' },
                    psychographic: { type: 'string' },
                  },
                },
              },
              competitors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    strategy: { type: 'string' },
                    market_share: { type: 'string' },
                  },
                },
              },
              trends: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    metric: { type: 'string' },
                    direction: { type: 'string' },
                    prediction_1yr: { type: 'string' },
                    prediction_3yr: { type: 'string' },
                    prediction_5yr: { type: 'string' },
                  },
                },
              },
              government_opportunities: { type: 'string' },
              technology_trends: { type: 'array', items: { type: 'string' } },
              seasonal_patterns: { type: 'string' },
              opportunities: { type: 'array', items: { type: 'string' } },
              summary: { type: 'string' },
            },
          },
          add_context_from_internet: true,
          model: 'gemini_3_1_pro',
        });

        const report = await base44.asServiceRole.entities.IntelligenceReport.create({
          title: `Intelligence: ${serviceCategory || 'Full Industry'} — ${sector || 'All Sectors'}`,
          report_type: 'industry_research',
          sector: sector || 'all',
          service_category: serviceCategory || 'epoxy_flooring',
          findings: [],
          pricing_data: intelRes.pricing || [],
          sentiment_data: intelRes.sentiment || [],
          trend_data: (intelRes.trends || []).map((t) => ({
            metric: t.metric,
            prediction: t.prediction_1yr,
          })),
          summary: intelRes.summary || intelRes.market_state || '',
          sources: ['LLM with web context'],
          status: 'complete',
        });

        return Response.json({ ok: true, report, intelligence: intelRes });
      }

      case 'scanSite': {
        const { url } = body;
        if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

        let scraped;
        try {
          scraped = await simpleScrape(url);
        } catch (e) {
          scraped = { url, content: '', error: e.message };
        }

        const { parsed: scanRes } = await generateText({
          prompt: `Analyze this scraped website content and identify what needs to change to rebrand it for a new epoxy flooring company. URL: ${url}. Content: ${(scraped.content || '').slice(0, 10000) || 'N/A'}. Identify: company name, logo, phone, email, address that need replacing, service area, color scheme, key pages, SEO keywords, CTAs, minimum content changes needed to launch. Format as JSON.`,
          response_json_schema: {
            type: 'object',
            properties: {
              company_name: { type: 'string' },
              logo_found: { type: 'boolean' },
              phone: { type: 'string' },
              email: { type: 'string' },
              address: { type: 'string' },
              service_area: { type: 'string' },
              color_scheme: { type: 'string' },
              pages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    page: { type: 'string' },
                    content_summary: { type: 'string' },
                    changes_needed: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
              keywords: { type: 'array', items: { type: 'string' } },
              ctas: { type: 'array', items: { type: 'string' } },
              minimum_changes: { type: 'array', items: { type: 'string' } },
              launch_readiness: { type: 'string' },
            },
          },
          model: 'claude-sonnet-5',
        });

        return Response.json({ ok: true, scan: scanRes, rawContent: (scraped.content || '').slice(0, 5000) });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('aiAssist error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}