import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { MIGRATION_CHUNKS, SUPABASE_PROJECT_REF } from '../../shared/supabaseMigrationSql.ts';

// ════════════════════════════════════════════════════════════════
// supabaseMigrationDeploy
// Deploys hardened control-plane migrations to the canonical Supabase
// project. Uses the Supabase connector OAuth token for the Management API,
// falling back to the SMAI service role key for the database REST API.
//
// Actions:
//   deploy  — Execute all migration chunks sequentially
//   verify  — Check that key tables and functions exist
//   seed    — Insert the default organization and a bootstrap system
// ════════════════════════════════════════════════════════════════

// Extract project ref from the SMAI Supabase URL (https://{ref}.supabase.co)
function getProjectRef(): string {
  const url = secrets.get('SMAI_SUPABASE_URL') || '';
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.(co|net|in)/);
  return match?.[1] || SUPABASE_PROJECT_REF;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'deploy';

    const projectRef = getProjectRef();
    const smaiUrl = secrets.get('SMAI_SUPABASE_URL') || '';
    const smaiKey = secrets.get('SMAI_SUPABASE_SERVICE_ROLE_KEY') || '';

    // ── Get Supabase OAuth access token (for Management API) ──
    let mgmtToken: string | null = null;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('supabase');
      mgmtToken = conn.accessToken;
    } catch { /* connector might not be connected */ }

    const supabaseApiBase = `https://api.supabase.com/v1/projects/${projectRef}`;

    // Execute SQL via Management API (preferred) or database REST API (fallback)
    async function executeSql(sql: string): Promise<{ ok: boolean; data: any; method: string }> {
      // Method 1: Supabase Management API (requires OAuth token)
      if (mgmtToken) {
        try {
          const res = await fetch(`${supabaseApiBase}/database/query`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mgmtToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sql }),
          });
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            return { ok: true, data, method: 'management_api' };
          }
          // If Forbidden, fall through to Method 2
          const errText = await res.text();
          if (!errText.includes('Forbidden') && !errText.includes('forbidden')) {
            return { ok: false, data: errText, method: 'management_api' };
          }
        } catch (e: any) {
          // Fall through to Method 2
        }
      }

      // Method 2: Supabase database REST API via pg_meta (requires service role key)
      if (smaiUrl && smaiKey) {
        try {
          const res = await fetch(`${smaiUrl}/pg/meta/${projectRef}/query`, {
            method: 'POST',
            headers: {
              'apikey': smaiKey,
              'Authorization': `Bearer ${smaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: sql }),
          });
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            return { ok: true, data, method: 'pg_meta' };
          }
          const errText = await res.text();
          return { ok: false, data: errText, method: 'pg_meta' };
        } catch (e: any) {
          return { ok: false, data: e.message, method: 'pg_meta' };
        }
      }

      return { ok: false, data: 'No Supabase access method available (need connector or service role key)', method: 'none' };
    }

    // ── DEPLOY: Execute all migration chunks ──
    if (action === 'deploy') {
      const results: any[] = [];
      let allOk = true;

      for (const chunk of MIGRATION_CHUNKS) {
        try {
          const execRes = await executeSql(chunk.sql);

          if (!execRes.ok) {
            const errText = typeof execRes.data === 'string' ? execRes.data : JSON.stringify(execRes.data);
            // Some errors are expected (e.g., "relation already exists" on rerun)
            const isExpected = errText.includes('already exists') || errText.includes('duplicate');
            results.push({
              chunk: chunk.name,
              status: isExpected ? 'already_exists' : 'failed',
              error: errText.slice(0, 500),
              method: execRes.method,
            });
            if (!isExpected) allOk = false;
          } else {
            results.push({ chunk: chunk.name, status: 'applied', method: execRes.method });
          }
        } catch (e: any) {
          results.push({ chunk: chunk.name, status: 'error', error: e.message });
          allOk = false;
        }
      }

      return Response.json({
        ok: allOk,
        project_ref: projectRef,
        project_name: 'Xtreme OS',
        chunks_total: MIGRATION_CHUNKS.length,
        chunks_applied: results.filter(r => r.status === 'applied').length,
        chunks_already_exists: results.filter(r => r.status === 'already_exists').length,
        chunks_failed: results.filter(r => r.status === 'failed' || r.status === 'error').length,
        results,
      });
    }

    // ── VERIFY: Check that key tables and functions exist ──
    if (action === 'verify') {
      const verifySql = `SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='systems') as systems_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='control_leases') as control_leases_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='jobs') as jobs_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='evidence_receipts') as evidence_receipts_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='validation_runs') as validation_runs_table,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema='public' AND routine_name='acquire_control_lease') as acquire_lease_fn,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema='public' AND routine_name='queue_send') as queue_send_fn,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='organizations') as orgs_table,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='organization_members') as org_members_table;`;

      const execRes = await executeSql(verifySql);
      return Response.json({
        ok: execRes.ok,
        project_ref: projectRef,
        method: execRes.method,
        verification: execRes.data,
      });
    }

    // ── SEED: Insert default organization and bootstrap system ──
    if (action === 'seed') {
      const seedSql = `INSERT INTO public.organizations (org_id, name, slug, status)
VALUES ('xtreme-team', 'XTREME Team', 'xtreme-team', 'active')
ON CONFLICT (org_id) DO NOTHING;

INSERT INTO public.systems (system_id, organization_id, name, system_type, current_mode, lifecycle, active)
VALUES ('epoxyquotenearme', 'xtreme-team', 'Epoxy Quote Near Me', 'website', 'bootstrap', 'bootstrap', true)
ON CONFLICT (system_id) DO NOTHING;

INSERT INTO public.systems (system_id, organization_id, name, system_type, current_mode, lifecycle, active)
VALUES ('thextremeteam-console', 'xtreme-team', 'XTREME Team Console', 'control_plane', 'bootstrap', 'bootstrap', true)
ON CONFLICT (system_id) DO NOTHING;

SELECT 'seeded' as status;`;

      const execRes = await executeSql(seedSql);
      return Response.json({
        ok: execRes.ok,
        project_ref: projectRef,
        method: execRes.method,
        seed_result: execRes.data,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}