# GPT / Twilio connection — 2026-10-13

Source: XTREME Communications OS, Base44 app 6a9b71a5d35335afb9198950.
Consumer: XTREME-SYSTEMS/digital-dominance, feature/gpt-twilio-connection-20261013.
Digital Dominance 2.0 is excluded.

## Implemented
gptTwilio supports status and inspect_number only. The MCP catalog exposes
inspect_twilio_connection with OAuth. Communications admins may inspect the
approved account and number; a cross-app API key must have twilio:read and match
TWILIO_TENANT_ID. Only provider GET requests occur; no entity writes or phone
routing mutations occur. Account and number identities are pinned to the
operator-provided account and number ending 1174. Secrets and raw provider
errors are not returned. Webhook URL inspection returns host/protocol only.

The Digital Dominance handler proxies these two operations using its existing
XTREME_COMMUNICATION_API_KEY and existing xtreme-communications.com function base.
That custom domain's live mapping to this app is not yet verified.

## Secret binding checklist — values remain server-side
Xtreme Communications: TWILIO_ACCOUNT_SID; TWILIO_API_KEY_SID +
TWILIO_API_KEY_SECRET (preferred) OR TWILIO_AUTH_TOKEN; TWILIO_TENANT_ID for
cross-app reads. Digital Dominance: XTREME_COMMUNICATION_API_KEY with twilio:read.
Do not put these values in MCP inputs, browser code, git or chat.
No credentials were provisioned or changed during implementation.

## Exact tests
Communications: node --test scripts/gpt-twilio.test.mjs (13 synthetic cases).
Digital Dominance: node --test scripts/gpt-twilio-proxy.test.mjs (6 synthetic cases).
Synthetic tests prove guards and contracts, not provider authentication,
deployment identity, OAuth invocation, voice playback or CRM delivery.

## Remaining activation sequence
Verify custom-domain deployment identity; bind the scoped key and account
credentials through approved secrets management; publish the tested source;
refresh the ChatGPT connector; run status and inspect_number.
Review the exact incoming webhook, fallback and human escalation target.
Use Twilio Developer Kit voice/webhook skills to implement and verify signed
TwiML plus the existing authorized real-time WebSocket bridge. Do not label
turn-based speech or generated audio as interactive live voice.
Obtain approval for the exact phone route before enabling Eden Skye.
Recording stays disabled until its consent policy is verified.
The ChatGPT plugin itself is not installed inside the website; its skills guide
development and MCP exposes the application functions to GPT.

## Rollback
Restore the pre-integration Xtreme Communications checkpoint or remove the new
gptTwilio function, its MCP entry and synthetic test. Close/revert the unmerged
Digital Dominance branch. Existing Telnyx and Twilio gateways were preserved.

## Reverified October 13, 2026 | Independent continuation

- Xtreme Communications read-only Twilio reader: 13/13 synthetic tests passed in the authenticated Base44 sandbox.
- Digital Dominance branch proxy: 6/6 synthetic tests passed by independently fetching the exact branch source and executing an in-memory Node.js test harness. No files in the Base44 app were changed.
- The deployed Xtreme Communications gptTwilio endpoint responded HTTP 405 to GET and HTTP 401 to an unauthenticated JSON POST. This validates reachable route and fail-closed unauthenticated behavior, NOT provider authentication.
- The Xtreme Communications internal PhoneNumber inventory did not list +1 866 571 1174. This does NOT prove the number is unavailable in Twilio itself.
- Existing active Xtreme Communications API keys did not advertise the required `twilio:read` scope. Do not elevate a broad production key to compensate. Provision a separate least-privilege key only after exact tenant identity, approval, secret-binding and rollback are established.
- The Xtreme Communications Provider entity currently identifies a Telnyx provider, not a verified direct Twilio provider entry. The read-only adapter calls Twilio directly using server-side credentials, so the provider registry alone is not conclusive.
- PR #24 is still open and draft; its branch is 33 commits behind main. GitHub's raw API reports mergeable_state as unknown, so an actual merge conflict has not been established. Preserve this PR rather than create duplicate integrations without proof of necessity.
- Digital Dominance 2.0 and its app 6abe63b2c9b013207fdf4e06 remain excluded from access, modification and routing.

Gate before live voice: verify Twilio account/number ownership via authenticated read, independently prove OAuth to the MCP inspection tool, verify tenant-scoped credentials without exposing any secret, then test signed Twilio webhook and realtime voice in isolation. A successful synthetic test or a 401 response is not activation evidence. Keep calling, recording, number reassignment, deployment and customer data writes disabled until expressly approved.
