import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// ═══════════════════════════════════════════════════════════════
// Eden Skye — Executive AI Receptionist
// Twilio SMS + AI Voice (Sol-like) + HeyGen Avatar + Memory
// ═══════════════════════════════════════════════════════════════

const EDEN_NUMBER = '+18665711174';
const EDEN_PERSONA = `You are Eden Skye, the executive AI receptionist. Your voice is warm, confident, and naturally conversational — similar to OpenAI's Sol voice. You are the first impression every caller and texter gets.

Your personality:
- Warm but razor-sharp professional. Never robotic, never scripted.
- You speak in natural contractions, use empathy, and have a conversational rhythm.
- You are confident and capable — people trust you instantly.
- You anticipate needs and offer solutions before they're asked.
- You are memorable — people remember speaking with you.

Your role:
- Handle inbound SMS and voice calls on the +1 866 571 1174 line
- Qualify leads, answer questions, schedule follow-ups
- Escalate urgent matters with clear context
- Remember past interactions and reference them naturally
- Generate action items and conversation summaries

When responding:
- Keep SMS responses concise (under 160 chars when possible)
- For voice, speak in natural sentences with conversational rhythm
- Always end with a clear next step or question to keep the conversation moving
- Never sound like a bot — sound like the most capable receptionist they've ever met`;

async function twilioApi(path: string, method: string, body?: any) {
  const sid = secrets.get('TWILIO_ACCOUNT_SID');
  const token = secrets.get('TWILIO_AUTH_TOKEN');
  if (!sid || !token) return { ok: false, status: 503, data: { error: 'credentials_required' } };
  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}${path}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body ? new URLSearchParams(body).toString() : undefined,
    signal: AbortSignal.timeout(15000),
  });
  let data: any = {};
  try { data = await res.json(); } catch (_) {}
  return { ok: res.ok, status: res.status, data };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    let body: any = {};
    try { body = await req.json(); } catch (_) {}
    const action = body.action || 'status';

    // ── STATUS: check Twilio connection + Eden Skye config ──
    if (action === 'status') {
      const sid = secrets.get('TWILIO_ACCOUNT_SID');
      const token = secrets.get('TWILIO_AUTH_TOKEN');
      const heygenKey = secrets.get('HEYGEN_API_KEY');
      const twilioConfigured = !!(sid && token);
      const heygenConfigured = !!heygenKey;

      let twilioAccount = null;
      if (twilioConfigured) {
        const res = await twilioApi('.json', 'GET');
        if (res.ok) {
          twilioAccount = {
            sid: res.data.sid,
            friendly_name: res.data.friendly_name,
            status: res.data.status,
            type: res.data.type,
          };
        }
      }

      const [avatars, recentEvents, memories] = await Promise.all([
        base44.asServiceRole.entities.AvatarConfig.filter({ status: 'active' }, { limit: 5 }).catch(() => ({ items: [] })),
        base44.asServiceRole.entities.CommsEvent.filter({}, { sort: '-created_date', limit: 10 }).catch(() => ({ items: [] })),
        base44.asServiceRole.entities.ConversationMemory.filter({ status: 'new' }, { sort: '-created_date', limit: 5 }).catch(() => ({ items: [] })),
      ]);

      return Response.json({
        eden_number: EDEN_NUMBER,
        twilio_configured: twilioConfigured,
        heygen_configured: heygenConfigured,
        twilio_account: twilioAccount,
        active_avatars: (avatars as any).items?.length || 0,
        recent_events: (recentEvents as any).items?.length || 0,
        new_memories: (memories as any).items?.length || 0,
        voice_profile: 'honey (warm, soft — Sol-like)',
        status: twilioConfigured ? 'LIVE' : 'credentials_required',
      });
    }

    // ── SEND SMS via Twilio ──
    if (action === 'send_sms') {
      const { to, message } = body;
      if (!to || !message) return Response.json({ error: 'to and message required' }, { status: 400 });
      const res = await twilioApi('/Messages.json', 'POST', {
        From: EDEN_NUMBER,
        To: to,
        Body: message,
      });
      if (!res.ok) return Response.json({ status: 'failed', error: res.data?.message || 'unknown' }, { status: res.status });

      await base44.asServiceRole.entities.CommsEvent.create({
        channel: 'sms', direction: 'outbound',
        from_addr: EDEN_NUMBER, to_addr: to,
        status: res.data.status, provider: 'twilio',
        provider_message_id: res.data.sid,
        body: message, classification: 'LIVE',
        agent_name: 'Eden Skye',
      });

      return Response.json({
        message_sid: res.data.sid, status: res.data.status,
        from: res.data.from, to: res.data.to,
        classification: 'LIVE', provider: 'twilio',
      });
    }

    // ── AI CHAT: Eden Skye responds intelligently ──
    if (action === 'chat') {
      const { message, contact_name, contact_phone, history } = body;
      if (!message) return Response.json({ error: 'message required' }, { status: 400 });

      const historyText = Array.isArray(history) && history.length > 0
        ? history.map((h: any) => `${h.role === 'user' ? 'Caller' : 'Eden'}: ${h.content}`).join('\n')
        : '';

      const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `${EDEN_PERSONA}\n\n${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}${contact_name ? `Caller name: ${contact_name}\n` : ''}Caller message: "${message}"\n\nRespond as Eden Skye. Keep it natural, warm, and concise. If this is SMS, keep under 160 chars. If voice, keep it conversational.`,
        model: 'gpt_6_sol',
      });

      const edenReply = typeof llmRes === 'string' ? llmRes : (llmRes as any)?.response || (llmRes as any)?.text || JSON.stringify(llmRes);

      // Save conversation memory
      await base44.asServiceRole.entities.ConversationMemory.create({
        agent_name: 'Eden Skye',
        channel: body.channel || 'sms',
        contact_name: contact_name || 'Unknown',
        contact_phone: contact_phone || '',
        summary: `Caller: "${message}" → Eden: "${edenReply}"`,
        sentiment: 'neutral',
        outcome: 'completed',
        status: 'new',
      });

      return Response.json({
        reply: edenReply,
        agent: 'Eden Skye',
        voice_profile: 'honey',
      });
    }

    // ── GENERATE VOICE: TTS with Sol-like voice ──
    if (action === 'generate_voice') {
      const { text, voice } = body;
      if (!text) return Response.json({ error: 'text required' }, { status: 400 });
      const selectedVoice = voice || 'honey'; // honey = warm, soft — closest to Sol

      const speechRes = await base44.asServiceRole.integrations.Core.GenerateSpeech({
        text: text.slice(0, 5000),
        voice: selectedVoice,
        language_code: 'en',
      });

      const audioUrl = (speechRes as any)?.url || speechRes;

      await base44.asServiceRole.entities.CommsEvent.create({
        channel: 'voice', direction: 'outbound',
        from_addr: EDEN_NUMBER, to_addr: 'internal',
        status: 'completed', provider: 'internal',
        body: text.slice(0, 500), classification: 'LIVE',
        agent_name: 'Eden Skye',
      });

      return Response.json({
        audio_url: audioUrl,
        voice: selectedVoice,
        agent: 'Eden Skye',
        classification: 'LIVE',
      });
    }

    // ── GENERATE AVATAR VIDEO: HeyGen talking head ──
    if (action === 'generate_avatar') {
      const { text, avatar_id } = body;
      if (!text) return Response.json({ error: 'text required' }, { status: 400 });
      const heygenKey = secrets.get('HEYGEN_API_KEY');
      if (!heygenKey) return Response.json({ status: 'credentials_required', error: 'HEYGEN_API_KEY not configured' }, { status: 503 });

      // HeyGen v2 API — generate talking avatar video
      const heygenRes = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${heygenKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_inputs: [{
            character: {
              type: 'avatar',
              avatar_id: avatar_id || 'Ann_Therapist_public',
              avatar_style: 'default',
            },
            voice: {
              type: 'text',
              input_text: text.slice(0, 2000),
              voice_id: '1bd001e7e50f421d891986aad5156675', // warm female voice
            },
            background: {
              type: 'color',
              value: '#000000',
            },
          }],
          dimension: { width: 1280, height: 720 },
        }),
        signal: AbortSignal.timeout(30000),
      });

      let heygenData: any = {};
      try { heygenData = await heygenRes.json(); } catch (_) {}

      if (!heygenRes.ok) {
        return Response.json({
          status: 'failed',
          error: heygenData?.message || 'HeyGen API error',
          heygen_status: heygenRes.status,
        }, { status: heygenRes.status });
      }

      await base44.asServiceRole.entities.CommsEvent.create({
        channel: 'video', direction: 'outbound',
        from_addr: EDEN_NUMBER, to_addr: 'internal',
        status: 'queued', provider: 'heygen',
        provider_message_id: heygenData?.data?.video_id,
        body: text.slice(0, 500), classification: 'LIVE',
        agent_name: 'Eden Skye',
      });

      return Response.json({
        video_id: heygenData?.data?.video_id,
        status: 'generating',
        provider: 'heygen',
        classification: 'LIVE',
        check_url: heygenData?.data?.video_id,
      });
    }

    // ── CHECK AVATAR VIDEO STATUS ──
    if (action === 'check_avatar') {
      const { video_id } = body;
      if (!video_id) return Response.json({ error: 'video_id required' }, { status: 400 });
      const heygenKey = secrets.get('HEYGEN_API_KEY');
      if (!heygenKey) return Response.json({ status: 'credentials_required' }, { status: 503 });

      const heygenRes = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${video_id}`, {
        headers: { 'Authorization': `Bearer ${heygenKey}` },
        signal: AbortSignal.timeout(10000),
      });
      let heygenData: any = {};
      try { heygenData = await heygenRes.json(); } catch (_) {}

      return Response.json({
        video_id,
        status: heygenData?.data?.status || 'unknown',
        video_url: heygenData?.data?.video_url || null,
        thumbnail_url: heygenData?.data?.thumbnail_url || null,
        provider: 'heygen',
      });
    }

    // ── LIST EVENTS: recent comms activity ──
    if (action === 'list_events') {
      const events = await base44.asServiceRole.entities.CommsEvent.filter(
        { agent_name: 'Eden Skye' },
        { sort: '-created_date', limit: body.limit || 20 }
      );
      return Response.json({ events: (events as any).items || [], count: (events as any).items?.length || 0 });
    }

    // ── LIST MEMORIES: conversation memory log ──
    if (action === 'list_memories') {
      const memories = await base44.asServiceRole.entities.ConversationMemory.filter(
        { agent_name: 'Eden Skye' },
        { sort: '-created_date', limit: body.limit || 20 }
      );
      return Response.json({ memories: (memories as any).items || [], count: (memories as any).items?.length || 0 });
    }

    // ── UPDATE MEMORY: mark reviewed ──
    if (action === 'review_memory') {
      const { memory_id } = body;
      if (!memory_id) return Response.json({ error: 'memory_id required' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.ConversationMemory.update(memory_id, { status: 'reviewed' });
      return Response.json({ memory: updated, status: 'reviewed' });
    }

    // ── LIST INVENTORY: Twilio phone numbers ──
    if (action === 'list_inventory') {
      const res = await twilioApi('/IncomingPhoneNumbers.json?PageSize=50', 'GET');
      if (!res.ok) return Response.json({ status: 'failed', error: res.data?.message }, { status: res.status });
      const numbers = (res.data.incoming_phone_numbers || []).map((n: any) => ({
        sid: n.sid, e164: n.phone_number, friendly_name: n.friendly_name,
        capabilities: n.capabilities || {},
      }));
      return Response.json({ numbers, count: numbers.length, provider: 'twilio' });
    }

    return Response.json({ error: 'unknown action', action }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}