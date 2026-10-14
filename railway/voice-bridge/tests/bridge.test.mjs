import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createVoiceBridge, makeSessionConfig } from '../core.mjs';
import { expectedSignature, escapeXml, validTwilioSignature } from '../security.mjs';

const cfg = {
  enabled: true,
  twilioAccountSid:'AC' + 'a'.repeat(32),
  twilioNumber:'+18665711174',
  twilioAuthToken:'synthetic-auth-token',
  openaiApiKey:'synthetic-openai-key',
  publicBaseUrl:'https://voice.example.org',
  publicWsUrl:'wss://voice.example.org/media',
};
const callId='CA'+'b'.repeat(32),streamId='MZ'+'c'.repeat(32);
const form={AccountSid:cfg.twilioAccountSid,To:cfg.twilioNumber,From:'+18005550000',CallSid:callId};
const payload=(v=form)=>new URLSearchParams(v).toString();
const signature=(v=form)=>expectedSignature(cfg.twilioAuthToken,'https://voice.example.org/twilio/voice',v);
const req=(v=form,sig=signature(v))=>({method:'POST',headers:{'x-twilio-signature':sig},body:payload(v)});
const ticketFrom=(xml)=>(xml.match(/name="ticket" value="([^"]+)"/)||[])[1];
class Socket extends EventEmitter {
  constructor(){super();this.readyState=1;this.bufferedAmount=0;this.sent=[];this.closes=0;}
  send(value){this.sent.push(JSON.parse(value));}
  close(){if(this.readyState!==3){this.readyState=3;this.closes++;this.emit('close');}}
  frame(obj){this.emit('message',JSON.stringify(obj));}
}
function setup(overrides={}) {
  const aiSockets=[];let created=0;
  const bridge=createVoiceBridge({config:{...cfg,...overrides.config},openaiFactory:()=>{created++; const a=new Socket();aiSockets.push(a);return a;},clock:overrides.clock||(()=>Date.now()),sendLead:overrides.sendLead||null});
  return {bridge,aiSockets,get created(){return created;}};
}
async function started(x) {
  const r=await x.bridge.handleVoiceRequest(req());assert.equal(r.status,200);const ticket=ticketFrom(r.body);assert.ok(ticket);
  const tw=new Socket();x.bridge.attachTwilioSocket(tw);
  tw.frame({event:'connected'});
  tw.frame({event:'start',start:{accountSid:cfg.twilioAccountSid,callSid:callId,streamSid:streamId,customParameters:{ticket}}});
  const ai=x.aiSockets[0];assert.ok(ai);
  ai.emit('open');return {tw,ai,ticket};
}
test('signature validation is constant-time matching and XML escapes',()=>{
  assert.equal(validTwilioSignature(cfg.twilioAuthToken,signature(),'https://voice.example.org/twilio/voice',form),true);
  assert.equal(validTwilioSignature(cfg.twilioAuthToken,signature(), 'https://evil.example/twilio/voice',form),false);
  assert.equal(validTwilioSignature(cfg.twilioAuthToken, '', 'https://voice.example.org/twilio/voice',form),false);
  assert.equal(escapeXml(`"<'&>`),'&quot;&lt;&apos;&amp;&gt;');
});
test('defaults disabled even when webhook is signed',async()=>{
  const x=setup({config:{enabled:false}});const r=await x.bridge.handleVoiceRequest(req());assert.equal(r.status,200);assert.ok(!r.body.includes('<Stream'));assert.equal(x.bridge.ready(),false);
});
test('rejects forged unsigned webhook',async()=>assert.equal((await setup().bridge.handleVoiceRequest(req(form,''))).status,403));
test('rejects webhook parameter tampering',async()=>assert.equal((await setup().bridge.handleVoiceRequest({ ...req(),body:payload({...form,To:'+18005559999'})})).status,403));
test('rejects wrong account even with signed message',async()=>{const f={...form,AccountSid:'AC'+'d'.repeat(32)};assert.equal((await setup().bridge.handleVoiceRequest(req(f))).status,403);});
test('rejects wrong target even with signed message',async()=>{const f={...form,To:'+16667778888'};assert.equal((await setup().bridge.handleVoiceRequest(req(f))).status,403);});
test('rejects malformed CallSid',async()=>{const f={...form,CallSid:'invalid'};assert.equal((await setup().bridge.handleVoiceRequest(req(f))).status,403);});
test('webhook generates ticket and retries reuse it',async()=>{const b=setup().bridge;const a=await b.handleVoiceRequest(req());const c=await b.handleVoiceRequest(req());assert.equal(a.body,c.body);assert.ok(a.body.includes('Connect><Stream url="wss://voice.example.org/media"'));assert.equal(b.stats().pending,1);});
test('signed upgrade checked against canonical media URL',()=>{const b=setup().bridge;assert.equal(b.validateUpgrade({url:'/media',signature:expectedSignature(cfg.twilioAuthToken,cfg.publicWsUrl)}),true);assert.equal(b.validateUpgrade({url:'/media',signature:'invalid'}),false);assert.equal(b.validateUpgrade({url:'/other',signature:expectedSignature(cfg.twilioAuthToken,cfg.publicWsUrl)}),false);});
test('random ticket is required, and no unauthenticated AI session created',async()=>{const x=setup();const tw=new Socket();x.bridge.attachTwilioSocket(tw);tw.frame({event:'start',start:{accountSid:cfg.twilioAccountSid,callSid:callId,streamSid:streamId,customParameters:{ticket:'forged'}}});assert.equal(tw.readyState,3);assert.equal(x.created,0);});
test('valid stream starts exactly one realtime session with safe audio config',async()=>{const x=setup();const {tw,ai}=await started(x);assert.equal(x.created,1);assert.equal(x.bridge.stats().active,1);assert.equal(ai.sent[0].session.audio.input.format.type,'audio/pcmu');assert.equal(ai.sent[0].session.audio.output.voice,'marin');assert.equal(ai.sent[0].session.model,'gpt-realtime-2.1');assert.equal(ai.sent[0].session.output_modalities[0],'audio');tw.close();});
test('initial realtime readiness asks AI to greet caller',async()=>{const x=setup();const {tw,ai}=await started(x);ai.frame({type:'session.updated'});assert.ok(ai.sent.some(m=>m.type==='response.create'));tw.close();});
test('one-time token cannot create a second stream',async()=>{const x=setup();const {tw,ticket}=await started(x);const other=new Socket();x.bridge.attachTwilioSocket(other);other.frame({event:'start',start:{accountSid:cfg.twilioAccountSid,callSid:callId,streamSid:'MZ'+'d'.repeat(32),customParameters:{ticket}}});assert.equal(other.readyState,3);assert.equal(x.created,1);tw.close();});
test('G711 payload forwarded into OpenAI buffer',async()=>{const x=setup();const {tw,ai}=await started(x);tw.frame({event:'media',streamSid:streamId,media:{track:'inbound',payload:'YWFhYQ=='}});assert.ok(ai.sent.some(y=>y.type==='input_audio_buffer.append'&&y.audio==='YWFhYQ=='));tw.close();});
test('OpenAI audio goes back to Twilio with matching stream ID',async()=>{const x=setup();const {tw,ai}=await started(x);ai.frame({type:'response.output_audio.delta',delta:'YmJi'});assert.ok(tw.sent.some(y=>y.event==='media'&&y.streamSid===streamId&&y.media.payload==='YmJi'));tw.close();});
test('barge-in clears playback and cancels active response',async()=>{const x=setup();const {tw,ai}=await started(x);ai.frame({type:'response.created'});ai.frame({type:'input_audio_buffer.speech_started'});assert.ok(tw.sent.some(y=>y.event==='clear'));assert.ok(ai.sent.some(y=>y.type==='response.cancel'));tw.close();});
test('rejects unexpected stream id to prevent cross-call injection',async()=>{const x=setup();const {tw,ai}=await started(x);tw.frame({event:'media',streamSid:'MZ'+'f'.repeat(32),media:{track:'inbound',payload:'YQ=='}});assert.equal(tw.readyState,3);assert.equal(ai.readyState,3);assert.equal(x.bridge.stats().active,0);});
test('model lead tool without explicit consent cannot dispatch',async()=>{let count=0;const x=setup({sendLead:async()=>{count++;return {ok:true}}});const {tw,ai}=await started(x);ai.frame({type:'response.function_call_arguments.done',name:'capture_lead',call_id:'func1',arguments:JSON.stringify({service:'epoxy',contact_permission:true,sharing_permission:false})});await new Promise(r=>setImmediate(r));assert.equal(count,0);assert.ok(ai.sent.some(y=>y.type==='conversation.item.create'&&y.item.output.includes('consent_required')));tw.close();});
test('lead tool without sink reports unavailable and never claims delivered',async()=>{const x=setup();const {tw,ai}=await started(x);ai.frame({type:'response.function_call_arguments.done',name:'capture_lead',call_id:'func1',arguments:JSON.stringify({service:'epoxy',contact_permission:true,sharing_permission:true})});await new Promise(r=>setImmediate(r));assert.ok(ai.sent.some(y=>y.type==='conversation.item.create'&&y.item.output.includes('lead_sink_not_configured')));tw.close();});
test('authorized consented lead dispatched at most once per CallSid',async()=>{const received=[];const x=setup({sendLead:async p=>{received.push(p);return {ok:true,status:'accepted'}}});const {tw,ai}=await started(x);const args={service:'epoxy flooring',zip:'33060',name:'Test Person',contact_permission:true,sharing_permission:true};ai.frame({type:'response.function_call_arguments.done',name:'capture_lead',call_id:'f1',arguments:JSON.stringify(args)});await new Promise(r=>setImmediate(r));ai.frame({type:'response.function_call_arguments.done',name:'capture_lead',call_id:'f2',arguments:JSON.stringify(args)});await new Promise(r=>setImmediate(r));assert.equal(received.length,1);assert.equal(received[0].provider_call_id,callId);assert.equal(received[0].contact_permission,true);assert.ok(ai.sent.some(y=>y.item?.call_id==='f2'&&y.item.output.includes('duplicate_lead_call')));tw.close();});
test('unexpected function name receives refusal and cannot trigger delivery',async()=>{let count=0;const x=setup({sendLead:async()=>{count++;return {ok:true}}});const {tw,ai}=await started(x);ai.frame({type:'response.function_call_arguments.done',name:'send_sms',call_id:'fx',arguments:'{}'});await new Promise(r=>setImmediate(r));assert.equal(count,0);assert.ok(ai.sent.some(y=>y.item?.call_id==='fx'&&y.item.output.includes('unsupported_tool')));tw.close();});
test('Twilio stop closes both channels and clears session',async()=>{const x=setup();const {tw,ai}=await started(x);tw.frame({event:'stop',streamSid:streamId});assert.equal(x.bridge.stats().active,0);assert.equal(ai.readyState,3);assert.equal(tw.readyState,3);});
test('default session model never claims the ChatGPT Sol API voice',()=>{const s=makeSessionConfig();assert.equal(s.session.audio.output.voice,'marin');assert.ok(!s.session.instructions.includes('I am Sol'));});
