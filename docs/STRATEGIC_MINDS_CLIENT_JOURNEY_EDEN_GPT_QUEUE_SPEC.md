# STRATEGIC MINDS AI — CUSTOMER ACQUISITION TO AUTONOMOUS DELIVERY
## Locked product specification for Digital Dominance Admin
**Status:** PROPOSED, NOT IMPLEMENTED OR RELEASED
**Date:** 2026-10-10
**Canonical source:** XTREME-SYSTEMS/digital-dominance, the existing Admin associated with epoxyquotenearme.com
**Related:** docs/STRATEGIC_MINDS_MANUS_STYLE_OS_MASTER_CONTRACT.md and contracts/manus_style_factory_checklist.v1.json

### A. Mission and three operator surfaces
1. PUBLIC: premium Strategic Minds AI marketing site, transparent packages/deposits, CTA, real portfolio, industry categories, pricing information, agreement workflow, secure purchase/offer redemption, login.
2. CLIENT: role-isolated, branded, mobile-first portal. Eden Skye live conversational onboarding, saved timeline, brief progress notices and only actionable approval requests: Logo Pack, Brand Pack, Web/App Pack, Social Media Pack. Approved previews and live deliverables accessible.
3. PRIVATE: existing Digital Dominance Admin. Primary operator types either one short sentence or detailed specifications to GPT mission chat. Authenticated bidirectional mission bridge, reusable templates, durable X1 queue, Super Agents, isolated job sandboxes, independent three-pass QA and approved provisioning. No client access to this plane.

Never reposition product as epoxy-only: epoxyquotenearme.com is the present platform host, not the only vertical or client. Any unrelated legacy contractor/epoxy product modules are classified and isolated, not flattened or deleted.

### B. Full user journey: 13 deterministic gates
01. Visitor arrives on premium marketing site. Choose package/use-case, read example outcomes, estimate/contract scope, transparent deposit and balance terms.
02. Client selects deposit checkout OR enters authorized promotion code. Promotion code has offer type: percentage/fixed discount or approved deposit waiver/sponsored entitlement, with campaign, product, expiry, per-customer and use count limits, server-only atomic redemption and audit.
03. Checkout is created SERVER SIDE using actual Strategic Minds AI Stripe authorized product/pricing. No client-submitted amount is authoritative. Payment and taxes/receipt handled via provider.
04. Payment proof is accepted only by signature-verified, idempotent Stripe webhook and verified settled/paid status (including async paid notifications). Never fulfill solely because of redirect. A full waiver uses a separately verified entitlement record, not a forged zero-dollar paid webhook.
05. Immediately after payment/entitlement verification, create a **private** client intake project + Google Drive folder tree under verified Digital Dominance parent, asynchronously and idempotently, even if legal signature still pending. Record folder IDs and receipts; do NOT invite broad public shares.
06. Client reviews and executes digital agreement covering scope, deposit/balance/payment schedule, revisions, IP/licensing, privacy and data-use consent, cancellation/refund, deliverables and e-sign disclosure. Use e-sign adapter with signer ID, document version/hash, signature time, signed PDF and immutable audit trail. Legal counsel must approve canonical service contract before production. Checkout and signature may complete in either order.
07. ONLY when deposit/waiver and legal agreement BOTH verified: activate invitation (single-use, short-lived magic link/OTP to verified email; optional SMS with consent), and issue tenant-scoped client account. The requested "temporary password" should be implemented as a one-time password-setup invitation, NOT email/SMS of a reusable plaintext password.
08. Client visits branded portal. Eden Skye welcomes the client and offers spoken conversational intake via live, real-time HeyGen **LiveAvatar**, separate from prerecorded standard HeyGen video. Avatar clearly identified as AI; client can choose text-only fallback and decline microphone. Implement low-latency voice through verified LiveAvatar API/Lite-mode plus own governed LLM where authorized. Vendor/plan and custom Eden identity require availability and consent verification before launch.
09. Eden asks short adaptive questions; do not re-ask information gathered from purchase/contract/public verified sources. Ask client to confirm any prefilled facts. Collect explicitly permissioned enrichment scope and owner approvals for social/Google accounts.
10. Agent collects verified PUBLIC BUSINESS information: website, business name, service areas, public contact address, public Google Business Profile details, known social page URLs, public service listings and lawful review references. NO individual/private skip tracing, no credential guessing, no behind-login scraping, no undisclosed sensitive personal information or assumption of Google Business Profile ownership.
11. Generate approved MissionSpec + research dossier + build checklist, fill templates from versioned vault, create isolated sandbox, assign specialist Super Agents via existing authoritative queue/lease supervisor, checkpoint all artifacts. Start safe autonomous drafting. External provider access requires OAuth/authorized connector.
12. Build preview -> Engineering Pass 1 -> Functional/browser Pass 2 -> Independent Guardian/Fault Line Pass 3 -> human-visible pack previews. Present Logo, Brand, Web/App and Social approvals (approve/request changes); accept versioned decision with client identity, timestamp and pack hash. Revisions create new version, invalidate stale approvals. Final release requires separate scoped operator release approval.
13. Authorized provider provisioning, real GA4 and Search Console property binding and permission checks, real integration smoke tests, proof URLs, monitoring, documentation, client portal timeline becomes operating/status dashboard. No "LIVE" status without independently fetched deployment result.

### C. Minimal Eden strategic onboarding: six conversational intents
Use voice or short text, one topic at a time. Pre-populate verified fields and ask for confirmation, not repetition.
Q1. "Tell me your business name and the best website or public profile for us to study." (if verified, ask "Is this your business?")
Q2. "What do you most want us to build and accomplish?" (goals, website/app/AI/CRM, key conversion)
Q3. "Who are your ideal customers, and which locations do you serve?" (locations and quantity only when relevant)
Q4. "What are your core services, offers or products? What must the system do?" (industry-specific dynamic follow-up)
Q5. "Do you already have a logo, colors, photos or brands/sites you like?" (uploads and permissions to use)
Q6. "Which social accounts and Google profiles do you want connected, and who approves our designs?" (OAuth handoff, approver, email/phone opt-in)
Adaptive follow-ups ONLY for missing legally/operationally essential items (domain ownership, legal entity, billing, content rights, contact routing, regulated industry, inventory/prices, etc.). Show summary for confirmation and allow later edits.
Eden never invents business claims and never promises live launch before release. All chatbot transcripts and microphone processing must obey disclosed retention, recording/consent, tenant isolation and deletion policies.

### D. Client portal and alerts
Routes (proposed, not live): /services, /pricing, /checkout, /redeem, /agreement, /login, /portal, /portal/onboarding, /portal/timeline, /portal/approvals, /portal/deliverables, /portal/messages.
Timeline checkpoints: Enrolled -> Agreement executed -> Workspace provisioned -> Eden onboarding -> Research facts confirmed -> Design in progress -> Logo approved -> Brand approved -> Website/App approved -> Social pack approved -> Final independent QA -> Release approved -> Launch verified -> Ongoing operations.
Client statuses are evidence-backed; some pack stages can be parallel and any non-purchased pack is NOT_REQUIRED. Do not let clients approve packs outside contracted scope.
Actionable approval card: pack type, version, image/full scroll preview, change summary, approve or request revision, due date (no unrequested deadline), comments, signer identity, timestamp; two modes: explicit single-pack approval or individually enumerated multi-pack approval in one session.
Notification engine: email mandatory account channel; SMS only opt-in/verified contact; send invitation, onboarding reminder, approval needed, revision ready, release verified. Batch non-critical notifications, respect preferences and quiet hours; no automated DMs or public posting without explicit separate authorization. All outbound messages are production-protected actions, test with sink mailbox/phone before activation.
Client portal auth: tenant-scoped user membership, RLS, invites, verified contact, roles client_owner/client_approver/client_viewer. Never use public email/phone lookup alone as authentication.
Owner sees minimal "next decision" and direct chat; engineering diagnostics hidden under advanced admin.

### E. Google Drive project factory — template folder contract
Verified intended parent: DIGITAL_DOMINANCE_PLATFORM (Drive folder ID 15KNWYWdKsZfZIrOGdy_T8JkRdbGSbIvD), identity and write rights checked before production binding. Do not generate a folder today for a fictional client.
Suggested child convention: CLIENTS/{opaque_client_id}-{sanitized_display_slug}/
  00_contracts_and_billing_private/
  01_onboarding_and_verified_business_facts/
  02_research_and_strategy/
  03_logo_pack/
  04_brand_pack/
  05_web_app_pack/
  06_social_media_pack/
  07_preview_and_qa/
  08_signed_approvals/
  09_deployment_receipts/
  10_client_handoff/
  11_operations_and_reports/
Copy **approved** folder template manifest/structure and Docs when permitted. Store immutable client_project_id <-> drive_folder_id link, service account identity, creation idempotency key, completed subfolder receipt and folder ACL proof. Payment webhook enqueues but does not directly block waiting for Drive API. Retry on transient error, prevent duplicates, show workspace_pending state until verified.

### F. Minimal backend schema
Customer(account_id,client_id,tenant_id,approved_contacts,roles)
Offer(offer_id,product_id,deposit_amount,balance_policy,currency,scope_version)
Promotion(entitlement_id,campaign_id,code_hash,entitlement_type,product_scope,max_uses,expires_at,redeemed_count)
Enrollment(enrollment_id,client_id,offer_id,payment_status,agreement_status,portal_status)
PaymentEvent(event_id,processor,checkout_id,settled_amount,currency,verified_at,correlation_id)
SignedAgreement(agreement_id,enrollment_id,version,document_hash,signed_document_ref,signer_identity,signer_timestamp)
ClientWorkspace(client_id,drive_folder_id,acl_status,manifest_version,idempotency_key)
OnboardingSession(client_id,completed_slots,questions,consent_scopes,fact_provenance,approved_profile)
Mission(mission_id,tenant_id,project_id,mission_spec_version,status,queue_ref,source_sha,resource_limits)
PackReview(review_id,client_id,pack_type,version,artifact_hash,status,decision_at,decision_by)
Notification(id,tenant_id,channel,event_type,consent_ref,dedup_key,delivery_status)
ProvisioningReceipt(mission_id,provider,resource_id,result,source_sha,verified_url,validation_ref)
Use existing tenant, queue, lease and audit tables via safe service adapters before new migrations. Separate schemas/DB logical ownership and current data. Do not use ordinary user metadata to grant admin access.

### G. Bidirectional GPT/Website chat command bridge
One scoped server API accepts both minimal operator command and complete client briefing. Endpoints only proposed:
  POST /api/v1/missions          -> validate identity, request, scope, idempotency; return mission_id and queue receipt
  GET  /api/v1/missions/{id}     -> current state with evidence and no leaked secrets
  GET  /api/v1/missions/{id}/events?cursor=... -> resumable updates
  POST /api/v1/client-enrollments -> idempotent enrollment service, no client-controlled payment status
  POST /api/v1/packs/{id}/decisions -> tenant-authorized immutable pack decisions
  POST /api/v1/approvals/{id}/decision -> role-restricted approvals and immutable receipts
  POST /api/v1/providers/{id}/authorize -> OAuth/provider-managed permission handoff
  POST /api/v1/webhooks/stripe -> raw-body verified signature, event dedup, enqueue outbox
Callbacks and queued events must use signed scoped identities, bounded retries, inbox/outbox receipts. This does NOT grant external ChatGPT automatic access to private chats/connectors: integration auth required. Use one existing authoritative X1 supervisor rather than another loop.

### H. Validation matrix + production gates
PASS 1: contract/package/payment-code logic + verified Stripe webhook signatures and replay protection; signed agreement hash, invite auth, Drive idempotency, schema/type/unit coverage, tenant RLS and secrets.
PASS 2: real browser marketing->checkout test mode->signature fixture->folder fixture->invite->Eden text fallback->consented business lookup->pack revisions->approval notices->preview + QA; responsive and accessibility; retry and resume.
PASS 3: Independent verification with source SHA, Stripe/test receipts, access-control negatives, email/phone/Drive ACL, avatar consent and costs, complete docs, original business facts, deployment + analytics smoke tests, rollback.
Required: ALL checks pass, zero release-blocking unknowns; implementation QA != absolute guarantee of bug-free code. Production charge, live client invites, e-sign sending, real SMS, provider writes, spend, social publishing, domain and production DB mutations all require explicit scoped approval. Business account docs and source truth remain in private project, no plaintext secrets anywhere.

### I. Verified source audit notes (2026-10-10)
- Connected Stripe account "Strategic Minds AI" was listed with livemode=true. No charge or checkout flow has been run or modified by this spec.
- Base44 existing create-checkout/entry.ts and payments-webhook/entry.ts are Wix platform plumbing with historical $19.99 Xtreme AI subscriptions; they do NOT implement this new Stripe deposit flow. Preserve/contain until migrated.
- Existing base44/entities/PromoCode.jsonc controls tool unlocks; it is NOT currently a scoped deposit waiver/offer ledger. Its read/update authorization must be audited before reusing for financial entitlements.
- Existing src/pages/CustomerPortal.jsx performs email/phone project lookup and uses legacy contractor data. Cannot be treated as secure paid SaaS account activation until tenant auth is independently validated.
- Existing src/pages/Portal.jsx may route authenticated users to Admin: clients MUST NOT be redirected to internal Admin.
- Existing base44/entities/ClientProject.jsonc uses garage/patio/commercial project fields; create proper industry-independent Customer/Mission data in governed adapter, avoiding destructive replacement.
- Existing base44/entities/ClientPortalConfig.jsonc is admin-only; build verified client-tenant access separately.
- Drive parent folder verified by authenticated metadata lookup, write permissions and downstream ACL not yet independently validated.
- Eden LiveAvatar feasibility from official HeyGen docs; current subscription permissions, custom avatar consent, session token binding and video streaming NOT verified.
- No production capabilities are claimed functional by this document.

### J. Scoped next implementation sequence
P0: reconcile actual main/feature branch, Stripe+Wix coexistence, Super Agent task queue owner, provider RLS and client data exposure. Preserve all customer data.
P1: separate client and admin authorization, reliable Stripe testmode checkout webhook + promo entitlement and signed contract state; durable enrollment outbox.
P2: Drive staging client folder factory, idempotent read-back, secure invite and portal timeline.
P3: Eden LiveAvatar staging integration + adaptable six-intent intake + permissioned business research.
P4: GPT bidirectional mission API, existing X1 queue and sandbox workflow. Approve/version four packs; notifications in sandbox.
P5: three-pass full lifecycle tests and staging proof for one synthetic generic client. Then gate production charge, emails, providers and publishing separately.
