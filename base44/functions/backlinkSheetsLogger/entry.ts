import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// backlinkSheetsLogger — Logs BacklinkOpportunity records to
// a master Google Sheet for tracking and outreach.
//
// Uses the googlesheets SHARED connector (platform OAuth).
// Requires a spreadsheet ID set as secret BACKLINK_SHEET_ID.
//
// Actions:
//   sync  — Append new (un-logged) BacklinkOpportunity records to the sheet
//   stats — Show sync statistics
// ============================================================

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'sync';
    const { secrets } = await import('base44:runtime');

    // Auth: API key OR admin session
    const authHeader = req.headers.get('authorization') || '';
    const bearerKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const syncKey = secrets.get('GPT_SYNC_API_KEY') || '';
    const isApiKey = syncKey && bearerKey === syncKey;

    let svc;
    if (isApiKey) {
      svc = base44.asServiceRole;
    } else {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Admin required' }, { status: 403 });
      svc = base44.asServiceRole;
    }

    const sheetId = body.spreadsheet_id || secrets.get('BACKLINK_SHEET_ID');
    if (!sheetId) {
      return Response.json({
        error: 'BACKLINK_SHEET_ID secret not set. Create a Google Sheet and set its ID in Secrets.',
        hint: 'The sheet ID is the long string in the sheet URL between /d/ and /edit',
      }, { status: 400 });
    }

    // Get Google Sheets OAuth token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    if (action === 'stats') {
      const allOpps = await svc.entities.BacklinkOpportunity.filter({}, { limit: 1000 });
      const items = Array.isArray(allOpps) ? allOpps : (allOpps.items || []);
      const logged = items.filter((o) => o.notes?.includes('[sheet-logged]')).length;
      return Response.json({
        ok: true,
        stats: {
          total_opportunities: items.length,
          logged_to_sheet: logged,
          pending_sync: items.length - logged,
        },
      });
    }

    // ── sync: Append new backlink opportunities to the sheet ──
    if (action === 'sync') {
      // Get all backlink opportunities not yet logged
      const allOpps = await svc.entities.BacklinkOpportunity.filter(
        { outreach_status: 'identified' },
        { limit: 200, sort: '-created_date' }
      );
      const items = Array.isArray(allOpps) ? allOpps : (allOpps.items || []);

      // Filter to ones not yet logged (check notes for marker)
      const toLog = items.filter((o) => !o.notes?.includes('[sheet-logged]'));

      if (toLog.length === 0) {
        return Response.json({ ok: true, message: 'No new opportunities to log', logged: 0 });
      }

      // Build rows for Google Sheets
      const headers = [
        'Date Logged', 'Opportunity ID', 'Target Domain', 'Source Domain', 'Source URL',
        'Type', 'Domain Authority', 'Page Authority', 'Relevance Score',
        'Anchor Text', 'Follow Status', 'Outreach Status', 'Notes',
      ];

      const rows = toLog.map((o) => [
        new Date().toISOString(),
        o.opportunity_id || o.id,
        o.target_domain || '',
        o.source_domain || '',
        o.source_url || '',
        o.opportunity_type || 'directory',
        o.domain_authority || 0,
        o.page_authority || 0,
        o.relevance_score || 0,
        o.anchor_text || '',
        o.follow_status || 'unknown',
        o.outreach_status || 'identified',
        (o.notes || '').replace('[sheet-logged]', '').trim(),
      ]);

      // Append to the sheet
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

      // First, check if headers exist; if not, add them
      const headerCheckUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:N1`;
      const headerRes = await fetch(headerCheckUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const headerData = await headerRes.json();

      const values = [];
      if (!headerData.values || headerData.values.length === 0) {
        values.push(headers);
      }
      values.push(...rows);

      const appendRes = await fetch(sheetUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      });

      if (!appendRes.ok) {
        const errText = await appendRes.text();
        console.error('[backlinkSheetsLogger] Sheet append error:', appendRes.status, errText);
        return Response.json({ error: `Google Sheets API error: ${appendRes.status}`, details: errText.slice(0, 500) }, { status: 502 });
      }

      const appendResult = await appendRes.json();

      // Mark opportunities as logged
      const updatePromises = toLog.map((o) =>
        svc.entities.BacklinkOpportunity.update(o.id, {
          notes: ((o.notes || '') + ' [sheet-logged]').trim(),
        }).catch(() => {})
      );
      await Promise.allSettled(updatePromises);

      return Response.json({
        ok: true,
        logged: toLog.length,
        sheet_range: appendResult.updates?.updatedRange || '',
        total_in_sheet: (headerData.values ? 0 : 1) + rows.length,
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[backlinkSheetsLogger] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}