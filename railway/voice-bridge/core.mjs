import { isCallSid, isStreamSid, escapeXml, newTicket, validTwilioSignature } from './security.mjs';

const MAX_INPUT_AUDIO_B64 = 22000;
const MAX_OUTPUT_AUDIO_B64 = 66000;
const MAX_CALL_MS = 15 * 60 * 1000;
const SESSION_TICKET_MS = 120000;
const DEFAULT_PROMPT = `You are Eden Skye, a warm, concise and capable AI voice receptionist for Digital Dominance. Identify yourself as an AI assistant immediately. You help callers seeking legitimate epoxy and commercial flooring services. Ask one question at a time: what service is needed, job ZIP code, scope, timeline, and preferred callback name and number. Repeat key details. Ask for explicit permission for a follow-up and separate permission before sharing their contact details with a suitable provider. Never guarantee pricing, an appointment, availability, or delivery without a confirmed transaction. For urgent situations or requests for a person, offer a callback; do not falsely claim a transfer. Do not claim that calls are recorded. If tools fail, explain that you cannot complete the request right now. Speak naturally, briefly, and without inventing facts.`;

export function makeSessionConfig({ voice = 'marin', model = 'gpt-realtime-2.1', instructions = DEFAULT_PROMPT } = {}) {
  return {
    type: 'session.update',
    session: {
      type: 'realtime', model, instructions,
      output_modalities: ['audio'],
      audio: {
        input: { format: { type: 'audio/pcmu' }, turn_detection: { type: 'server_vad', create_response: true, interrupt_response: true } },
        output: { format: { type: 'audio/pcmu' }, voice },
      },
      tools: [
        { type: 'function', name: 'capture_lead', description: 'Record a caller-consented flooring service inquiry once, after explicit permission. Never call until details and consent have been confirmed.', parameters: {
          type: 'object', additionalProperties: false,
          properties: { name: { type: 'string' }, phone: { type: 'string' }, service: { type: 'string' }, zip: { type: 'string' }, scope: { type: 'string' }, timeframe: { type: 'string' }, contact_permission: { type: 'boolean' }, sharing_permission: { type: 'boolean' } },
          required: ['service', 'contact_permission', 'sharing_permission']
        } },
        { type: 'function', name: 'request_human', description: 'Record that the caller requested human assistance. No live transfer is available until an authorized handoff number is configured.', parameters: { type:'object', additionalProperties:false, properties:{reason:{type:'string'}}, required:['reason'] } },
      ],
      tool_choice: 'auto',
    }
  };
}

const twiml = (xml) => ({ status: 200, body: `<?xml version="1.0" encoding="UTF-8"?><Response>${xml}</Response>`, type: 'text/xml; charset=utf-8' });
const unavailable = () => twiml('<Say>Our automated assistant is unavailable at the moment. Please try again later.</Say><Hangup/>');
const denied = (status) => ({status, body:'Rejected', type:'text/plain; charset=utf-8'});
const keyOf = (callSid) => String(callSid ?? '').slice(-7);

export function createVoiceBridge({
  config, openaiFactory, clock = () => Date.now(),
  log = () => {}, sendLead = null
}) {
  const tickets = new Map();
  const sessions = new Map();
  const ready = () => Boolean(config.enabled && config.twilioAuthToken && config.twilioAccountSid && config.twilioNumber && config.openaiApiKey && config.publicBaseUrl?.startsWith('https://') && config.publicWsUrl?.startsWith('wss://'));
  const clearExpired = () => { const now = clock(); for(const [key,t] of tickets) if(t.expires <= now) tickets.delete(key); };
  const voiceUrl = new URL('/twilio/voice', config.publicBaseUrl || 'https://invalid.example').toString();
  const mediaUrl = config.publicWsUrl || 'wss://invalid.example/media';

  async function handleVoiceRequest({method, headers, body}) {
    if (method !== 'POST') return denied(405);
    if (typeof body !== 'string' || body.length > 8192) return denied(413);
    const params = Object.fromEntries(new URLSearchParams(body));
    const signature = headers?.['x-twilio-signature'] || headers?.get?.('x-twilio-signature');
    if (!validTwilioSignature(config.twilioAuthToken, signature, voiceUrl, params)) return denied(403);
    if (params.AccountSid !== config.twilioAccountSid || params.To !== config.twilioNumber || !isCallSid(params.CallSid)) return denied(403);
    if (!ready()) return unavailable();
    clearExpired();
    // Idempotent Twilio HTTP retries: reuse the pending ticket for the same call.
    let ticket = [...tickets.values()].find(t => t.callSid === params.CallSid && t.expires > clock())?.id;
    if (!ticket) {
      ticket = newTicket();
      tickets.set(ticket, {id:ticket,callSid:params.CallSid, accountSid:params.AccountSid, phone:params.From || '', expires:clock()+SESSION_TICKET_MS});
    }
    log({event:'voice_webhook_accepted', call:keyOf(params.CallSid)});
    return twiml(`<Connect><Stream url="${escapeXml(mediaUrl)}"><Parameter name="ticket" value="${escapeXml(ticket)}" /></Stream></Connect><Say>Our automated assistant is unavailable at the moment. Please try again later.</Say><Hangup/>`);
  }

  function validateUpgrade({signature, url}) {
    if (!ready()) return false;
    const wss = mediaUrl;
    // Twilio deployments can sign using the WSS URL or its HTTPS equivalent.
    return (url === '/media') && (
      validTwilioSignature(config.twilioAuthToken, signature, wss, {}) ||
      validTwilioSignature(config.twilioAuthToken, signature, wss.replace(/^wss:/,'https:'), {})
    );
  }

  function closeSocket(ws) { try { if(ws.readyState === 1 || ws.readyState === 0) ws.close(); } catch {} }
  function wsSend(ws,msg) { if(ws?.readyState !== 1) return false; if((ws.bufferedAmount||0)>512000) return false; ws.send(JSON.stringify(msg));return true; }

  function attachTwilioSocket(twilioSocket) {
    let session = null;
    const fail = () => { if(session) cleanup(session); closeSocket(twilioSocket); };
    const timer = setTimeout(() => { if(!session) fail(); }, 5500);
    timer.unref?.();
    twilioSocket.on('message', (raw) => {
      if (raw?.length > 90000) return fail();
      let msg; try { msg = JSON.parse(String(raw)); } catch { return fail(); }
      if (!session) {
        if(msg.event === 'connected') return;
        if(msg.event !== 'start') return fail();
        const {accountSid, callSid, streamSid, customParameters} = msg.start || {};
        const ticket = tickets.get(customParameters?.ticket);
        if(!ticket || ticket.expires < clock() || ticket.callSid !== callSid || ticket.accountSid !== accountSid || accountSid !== config.twilioAccountSid || !isStreamSid(streamSid) || !isCallSid(callSid) || sessions.has(callSid)) return fail();
        clearTimeout(timer);
        tickets.delete(customParameters.ticket);
        session = {callSid, streamSid, twilioSocket, openaiSocket:null, started:clock(), audioPackets:0, audioOutputPackets:0, activeResponse:false, leadAttempted:false, cleaned:false};
        sessions.set(callSid, session);
        session.timeout = setTimeout(fail, Math.min(config.maxCallMs || MAX_CALL_MS, MAX_CALL_MS)); session.timeout.unref?.();
        try { session.openaiSocket = openaiFactory({ apiKey: config.openaiApiKey, model: config.model || 'gpt-realtime-2.1' }); } catch { return fail(); }
        const ai = session.openaiSocket;
        ai.on('open',()=>wsSend(ai,makeSessionConfig({voice:config.voice||'marin',model:config.model||'gpt-realtime-2.1'})));
        ai.on('message', (rawAi)=> handleAi(session,rawAi));
        ai.on('error',fail); ai.on('close',fail);
        log({event:'realtime_started',call:keyOf(callSid)});
        return;
      }
      if(msg.streamSid && msg.streamSid !== session.streamSid) return fail();
      if(msg.event === 'stop') { cleanup(session); return; }
      if(msg.event === 'media') {
        if(msg.media?.track !== 'inbound' || typeof msg.media?.payload !== 'string' || msg.media.payload.length>MAX_INPUT_AUDIO_B64) return fail();
        session.audioPackets++;
        wsSend(session.openaiSocket,{type:'input_audio_buffer.append',audio:msg.media.payload});
      }
      // mark and DTMF input are intentionally ignored (no permissions implied).
    });
    twilioSocket.on('close',()=>{clearTimeout(timer);if(session)cleanup(session);});
    twilioSocket.on('error',()=>{clearTimeout(timer);if(session)cleanup(session);});
  }

  async function toolCall(s,name,args,callId) {
    let result={ok:false,error:'unsupported_tool'};
    if(name === 'request_human') result={ok:true,status:'callback_requested',note:'Human handoff must be arranged separately; no transfer took place.'};
    if(name === 'capture_lead') {
      if(s.leadAttempted) result={ok:false,error:'duplicate_lead_call'};
      else {
        if(args?.contact_permission !== true || args?.sharing_permission !== true) result={ok:false,error:'consent_required'};
        else if(typeof args.service!=='string' || args.service.length<2 || args.service.length>120) result={ok:false,error:'invalid_service'};
        else if(!sendLead) result={ok:false,error:'lead_sink_not_configured'};
        else {
          s.leadAttempted=true;
          const payload={provider:'twilio',source:'inbound_voice',provider_call_id:s.callSid,lead_type:'consumer_service_inquiry',name:String(args.name||'').slice(0,120),phone:String(args.phone||'').slice(0,35),service:args.service,zip:String(args.zip||'').slice(0,12),scope:String(args.scope||'').slice(0,700),timeframe:String(args.timeframe||'').slice(0,120),contact_permission:true,sharing_permission:true,consent_recorded_at:new Date(clock()).toISOString()};
          try { result=await sendLead(payload); } catch { result={ok:false,error:'lead_sink_unavailable'}; }
        }
      }
    }
    const ai=s.openaiSocket;
    if(!s.cleaned && wsSend(ai,{type:'conversation.item.create',item:{type:'function_call_output',call_id:callId,output:JSON.stringify(result)}})) wsSend(ai,{type:'response.create'});
    log({event:'function_result',call:keyOf(s.callSid),tool:name,ok:result.ok===true});
  }

  function handleAi(s,raw) {
    if(s.cleaned || raw?.length > 90000) return;
    let msg;try{msg=JSON.parse(String(raw));}catch{return;}
    if(msg.type==='session.updated' && !s.greeted) {
      s.greeted=true;
      wsSend(s.openaiSocket,{type:'response.create',response:{instructions:'Greet the caller now, disclose you are an AI assistant, and ask what flooring service they need. Keep the greeting short.',output_modalities:['audio']}});
    }
    if(msg.type==='response.created') s.activeResponse=true;
    if(msg.type==='response.done') s.activeResponse=false;
    if(msg.type==='input_audio_buffer.speech_started') {
      wsSend(s.twilioSocket,{event:'clear',streamSid:s.streamSid});
      if(s.activeResponse) wsSend(s.openaiSocket,{type:'response.cancel'});
      s.activeResponse=false;
    }
    if(msg.type==='response.output_audio.delta' && typeof msg.delta==='string' && msg.delta.length<=MAX_OUTPUT_AUDIO_B64) {
      s.audioOutputPackets++;
      wsSend(s.twilioSocket,{event:'media',streamSid:s.streamSid,media:{payload:msg.delta}});
    }
    if(msg.type==='response.function_call_arguments.done' && typeof msg.call_id==='string' && msg.call_id.length<128) {
      let args;try{args=JSON.parse(msg.arguments||'{}');}catch{args={};}
      void toolCall(s,msg.name,args,msg.call_id);
    }
    if(msg.type==='error') log({event:'realtime_error',call:keyOf(s.callSid),status:'error'});
  }

  function cleanup(s){
    if(s.cleaned) return;
    s.cleaned=true;
    clearTimeout(s.timeout);
    sessions.delete(s.callSid);
    closeSocket(s.openaiSocket);
    closeSocket(s.twilioSocket);
    log({event:'realtime_ended',call:keyOf(s.callSid),duration_ms:clock()-s.started,in_packets:s.audioPackets,out_packets:s.audioOutputPackets});
  }
  return { handleVoiceRequest, validateUpgrade, attachTwilioSocket, ready, stats:()=>({pending:tickets.size,active:sessions.size}), makeSessionConfig };
}
