import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';

// ─────────────────────────────────────────────────────────────────────────────
// imageIngestion — Screenshot/design → frontend + backend code generator.
//
// Takes an uploaded image URL, sends it to a vision-capable LLM via Vercel AI
// Gateway, and returns structured JSON with:
//   - analysis of what the image shows
//   - a complete React component (JSX + Tailwind)
//   - a backend function (entry.ts) if the design implies data operations
//   - entity schema suggestions if new data entities are needed
//
// Routes through Vercel AI Gateway (bypasses Base44 integration credits).
// ─────────────────────────────────────────────────────────────────────────────

const GATEWAY_BASE = 'https://ai-gateway.vercel.sh/v1';

const SYSTEM_PROMPT = [
  'You are an expert full-stack developer for a React + Tailwind CSS + Vite application on the Base44 platform.',
  'You analyze UI screenshots/designs and generate production-ready code.',
  '',
  'STRICT CONVENTIONS — follow exactly:',
  '- Frontend: React functional components, JSX, Tailwind CSS literal class strings',
  '- Export default, named same as the file (PascalCase)',
  '- Icons: lucide-react only (import { IconName } from "lucide-react")',
  '- Imports: use @/ alias (e.g., @/components/ui/button, @/lib/utils)',
  '- shadcn/ui components from @/components/ui/ when appropriate (Button, Card, Input, etc.)',
  '- base44 SDK: import { base44 } from "@/api/base44Client"',
  '- Entity reads: const items = await base44.entities.EntityName.filter(query, { sort, limit })',
  '- Entity writes: await base44.entities.EntityName.create({ ... })',
  '- Backend functions: TypeScript, export default async function(req: Request): Promise<Response>',
  '- Backend imports: import { createClientFromRequest } from "npm:@base44/sdk@0.8.48"; import { secrets } from "base44:runtime"',
  '- Backend entity ops: base44.entities.EntityName.filter/create/update/delete',
  '- Never use require() or module.exports — ESM only',
  '- Never use dynamic Tailwind class names (bg-${color}-500) — always literal strings',
  '',
  'ANALYSIS STEPS:',
  '1. Identify the page/component type (landing page, dashboard, form, list, card, detail view, etc.)',
  '2. Catalog every visual element (headers, buttons, forms, tables, cards, images, nav, tabs, modals)',
  '3. Determine data interactions — does it read data? submit forms? call APIs? what entities?',
  '4. Note the color scheme, typography, spacing, and layout structure',
  '5. Identify responsive considerations (mobile vs desktop)',
  '',
  'GENERATE:',
  '- A COMPLETE, working React component that reproduces the design as faithfully as possible',
  '- Include all visible text content, styled with Tailwind classes matching the design',
  '- If the design implies data operations (forms, lists, CRUD), generate a matching backend function',
  '- If new data entities are needed, suggest them with field names and types',
  '- List any npm dependencies that are not already installed',
  '',
  'The frontend_code must be a single complete file — no placeholders, no ellipsis, no TODOs.',
  'The backend_code must be a complete entry.ts — or an empty string if no backend is needed.',
].join('\n');

const RESPONSE_SCHEMA: any = {
  type: 'object',
  properties: {
    analysis: { type: 'string', description: 'Detailed analysis of what the image shows — page type, elements, data interactions, colors, layout' },
    component_name: { type: 'string', description: 'PascalCase React component name' },
    file_path: { type: 'string', description: 'Suggested file path, e.g. src/pages/admin/MyPage.jsx' },
    frontend_code: { type: 'string', description: 'Complete React component JSX file content' },
    backend_function_name: { type: 'string', description: 'Snake-case function name for the backend, or empty string if none needed' },
    backend_code: { type: 'string', description: 'Complete entry.ts backend function content, or empty string if none needed' },
    entity_suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Entity name (PascalCase)' },
          fields: { type: 'string', description: 'Comma-separated field:type list, e.g. title:string, status:enum, price:number' },
          purpose: { type: 'string', description: 'What this entity stores' },
        },
        required: ['name', 'fields', 'purpose'],
      },
    },
    dependencies: { type: 'array', items: { type: 'string' }, description: 'npm packages needed that are not already installed' },
  },
  required: ['analysis', 'component_name', 'frontend_code'],
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const apiKey = secrets.get('VERCEL_AI_GATEWAY_API_KEY') || secrets.get('VERCEL_API_TOKEN');
    if (!apiKey) return Response.json({ error: 'VERCEL_AI_GATEWAY_API_KEY secret not set' }, { status: 500 });

    const body = await req.json();
    const { image_url, instructions } = body;
    if (!image_url) return Response.json({ error: 'image_url required' }, { status: 400 });

    const userPrompt = instructions
      ? `Analyze this screenshot/design and generate the code. Additional instructions from the operator: ${instructions}`
      : 'Analyze this screenshot/design and generate the frontend component and backend function code. Return valid JSON per the schema.';

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: image_url } },
      ]},
    ];

    const payload: any = {
      messages,
      max_tokens: 16000,
      response_format: { type: 'json_schema', json_schema: { name: 'image_ingestion', schema: RESPONSE_SCHEMA } },
    };

    // Vision-capable model fallback chain
    const modelChain = ['anthropic/claude-opus-4.7', 'openai/gpt-5.4'];
    let data: any = null;
    let lastError = '';

    for (const model of modelChain) {
      payload.model = model;
      try {
        const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(120000),
        });
        if (!res.ok) {
          lastError = `(${res.status}): ${(await res.text()).slice(0, 500)}`;
          console.warn(`[imageIngestion] model ${model} failed: ${res.status}`);
          continue;
        }
        data = await res.json();
        break;
      } catch (err: any) {
        lastError = err.message;
        console.warn(`[imageIngestion] model ${model} threw: ${err.message}`);
        continue;
      }
    }

    if (!data) return Response.json({ error: `All models failed. Last: ${lastError}` }, { status: 500 });

    const text = data.choices?.[0]?.message?.content || '';
    let parsed: any;
    try { parsed = JSON.parse(text); } catch {
      parsed = { analysis: text, component_name: 'GeneratedComponent', frontend_code: text, backend_code: '' };
    }

    return Response.json({ ok: true, ...parsed, model: data.model });
  } catch (err: any) {
    console.error('[imageIngestion]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}