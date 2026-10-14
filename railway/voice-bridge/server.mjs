import http from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';
import { createVoiceBridge } from './core.mjs';

const config={
  enabled:process.env.ENABLE_VOICE_STREAMS==='true',
  twilioAccountSid:process.env.TWILIO_ACCOUNT_SID,
  twilioNumber:process.env.TWILIO_NUMBER,
  twilioAuthToken:process.env.TWILIO_AUTH_TOKEN,
  openaiApiKey:process.env.OPENAI_API_KEY,
  publicBaseUrl:process.env.PUBLIC_BASE_URL,
  publicWsUrl:process.env.PUBLIC_WS_URL,
  model:process.env.OPENAI_REALTIME_MODEL||'gpt-realtime-2.1',
  voice:process.env.OPENAI_REALTIME_VOICE||'marin',
};

const upstream=({apiKey,model})=>new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,{
  headers:{Authorization:`Bearer ${apiKey}`},handshakeTimeout:10000,
  maxPayload:128000,
});
const sink=process.env.LEAD_SINK_URL && process.env.LEAD_SINK_TOKEN
  ? async (payload)=>{
    const parsed=new URL(process.env.LEAD_SINK_URL);
    if(parsed.protocol!=='https:') return {ok:false,error:'invalid_lead_sink'};
    const ac=new AbortController();const timeout=setTimeout(()=>ac.abort(),7000);
    try {
      const r=await fetch(parsed.toString(),{method:'POST',signal:ac.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.LEAD_SINK_TOKEN}`,'Idempotency-Key':`twilio:${payload.provider_call_id}`},body:JSON.stringify(payload)});
      // The receipt is deliberately minimal, and does not disclose PII.
      return r.ok?{ok:true,status:'accepted',backend_status:r.status}:{ok:false,error:'lead_sink_rejected',backend_status:r.status};
    } finally {clearTimeout(timeout);}
  } : null;

const bridge=createVoiceBridge({config,openaiFactory:upstream,sendLead:sink,log:obj=>console.log(JSON.stringify(obj))});
const srv=http.createServer(async(req,res)=>{
  if(req.url==='/health' && req.method==='GET') {res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,voice:'not_activated_without_signed_webhook',ready:bridge.ready()}));return;}
  if(req.url !== '/twilio/voice') {res.writeHead(404);res.end();return;}
  let raw='';for await (const chunk of req) {raw+=chunk;if(raw.length>8192){break;}}
  const result=await bridge.handleVoiceRequest({method:req.method,headers:req.headers,body:raw});
  res.writeHead(result.status,{'Content-Type':result.type,'Cache-Control':'no-store'});res.end(result.body);
});
const wss=new WebSocketServer({noServer:true,maxPayload:90000,perMessageDeflate:false});
srv.on('upgrade',(req,socket,head)=>{
  if(!bridge.validateUpgrade({url:req.url,signature:req.headers['x-twilio-signature']})) {socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>bridge.attachTwilioSocket(ws));
});
const port=Number(process.env.PORT||8080);
srv.listen(port,'0.0.0.0',()=>console.log(JSON.stringify({event:'voice_bridge_listening',port,configured:bridge.ready()})));
