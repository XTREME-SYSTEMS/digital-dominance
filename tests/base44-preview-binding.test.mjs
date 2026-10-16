import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidBase44AppId, shouldUseBase44Backend } from '../src/lib/base44Binding.js';
test('staging and local pages cannot silently bind to a null Base44 app',()=>{
 assert.equal(shouldUseBase44Backend(null,'digital-dominance-jngr18e75-strategic-minds-advisory.vercel.app'),false);
 assert.equal(shouldUseBase44Backend(null,'127.0.0.1'),false);
 assert.equal(shouldUseBase44Backend(null,'localhost'),false);
 assert.equal(shouldUseBase44Backend('null','digital-dominance-jngr18e75-strategic-minds-advisory.vercel.app'),false);
});
test('production remains on its existing integration path and explicit staging bindings are accepted',()=>{
 assert.equal(shouldUseBase44Backend(null,'digital-dominance.vercel.app'),true);
 assert.equal(shouldUseBase44Backend(null,'example.com'),true);
 assert.equal(shouldUseBase44Backend('6a77f4491f0bf92de9a3ed8b','digital-dominance-jngr18e75-strategic-minds-advisory.vercel.app'),true);
 assert.equal(isValidBase44AppId('unknown'),false);
});
