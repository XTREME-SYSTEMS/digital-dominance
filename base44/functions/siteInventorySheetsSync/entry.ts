import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Site Inventory Google Sheets Sync — syncs site status changes from the
// SiteBank entity to the master Google Sheet. Every status change (queued →
// deploying → live → synced) updates the corresponding row automatically.
// Called by the Site Inventory Sheets Sync workflow on entity updates.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const sheetId = process.env.BACKLINK_SHEET_ID;

    if (!sheetId) {
      return Response.json({ error: "BACKLINK_SHEET_ID not configured" }, { status: 500 });
    }

    // Get the Google Sheets connector token
    const connection = await base44.asServiceRole.connectors.getConnection('googlesheets');
    const accessToken = connection?.accessToken;

    if (!accessToken) {
      return Response.json({ error: "Google Sheets connector not authorized" }, { status: 500 });
    }

    // The site data from the workflow trigger
    const site = body.site || body.data || body;
    const eventType = body.event_type || "update";

    // Prepare the row data
    const rowData = [
      site.id || "",
      site.site_slug || "",
      site.site_name || "",
      site.niche || "",
      site.target_city || "",
      site.target_state || "",
      site.domain || "",
      site.site_url || "",
      site.status || "",
      site.template_name || "",
      site.is_autonomous ? "Yes" : "No",
      site.launched_at ? new Date(site.launched_at).toISOString() : "",
      site.deployed_at ? new Date(site.deployed_at).toISOString() : "",
      new Date().toISOString(),
    ];

    // Try to find and update existing row, or append new row
    // First, get the sheet data to find existing rows
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Site%20Inventory!A:O`;
    
    let existingRow = -1;
    try {
      const sheetRes = await fetch(sheetUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (sheetRes.ok) {
        const sheetData = await sheetRes.json();
        const rows = sheetData.values || [];
        // Find row matching site ID (column A)
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === site.id) {
            existingRow = i + 1; // 1-indexed
            break;
          }
        }
      }
    } catch (e) {
      console.log("Sheet read error:", e.message);
    }

    if (existingRow > 0) {
      // Update existing row
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Site%20Inventory!A${existingRow}:O${existingRow}?valueInputOption=RAW`;
      const updateRes = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [rowData] }),
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.error("Sheet update failed:", errText);
        return Response.json({ error: "Failed to update sheet row" }, { status: 500 });
      }

      return Response.json({ ok: true, action: "updated", row: existingRow });
    } else {
      // Append new row
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Site%20Inventory!A:O:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
      const appendRes = await fetch(appendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: [rowData] }),
      });

      if (!appendRes.ok) {
        const errText = await appendRes.text();
        console.error("Sheet append failed:", errText);
        return Response.json({ error: "Failed to append sheet row" }, { status: 500 });
      }

      return Response.json({ ok: true, action: "appended" });
    }
  } catch (error) {
    console.error("siteInventorySheetsSync error", error?.message || error);
    return Response.json({ error: error?.message || "server error" }, { status: 500 });
  }
}