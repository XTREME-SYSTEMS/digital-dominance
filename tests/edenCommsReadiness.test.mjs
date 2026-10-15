import test from 'node:test';
import assert from 'node:assert/strict';
import { createEdenCommsReadiness } from '../base44/functions/edenCommsReadiness/reader.mjs';

const NUMBER = '+18665711174';
const request = (body={action:'status'},headers={}) => new Request('https://digital-dominance.test/api/functions/edenCommsReadiness', {
  method:'POST', headers:{'Content-Type':'application/json', ...headers}, body:JSON.stringify(body),
});
function setup(options={}) {
  const calls=[];
  const fetcher=async (url,init)=> {
    calls.push({url,init});
    return options.response || Response.json({
      provider:'twilio',account_verified:true,account_status:'active',ownership_verified:true,
      capabilities:{sms:true,mms:true,voice:true},
      voice_route:{configured:true,excluded:false,host:'private.example',full_url:'https://private.example/secret'}
    });
  };
  const app=createEdenCommsReadiness({
    authenticate:async()=>options.identity===undefined?{role:'admin'}:options.identity,
    getApiKey:()=>options.key===undefined?'test-server-secret':options.key,
    getEdenNumber:()=>options.number===undefined?NUMBER:options.number,
    fetcher,
  });
  return {app,calls};
}
const run = async(app,body,headers) => {
  const response=await app(request(body,headers));
  return {status:response.status,data:await response.json()};
};
test('anonymous fails closed',async()=> {let {app,calls}=setup({identity:null});let r=await run(app);assert.equal(r.status,401);assert.equal(calls.length,0)});
test('non-admin cannot inspect',async()=> {let {app,calls}=setup({identity:{role:'user'}});let r=await run(app);assert.equal(r.status,403);assert.equal(calls.length,0)});
test('GET cannot access service',async()=> {let {app,calls}=setup();let r=await app(new Request('https://digital-dominance.test/'));assert.equal(r.status,405);assert.equal(calls.length,0)});
test('malformed JSON rejected',async()=> {let {app}=setup();let r=await app(new Request('https://digital-dominance.test/',{method:'POST',body:'bad'}));assert.equal(r.status,400)});
test('unknown / send actions rejected without upstream',async()=> {let {app,calls}=setup();for (const action of ['send_sms','make_call','buy','generate_avatar','outbound_email']){let r=await run(app,{action});assert.equal(r.status,400)}assert.equal(calls.length,0)});
test('cross-site request blocked before secret or network usage',async()=> {let {app,calls}=setup();let r=await run(app,{}, {'sec-fetch-site':'cross-site'});assert.equal(r.status,403);assert.equal(calls.length,0)});
test('missing API key blocks without network',async()=> {let {app,calls}=setup({key:null});let r=await run(app);assert.equal(r.status,503);assert.equal(calls.length,0)});
test('status uses the single fixed host and bearer only, no secret in body or response',async()=> {let {app,calls}=setup();let r=await run(app);assert.equal(r.status,200);assert.equal(r.data.status,'verified_account');assert.equal(calls.length,1);assert.equal(calls[0].url,'https://xtreme-communications.com/api/functions/gptTwilio');assert.equal(calls[0].init.headers.Authorization,'Bearer test-server-secret');assert.deepEqual(JSON.parse(calls[0].init.body),{action:'status'});assert.ok(!JSON.stringify(r.data).includes('test-server-secret'))});
test('inspect_number rejects number drift',async()=> {let {app,calls}=setup();let r=await run(app,{action:'inspect_number',number:'+15551234567'});assert.equal(r.status,403);assert.equal(calls.length,0)});
test('inspect_number requires E164 allowed binding',async()=> {let {app,calls}=setup({number:'bogus'});let r=await run(app,{action:'inspect_number'});assert.equal(r.status,403);assert.equal(calls.length,0)});
test('number result excludes sensitive provider fields and preserves route flags',async()=> {let {app,calls}=setup();let r=await run(app,{action:'inspect_number'});assert.equal(r.status,200);assert.equal(r.data.phone_suffix,'1174');assert.equal(r.data.voice_route.configured,true);assert.equal(r.data.routing_changed,false);assert.ok(!JSON.stringify(r.data).includes('private.example'));assert.deepEqual(JSON.parse(calls[0].init.body),{action:'inspect_number',number:NUMBER})});
test('excluded route does not alter routing',async()=> {let {app}=setup({response:Response.json({provider:'twilio',ownership_verified:true,voice_route:{configured:true,excluded:true}})});let r=await run(app,{action:'inspect_number'});assert.equal(r.data.status,'blocked_excluded_route');assert.equal(r.data.routing_changed,false)});
test('non-Twilio response fails independently',async()=> {let {app}=setup({response:Response.json({provider:'unknown',account_verified:true})});let r=await run(app);assert.equal(r.status,502)});
test('unverified upstream account fails closed',async()=> {let {app}=setup({response:Response.json({provider:'twilio',account_verified:false})});let r=await run(app);assert.equal(r.status,502)});
test('upstream errors scrub response body',async()=> {let {app}=setup({response:Response.json({error:'token test-server-secret leaked'}, {status:403})});let r=await run(app);assert.equal(r.status,502);assert.ok(!JSON.stringify(r.data).includes('test-server-secret'))});
test('missing upstream credentials correctly reported',async()=> {let {app}=setup({response:Response.json({status:'credentials_required'}, {status:503})});let r=await run(app);assert.equal(r.status,503);assert.equal(r.data.status,'credentials_required')});
test('request with array payload denied',async()=> {let {app}=setup();let r=await run(app,[]);assert.equal(r.status,400)});
