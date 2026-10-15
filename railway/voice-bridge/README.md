# Digital Dominance | Eden Skye Voice Bridge (staging only)

This folder contains a default-OFF inbound Twilio-to-OpenAI realtime voice bridge. It is source code, not a deployed or activated calling service. Digital Dominance 2.0 is strictly excluded. Existing Telnyx routing and the original Twilio Voice URL must remain unchanged until a separate production approval.

## Implemented

Twilio signed POST /twilio/voice -> exact account and E.164 number checks -> short-lived 32-byte random stream ticket -> signed WSS /media upgrade -> verified ticket, CallSid and StreamSid -> OpenAI Realtime gpt-realtime-2.1 with native G.711 mu-law -> streaming audio replies and barge-in -> consent-gated lead handoff. One active realtime stream per CallSid. No dial, SMS, call purchases, recording, or caller transcript logging.

On OpenAI session readiness Eden identifies herself as an AI receptionist and asks one question at a time. The selected built-in API voice defaults to marin; this is a Sol-like speaking direction, NOT the exact ChatGPT product voice Sol.

## Required environment settings

Set these ONLY in the server environment, never in GitHub, chat or browser code:

- ENABLE_VOICE_STREAMS=true: off by default and must not be enabled until the exact phone route and runtime have production approval.
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_NUMBER: exact Twilio account and authorized E.164 number.
- OPENAI_API_KEY: server-side authorized OpenAI project key.
- PUBLIC_BASE_URL: canonical HTTPS service origin.
- PUBLIC_WS_URL: canonical WSS URL ending in /media.
- OPENAI_REALTIME_MODEL: optional, defaults to gpt-realtime-2.1.
- OPENAI_REALTIME_VOICE: optional, defaults to marin.
- LEAD_SINK_URL and LEAD_SINK_TOKEN: optional server-side approved CRM endpoint and its scoped auth. Without both, lead submission explicitly fails as unconfigured.

The lead sink must independently verify tenant, consent, scope and idempotency; the bridge sends an Idempotency-Key header derived from the Twilio CallSid. Do not point the sink to production until its contract and permissions are independently validated.

GET /health indicates process/config readiness, not real Twilio account ownership or call success. POST /twilio/voice and WSS /media reject unauthenticated requests. Recording is disabled. No unverified live transfers.

## Verification

From this folder: npm install, npm test, node --check server.mjs. The 23 isolated Node tests use synthetic sockets/data, so they do not use Twilio minutes or model tokens. The entry point requires ws at runtime; CI must install dependencies. Railway project should point its root directory to /railway/voice-bridge and use the scoped Dockerfile and railway.json.

Production gating requires: authenticated Twilio account and exact number inventory, authorized secrets, a secured deployment, signed webhook and WSS tests against the actual public URL, one operator-owned isolated inbound call, measured bidirectional audio and barge-in, consent and CRM receipt, cost monitoring, human fallback, independent security review, rollback plan and operator approval before changing the existing phone routing. Nothing in this branch activates calling.

Official references:
- https://developers.openai.com/api/docs/guides/realtime-conversations
- https://developers.openai.com/api/docs/guides/voice-websockets
- https://www.twilio.com/docs/voice/twiml/stream
- https://www.twilio.com/docs/usage/security
