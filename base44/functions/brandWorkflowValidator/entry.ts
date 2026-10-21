import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { scorePack } from '../../shared/brandWorkflowChecks.js';

// BRAND WORKFLOW VALIDATOR
// Runs the entire brand -> website workflow end to end on a disposable QA brand:
// profile, industry discovery, logo generation, page pack, then photo posing.
// The output is scored twice — a deterministic validator over every page, and an
// independent QA reviewer (LLM) that reads the built pages and grades them.
// The run is stored as a PackValidationRun record.

const AUDIT_TAG = 'brand-workflow-audit';

const QA_PROFILE = {
  business_name: 'Summit Coatings Audit',
  website_mode: 'new',
  industry: 'epoxy_flooring',
  industry_label: 'Epoxy Flooring',
  city: 'Fort Lauderdale',
  state: 'FL',
  phone: '(954) 555-0142',
  email: 'office@summit-coatings-audit.com',
  palette_id: 'coastal-blue',
  palette: {
    id: 'coastal-blue',
    name: 'Coastal Blue',
    accent: '#126fc8',
    accentLight: '#6cc6ff',
    gradient: 'linear-gradient(135deg,#126fc8,#0d9488)',
  },
};

const strip = (html) => String(html || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ');
const pick = (html, rx) => (String(html || '').match(rx) || [])[1] || '';

export default async function (req: Request): Promise<Response> {
  const startedAt = new Date().toISOString();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const pageCount = Math.min(7, Math.max(5, Number(body.page_count) || 7));
    const svc = base44.asServiceRole;

    const stages: any[] = [];
    const stage = (name: string, ok: boolean, note: string) => {
      stages.push({ name, status: ok ? 'pass' : 'fail', note: String(note).slice(0, 280) });
      return ok;
    };
    const invoke = async (name: string, payload: any) => {
      const res: any = await base44.functions.invoke(name, payload);
      return res?.data || res || {};
    };

    // Keep exactly one audit site: clear the previous run's artifacts first.
    await svc.entities.TemplateLibrary.deleteMany({ tags: AUDIT_TAG }).catch(() => {});
    await svc.entities.BrandProfile.deleteMany({ business_name: QA_PROFILE.business_name }).catch(() => {});

    // 1 — the brand profile the wizard writes
    const profile: any = await svc.entities.BrandProfile.create({ ...QA_PROFILE, discovery_status: 'pending', status: 'draft' });
    stage('Brand profile created', !!profile?.id, `${QA_PROFILE.business_name} · ${QA_PROFILE.industry_label} · ${QA_PROFILE.city}, ${QA_PROFILE.state}`);

    // 2 — background industry discovery
    let discovery: any = null;
    try {
      const res = await invoke('industryDiscovery', {
        industry: QA_PROFILE.industry,
        industry_label: QA_PROFILE.industry_label,
        city: QA_PROFILE.city,
        state: QA_PROFILE.state,
        business_name: QA_PROFILE.business_name,
        profile_id: profile.id,
      });
      discovery = res.discovery || null;
    } catch (error: any) {
      console.error('Audit discovery failed:', error.message);
    }
    stage(
      'Industry discovery',
      !!discovery,
      discovery
        ? `${(discovery.services || []).length} services · ${(discovery.image_prompts || []).length} image prompts · ${(discovery.aeo_questions || []).length} buyer questions · ${(discovery.seo_keywords || []).length} keywords`
        : 'discovery returned no dossier',
    );

    // 3 — logo concepts
    let logos: any[] = [];
    try {
      const res = await invoke('generateBrandIdentity', { action: 'generate_logos', businessName: QA_PROFILE.business_name, industry: QA_PROFILE.industry, transparent: true });
      logos = Array.isArray(res.logos) ? res.logos : [];
    } catch (error: any) {
      console.error('Audit logo generation failed:', error.message);
    }
    const logoUrl = logos.find((l: any) => l?.url)?.url || '';
    if (logoUrl) await svc.entities.BrandProfile.update(profile.id, { logo_url: logoUrl, logos }).catch(() => {});
    stage('Logo concepts generated', logos.length >= 8, `${logos.length} transparent-background concepts`);

    // 4 — page pack build
    let build: any = {};
    try {
      build = await invoke('pagePackGenerator', { profile_id: profile.id, page_count: pageCount });
    } catch (error: any) {
      console.error('Audit page pack build failed:', error.message);
    }
    stage('Page pack built', (build.pages || []).length >= 5, `${(build.pages || []).length} pages · ${build.image_count || 0} images generated`);

    // 5 — photo posing: the pack's own images are posed back as owner photos,
    // which must replace them instead of being regenerated.
    const packTag = `brand-${profile.id}`;
    const first: any = await svc.entities.TemplateLibrary.filter({ tags: packTag }, { sort: 'sort_order', limit: 10, fields: ['id', 'slug', 'name', 'tags', 'content'] }).catch(() => ({ items: [] }));
    const rows: any[] = first.items || [];
    const byKey = (key: string) => rows.find((r: any) => (r.tags || []).includes(`page-${key}`));
    const heroOf = (key: string) => pick(byKey(key)?.content, /<img class="hero-img" src="([^"]+)"/i);
    const figures = [...String(byKey('home')?.content || '').matchAll(/<figure>\s*<img src="([^"]+)"/gi)].map((m) => m[1]);
    const posed = [
      { name: 'audit-hero.jpg', url: heroOf('home'), slot: 'hero' },
      { name: 'audit-services.jpg', url: heroOf('services'), slot: 'services' },
      { name: 'audit-about.jpg', url: heroOf('about'), slot: 'about' },
      { name: 'audit-gallery-1.jpg', url: figures[0], slot: 'gallery1' },
      { name: 'audit-gallery-2.jpg', url: figures[1], slot: 'gallery2' },
      { name: 'audit-gallery-3.jpg', url: figures[2], slot: 'gallery3' },
    ].filter((p) => p.url);

    if (posed.length) await svc.entities.BrandProfile.update(profile.id, { photos: posed });
    let rebuild: any = {};
    try {
      rebuild = await invoke('pagePackGenerator', { profile_id: profile.id, page_count: pageCount });
    } catch (error: any) {
      console.error('Audit rebuild with posed photos failed:', error.message);
    }
    const finalRows: any = await svc.entities.TemplateLibrary.filter({ tags: packTag }, { sort: 'sort_order', limit: 10 }).catch(() => ({ items: [] }));
    const finalHome = (finalRows.items || []).find((r: any) => (r.tags || []).includes('page-home'));
    const posedHeroKept = !!posed.length && String(finalHome?.content || '').includes(posed[0].url);
    const posingOk = posed.length >= 4 && rebuild.photo_count === posed.length && rebuild.image_count === posed.length && posedHeroKept;
    stage(
      'Owner photos replace generated imagery',
      posingOk,
      posed.length
        ? `posed ${posed.length} photos · builder reported ${rebuild.photo_count || 0} photos of ${rebuild.image_count || 0} images · hero kept: ${posedHeroKept ? 'yes' : 'no'}`
        : 'no image URLs were found in the first build to pose',
    );

    // 6 — deterministic validation of the finished pack
    const records: any[] = finalRows.items || [];
    const pages = records.map((record: any) => {
      const key = (record.tags || []).find((t: string) => t.startsWith('page-'))?.slice(5) || record.slug;
      return {
        key,
        title: String(record.name || '').split(' — ').pop() || key,
        path: key === 'home' ? '/' : `/${key}`,
        html: record.content || '',
        template_id: record.id,
      };
    });
    const validation = scorePack({ pages, profile: { ...profile, logo_url: logoUrl, photos: posed } });
    stage('Deterministic validation', pages.length > 0, `${validation.score}/100 (${validation.grade}) across ${pages.length} pages`);

    // 7 — independent QA review of the real pages
    const sample = ['home', 'services', 'gallery', 'contact']
      .map((key) => pages.find((p) => p.key === key))
      .filter(Boolean)
      .map((p) => {
        const text = strip(p.html);
        return `PAGE ${p.key} — ${p.path}\n${text.slice(0, 6000)}${text.length > 6000 ? '\n[... excerpt truncated for review ...]' : ''}`;
      })
      .join('\n\n---\n\n');

    let qa: any = null;
    if (sample) {
      try {
        qa = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an independent QA reviewer auditing a website an automated system just generated for a ${QA_PROFILE.industry_label} company in ${QA_PROFILE.city}, ${QA_PROFILE.state}.

Judge it the way a demanding agency QA lead would before a client sees it. Penalise generic filler, duplicated copy, weak conversion paths, missing trust or contact details, poor hierarchy and anything that would embarrass the business.

Cover, per page and overall: copy quality and specificity, visual hierarchy and design craft, conversion clarity, trust and credibility, search and AI-answer readiness, and mobile-friendliness.

Return ONLY JSON. overall_score is 0-100 for the whole site. Be strict: a site with placeholder-feeling copy or a missing call to action scores below 70. A genuinely specific, well-structured, conversion-ready site can reach the high 80s or 90s.

Two things about this review so you judge it fairly:
- Each page is given as HTML with styles and scripts stripped, and an excerpt may be cut off where it is marked [... excerpt truncated for review ...]. That marker is a limit of this review, not a build defect.
- These are pre-launch concept pages generated from researched industry data. A "template concept, verify before publishing" notice and research-generated concept imagery are expected at this stage, so do not treat those alone as defects.

Judge everything else strictly: how specific and useful the copy is, whether pages duplicate each other, hierarchy and design craft, how obvious the conversion path is, trust signals, the metadata on each page, and mobile-friendliness.

Pages to audit:
${sample}`,
          response_json_schema: {
            type: 'object',
            properties: {
              overall_score: { type: 'number' },
              verdict: { type: 'string' },
              page_scores: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string' },
                    score: { type: 'number' },
                    strengths: { type: 'string' },
                    weaknesses: { type: 'string' },
                  },
                },
              },
              critical_issues: { type: 'array', items: { type: 'string' } },
              improvements: { type: 'array', items: { type: 'string' } },
            },
          },
        });
      } catch (error: any) {
        console.error('Audit QA review failed:', error.message);
      }
    }
    const qaScore = Math.max(0, Math.min(100, Number(qa?.overall_score) || 0));
    stage('Independent QA review', !!qa, qa ? `${qaScore}/100 · ${String(qa.verdict || '').slice(0, 160)}` : 'QA reviewer returned nothing');

    // 8 — verdict and receipt
    const blocked = stages.some((s) => s.status === 'fail');
    const status = blocked || validation.score < 85 || qaScore < 85 || validation.criticalFailures.length ? 'fail' : 'pass';
    const validatorVerdict = blocked
      ? `Blocked: ${stages.filter((s) => s.status === 'fail').map((s) => s.name).join(', ')}`
      : `Validator ${validation.score}/100 (${validation.grade}) — ${validation.failures.length} criteria short of perfect`;
    const verdict = `${validatorVerdict} · QA reviewer ${qaScore}/100 · ${status.toUpperCase()}`;

    if (records.length) {
      await svc.entities.TemplateLibrary.updateMany({ tags: packTag }, { $addToSet: { tags: AUDIT_TAG } }).catch(() => {});
    }

    const record: any = await svc.entities.PackValidationRun.create({
      validation_id: `audit-${Date.now().toString(36)}`,
      receipt_id: profile.id,
      pack_id: profile.id,
      template_key: `${QA_PROFILE.industry}-${pageCount}p`,
      target_url: 'brand-site-pack (not deployed)',
      run_type: 'full',
      status,
      validator_name: 'brandWorkflowValidator',
      validator_version: '1.0',
      operational_score: validation.score,
      visual_score: qaScore,
      workflow_checks: validation.checks,
      page_scores: Array.isArray(qa?.page_scores) ? qa.page_scores : [],
      stage_results: stages,
      failures: validation.failures,
      evidence_refs: [profile.id, ...records.map((r: any) => r.id)],
      grade: validation.grade,
      validator_verdict: validatorVerdict.slice(0, 500),
      qa_verdict: String(qa?.verdict || '').slice(0, 500),
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      notes: [
        verdict,
        '',
        'Criteria short of full marks:',
        ...(validation.failures.length ? validation.failures : ['none']),
        '',
        'QA reviewer critical issues:',
        ...((qa?.critical_issues || []).length ? qa.critical_issues : ['none reported']),
        '',
        'QA reviewer improvements:',
        ...((qa?.improvements || []).length ? qa.improvements : ['none reported']),
      ].join('\n').slice(0, 4000),
    });

    return Response.json({
      run_id: record.id,
      status,
      verdict,
      validator: { score: validation.score, grade: validation.grade, checks: validation.checks, failures: validation.failures, critical_failures: validation.criticalFailures },
      qa: { score: qaScore, verdict: qa?.verdict || '', pages: qa?.page_scores || [], critical_issues: qa?.critical_issues || [], improvements: qa?.improvements || [] },
      stages,
      pages: validation.pages,
      profile_id: profile.id,
      pack_tag: packTag,
      completed_at: record.completed_at,
    });
  } catch (error: any) {
    console.error('Brand workflow validator error:', error);
    return Response.json({ error: error.message || 'The workflow audit could not run' }, { status: 500 });
  }
}