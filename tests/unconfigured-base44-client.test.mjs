import test from 'node:test';
import assert from 'node:assert/strict';
import { createUnconfiguredBase44Client } from '../src/lib/unconfiguredBase44Client.js';

test('unconfigured preview SDK never initializes an API transport',async()=>{
  const client=createUnconfiguredBase44Client();
  for(const apiCall of [
    ()=>client.entities.TemplateLibrary.filter({}),
    ()=>client.entities.Lead.create({name:'synthetic'}),
    ()=>client.functions.invoke('generatePage',{}),
    ()=>client.auth.me(),
    ()=>client.integrations.Core.InvokeLLM({prompt:'test'}),
    ()=>client.analytics.track('test'),
  ]){
    await assert.rejects(apiCall(), { code:'BACKEND_NOT_CONFIGURED' });
  }
});
test('unconfigured backend identity cannot be mutated',()=>{
  const client=createUnconfiguredBase44Client();
  assert.throws(()=>{client.entities=null},TypeError);
});
