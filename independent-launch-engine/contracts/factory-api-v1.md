# Factory API v1 - draft, NOT LIVE
Base44-independent contract; safe for branch development only.
POST /api/packs: signed-in tenant editor, content hash, idempotency key, immutable preview pack, approval pending.
POST /api/site-batches: tenant owner, template pack ID, unique genuine markets, quantity matches market count; create durable job, no production action.
GET /api/site-batches/:id: tenant-scoped jobs, statuses configured|building|preview_ready|validated|blocked|released; never infer released from a database boolean.
POST /api/site-batches/:id/approve: owner signs specific manifest SHA; release requires separate scoped production approval.
GET /api/site-batches/:id/receipts: independent re-fetch receipts, URL, HTTP status, checksum, validator, timestamp.
Data lineage: legacy WebsiteTemplate, LaunchCampaign, DynamicPage and location renderer must first be exported/reconciled with historical URL inventory. Never silently migrate production data.
Security: server-issued identity, org-scoped RLS, deny cross-tenant tests, no service keys in browsers, strict validation, safe retries, lease and idempotency.
SEO: no fake offices/reviews; each indexable local page must give distinct user value.
Existing Base44 APIs are donors only. Do not call them from this new frontend.
