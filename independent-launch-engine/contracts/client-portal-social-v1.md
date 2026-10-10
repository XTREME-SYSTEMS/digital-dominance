# Client Portal and Social Automation v1 - draft, NOT LIVE
Owner portal: Supabase Auth identity, tenants, memberships (owner|editor|viewer), site access, leads, brand settings, approvals, analytics, proof and audit log.
RLS: users read only their tenant memberships; sites/leads/approvals scoped by tenant; server-side service account cannot be exposed. Negative cross-tenant integration tests required.
Social content: create 30-day draft calendar from approved site/business facts. No unverified images, fabricated testimonials, or unsupported client claims.
Authorization policy: APPROVE_ONCE_THEN_AUTOMATE applies to an immutable campaign manifest only. Record approved channel IDs, content/media hashes, schedule window, signer, manifest hash, revocation state.
Posting workers may dispatch only content exactly matching an unrevoked approval, within channel/provider scopes; idempotency and provider receipts required. New revision requires reapproval.
Replies/comments/DMs remain DRAFT ONLY. Live social posting, provider authorization changes and customer messages are separately gated.
Jobs share the existing canonical queue/heartbeat; no duplicate cron.
Release proof: tenant-isolation validation, one real preview funnel + synthetic lead stored and read back, social mock posting test, browser desktop/mobile, independent validator.
