import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';
import { xtremeCall } from '../../shared/xtremeGateway.ts';

// ═══════════════════════════════════════════════════════════════════════════
// independentEmail — Drop-in replacement for Base44 Core.SendEmail.
//
// Routes through providers that don't use Base44 integration credits:
//   1. Xtreme Communications gateway (XTREME_COMMUNICATION_API_KEY)
//   2. Gmail connector (OAuth — already authorized)
//
// NEVER uses Base44 integration credits. The system stays operational even
// when Base44 integration credits are exhausted.
//
// Parameters (same as SendEmail for drop-in compatibility):
//   to, subject, body (plain text), html (HTML body), text (plain text alt),
//   attachments: [{ filename, file_url | content }]
// ═══════════════════════════════════════════════════════════════════════════

function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildMimeMessage(to, subject, text, html, attachments) {
  const boundary = '----=_part_' + Math.random().toString(36).slice(2);
  const altBoundary = '----=_alt_' + Math.random().toString(36).slice(2);
  const lines = [];

  lines.push(`To: ${to}`);
  lines.push(`Subject: =?utf-8?B?${base64UrlEncode(subject)}?=`);
  lines.push('MIME-Version: 1.0');
  lines.push(`Content-Type: multipart/${attachments?.length ? 'mixed' : 'alternative'}; boundary="${boundary}"`);
  lines.push('');

  if (attachments?.length) {
    // Text + HTML part
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
    lines.push('');
    if (text) {
      lines.push(`--${altBoundary}`);
      lines.push('Content-Type: text/plain; charset=utf-8');
      lines.push('Content-Transfer-Encoding: 7bit');
      lines.push('');
      lines.push(text);
      lines.push('');
    }
    if (html) {
      lines.push(`--${altBoundary}`);
      lines.push('Content-Type: text/html; charset=utf-8');
      lines.push('Content-Transfer-Encoding: 7bit');
      lines.push('');
      lines.push(html);
      lines.push('');
    }
    lines.push(`--${altBoundary}--`);
    lines.push('');

    // Attachments
    for (const att of attachments) {
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: application/octet-stream; name="${att.filename}"`);
      lines.push('Content-Transfer-Encoding: base64');
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push('');
      if (att.content) {
        lines.push(att.content);
      }
      lines.push('');
    }
    lines.push(`--${boundary}--`);
  } else {
    // No attachments — simple alternative
    if (text) {
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/plain; charset=utf-8');
      lines.push('Content-Transfer-Encoding: 7bit');
      lines.push('');
      lines.push(text);
      lines.push('');
    }
    if (html) {
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/html; charset=utf-8');
      lines.push('Content-Transfer-Encoding: 7bit');
      lines.push('');
      lines.push(html);
      lines.push('');
    }
    lines.push(`--${boundary}--`);
  }

  return lines.join('\r\n');
}

async function sendViaXtremeComms(to, subject, body) {
  const apiKey = secrets.get('XTREME_COMMUNICATION_API_KEY');
  if (!apiKey) return null;
  try {
    const result = await xtremeCall('gatewayEmail', { to, subject, body });
    return result;
  } catch (e) {
    console.warn('[independentEmail] Xtreme Comms failed:', e.message);
    return null;
  }
}

async function sendViaGmail(base44, to, subject, text, html, attachments) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    if (!accessToken) return null;

    const mimeMessage = buildMimeMessage(to, subject, text || body, html, attachments);
    const encoded = base64UrlEncode(mimeMessage);

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('[independentEmail] Gmail API error:', err);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn('[independentEmail] Gmail failed:', e.message);
    return null;
  }
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { to, subject, body: textBody, html, text, attachments } = body;

    if (!to || !subject) {
      return Response.json({ error: 'to and subject required' }, { status: 400 });
    }

    const plainText = text || textBody || '';
    const htmlBody = html || '';
    const errors = [];

    // 1. Try Xtreme Comms gateway (simplest — plain text email)
    const xtremeResult = await sendViaXtremeComms(to, subject, plainText || htmlBody);
    if (xtremeResult) {
      return Response.json({
        ok: true,
        provider: 'xtreme-comms',
        independent: true,
        result: xtremeResult,
      });
    }
    errors.push('xtreme-comms: failed or not configured');

    // 2. Fall back to Gmail connector (supports HTML + attachments)
    const gmailResult = await sendViaGmail(base44, to, subject, plainText, htmlBody, attachments);
    if (gmailResult) {
      return Response.json({
        ok: true,
        provider: 'gmail',
        independent: true,
        result: gmailResult,
      });
    }
    errors.push('gmail: failed or not connected');

    return Response.json({
      error: 'All independent email providers failed',
      errors,
      hint: 'Ensure XTREME_COMMUNICATION_API_KEY is set or Gmail connector is authorized',
    }, { status: 503 });
  } catch (error) {
    console.error('[independentEmail] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}