import { compiledLocalStockCatalog } from '../src/components/template-studio/localStockData.js';

/**
 * One synthetic, approved-source concept only. No tenant records, worker,
 * marketing submission or production deployment.
 */
export function generateSyntheticPreviewSite(industryKey='roofing', designKey='signature') {
  const allowedIndustry = new Set(['roofing']);
  const allowedDesign = new Set(['signature']);
  if (!allowedIndustry.has(industryKey) || !allowedDesign.has(designKey)) {
    throw new Error('SYNTHETIC_CANARY_SCOPE_DENIED');
  }
  const item = compiledLocalStockCatalog().find(r => {
    const m=r.sections?.find(s=>s.section_type==='manifest')?.config;
    return m?.industry_key === industryKey && m?.design_key === designKey;
  });
  if (!item || !item.preview_only) throw new Error('SOURCE_TEMPLATE_UNAVAILABLE');
  const html=item.content.replace('<body>', '<body><aside role="status" style="background:#111c26;color:#fff;padding:12px 20px;font:700 14px Arial,sans-serif;text-align:center">SYNTHETIC WEBSITE CONCEPT · NOT A REAL BUSINESS · NO LIVE QUOTES OR MESSAGES</aside>');
  if (!html.includes('name="robots" content="noindex,nofollow"') ||
      !html.includes('NOT A REAL BUSINESS') || html.includes('<form')) {
    throw new Error('SYNTHETIC_CANARY_VALIDATION_FAILED');
  }
  return { html, template_id:item.id,preview_only:true,source_version:item.source_version,
    generated:false,published:false,customer_data:false,kind:'SYNTHETIC_TEMPLATE_PROOF' };
}
