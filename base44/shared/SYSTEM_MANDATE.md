# SYSTEM MANDATE — Vercel AI Gateway & Railway Crons (Permanent)

## MANDATORY ROUTING (NO EXCEPTIONS)

### AI / LLM Operations
- **ALL** LLM calls (text generation, chat, analysis, structured output) MUST route through **Vercel AI Gateway** via the `vercelAiGateway` backend function or the shared `aiGateway.ts` module.
- **NEVER** use `base44.integrations.Core.InvokeLLM` directly. The `patchCore()` helper in `base44/shared/aiGateway.ts` overrides this method to route through Vercel automatically — call `patchCore(base44)` and `patchCore(svc)` at the top of every backend function.
- **Frontend**: The `base44Client.js` already patches all Core methods globally. No per-component changes needed.

### Image / Video / Audio Generation
- **ALL** image generation → `vercelAiGateway` action `generateImage`
- **ALL** video generation → `vercelAiGateway` action `generateVideo`
- **ALL** speech generation → `vercelAiGateway` action `generateSpeech`
- **ALL** audio transcription → `vercelAiGateway` action `transcribeAudio`
- **NEVER** use `base44.integrations.Core.GenerateImage`, `Core.GenerateVideo`, `Core.GenerateSpeech`, `Core.TranscribeAudio`

### File Uploads
- **ALL** file uploads → `supabaseUpload` backend function (Supabase Storage)
- **NEVER** use `base44.integrations.Core.UploadPublicFile` or `Core.UploadPrivateFile`
- Signed URLs → `supabaseUpload` action `signedUrl` (not `Core.CreateFileSignedUrl`)

### Email
- **ALL** email sends → `independentEmail` backend function or `xtremeComms` action `sendEmail`
- **NEVER** use `base44.integrations.Core.SendEmail`

### Data Extraction
- **ALL** file data extraction → `vercelAiGateway` action `extractData`
- **NEVER** use `base44.integrations.Core.ExtractDataFromUploadedFile`

### Automations / Scheduled Tasks
- **ALL** scheduled automations MUST use **Railway crons** via the `railwayCronDispatcher` backend function.
- **NEVER** create new Base44 workflows (`base44/workflows/*.jsonc`) for scheduled tasks — they require integration credits.
- Existing Base44 workflows should be migrated to Railway crons when touched.
- Railway cron jobs call backend functions via HTTP — no credit dependency.

### Push Notifications
- **NEVER** use `base44.integrations.Core.SendPushNotification` — it requires a native mobile build and Base44 credits.
- Route through `xtremeComms` if push is needed.

## WHAT STAYS ON BASE44
- **Authentication only** — `base44.auth.me()`, `base44.auth.isAuthenticated()`, `base44.auth.logout()`, login/register/reset flows.
- **Entity CRUD** — `base44.entities.*` (database operations, realtime subscriptions).
- **Function invocation** — `base44.functions.invoke()` (the transport layer, not the integration).
- **User management** — `base44.users.inviteUser()`.

## ENFORCEMENT
- The `patchCore()` function in `base44/shared/aiGateway.ts` enforces this at runtime by overriding all Core integration methods.
- The frontend `base44Client.js` enforces this globally for all frontend code.
- Any new backend function MUST call `patchCore(base44)` and `patchCore(svc)` immediately after `createClientFromRequest(req)`.
- Any new frontend component can call `base44.integrations.Core.*` freely — the global patch routes it through Vercel AI Gateway automatically.

## MODEL ROUTING
- Default model: `openai/gpt-5.4` (Vercel AI Gateway format, not Base44 Core format)
- Core model names are mapped automatically by `MODEL_MAP` in `aiGateway.ts`
- `add_context_from_internet` is silently dropped (not supported by Vercel AI Gateway)

## CREDENTIAL
- `VERCEL_AI_GATEWAY_API_KEY` — the key for all Vercel AI Gateway calls (already set as a secret).
- This key uses the user's paid Vercel account — independent of Base44 billing.