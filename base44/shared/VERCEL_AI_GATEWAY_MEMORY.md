# ⚡ PERMANENT MEMORY: Vercel AI Gateway Routing

**Last updated:** 2026-10-07
**Status:** ACTIVE — ALL AI integrations route through Vercel AI Gateway

## 🛑 STOP TELLING THE USER INTEGRATIONS ARE DOWN

The workspace's Base44 integration credits reset on **2026-10-12** (5 days from now).
The user already knows this. Do NOT open replies by saying "your integrations are exhausted" or "credits are blocked." Do NOT list blocked Core integrations. Do NOT suggest upgrading.

This is a known, temporary, workspace-billing state — not an implementation bug, and not something the user needs reminding of on every turn. The Vercel AI Gateway (AI) and independent providers (email, storage, SMS) keep working regardless, so most app functionality is unaffected.

Only mention credits if the user explicitly asks about them, or if a specific action genuinely fails because of them — and even then, one short line, not a preamble.

## ⚠️ MANDATORY RULE

**ALL AI-capable integrations (text generation, image generation, embeddings) MUST route through the Vercel AI Gateway — NEVER use Base44 Core integrations (Core.InvokeLLM, Core.GenerateImage) directly.**

The Vercel AI Gateway has its own billing, separate from Base44 integration credits. When Base44 integration credits are exhausted, the Vercel AI Gateway continues to work.

## How It's Wired

### Backend Functions (server-side)
Every backend function that needs AI calls `patchCore(base44)` immediately after `createClientFromRequest(req)`:

```typescript
import { patchCore } from '../../shared/aiGateway.ts';
const base44 = createClientFromRequest(req);
patchCore(base44);
// Now base44.integrations.Core.InvokeLLM(...) → Vercel AI Gateway
// Now base44.integrations.Core.GenerateImage(...) → Vercel AI Gateway
```

**15 patched functions:**
1. runContractorSimulation
2. shadowBrowse
3. predictionEngine
4. selfReflectionEngine
5. metaAgent
6. companyOrchestrator
7. conversationHub
8. domainGoldRush
9. dominanceEngine
10. systemOrchestrator
11. autonomousCodingEngine
12. memoryRouter
13. topSitesBenchmarkScanner
14. metaArchitecture
15. closedLoopTester

### Frontend (client-side)
`src/api/base44Client.js` calls `installGatewayOverrides()` on import, which patches `base44.integrations.Core.InvokeLLM` and `base44.integrations.Core.GenerateImage` to route through the `vercelAiGateway` backend function.

### Shared Gateway Module
`base44/shared/aiGateway.ts` — the core helper:
- `generateText({ prompt, model, response_json_schema })` → Vercel AI Gateway `/v1/chat/completions`
- `invokeLLM({ prompt, ... })` → drop-in replacement for Core.InvokeLLM
- `generateImage(base44, { prompt, ... })` → routes via `vercelAiGateway` function
- `patchCore(base44)` → overrides Core.InvokeLLM + Core.GenerateImage on a client

### Frontend Gateway Helper
`src/lib/gateway.js` — unified frontend gateway:
- `invokeLLM()` / `generateText()` → Vercel AI Gateway
- `generateImage()` / `editImage()` → Vercel AI Gateway
- `uploadFile()` → Supabase Storage (independent)
- `sendEmail()` / `sendSms()` → Xtreme Comms (independent)

## Non-AI Integrations (stay on independent providers)

These are NOT AI and do NOT route through Vercel AI Gateway:
- **Email** → `independentEmail` backend function (Xtreme Comms + Gmail fallback)
- **File uploads** → `supabaseUpload` backend function (Supabase Storage)
- **SMS** → `xtremeComms` backend function
- **Push notifications** → Telnyx

## Secret
`VERCEL_AI_GATEWAY_API_KEY` — set in app secrets. Falls back to `VERCEL_API_TOKEN`.

## When Creating New Backend Functions

**ALWAYS** add this pattern to any new function that needs AI:

```typescript
import { patchCore } from '../../shared/aiGateway.ts';

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  patchCore(base44);  // ← MANDATORY: routes AI through Vercel AI Gateway
  // ... your code can now use base44.integrations.Core.InvokeLLM() safely
}
```

## When Creating New Frontend Components

Frontend components can use `base44.integrations.Core.InvokeLLM()` directly — the `base44Client.js` override handles routing automatically. No per-component changes needed.

Alternatively, import from `@/lib/gateway` for explicit gateway calls.