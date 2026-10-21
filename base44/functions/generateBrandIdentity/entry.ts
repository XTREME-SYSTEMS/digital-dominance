import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';

// BRAND IDENTITY GENERATOR
// Generates 10 AI logos + domain name suggestions with availability check

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, businessName, industry, transparent } = body;

    if (action === 'generate_logos') {
      if (!businessName) return Response.json({ error: 'businessName required' }, { status: 400 });

      const cleanName = businessName.trim();
      const ind = (industry || 'general').toLowerCase();
      // Transparent-background concepts: no plate, no shadow, PNG with alpha.
      const plate = transparent
        ? ', isolated on a fully transparent background, no background, no plate, no shadow, PNG with alpha channel, centered with even padding'
        : '';

      // 10 distinct logo style prompts
      const logoStyles = [
        { style: 'Minimalist Monogram', prompt: `Minimalist monogram logo for "${cleanName}", two-letter monogram, clean geometric lines, single color, white background, professional vector style, centered, simple` },
        { style: 'Modern Wordmark', prompt: `Modern wordmark logo for "${cleanName}", clean sans-serif typography, single weight, professional brand mark, white background, centered, minimal` },
        { style: 'Classic Emblem', prompt: `Classic emblem logo for "${cleanName}", circular badge design, professional crest style, white background, centered, detailed but clean` },
        { style: 'Geometric Icon', prompt: `Geometric icon logo for "${cleanName}", abstract geometric shape representing ${ind} industry, single color, white background, professional, centered` },
        { style: 'Bold Typographic', prompt: `Bold typographic logo for "${cleanName}", strong heavy font, professional brand name, white background, centered, impactful` },
        { style: 'Shield Crest', prompt: `Shield crest logo for "${cleanName}", professional shield design, ${ind} industry symbol inside, white background, centered, clean vector style` },
        { style: 'Abstract Symbol', prompt: `Abstract symbol logo for "${cleanName}", modern abstract mark suggesting ${ind} industry, white background, centered, professional brand identity` },
        { style: 'Letter Mark', prompt: `Letter mark logo for "${cleanName}", single large letter, modern professional design, white background, centered, clean` },
        { style: 'Vintage Badge', prompt: `Vintage badge logo for "${cleanName}", retro professional badge, ${ind} industry theme, white background, centered, clean lines` },
        { style: 'Gradient Modern', prompt: `Modern gradient logo for "${cleanName}", professional brand mark with subtle gradient, ${ind} industry, white background, centered, contemporary` },
      ];

      // Generate all 10 logos in parallel
      const results = await Promise.allSettled(
        logoStyles.map(async (ls) => {
          const res = await base44.integrations.Core.GenerateImage({
            prompt: `${ls.prompt}${plate}`,
          });
          return { style: ls.style, url: res.url };
        })
      );

      const logos = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);

      return Response.json({ logos, count: logos.length });
    }

    if (action === 'check_domains') {
      if (!businessName) return Response.json({ error: 'businessName required' }, { status: 400 });

      const cleanName = businessName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!cleanName) return Response.json({ error: 'Invalid name' }, { status: 400 });

      // Generate domain suggestions
      const tlds = ['com', 'net', 'io', 'co', 'ai'];
      const prefixes = ['', 'get', 'the', 'my'];
      const suffixes = ['', 'pro', 'hq', 'co'];

      const domains: string[] = [];
      for (const tld of tlds) {
        domains.push(`${cleanName}.${tld}`);
      }
      for (const p of prefixes) {
        if (p) domains.push(`${p}${cleanName}.com`);
      }
      for (const s of suffixes) {
        if (s) domains.push(`${cleanName}${s}.com`);
      }

      // Check availability using RDAP (free, no API key)
      const uniqueDomains = [...new Set(domains)].slice(0, 12);
      const checks = await Promise.allSettled(
        uniqueDomains.map(async (domain) => {
          try {
            const res = await fetch(`https://rdap.org/domain/${domain}`, {
              method: 'GET',
              headers: { 'Accept': 'application/rdap+json', 'User-Agent': 'UnlimitedWebsites/1.0' },
              signal: AbortSignal.timeout(8000),
            });
            // 200 = registered, 404 = available, 403 = rate limited (treat as unknown)
            return { domain, available: res.status === 404 ? true : res.status === 200 ? false : null, status: res.status };
          } catch {
            return { domain, available: null, status: 'error' };
          }
        })
      );

      const results = checks
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);

      return Response.json({ domains: results });
    }

    return Response.json({ error: 'Unknown action. Use generate_logos or check_domains' }, { status: 400 });
  } catch (error) {
    console.error('Brand identity generator error:', error);
    return Response.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}