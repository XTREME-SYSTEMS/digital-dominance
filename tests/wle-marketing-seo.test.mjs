import test from 'node:test';
import assert from 'node:assert/strict';
import { WLE_MARKETING_ROUTES, isWleMarketingRoute, wleMarketingCanonical } from '../src/lib/wleMarketingSeo.js';

test('approved website launch pages cannot inherit donor Epoxy metadata',()=>{
  for(const path of ['/', '/launch-engine', '/templates']){
    assert.equal(isWleMarketingRoute(path),true);
    assert.match(WLE_MARKETING_ROUTES[path].title,/Website|Templates|Unlimited/);
    assert.doesNotMatch(JSON.stringify(WLE_MARKETING_ROUTES[path]),/epoxy|4.9|reviews|guaranteed/i);
  }
  assert.equal(isWleMarketingRoute('/epoxy-garage-floor-cost'),false);
});
test('canonical site is never inferred from unrelated Epoxy host or Vercel preview',()=>{
  assert.equal(wleMarketingCanonical('/','https://epoxyquotenearme.com'),null);
  assert.equal(wleMarketingCanonical('/templates','https://website-launch-engine.vercel.app'),null);
  assert.equal(wleMarketingCanonical('/',''),null);
  assert.equal(wleMarketingCanonical('/templates','https://unlimitedwebsites.net'), 'https://unlimitedwebsites.net/templates');
  assert.equal(wleMarketingCanonical('/templates','http://unlimitedwebsites.net'),null);
  assert.equal(wleMarketingCanonical('/templates','https://unlimitedwebsites.net/other'),null);
});
