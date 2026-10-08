import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';

// ─────────────────────────────────────────────────────────────────────────────
// systemAuditInventory — Returns live status of all system secrets and
// connector availability. The static inventory (functions, entities, agents,
// workflows, pages) lives in the frontend data file; this function provides
// the dynamic parts that can only be checked server-side.
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_SECRETS = [
  'VERCEL_AI_GATEWAY_API_KEY', 'GROQ_API_KEY', 'GOOGLE_AI_API_KEY', 'OPENROUTER_API_KEY',
  'XTREME_COMMUNICATION_API_KEY', 'TELNYX_API_KEY',
  'SMAI_SUPABASE_URL', 'SMAI_SUPABASE_ANON_KEY', 'SMAI_SUPABASE_SERVICE_ROLE_KEY',
  'CLOUD_BROWSER_ENGINE_URL', 'BROWSERBASE_API_KEY',
  'VERCEL_API_TOKEN', 'VERCEL_TEAM',
  'GITHUB_TOKEN', 'GITHUB_REPO', 'GITHUB_ORG', 'GITHUB_CLIENT_ID', 'GITHUB_APP_ID',
  'GODADDY_API_KEY', 'BLS_API_KEY', 'RENTCAST_API_KEY', 'ENGINE_API_KEY', 'SEOGENERATOR_API_KEY',
  'GOOGLE_CREDENTIALS_JSON', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
  'RAILWAY_PROJECT_ID', 'SUPABASE_URL', 'VISION_CORTEX_EMAIL',
  'NEARME_DRIVE_FOLDER_ID', 'PACK_SYNC_TOKEN',
  'SMAI_SUPABASE_STAGING_URL', 'SMAI_SUPABASE_STAGING_ANON_KEY',
  'WIX_CHECKOUT_APP_URL', 'WIX_CHECKOUT_SITE_ID', 'WIX_CHECKOUT_API_KEY',
  'WIX_CHECKOUT_WEBHOOK_URL', 'WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY',
  'WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY', 'WIX_PAYMENTS_SITE_ID', 'WIX_PAYMENTS_API_KEY',
];

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const secretStatus = KNOWN_SECRETS.map(name => ({
    name,
    set: !!secrets.get(name),
  }));

  return Response.json({
    ok: true,
    secrets: {
      all: secretStatus,
      total: secretStatus.length,
      configured: secretStatus.filter(s => s.set).length,
      missing: secretStatus.filter(s => !s.set).map(s => s.name),
    },
  });
}