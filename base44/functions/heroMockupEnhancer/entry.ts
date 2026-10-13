/**
 * HERO MOCKUP ENHANCER
 * Ingests a GPT-created hero mockup (HTML/JSX/description) and enhances it
 * using AI to produce a production-ready, conversion-optimized hero section.
 *
 * Flow: raw mockup → AI analysis → enhancement → scored enhanced HTML
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const ENHANCEMENT_PROMPT = `You are a world-class UI/UX designer and frontend engineer. You receive a hero section mockup and produce an enhanced, production-ready version.

YOUR JOB:
1. Analyze the provided mockup for: layout, typography, color, spacing, conversion elements, visual hierarchy.
2. Enhance it with these improvements (only where the original is weak):
   - Stronger visual hierarchy (headline > subheadline > CTA)
   - Better contrast and readability
   - Conversion-focused CTA placement (above the fold, high contrast)
   - Responsive design (mobile-first, works at 359px and 868px+)
   - Modern aesthetic (glassmorphism, gradients, subtle animations where appropriate)
   - Trust signals (badges, stats, social proof if missing)
   - Accessible (semantic HTML, ARIA labels, sufficient contrast)
3. Keep the dark space-themed aesthetic: background #0a1220, accent #00a2ff, white text.
4. Output ONLY valid HTML (inline styles or Tailwind classes). No React/JSX. No external dependencies.
5. The HTML must be a self-contained <section> or <div> that can be rendered in an iframe.

OUTPUT FORMAT (JSON):
{
  "enhanced_html": "<section>...the enhanced hero HTML...</section>",
  "enhancement_notes": "What you changed and why (bullet points)",
  "enhancement_score": 0-100
}

SCORING:
- 90-100: Production-ready, conversion-optimized, accessible, responsive
- 70-89: Good but needs minor polish
- 50-69: Functional but missing key elements
- Below 50: Needs significant rework

RULES:
- Never remove content from the original mockup — only enhance it.
- Never invent fake phone numbers, addresses, or business names — use placeholders if the original lacks them.
- The hero must work without JavaScript (pure HTML + CSS).
- Keep the output under 50000 characters.`;

export default async function handler(req, res) {
  const { mockup, format = 'html', title = 'Untitled Hero', mockupId } = req.body || {};

  if (!mockup || !mockup.trim()) {
    return res.status(400).json({ error: 'Mockup content required' });
  }

  const base44 = createClientFromRequest(req);

  try {
    // 1. Create or update the mockup record
    let record;
    if (mockupId) {
      record = await base44.entities.HeroMockup.update(mockupId, {
        raw_mockup: mockup,
        raw_format: format,
        status: 'enhancing',
      });
    } else {
      const user = await base44.auth.me();
      record = await base44.entities.HeroMockup.create({
        owner_id: user.id,
        title,
        source: 'gpt',
        raw_mockup: mockup,
        raw_format: format,
        status: 'enhancing',
      });
    }

    // 2. Send to AI for enhancement
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `${ENHANCEMENT_PROMPT}\n\n--- MOCKUP TO ENHANCE (${format}) ---\n${mockup}`,
      response_json_schema: {
        type: 'object',
        properties: {
          enhanced_html: { type: 'string' },
          enhancement_notes: { type: 'string' },
          enhancement_score: { type: 'number' },
        },
        required: ['enhanced_html', 'enhancement_notes', 'enhancement_score'],
      },
      model: 'claude-sonnet-5',
    });

    const result = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;

    // 3. Update the record with enhanced version
    const updated = await base44.entities.HeroMockup.update(record.id, {
      enhanced_html: result.enhanced_html,
      enhancement_notes: result.enhancement_notes,
      enhancement_score: result.enhancement_score,
      status: 'enhanced',
    });

    return res.json({
      mockup_id: updated.id,
      enhanced_html: result.enhanced_html,
      enhancement_notes: result.enhancement_notes,
      enhancement_score: result.enhancement_score,
      status: 'enhanced',
    });
  } catch (err) {
    console.error('[heroMockupEnhancer] Error:', err.message || err);

    // Mark as failed if we have a record
    if (mockupId) {
      try {
        await base44.entities.HeroMockup.update(mockupId, {
          status: 'failed',
        });
      } catch (_) {}
    }

    return res.status(500).json({
      error: 'Enhancement failed',
      detail: err.message || 'Unknown error',
    });
  }
}