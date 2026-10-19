# Eden Skye + Xtreme Communications | Reversible integration plan

**Authority:** operator requested Eden One-Image Live Factory, Xtreme Communications OS, Twilio, and Digital Dominance integration. This is a nonproduction feature branch; it is NOT deployed or connected to a live Twilio line.

## Source inventory verified 2026-10-13
- Personal Base44 Eden Skye app: ID 6a8ab2c3080538da4dadb3ef. Existing VideoChat/AvatarStudio/MovieStudio/talkingAvatar functions; generated-video job polling is not proven continuous two-way avatar streaming.
- Personal Base44 XTREME Communications OS: ID 6a9b71a5d35335afb9198950. Its gptTwilio/reader.mjs already implements status and inspect_number, protected by admin or tenant bearer scope twilio:read + TWILIO_TENANT_ID binding, and returns masked webhook-route metadata. Existing Telnyx provider is registered; Twilio account/number status is UNKNOWN.
- Source repo: XTREME-SYSTEMS/digital-dominance (PRIVATE), existing edenSkye, xtremeComms, voiceAssistant, and edenCommsReadiness (feature branch) functions.
- Existing Eden One Image Live package contains six specialized entities: EdenAvatarSource, EdenContentBrief, EdenApproval, EdenRenderJob, EdenSocialDraft, EdenFactoryReceipt. Six functions: edenBootstrapFactory, edenCreateDraft, edenRecordApproval, edenSubmitHeyGen, edenPollHeyGen, edenCreateSocialDrafts. One workflow, one agent and src/pages/EdenLiveFactory.jsx. It also contains hundreds of unrelated Fault Line entities/functions and assets; import Eden-only files, NOT the donor app as a whole.
- Base44 apps expose only main; do not overwrite production source or run prod schema mutations until a preview/fork/branch is available and approved.

## Implemented on this branch
The base44/functions/edenCommsReadiness endpoint is an admin-only, read-only, provider-scoped proxy to the existing Xtreme Communications gptTwilio function. status checks scoped account readiness; inspect_number checks the explicitly configured Eden number. This new endpoint cannot dial, send SMS/MMS, purchase numbers, or modify provider settings.
- Endpoint pinned to https://xtreme-communications.com/api/functions/gptTwilio (existing server-to-server contract). No URL parameter override.
- Server-side credentials at deployment: XTREME_COMMUNICATION_API_KEY (tenant-scoped with twilio:read scope), EDEN_TWILIO_NUMBER_E164 (owned DID). Never commit values. Xtreme Communications requires Twilio credentials and TWILIO_TENANT_ID binding, managed there.
- No provider credentials, bearer tokens, webhook URLs, raw provider payloads, or full phone numbers appear in returned JSON.
- Run node --test tests/edenCommsReadiness.test.mjs on Node 20+; unit tests verify actions, authorization, scope, secret handling, upstream behavior and response sanitization.

## Phase 2: Base44 separate preview, not production
1. Obtain approved staging/fork app identity. Preserve original Eden Base44 app and its published UI.
2. Install Eden-specific six entities, six functions, workflow, agent, approved image asset, and EdenLiveFactory route into the isolated app. Keep HeyGen generation and social publication DISABLED by default, with explicit asset rights and a budget.
3. Run one controlled synthetic sample: source record -> safe content draft -> approval receipt -> authorized sandbox render -> status poll -> visual/audio/caption QA -> social draft -> approval. Capture stable run IDs and evidence; no published posts or customer sends.
4. Extend Xtreme Communications in staging with admin-only Eden profile and draft-only Twilio/Telnyx routing. Use existing gptTwilio reader for account verification; add signed inbound webhooks and isolated live voice sessions only after validation.
5. Connect Digital Dominance through authenticated server-to-server contract; never expose Twilio/API secrets in Vite browser.
6. Test permissioned synthetic inbound call, opt-in/out and human handoff. Outbound calls/SMS/email and provider-number mutations require compliance review and explicit release approval.

## GPT contract
The connected XTREME Communications MCP already exposes an Eden agent, but authenticated Twilio actions through GPT are NOT independently verified. Initially expose only communications.status, eden.inspect_number, eden.create_draft, and eden.request_handoff. Outbound requires approval queue with contact consent, purpose, quiet hours, tenant binding, idempotency and explicit execution authority. Never pass raw credentials through GPT.

## Release criteria and blocked states
- PASS for local simulated unit tests only: Node read-only bridge tests.
- UNKNOWN: exact repo CI, live Twilio account status, DID ownership/routing, realtime audio/video, HeyGen custom avatar rights, Base44 staging identity, Xtreme Comms API key tenant scopes, Supabase RLS and GPT MCP runtime.
- BLOCKED: release, protected/main merge, production credentials, prod DB migration, live Twilio webhook routing change, customer messages and paid generation.
- NO changes to Digital Dominance 2.0. Reject Twilio route pointing at old 2.0.

## Findings to harden separately
- XTREME Communications OS/base44/functions/testProviderConnection appears to call service-role provider verification without a user/tenant gate. Verify and remediate before public exposure.
- Existing digital-dominance xtremeComms sends tenant API key in JSON body as well as Authorization; plan a backward-compatible fix.
- A generated quality score is not proof of human-realistic audio/video or delivered communications.
