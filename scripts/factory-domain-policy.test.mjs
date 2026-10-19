import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FACTORY_ROOT, normalizeHostname, normalizeTenantSlug, createPreviewUrl,
  resolveFactoryHost, evaluateIndexEligibility, createDirectoryPath,
} from '../src/lib/factoryDomainPolicy.mjs';

const allowed = [{ hostname: 'epoxypros.unlimitedwebsites.net', siteId: 'tenant-01', status: 'approved' }];

test('factory root is owned domain', () => assert.equal(FACTORY_ROOT, 'unlimitedwebsites.net'));
test('normalize hostname and strip port safely', () => assert.equal(normalizeHostname('HTTPS://WWW.UnlimitedWebsites.net:443/foo'), 'www.unlimitedwebsites.net'));
test('reject malformed host', () => assert.equal(normalizeHostname('not-a-host..com'), null));
test('reject embedded credentials', () => assert.equal(normalizeHostname('user@unlimitedwebsites.net'), null));
test('reject foreign target impersonation', () => assert.equal(resolveFactoryHost('evil.unlimitedwebsites.net.attacker.com', allowed).allowed, false));
test('reject URL host with unknown two-level subdomain', () => assert.equal(resolveFactoryHost('a.b.unlimitedwebsites.net', allowed).allowed, false));
test('apex canonicalizes to configured marketing host', () => assert.equal(resolveFactoryHost('unlimitedwebsites.net').canonicalUrl, 'https://www.unlimitedwebsites.net/'));
test('www is approved marketing surface', () => assert.equal(resolveFactoryHost('www.unlimitedwebsites.net').kind, 'marketing'));
test('reserved app is not exposed as a tenant', () => assert.equal(resolveFactoryHost('app.unlimitedwebsites.net', allowed).kind, 'reserved'));
test('wildcard hostname does not auto-register site', () => assert.equal(resolveFactoryHost('unknown.unlimitedwebsites.net', allowed).allowed, false));
test('approved tenant is mapped to exact record only', () => assert.deepEqual(resolveFactoryHost('epoxypros.unlimitedwebsites.net', allowed), {kind:'tenant',allowed:true,hostname:'epoxypros.unlimitedwebsites.net',siteId:'tenant-01',indexable:false}));
test('inactive record cannot be served', () => assert.equal(resolveFactoryHost('epoxypros.unlimitedwebsites.net', [{...allowed[0],status:'queued'}]).allowed, false));
test('tenant previews default non-indexable', () => assert.equal(resolveFactoryHost('epoxypros.unlimitedwebsites.net',allowed).indexable, false));
test('slug normalization rejects reserved and invalid names', () => {assert.equal(normalizeTenantSlug('ADMIN'), null);assert.equal(normalizeTenantSlug('example-1'), 'example-1');assert.equal(normalizeTenantSlug('-example'), null)});
test('preview URL uses factory domain', () => assert.equal(createPreviewUrl('epoxypros'), 'https://epoxypros.unlimitedwebsites.net/'));
test('unknown index proof fails closed', () => assert.equal(evaluateIndexEligibility().eligible, false));
test('all verified index proof is eligible', () => assert.equal(evaluateIndexEligibility({realBusinessVerified:true,originalContentVerified:true,serviceAreaVerified:true,deploymentVerified:true,independentQaPassed:true,ownerApproved:true}).eligible,true));
test('NearMe directory requires ownership verification', () => assert.equal(createDirectoryPath({service:'epoxy flooring',state:'FL',city:'Pompano Beach'}), null));
test('authorized directory uses paths', () => assert.equal(createDirectoryPath({service:'epoxy flooring',state:'FL',city:'Pompano Beach',ownershipVerified:true}), '/epoxy-flooring/fl/pompano-beach'));
