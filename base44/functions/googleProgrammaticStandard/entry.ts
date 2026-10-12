import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// ============================================================
// GOOGLE 2026 PROGRAMMATIC STANDARD
// Deterministic scoring based on Google's published 2026 algorithm
// weights (source: First Page Sage 16-year continuous study, Q3 2026).
// Every factor is scored 0-100 deterministically, then weighted by
// its algorithm share to produce a single 0-100 compliance score.
// ============================================================

const GOOGLE_FACTORS = {
  satisfying_content:  { weight: 24, label: "Consistent Publication of Satisfying Content" },
  niche_expertise:     { weight: 14, label: "Niche Expertise" },
  searcher_engagement: { weight: 13, label: "Searcher Engagement" },
  keyword_title:       { weight: 12, label: "Keyword in Meta Title Tag" },
  backlinks:           { weight: 12, label: "Backlinks" },
  freshness:           { weight: 6,  label: "Freshness" },
  trustworthiness:     { weight: 5,  label: "Trustworthiness" },
  mobile_first:        { weight: 4,  label: "Mobile-First Website" },
  link_diversity:      { weight: 3,  label: "Link Distribution Diversity" },
  page_speed:          { weight: 2,  label: "Page Speed" },
  brand_mentions:      { weight: 2,  label: "Brand Mentions" },
  site_security:       { weight: 1,  label: "Site Security / SSL" },
  internal_links:      { weight: 1,  label: "Internal Links" },
  meta_description:    { weight: 1,  label: "Meta Description + Other" },
};

// --- Deterministic scoring functions (0-100 each) ---

function scoreContent(d) {
  let s = 0;
  if (d.pageCount >= 15) s += 30; else if (d.pageCount >= 8) s += 20; else if (d.pageCount >= 3) s += 10;
  if (d.avgWordCount >= 2000) s += 30; else if (d.avgWordCount >= 1200) s += 18; else if (d.avgWordCount >= 600) s += 8;
  if (d.hasBlog) s += 20;
  if (d.hasFAQ) s += 10;
  if (d.hasServicePages) s += 10;
  return Math.min(s, 100);
}

function scoreNiche(d) {
  let s = 0;
  if (d.serviceCount >= 8) s += 30; else if (d.serviceCount >= 4) s += 18; else if (d.serviceCount >= 1) s += 8;
  if (d.hasLocationPages) s += 25;
  if (d.hasIndustryContent) s += 20;
  if (d.hasAuthorBio) s += 15;
  if (d.hasEAT) s += 10;
  return Math.min(s, 100);
}

function scoreEngagement(d) {
  let s = 0;
  if (d.hasCTA) s += 25;
  if (d.hasContactForm) s += 20;
  if (d.hasLiveChat) s += 15;
  if (d.hasClickToCall) s += 15;
  if (d.hasVideoContent) s += 15;
  if (d.hasInteractiveElements) s += 10;
  return Math.min(s, 100);
}

function scoreKeywordTitle(d) {
  let s = 0;
  if (d.titleTagOptimized) s += 40;
  if (d.h1Optimized) s += 30;
  if (d.hasMetaDescription) s += 20;
  if (d.hasHeaderHierarchy) s += 10;
  return Math.min(s, 100);
}

function scoreBacklinks(d) {
  let s = 0;
  if (d.backlinkCount >= 100) s += 50; else if (d.backlinkCount >= 50) s += 30; else if (d.backlinkCount >= 10) s += 15;
  if (d.hasReferringDomains) s += 30;
  if (d.hasAuthorityLinks) s += 20;
  return Math.min(s, 100);
}

function scoreFreshness(d) {
  let s = 0;
  const days = d.lastUpdatedDays ?? 365;
  if (days <= 7) s += 50; else if (days <= 30) s += 35; else if (days <= 90) s += 20; else if (days <= 365) s += 10;
  if (d.hasContentCalendar) s += 30;
  if (d.hasRecentBlog) s += 20;
  return Math.min(s, 100);
}

function scoreTrust(d) {
  let s = 0;
  if (d.hasSSL) s += 25;
  if (d.hasReviews) s += 25;
  if (d.hasTestimonials) s += 15;
  if (d.hasPrivacyPolicy) s += 15;
  if (d.hasTerms) s += 10;
  if (d.hasAboutPage) s += 10;
  return Math.min(s, 100);
}

function scoreMobile(d) {
  let s = 0;
  if (d.isResponsive) s += 50;
  if (d.hasMobileCTA) s += 25;
  if (d.hasAmpVersion) s += 15;
  if (d.hasMobileSpeed) s += 10;
  return Math.min(s, 100);
}

function scoreLinkDiv(d) {
  let s = 0;
  if (d.referringDomainCount >= 20) s += 40; else if (d.referringDomainCount >= 10) s += 25; else if (d.referringDomainCount >= 5) s += 15;
  if (d.hasDiverseAnchorText) s += 30;
  if (d.hasContextualLinks) s += 30;
  return Math.min(s, 100);
}

function scoreSpeed(d) {
  let s = 0;
  const lt = d.loadTimeSeconds ?? 5;
  if (lt <= 1) s += 50; else if (lt <= 2) s += 35; else if (lt <= 3) s += 20;
  if (d.hasOptimizedImages) s += 25;
  if (d.hasMinifiedAssets) s += 15;
  if (d.hasLazyLoading) s += 10;
  return Math.min(s, 100);
}

function scoreBrand(d) {
  let s = 0;
  if (d.brandMentionCount >= 50) s += 40; else if (d.brandMentionCount >= 20) s += 25; else if (d.brandMentionCount >= 5) s += 15;
  if (d.hasSocialProfiles) s += 30;
  if (d.hasPressCoverage) s += 30;
  return Math.min(s, 100);
}

function scoreSecurity(d) {
  let s = 0;
  if (d.hasSSL) s += 60;
  if (d.hasHSTS) s += 20;
  if (d.hasSecurityHeaders) s += 20;
  return Math.min(s, 100);
}

function scoreInternalLinks(d) {
  let s = 0;
  if (d.internalLinkCount >= 50) s += 40; else if (d.internalLinkCount >= 20) s += 25; else if (d.internalLinkCount >= 10) s += 15;
  if (d.hasBreadcrumbNav) s += 30;
  if (d.hasRelatedPosts) s += 30;
  return Math.min(s, 100);
}

function scoreMeta(d) {
  let s = 0;
  if (d.hasMetaDescription) s += 40;
  if (d.metaDescriptionLength && d.metaDescriptionLength >= 120 && d.metaDescriptionLength <= 160) s += 30;
  if (d.hasOGTags) s += 20;
  if (d.hasTwitterCards) s += 10;
  return Math.min(s, 100);
}

const SCORERS = {
  satisfying_content: scoreContent,
  niche_expertise: scoreNiche,
  searcher_engagement: scoreEngagement,
  keyword_title: scoreKeywordTitle,
  backlinks: scoreBacklinks,
  freshness: scoreFreshness,
  trustworthiness: scoreTrust,
  mobile_first: scoreMobile,
  link_diversity: scoreLinkDiv,
  page_speed: scoreSpeed,
  brand_mentions: scoreBrand,
  site_security: scoreSecurity,
  internal_links: scoreInternalLinks,
  meta_description: scoreMeta,
};

const RECS = {
  satisfying_content: "Publish 2,000+ word pages weekly with comprehensive, original content that fully resolves searcher intent.",
  niche_expertise: "Create dedicated pages for every service, location, and use-case permutation to build topical authority hubs.",
  searcher_engagement: "Add interactive elements, video, click-to-call, and live chat to maximize dwell time and reduce bounce.",
  keyword_title: "Optimize title tags with primary keywords in the first 60 characters; use compelling, click-worthy titles.",
  backlinks: "Build authority backlinks via guest posting, digital PR, and industry directory submissions (target 50+ referring domains).",
  freshness: "Update existing content quarterly minimum; publish new content weekly; maintain a content calendar.",
  trustworthiness: "Add author bios with credentials, E-E-A-T signals, reviews, testimonials, privacy policy, and terms of service.",
  mobile_first: "Ensure responsive design with mobile-first CTAs, fast mobile load times, and touch-friendly navigation.",
  link_diversity: "Diversify referring domains and anchor text distribution for a natural, penalty-resistant link profile.",
  page_speed: "Optimize images, minify CSS/JS, enable lazy loading, use a CDN, and target sub-2-second load times.",
  brand_mentions: "Build brand authority through PR campaigns, social media, and industry publication coverage.",
  site_security: "Enable SSL, HSTS, and security headers (X-Frame-Options, X-Content-Type-Options, CSP).",
  internal_links: "Add breadcrumb navigation, related-posts sections, and contextual internal links between hub pages.",
  meta_description: "Write 120-160 character meta descriptions with primary keywords and compelling CTAs.",
};

function getGrade(score) {
  if (score >= 95) return "A+ — Google First Page Ready";
  if (score >= 90) return "A — Near First Page";
  if (score >= 85) return "A- — Strong Contender";
  if (score >= 80) return "B+ — Competitive";
  if (score >= 70) return "B — Needs Enhancement";
  if (score >= 60) return "C — Below Standard";
  if (score >= 50) return "D — Critical Gaps";
  return "F — Non-Compliant";
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { siteData } = await req.json();
    const d = siteData || {};

    const breakdown = {};
    let totalWeighted = 0;
    let maxPossible = 0;

    for (const [key, meta] of Object.entries(GOOGLE_FACTORS)) {
      const rawScore = SCORERS[key](d);
      const weighted = (rawScore / 100) * meta.weight;
      totalWeighted += weighted;
      maxPossible += meta.weight;
      breakdown[key] = {
        label: meta.label,
        weight: meta.weight,
        score: rawScore,
        weighted_score: Math.round(weighted * 100) / 100,
        max: meta.weight,
      };
    }

    const finalScore = Math.round((totalWeighted / maxPossible) * 100);

    const recommendations = Object.entries(breakdown)
      .filter(([, v]) => v.score < 80)
      .map(([k, v]) => ({
        factor: v.label,
        key: k,
        current_score: v.score,
        weight: v.weight,
        impact: Math.round((100 - v.score) * v.weight / 100 * 100) / 100,
        recommendation: RECS[k] || "Improve this factor.",
      }))
      .sort((a, b) => b.impact - a.impact);

    return Response.json({
      score: finalScore,
      max_score: 100,
      grade: getGrade(finalScore),
      breakdown,
      recommendations,
      factors_used: Object.fromEntries(
        Object.entries(GOOGLE_FACTORS).map(([k, v]) => [k, v.weight])
      ),
      standard: "Google 2026 Programmatic Standard",
      algorithm: "deterministic_weighted_factor_scoring_v1",
      evaluated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("googleProgrammaticStandard error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}