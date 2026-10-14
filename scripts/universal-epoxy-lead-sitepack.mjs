// Branch-safe, pure-data epoxy lead-gen SitePack compiler.
// Does not invoke hosting, CRM, emails, domains, billing, or queues.
import { createHash } from 'node:crypto';

export const PACK_VERSION = '1.0.0';
export const EP0XY_MARKETS = Object.freeze([
  'Fort Lauderdale', 'Pompano Beach', 'Boca Raton',
  'Deerfield Beach', 'Hollywood', 'Davie', 'Plantation',
  'Coral Springs', 'Delray Beach', 'West Palm Beach',
]);
export const REQUIRED_MODULES = Object.freeze(['estimate', 'crm', 'seo', 'analytics']);
const RELEASE_GATES = Object.freeze({
  mode: 'preview', approval_required: true, noindex_until_validated: true,
  production_publish: false, customer_outbound: false,
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function nonempty(value) { return typeof value === 'string' && value.trim().length > 0; }
function plainText(value) {
  assert(nonempty(value), 'Expected nonempty text');
  return value.trim();
}
function deepFreeze(object) {
  Object.freeze(object);
  for (const value of Object.values(object))
    if (value && typeof value === 'object' && !Object.isFrozen(value)) deepFreeze(value);
  return object;
}

// Unverified market names are candidates, never service-area claims.
export function createEpoxyLeadDraft({ sourceSha, templateId, brandName, legalBusinessName, contactPhone, referenceUrl } = {}) {
  assert(typeof sourceSha === 'string' && /^[a-f0-9]{40}$/i.test(sourceSha), 'Exact 40-char source SHA required');
  const source = {
    repository: 'XTREME-SYSTEMS/digital-dominance',
    commit_sha: sourceSha,
    template_id: plainText(templateId),
  };
  const draft = {
    pack_id: 'dd-epoxy-leads-10-v1',
    version: PACK_VERSION,
    status: 'pending_research_and_approval',
    product: 'lead',
    quantity: 10,
    source,
    brand: {
      name: plainText(brandName),
      legal_business_name: plainText(legalBusinessName),
      contact_phone: plainText(contactPhone),
    },
    industry: { slug: 'epoxy', services: ['epoxy floor coatings'] },
    design: { tier: 'premium', approved_reference: plainText(referenceUrl), design_token_version: 'pending-visual-lock' },
    modules: [...REQUIRED_MODULES],
    locations: EP0XY_MARKETS.map(city => ({
      city, region: 'Florida', country: 'US',
      verified_service_area: false, unique_value: '',
      research_status: 'unverified',
    })),
    provisioning: { ...RELEASE_GATES },
  };
  return deepFreeze(draft);
}

// Promote an approved, independently researched candidate set to a
// preview-only SitePack. Does not enqueue, deploy, publish, or send.
export function compilePreviewSitePack(draft, validations) {
  assert(draft?.status === 'pending_research_and_approval', 'Expected a draft pack');
  assert(draft?.product === 'lead' && draft?.quantity === 10, 'Wrong product or quantity');
  assert(draft?.source?.repository === 'XTREME-SYSTEMS/digital-dominance', 'Wrong repository');
  assert(/^[a-f0-9]{40}$/i.test(draft.source.commit_sha), 'Invalid source SHA');
  assert(draft?.provisioning?.mode === 'preview' && draft.provisioning.approval_required === true
    && draft.provisioning.noindex_until_validated === true
    && draft.provisioning.production_publish === false, 'Unsafe provisioning settings');
  assert(Array.isArray(validations) && validations.length === 10, 'Ten independent market validation records required');
  const byCity = new Map();
  for (const v of validations) {
    assert(nonempty(v?.city) && !byCity.has(v.city), 'Missing or duplicate city validation');
    assert(v.verified_service_area === true, 'Service area must be independently verified');
    assert(nonempty(v.verification_source), 'Verification source is required');
    assert(nonempty(v.unique_value) && v.unique_value.trim().length >= 30, 'Unique local value must be substantive');
    assert(v.content_review_approved === true, 'Local content must be approved');
    byCity.set(v.city, v);
  }
  const locations = draft.locations.map(location => {
    const v = byCity.get(location.city);
    assert(v, 'Missing market validation: ' + location.city);
    return {
      city: location.city, region: 'Florida', country: 'US',
      verified_service_area: true, unique_value: v.unique_value.trim(),
      verification_source: v.verification_source.trim(),
    };
  });
  assert(byCity.size === 10, 'Unexpected market validation');
  const pack = {
    pack_id: draft.pack_id, version: draft.version,
    source: draft.source, brand: draft.brand, industry: draft.industry,
    design: draft.design, modules: [...REQUIRED_MODULES],
    locations, provisioning: { ...RELEASE_GATES },
  };
  const manifestSha256 = createHash('sha256').update(JSON.stringify(pack)).digest('hex');
  return deepFreeze({ ...pack, manifest_sha256: manifestSha256, status: 'preview_spec_ready_not_deployed' });
}
