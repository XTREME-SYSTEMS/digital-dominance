import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { lead_id } = body;
    if (!lead_id) return Response.json({ error: "lead_id required" }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });
    if (!lead.email) return Response.json({ error: "Lead has no email" }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("hubspot");
    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    // 1. Create or find the contact by email
    let contactId = null;
    const contactRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify({
        properties: {
          email: lead.email,
          firstname: lead.first_name || "",
          lastname: lead.last_name || "",
          phone: lead.phone || "",
          address: lead.address || "",
          city: lead.city || "",
          state: lead.state || "",
          zip: lead.zip || "",
          lifecyclestage: "lead",
        },
      }),
    });
    const contact = await contactRes.json();
    if (contactRes.ok) {
      contactId = contact.id;
    } else {
      // Contact may already exist — search by email
      const search = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
        method: "POST",
        headers,
        body: JSON.stringify({
          filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: lead.email }] }],
          properties: ["email", "firstname", "lastname"],
          limit: 1,
        }),
      });
      const sData = await search.json();
      contactId = sData.results?.[0]?.id || null;
    }

    // 2. Create a deal linked to the contact
    const dealName = `Garage Floor — ${lead.first_name || ""} ${lead.last_name || ""}`.trim();
    const dealRes = await fetch("https://api.hubapi.com/crm/v3/objects/deals", {
      method: "POST",
      headers,
      body: JSON.stringify({
        properties: {
          dealname: dealName,
          amount: String(lead.estimate_mid || 0),
          dealstage: "appointmentscheduled",
          pipeline: "default",
        },
        associations: contactId
          ? [{ to: { id: contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }] }]
          : undefined,
      }),
    });
    const deal = await dealRes.json();

    // Persist CRM identity immediately so downstream revenue sync has a stable join.
    const crmIdentity: Record<string, string> = {};
    if (contactId) crmIdentity.hubspot_contact_id = String(contactId);
    if (dealRes.ok && deal?.id) crmIdentity.hubspot_deal_id = String(deal.id);
    if (Object.keys(crmIdentity).length) {
      await base44.asServiceRole.entities.Lead.update(lead.id, crmIdentity);
    }

    // 3. Create a note with before/after images and lead details
    if (contactId) {
      const beforePhoto = (lead.photos || [])[0] || "";
      const afterConcept = lead.concept_image || "";
      const noteBody = [
        `Garage Floor Estimate — ${lead.first_name || ""} ${lead.last_name || ""}`.trim(),
        ``,
        `Address: ${lead.address || ""}, ${lead.city || ""}, ${lead.state || ""} ${lead.zip || ""}`,
        `Garage Size: ${lead.square_footage || "Unknown"} sq ft`,
        `Floor Condition: ${(lead.floor_condition || []).join(", ") || "Not specified"}`,
        `Selected System: ${lead.desired_system || "flake"}`,
        lead.flake_color_name ? `Selected Color: ${lead.flake_color_name} (${lead.flake_color || ""})` : "",
        `Estimate Range: $${lead.estimate_low || 0} – $${lead.estimate_high || 0}`,
        ``,
        beforePhoto ? `BEFORE PHOTO: ${beforePhoto}` : "",
        afterConcept ? `AFTER CONCEPT: ${afterConcept}` : "",
      ].filter(Boolean).join("\n");

      try {
        await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
          method: "POST",
          headers,
          body: JSON.stringify({
            properties: {
              hs_note_body: noteBody,
              hs_timestamp: Date.now().toString(),
            },
            associations: [{ to: { id: contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 12 }] }],
          }),
        });
      } catch (noteErr) {
        console.error("Failed to create note:", noteErr.message);
      }
    }

    return Response.json({
      ok: true,
      contactId,
      dealId: deal.id || null,
      dealCreated: dealRes.ok,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}