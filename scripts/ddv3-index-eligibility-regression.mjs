import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const pageSchema = read("base44/entities/GeneratedPage.jsonc");
const jobSchema = read("base44/entities/ProgrammaticSeoJob.jsonc");
const compile = read("base44/functions/compileProgrammaticPageCandidate/entry.ts");
const evaluate = read("base44/functions/evaluateProgrammaticIndexEligibility/entry.ts");
const requestRelease = read("base44/functions/requestProgrammaticPageRelease/entry.ts");
const release = read("base44/functions/releaseProgrammaticPage/entry.ts");
const gapFiller = read("base44/functions/gapFillerEngine/entry.ts");
const generateSeoPage = read("base44/functions/generateSeoPage/entry.ts");
const autonomousSeo = read("base44/functions/autonomousSeoDominance/entry.ts");
const fillGaps = read("base44/functions/fillContentGaps/entry.ts");
const sitemap = read("base44/functions/generateSitemap/entry.ts");
const indexers = read("base44/functions/submitToIndexers/entry.ts");
const rss = read("base44/functions/generateRss/entry.ts");
const ping = read("base44/functions/pingIndexNow/entry.ts");
const workflow = read("base44/workflows/Sitemap Auto-Update.jsonc");

check(
  "GeneratedPage defaults to draft",
  pageSchema.includes('"default": "draft"') &&
    pageSchema.includes('"preview"') &&
    pageSchema.includes('"validated"'),
  "Generated content must not default to published."
);

check(
  "GeneratedPage defaults to noindex and locked release",
  pageSchema.includes('"robots_directive"') &&
    pageSchema.includes('"default": "noindex, follow"') &&
    pageSchema.includes('"index_eligible"') &&
    pageSchema.includes('"sitemap_eligible"') &&
    pageSchema.includes('"release_authorized"'),
  "New candidates must fail closed."
);

check(
  "Programmatic jobs default to research-only and no publish authority",
  jobSchema.includes('"default": "research_only"') &&
    jobSchema.includes('"production_publish_authorized"') &&
    jobSchema.includes('"default": false'),
  "A job cannot imply production authority."
);

check(
  "Candidate compiler creates draft/noindex only",
  compile.includes('status: "draft"') &&
    compile.includes('robots_directive: "noindex, follow"') &&
    compile.includes("index_eligible: false") &&
    compile.includes("sitemap_eligible: false") &&
    compile.includes("release_authorized: false"),
  "Compilation cannot publish."
);

check(
  "Candidate compiler blocks unsupported claims",
  compile.includes("UNVERIFIED_CLAIM_BLOCKED") &&
    compile.includes("top[- ]rated") &&
    compile.includes("satisfaction guaranteed"),
  "Unsupported marketing proof must be rejected."
);

check(
  "Local candidates require registry and serviceability",
  compile.includes("LOCATION_NOT_VERIFIED") &&
    compile.includes("LOCATION_NOT_SERVICEABLE") &&
    compile.includes('serviceability_status !== "serviceable"'),
  "A fake or unserved location cannot become a candidate."
);

check(
  "Eligibility requires evidence, local value, and independent validation",
  evaluate.includes("first_party_gsc_query_evidence") &&
    evaluate.includes('opp?.evidence_state === "verified"') &&
    evaluate.includes("local_value_score_below_70") &&
    evaluate.includes("location_not_validated") &&
    evaluate.includes("validation_work_packet_missing") &&
    evaluate.includes("REQUIRED_VALIDATION_CHECKS"),
  "Index eligibility must be evidence- and validator-backed."
);

check(
  "Eligibility never self-authorizes release",
  evaluate.includes("release_authorized: false") &&
    !evaluate.includes('status: "published"'),
  "Eligibility means allowed to request approval, not publish."
);

check(
  "Release approval is exact-page scoped",
  requestRelease.includes('"publish_programmatic_page:" + page.id') &&
    requestRelease.includes('risk_class: "PROTECTED"') &&
    release.includes('expectedAction = "publish_programmatic_page:" + page.id') &&
    release.includes('approval.status !== "APPROVED"') &&
    release.includes("approval.work_packet_id !== page.validation_work_packet_id"),
  "Broad or unrelated approval must not publish another page."
);

check(
  "Only release function can set published and release authorized",
  release.includes('status: "published"') &&
    release.includes("release_authorized: true") &&
    release.includes("DDV3_RELEASE_APPROVAL_REQUIRED"),
  "Production release requires exact approval."
);

const quarantined = [
  "run_programmatic_seo",
  "accelerate_first_page",
  "run_full_gap_fill",
  "submit_mass_citations",
  "find_backlink_opportunities",
  "generate_content_calendar",
  "generate_social_content",
  "submit_apple_yelp",
  "sync_gbp",
  "submit_to_bing",
];
check(
  "Unsafe legacy gap-filler actions are quarantined",
  quarantined.every((name) => gapFiller.includes('"' + name + '"')) &&
    gapFiller.includes("DDV3_GOVERNED_EVIDENCE_REQUIRED"),
  "Legacy scale shortcuts cannot bypass DDV3."
);

check(
  "Legacy SEO generator is draft/noindex and never pings IndexNow",
  generateSeoPage.includes('status: "draft"') &&
    generateSeoPage.includes('robots_directive: "noindex, follow"') &&
    !generateSeoPage.includes("api.indexnow.org"),
  "Legacy content generation is allowed only as research draft."
);

check(
  "Autonomous SEO is research-only",
  autonomousSeo.includes('mode: "research_only"') &&
    autonomousSeo.includes("Pages generated: 0") &&
    autonomousSeo.includes("URLs submitted: 0") &&
    !autonomousSeo.includes("api.indexnow.org"),
  "Autonomous SEO may recommend, not publish or submit."
);

check(
  "Content gap engine creates zero pages",
  fillGaps.includes("pages_created: 0") &&
    fillGaps.includes('mode: "research_only"') &&
    !fillGaps.includes('functions.invoke("generateSeoPage"'),
  "AI gap ideas remain hypotheses."
);

check(
  "Sitemap requires released generated pages",
  sitemap.includes('g.status === "published"') &&
    sitemap.includes("g.index_eligible !== false") &&
    sitemap.includes("g.sitemap_eligible !== false") &&
    sitemap.includes("g.release_authorized !== false"),
  "Validated-only candidates must not enter the sitemap."
);

check(
  "Sitemap excludes unvalidated local pages",
  sitemap.includes('loc.validation_status === "passed"') &&
    sitemap.includes('loc.serviceability_status === "serviceable"') &&
    sitemap.includes("Number(loc.local_value_score || 0) >= 70"),
  "Unvalidated location inventory must not be advertised to crawlers."
);

check(
  "Indexer submission requires eligibility for pages and locations",
  indexers.includes('page?.status === "published"') &&
    indexers.includes("page?.release_authorized !== false") &&
    indexers.includes('loc.validation_status === "passed"') &&
    indexers.includes("Number(loc.local_value_score || 0) >= 70"),
  "IndexNow batches must be filtered at the last mile."
);

check(
  "RSS uses canonical domain and released pages only",
  rss.includes('const SITE = "https://epoxyquotenearme.com"') &&
    rss.includes('g.status === "published"') &&
    rss.includes("g.release_authorized !== false"),
  "RSS cannot expose drafts/validated-only candidates or old domains."
);

check(
  "Direct IndexNow ping re-checks released page state",
  ping.includes("DDV3_INDEX_ELIGIBILITY_REQUIRED") &&
    ping.includes('page?.status === "published"') &&
    ping.includes("page?.release_authorized !== false") &&
    !ping.includes("epoxyquotenearme.base44.app"),
  "A caller cannot submit an arbitrary draft URL."
);

check(
  "Discovery workflow triggers only for explicit released pages",
  workflow.includes('.trigger.data.status == \\"published\\"') &&
    workflow.includes(".trigger.data.release_authorized == true") &&
    workflow.includes(".trigger.data.index_eligible == true") &&
    workflow.includes(".trigger.data.sitemap_eligible == true") &&
    workflow.includes("https://epoxyquotenearme.com/"),
  "Entity events must not auto-index drafts or validation candidates."
);

const failed = checks.filter((c) => !c.pass);
for (const c of checks) {
  console.log(`${c.pass ? "PASS" : "FAIL"} | ${c.name} | ${c.detail}`);
}
console.log(`\nDDV3 index eligibility regression: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
