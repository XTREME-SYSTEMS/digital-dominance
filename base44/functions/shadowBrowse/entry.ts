import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { invokeIndependentAi } from '../../shared/independentCore.ts';
import { browseSession, browseStealth, str } from '../../shared/cloudBrowser.ts';

// ─────────────────────────────────────────────────────────────────────────────
// shadowBrowse — Covert cloud browser. Drives an isolated browser session
// through the proxy pool and returns page content ONLY to the caller.
// Nothing is persisted — no entity writes, no logs, no trace.
//
// Actions:
//   browse   — open a URL and return raw page text (no LLM)
//   extract  — open a URL, extract page text, then structure it via vercelAiGateway
//   stealth  — anti-detection browse with proxy rotation + human-like behavior
//
// Uses vercelAiGateway (not Core.InvokeLLM) for LLM extraction so it works
// even when Base44 integration credits are exhausted.
// ─────────────────────────────────────────────────────────────────────────────

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Owner only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const url = str(body?.url, 500).trim();
    const prompt = str(body?.prompt, 4000);
    const action = body?.action || 'browse';
    const stealth = !!body?.stealth;
    if (!url) return Response.json({ error: 'url is required' }, { status: 400 });

    let pageText: string;
    let meta: any = {};

    // Google search URLs get captcha-blocked by the cloud browser — Google's
    // anti-bot detects the headless session even with proxy rotation. Route
    // Google searches through InvokeLLM's web search instead, which uses
    // Google's API backend (not a browser) and never gets captcha'd.
    const isGoogleSearch = /https?:\/\/(www\.)?google\..*\/search/.test(url);
    if (isGoogleSearch) {
      const query = new URL(url).searchParams.get('q') || url;
      const llmRes = await invokeIndependentAi(base44, {
        prompt: `Search Google for: "${query}". Return the top organic search results as a structured list. For each result, include: title, URL, and a brief snippet/description. Also note any local business listings (Google Business Profile results) with their name, rating, and phone if visible. Return up to 20 results.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  url: { type: 'string' },
                  snippet: { type: 'string' },
                  is_local_business: { type: 'boolean' },
                  rating: { type: 'number' },
                  phone: { type: 'string' }
                }
              }
            },
            summary: { type: 'string' }
          }
        }
      });
      pageText = JSON.stringify(llmRes, null, 2);
      meta = { method: 'llm_web_search', query };
    } else if (stealth || action === 'stealth') {
      const result = await browseStealth(url, { maxChars: 40000, country: body?.country || null });
      pageText = result.text;
      meta = { attempts: result.attempts, sessionId: result.sessionId };
    } else {
      pageText = await browseSession(url, 40000);
    }

    // Detect captcha / anti-bot block pages
    const captchaHit = /unusual traffic from your computer network|captcha|are you a robot|Our systems have detected unusual traffic/i.test(pageText);
    if (captchaHit) {
      return Response.json({
        url,
        textChars: pageText.length,
        error: 'Anti-bot block detected (captcha). This site is blocking the cloud browser. Try the stealth action or use a different source.',
        blocked: true,
        ...meta
      });
    }

    if (!pageText || pageText.length < 50) {
      return Response.json({ url, textChars: pageText.length, error: 'no usable page text extracted', ...meta });
    }

    // Raw covert read — return page text directly, no LLM, no persistence.
    if (action === 'browse' || !prompt) {
      return Response.json({ url, textChars: pageText.length, text: pageText, ...meta });
    }

    // LLM structuring via vercelAiGateway (bypasses Base44 credit exhaustion)
    if (action === 'extract' && prompt) {
      const llmRes = await base44.functions.invoke('vercelAiGateway', {
        action: 'generateText',
        model: 'openai/gpt-5.4-mini',
        system_prompt: 'You are a covert intelligence extractor. Return ONLY the extracted information in clear, structured format. No preamble.',
        prompt: `${prompt}\n\nPage URL: ${url}\n\nPage content:\n"""\n${pageText}\n"""`,
      });
      return Response.json({ url, textChars: pageText.length, result: llmRes.data?.text || '', ...meta });
    }

    return Response.json({ url, textChars: pageText.length, text: pageText, ...meta });
  } catch (error) {
    console.error('[shadowBrowse] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}