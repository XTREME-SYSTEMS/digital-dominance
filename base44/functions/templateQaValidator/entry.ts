import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * templateQaValidator — the independent QA and validation agents for a page.
 *
 * The validator re-reads the finished HTML and fails closed on anything mock,
 * missing or contradictory (for example a rating shown for a business that told
 * us it has none). The QA agent scores the page, and the suggestions agent
 * returns the improvements the owner can tick.
 *
 * It trusts nothing the build code claims about the page: every finding below
 * is derived from the HTML that will actually ship.
 *
 * Public on purpose: the launch wizard is used by visitors who are not signed in.
 */

const has = (html: string, pattern: RegExp) => pattern.test(html);

function digits(value: string) {
  return String(value || '').replace(/\D/g, '');
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const html = String(body.html || '').slice(0, 500000);
    const profile = body.profile || {};
    const applied = Array.isArray(body.applied_fixes) ? body.applied_fixes.map(String) : [];

    if (!html) return Response.json({ error: 'html is required' }, { status: 400 });

    const name = String(profile.business_name || '').trim();
    const trade = String(profile.industry_label || profile.industry || 'local services').trim();
    const place = [profile.city, profile.state].map(v => String(v || '').trim()).filter(Boolean).join(', ');
    const services = Array.isArray(profile.services) ? profile.services.filter(Boolean) : [];

    // ── VALIDATOR: hard findings on the finished page ────────
    const findings: any[] = [];
    const add = (id, label, detail, fix, severity = 'high') => findings.push({ id, label, detail, fix, severity });

    if (has(html, /Northstar Studio/)) add('mock_name', 'Stock business name still on the page', '“Northstar Studio” is the template demonstration name.', 'brand_name');
    if (has(html, /example\.com/)) add('mock_email', 'Sample email address still on the page', 'A hello@example.com address is not a working contact route.', 'contact_block');
    if (has(html, /Strategy &amp; Planning|Strategy & Planning|Custom Solutions|Ongoing Support/)) add('mock_services', 'Demonstration services still listed', 'Strategy & Planning / Custom Solutions are placeholder services.', 'expand_services');
    if (has(html, /Your service area|Your local service area/)) add('mock_place', 'Placeholder service area', 'The page still says “Your service area”.', 'service_area');
    if (has(html, /Ready to build something exceptional|Make your next big idea look effortless/)) add('mock_headline', 'Demonstration headline', 'The hero still shows the template headline.', 'tighten_hero');
    if (has(html, /Configure a contact email|needs image review|Needs image review/)) add('setup_notice', 'Unfinished setup notice visible to visitors', 'A configuration notice is showing on the page.', 'contact_block');
    if (has(html, /class="draft-note"|Template preview: replace sample/)) add('draft_note', 'Draft note showing on the page', 'The template preview note must not ship.', 'brand_name');

    if (name && !html.includes(name)) add('name_missing', 'Business name missing from the page', `“${name}” does not appear anywhere on the page.`, 'brand_name');
    if (!name) add('name_empty', 'No business name given', 'The site cannot be branded without a business name.', 'brand_name');

    if (profile.phone) {
      const phone = digits(profile.phone);
      if (!html.includes('tel:') || (phone && !digits(html).includes(phone))) {
        add('phone_missing', 'Phone number not installed', 'The page has no working tap-to-call link with your number.', 'cta_phone');
      }
    } else {
      add('phone_absent', 'No phone number given', 'Visitors have no way to call from the page.', 'cta_phone', 'medium');
    }

    if (profile.email) {
      if (!html.toLowerCase().includes('mailto:')) add('email_missing', 'Email not installed', 'Your email is not a clickable contact route on the page.', 'contact_block');
    } else {
      add('email_absent', 'No business email given', 'No email route on the page.', 'contact_block', 'medium');
    }

    if ((profile.address || place) && !html.includes('Serving')) {
      add('area_missing', 'Service area line missing', 'A “Serving …” line tells local visitors you cover them.', 'service_area', 'medium');
    }

    // Rating must match what the owner told us — in both directions.
    const showsRating = has(html, /rating-band|★★★★★|out of 5/i);
    if (profile.has_rating && !showsRating) add('rating_missing', 'Rating not shown', 'You said you have ratings — they are not on the page.', 'rating', 'medium');
    if (!profile.has_rating && showsRating) add('rating_unwanted', 'Rating shown but you have none', 'Nothing about reviews may appear when you have no ratings.', 'rating');

    if (!/<title>[\s\S]*?<\/title>/.test(html)) add('title_missing', 'Page title missing', 'Search engines need a titled page.', 'seo_meta');
    else if (name && !(html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.includes(name)) add('title_off', 'Title does not carry the business name', 'The title tag still describes the template, not the business.', 'seo_meta', 'medium');
    if (!/<meta name="description"/.test(html)) add('description_missing', 'Meta description missing', 'No search description on the page.', 'seo_meta', 'medium');

    const images = (html.match(/<img /gi) || []).length;
    if (images === 0) add('no_imagery', 'No photography on the page', 'Every image slot failed to resolve.', 'imagery');
    const missingSlots = (html.match(/artifact-missing|needs image review/gi) || []).length;
    if (missingSlots > 0) add('image_gaps', `${missingSlots} image slot(s) unresolved`, 'Those slots are flagged for review instead of showing photography.', 'imagery', 'medium');

    if (services.length >= 3) {
      const listed = services.filter(service => html.toLowerCase().includes(String(service).toLowerCase()));
      if (listed.length < 3) add('services_thin', 'Your services are barely on the page', `Only ${listed.length} of ${services.length} services appear.`, 'expand_services');
    } else if (!services.length) {
      add('services_absent', 'No services given', 'The page has nothing to sell.', 'expand_services', 'medium');
    }

    const validation = {
      passed: findings.filter(f => f.severity === 'high').length === 0,
      findings,
      summary: findings.length
        ? `${findings.length} finding${findings.length === 1 ? '' : 's'} — ${findings.filter(f => f.severity === 'high').length} must be fixed before publishing.`
        : 'No mock content, missing contact details or contradictions found.',
    };

    // ── QA AGENT: scores the page ────────────────────────────
    const clean = (pattern: RegExp) => !has(html, pattern);
    const criteria = [
      { key: 'brand_accuracy', weight: 25, label: 'Brand accuracy', score: clean(/Northstar Studio|Ready to build something exceptional|Make your next big idea/) && (name ? html.includes(name) : false) ? 1 : 0 },
      { key: 'contact_completeness', weight: 20, label: 'Contact completeness', score: [profile.phone && html.includes('tel:'), profile.email && html.toLowerCase().includes('mailto:'), profile.address || place].filter(Boolean).length / 3 },
      { key: 'content_depth', weight: 20, label: 'Content depth', score: Math.min(1, (services.filter(service => html.toLowerCase().includes(String(service).toLowerCase())).length / Math.max(4, Math.min(services.length, 8)))) },
      { key: 'trust_signals', weight: 10, label: 'Trust signals', score: (profile.has_rating && showsRating ? 0.6 : 0) + (html.includes('Serving') ? 0.4 : 0) },
      { key: 'search_readiness', weight: 15, label: 'Search readiness', score: [has(html, /<title>/), has(html, /<meta name="description"/), name ? (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.includes(name) : false].filter(Boolean).length / 3 },
      { key: 'imagery', weight: 10, label: 'Imagery', score: images > 0 && missingSlots === 0 ? 1 : (images > 0 ? 0.5 : 0) },
    ].map(item => ({ ...item, earned: Math.round(item.weight * item.score) }));

    const score = criteria.reduce((sum, item) => sum + item.earned, 0);
    const flagged = criteria.filter(item => item.score < 0.7).map(item => `${item.label} — ${item.label === 'Imagery' ? 'photography coverage' : 'needs work'}`);
    const qa = {
      score,
      criteria,
      flagged,
      verdict: score >= 90 ? 'Publish-ready.' : score >= 75 ? 'Strong, with a few gaps.' : score >= 55 ? 'Needs another pass before publishing.' : 'Not ready — work through the flagged areas.',
    };

    // ── SUGGESTIONS AGENT: what the owner can tick ───────────
    const suggestions: any[] = [];
    const offer = (id, label, detail, severity) => {
      if (applied.includes(id)) return;
      suggestions.push({ id, label, detail, severity, fix: id });
    };

    if (findings.some(f => ['mock_name', 'name_missing', 'name_empty', 'draft_note'].includes(f.id))) offer('brand_name', 'Replace the stock name everywhere', 'Your business name in the header, title, footer and schema.', 'high');
    if (findings.some(f => ['mock_email', 'email_missing', 'setup_notice', 'email_absent'].includes(f.id))) offer('contact_block', 'Install your email, phone and address', 'Contact and footer blocks built from your real details.', 'high');
    if (findings.some(f => ['mock_services', 'services_thin', 'services_absent'].includes(f.id))) offer('expand_services', 'Show every service you offer', 'One card per service, straight from your list.', 'high');
    if (findings.some(f => ['area_missing', 'mock_place'].includes(f.id))) offer('service_area', 'Add your service-area line', '“Serving <your area> and N miles around” on the page and footer.', 'medium');
    if (findings.some(f => f.id === 'rating')) offer('rating', profile.has_rating ? 'Show your star rating' : 'Remove the star rating', profile.has_rating ? 'Rated out of 5 with your review count.' : 'Nothing about reviews stays on the page.', 'high');
    if (findings.some(f => ['title_missing', 'title_off', 'description_missing'].includes(f.id))) offer('seo_meta', 'Write the search title and description', 'Built from your business, trade and area.', 'medium');
    if (!applied.includes('faq')) offer('faq', 'Answer the questions customers ask first', 'FAQs generated from your own services — no invented facts.', 'medium');
    if (!applied.includes('differentiators')) offer('differentiators', 'Add why customers pick you', 'Reasons written from how you work, not made-up claims.', 'medium');
    if (!applied.includes('cta_phone') && profile.phone) offer('cta_phone', 'Make your phone the main button', 'Every main button becomes a tap-to-call on mobile.', 'medium');
    if (!applied.includes('tighten_hero')) offer('tighten_hero', 'Change the headline to trade + area', `Leads with “${trade}${place ? ` in ${place}` : ''}”.`, 'medium');

    // The suggestions agent's own read on this industry, applied as a copy fix.
    if (!applied.includes('ai_copy')) {
      try {
        const copy = await base44.integrations.Core.InvokeLLM({
          prompt: `Write page copy for a ${trade} business called "${name}"${place ? ` in ${place}` : ''}. Services they offer: ${services.slice(0, 8).join(', ') || '(not provided)'}.

Return:
- headline: one line under 60 characters that reads like a ${trade} company, not a software company. No exclamation marks.
- description: one sentence under 180 characters describing what they do and for whom. Only use the services listed.
- differentiators: exactly 3 short reasons to choose them, each under 60 characters, that describe how the work is done (quotes, scheduling, clean-up, scope). Never claim certifications, licences, awards or years in business.`,
          response_json_schema: {
            type: 'object',
            properties: {
              headline: { type: 'string' },
              description: { type: 'string' },
              differentiators: { type: 'array', items: { type: 'string' } },
            },
            required: ['headline', 'description', 'differentiators'],
          },
        });
        if (copy?.headline && copy?.description) {
          suggestions.push({
            id: 'ai_copy',
            fix: 'ai_copy',
            severity: 'medium',
            label: 'Let the AI rewrite your page copy',
            detail: `Headline: “${String(copy.headline).slice(0, 70)}”`,
            payload: {
              headline: String(copy.headline).slice(0, 90),
              description: String(copy.description).slice(0, 220),
              differentiators: (copy.differentiators || []).slice(0, 3).map(d => String(d).slice(0, 90)),
            },
          });
        }
      } catch (error: any) {
        console.error('templateQaValidator copy suggestion failed:', error?.message);
      }
    }

    return Response.json({ ok: true, validation, qa, suggestions });
  } catch (error: any) {
    console.error('templateQaValidator error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}