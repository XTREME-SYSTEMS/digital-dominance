export const GOOGLE_SOURCES = {
 technical:'https://developers.google.com/search/docs/essentials/technical',
 helpful:'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
 spam:'https://developers.google.com/search/docs/essentials/spam-policies',
 vitals:'https://web.dev/articles/vitals',
 schema:'https://developers.google.com/search/docs/appearance/structured-data/sd-policies'
};
export function assessGoogleReadiness(html, evidence = {}) {
 const check = (id,name,status,detail,source) => ({id,name,status,detail,source});
 const content = String(html || '');
 const result = [
  check('title','Descriptive title', /<title>[^<]+<\/title>/i.test(content)?'passed':'failed','Evaluated in the generated document.',GOOGLE_SOURCES.helpful),
  check('description','Meta description', /name=["']description["']/i.test(content)?'passed':'failed','A description is not a ranking guarantee.',GOOGLE_SOURCES.helpful),
  check('h1','One primary heading',(content.match(/<h1\b/gi)||[]).length===1?'passed':'failed','One document-level primary heading.',GOOGLE_SOURCES.helpful),
  check('viewport','Mobile viewport',/name=["']viewport["']/i.test(content)?'passed':'failed','Responsive layout still needs browser assessment.',GOOGLE_SOURCES.technical),
  check('content','Indexable text',content.replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').trim().length>500?'passed':'failed','Checks text presence, not expertise or originality.',GOOGLE_SOURCES.technical),
  check('robots','Production indexing enabled',/noindex/i.test(content)?'failed':'unknown','Stock previews intentionally stay noindex until launch review.',GOOGLE_SOURCES.technical),
  check('images','Descriptive image alternatives',/<img\b/i.test(content)&&!/<img\b(?![^>]*\balt=)[^>]*>/i.test(content)?'passed':'failed','Alternative text is present in the document.',GOOGLE_SOURCES.helpful),
  check('status','Live HTTP 200',evidence.http_status===200?'passed':evidence.http_status?'failed':'unknown','Requires an actual deployment response.',GOOGLE_SOURCES.technical),
  check('crawl','Googlebot access','unknown','Requires robots.txt and URL Inspection evidence.',GOOGLE_SOURCES.technical),
  check('vitals','Field Core Web Vitals',evidence.field_p75? (evidence.field_p75.lcp<=2500&&evidence.field_p75.inp<=200&&evidence.field_p75.cls<=0.1?'passed':'failed'):'unknown','Requires real p75 field LCP, INP and CLS, not synthetic guesses.',GOOGLE_SOURCES.vitals),
  check('originality','People-first original value','review','Human review must establish usefulness, sources and distinctive value; no universal word-count or percentage rule exists.',GOOGLE_SOURCES.helpful),
  check('scaled','No doorway or scaled-content abuse','review','City substitutions alone do not establish independent user value.',GOOGLE_SOURCES.spam),
  check('facts','Verified business and local facts','review','Confirm identity, address, qualifications, author credentials and service coverage.',GOOGLE_SOURCES.helpful),
  check('rights','Asset and brand rights','review','Original assets reduce copying risk but do not replace legal review.',GOOGLE_SOURCES.spam),
  check('structured','Structured data matches visible facts','review','Only verified business facts may enter production schema; FAQ rich results are eligibility-restricted.',GOOGLE_SOURCES.schema)
 ];
 const passed=result.filter(c=>c.status==='passed').length;
 return {standard:'Google Search readiness checklist v1',score:Math.round(passed/result.length*100),passed,total:result.length,checks:result,releaseApproved:result.every(c=>c.status==='passed'),disclaimer:'Internal readiness coverage, not Google algorithm weights, certification, ranking probability or a promise of indexing.'};
}