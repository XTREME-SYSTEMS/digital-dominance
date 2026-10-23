import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// BUSINESS URL INGESTOR
// Scrapes a business website URL and extracts structured business data:
// - Business name, phone, email, address
// - Services, about text, hours, social links
// - Images found on the page
// Then enhances a template with the scraped data.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { action, url } = body;

    if (action === 'ingest') {
      if (!url) return Response.json({ error: 'url required' }, { status: 400 });

      // Normalize URL
      let fetchUrl = url.trim();
      if (!fetchUrl.match(/^https?:\/\//)) fetchUrl = 'https://' + fetchUrl;

      // Fetch the URL
      let html = '';
      let fetchError = '';
      try {
        const res = await fetch(fetchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(15000),
          redirect: 'follow',
        });
        if (!res.ok) {
          return Response.json({ error: `Website returned status ${res.status}` }, { status: 502 });
        }
        html = await res.text();
      } catch (err: any) {
        return Response.json({ error: 'Failed to fetch URL: ' + (err.message || 'network error') }, { status: 502 });
      }

      if (!html || html.length < 100) {
        return Response.json({ error: 'Page content is empty or too small' }, { status: 502 });
      }

      // ── REGEX EXTRACTION ──
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const metaDescMatch = html.match(/<meta[^>]+name=["']description["']\s+content=["']([^"']*)["']/i) ||
                            html.match(/<meta[^>]+property=["']og:description["']\s+content=["']([^"']*)["']/i);
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["']\s+content=["']([^"']*)["']/i);
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["']\s+content=["']([^"']*)["']/i);

      // Phone numbers (US format)
      const phoneRegex = /(?:\+?1[-.\s]?)?\(?([2-9]\d{2})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/g;
      const phoneMatches = [...html.matchAll(phoneRegex)]
        .map(m => m[0].trim())
        .filter(p => !p.includes('555') || p.length > 10)
        .slice(0, 5);

      // Emails
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emailMatches = [...html.matchAll(emailRegex)]
        .map(m => m[0])
        .filter(e => !e.includes('sentry') && !e.includes('example.com') && !e.includes('wixpress') && !e.includes('cloudflare'))
        .slice(0, 3);

      // Images
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      const imgMatches = [...html.matchAll(imgRegex)]
        .map(m => m[1])
        .filter(src => !src.startsWith('data:') && !src.includes('favicon') && !src.includes('logo') && !src.includes('icon'))
        .map(src => src.startsWith('http') ? src : new URL(src, fetchUrl).href)
        .slice(0, 10);

      // Headings (potential services)
      const h2Regex = /<h[2-3][^>]*>([^<]+)<\/h[2-3]>/gi;
      const headingMatches = [...html.matchAll(h2Regex)]
        .map(m => m[1].trim())
        .filter(h => h.length > 3 && h.length < 100 && !h.match(/^(home|about|contact|menu|footer|navigation)$/i))
        .slice(0, 10);

      // Address
      const addressRegex = /\d+\s+[A-Za-z0-9\s.,]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl|Parkway|Pkwy)[,\s]+[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}(-\d{4})?/g;
      const addressMatches = [...html.matchAll(addressRegex)].map(m => m[0].trim()).slice(0, 2);

      // Social links
      const socialRegex = /href=["'](https?:\/\/(?:www\.)?(?:facebook|instagram|twitter|x|linkedin|youtube|tikkit|tiktok)\.com\/[^"']+)["']/gi;
      const socialMatches = [...html.matchAll(socialRegex)].map(m => m[1]).slice(0, 5);

      // ── LLM STRUCTURING ──
      // Strip scripts/styles, get visible text for LLM
      const rawText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 10000);

      let llmData: any = {};
      try {
        const llmRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract structured business information from this website content. Return JSON with only information actually found. Leave fields empty if not found.

Website content (first 10000 chars):
${rawText}

Extract:
- businessName: The business or company name
- phone: Primary phone number
- email: Primary email address
- address: Street address if found
- services: Array of service names offered (from headings or content)
- aboutText: 1-2 sentence description of the business
- hours: Business hours if found
- socialLinks: Array of social media URLs`,
          response_json_schema: {
            type: 'object',
            properties: {
              businessName: { type: 'string' },
              phone: { type: 'string' },
              email: { type: 'string' },
              address: { type: 'string' },
              services: { type: 'array', items: { type: 'string' } },
              aboutText: { type: 'string' },
              hours: { type: 'string' },
              socialLinks: { type: 'array', items: { type: 'string' } }
            }
          }
        });
        llmData = llmRes;
      } catch (err) {
        console.error('LLM structuring failed, using regex-only results:', err.message);
      }

      // Merge regex + LLM results (LLM takes priority, regex fills gaps)
      const result = {
        url: fetchUrl,
        businessName: (llmData.businessName || '').trim() || titleMatch?.[1]?.trim() || ogTitleMatch?.[1]?.trim() || '',
        phone: (llmData.phone || '').trim() || phoneMatches[0] || '',
        email: (llmData.email || '').trim() || emailMatches[0] || '',
        address: (llmData.address || '').trim() || addressMatches[0] || '',
        services: (llmData.services?.length ? llmData.services : headingMatches) || [],
        aboutText: (llmData.aboutText || '').trim() || metaDescMatch?.[1]?.trim() || '',
        hours: (llmData.hours || '').trim() || '',
        socialLinks: (llmData.socialLinks?.length ? llmData.socialLinks : socialMatches) || [],
        images: imgMatches,
        ogImage: ogImageMatch?.[1] || '',
        metaDescription: metaDescMatch?.[1]?.trim() || '',
        title: titleMatch?.[1]?.trim() || '',
      };

      return Response.json(result);
    }

    return Response.json({ error: 'Unknown action. Use ingest.' }, { status: 400 });
  } catch (error) {
    console.error('Business URL ingestor error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}