// Shared template scoring functions used by autonomousTemplateEnhancer
// and websiteBenchmarkSystem. These score content objects (hero, services,
// faq, etc.) — distinct from googleProgrammaticStandard which scores site data.

export interface ContentScoreInput {
  hero?: string;
  services?: string[];
  about?: string;
  faq?: string[];
  testimonials?: string[];
  gallery?: boolean;
  video?: boolean;
  cta_buttons?: any[];
  trust_badges?: boolean;
  urgency_signals?: boolean;
  responsive?: boolean;
  touch_targets_optimized?: boolean;
  lazy_loaded?: boolean;
  meta_title?: string;
  meta_description?: string;
  schema_markup?: boolean;
  semantic_html?: boolean;
  sitemap?: boolean;
  faq_schema?: boolean;
  answer_first_content?: boolean;
  structured_data?: boolean;
  local_schema?: boolean;
  nap_consistent?: boolean;
  local_landmarks?: boolean;
  google_business_profile?: boolean;
  image_optimized?: boolean;
  minimal_js?: boolean;
  cdn_enabled?: boolean;
  aria_labels?: boolean;
  keyboard_nav?: boolean;
  contrast_aaa?: boolean;
  screen_reader?: boolean;
  unique_local_data?: boolean;
  multi_source?: boolean;
  value_beyond_template?: boolean;
  differentiation_rate?: number;
  brand_colors?: boolean;
  brand_fonts?: boolean;
  brand_logo?: boolean;
  brand_tone?: boolean;
}

// Score result includes whether the score was measured or assumed.
// A score without measurement is UNKNOWN (null), not a high baseline.
export interface ScoreResult {
  score: number | null;
  measured: boolean;
  evidence?: string;
  unknown_reason?: string;
}

export function scoreDesignQuality(content: ContentScoreInput, layout?: string): ScoreResult {
  // No baseline. Score starts at 0 and only increases with verified evidence.
  let score = 0;
  const evidence: string[] = [];
  if (layout === "bento_box" || layout === "glassmorphism") { score += 12; evidence.push("layout: bento/glass"); }
  else if (layout === "bold_minimal" || layout === "split_screen") { score += 10; evidence.push("layout: bold/split"); }
  else if (layout === "kinetic_typography" || layout === "three_d_hero") { score += 8; evidence.push("layout: kinetic/3d"); }
  else if (layout) { score += 5; evidence.push(`layout: ${layout}`); }
  if (content.hero && content.hero.length > 100) { score += 5; evidence.push("hero > 100 chars"); }
  if (content.gallery) { score += 5; evidence.push("gallery present"); }
  if (content.testimonials && content.testimonials.length >= 3) { score += 3; evidence.push("3+ testimonials"); }
  if (content.video) { score += 3; evidence.push("video present"); }
  // Without visual inspection, we cannot verify design quality.
  // Return UNKNOWN if no browser screenshot evidence was provided.
  return { score: Math.min(100, score), measured: false, evidence: evidence.join(", "), unknown_reason: "No browser screenshot evidence — design quality requires visual inspection" };
}

export function scoreConversionOpt(content: ContentScoreInput): ScoreResult {
  let score = 0;
  const evidence: string[] = [];
  if (content.hero && /call|book|quote|free|now/i.test(content.hero)) { score += 12; evidence.push("hero has CTA keywords"); }
  if (content.cta_buttons && content.cta_buttons.length >= 2) { score += 10; evidence.push("2+ CTA buttons"); }
  if (content.trust_badges) { score += 5; evidence.push("trust badges present"); }
  if (content.urgency_signals) { score += 5; evidence.push("urgency signals present"); }
  return { score: Math.min(100, score), measured: false, evidence: evidence.join(", "), unknown_reason: "Conversion score is structural, not measured — actual conversion rate requires analytics" };
}

export function scoreMobileOpt(content: ContentScoreInput): ScoreResult {
  let score = 0;
  const evidence: string[] = [];
  if (content.responsive) { score += 12; evidence.push("responsive declared"); }
  if (content.touch_targets_optimized) { score += 5; evidence.push("touch targets optimized"); }
  if (content.lazy_loaded) { score += 5; evidence.push("lazy loaded"); }
  return { score: Math.min(100, score), measured: false, evidence: evidence.join(", "), unknown_reason: "Mobile score is declared, not measured — actual mobile UX requires device testing" };
}

export function scoreSeoFeatures(content: ContentScoreInput): ScoreResult {
  let score = 0;
  const evidence: string[] = [];
  if (content.meta_title && content.meta_title.length > 30) { score += 10; evidence.push("meta_title > 30 chars"); }
  if (content.meta_description && content.meta_description.length > 120) { score += 10; evidence.push("meta_desc > 120 chars"); }
  if (content.schema_markup) { score += 10; evidence.push("schema markup"); }
  if (content.semantic_html) { score += 5; evidence.push("semantic HTML"); }
  if (content.sitemap) { score += 3; evidence.push("sitemap"); }
  return { score: Math.min(100, score), measured: false, evidence: evidence.join(", "), unknown_reason: "SEO score is structural — actual ranking requires GSC data" };
}

export function scoreAeoOpt(content: ContentScoreInput): ScoreResult {
  let score = 0;
  const evidence: string[] = [];
  if (content.faq && content.faq.length >= 5) { score += 20; evidence.push("5+ FAQs"); }
  if (content.faq_schema) { score += 10; evidence.push("FAQ schema"); }
  if (content.answer_first_content) { score += 10; evidence.push("answer-first content"); }
  if (content.structured_data) { score += 5; evidence.push("structured data"); }
  return { score: Math.min(100, score), measured: false, evidence: evidence.join(", "), unknown_reason: "AEO score is structural — actual AI Overview capture requires live testing" };
}

export function scoreGeoOpt(content: ContentScoreInput, location?: string): ScoreResult {
  let score = 0;
  const evidence: string[] = [];
  if (location) { score += 15; evidence.push(`location: ${location}`); }
  if (content.local_schema) { score += 10; evidence.push("local schema"); }
  if (content.nap_consistent) { score += 10; evidence.push("NAP consistent"); }
  if (content.local_landmarks) { score += 5; evidence.push("local landmarks"); }
  if (content.google_business_profile) { score += 5; evidence.push("GBP linked"); }
  return { score: Math.min(100, score), measured: false, evidence: evidence.join(", "), unknown_reason: "Geo score is structural — actual local ranking requires GSC + Maps data" };
}

export function scorePerformanceOpt(content: ContentScoreInput): ScoreResult {
  let score = 0;
  const evidence: string[] = [];
  if (content.image_optimized) { score += 10; evidence.push("images optimized"); }
  if (content.lazy_loaded) { score += 10; evidence.push("lazy loaded"); }
  if (content.minimal_js) { score += 5; evidence.push("minimal JS"); }
  if (content.cdn_enabled) { score += 3; evidence.push("CDN enabled"); }
  return { score: Math.min(100, score), measured: false, evidence: evidence.join(", "), unknown_reason: "Performance score is declared — actual CWV requires Lighthouse/PageSpeed" };
}

export function scoreAccessibilityOpt(content: ContentScoreInput): ScoreResult {
  let score = 0;
  const evidence: string[] = [];
  if (content.aria_labels) { score += 10; evidence.push("ARIA labels"); }
  if (content.keyboard_nav) { score += 10; evidence.push("keyboard nav"); }
  if (content.contrast_aaa) { score += 8; evidence.push("contrast AAA"); }
  if (content.screen_reader) { score += 4; evidence.push("screen reader"); }
  return { score: Math.min(100, score), measured: false, evidence: evidence.join(", "), unknown_reason: "Accessibility score is declared — actual compliance requires axe-core audit" };
}

export function scoreContentQuality(content: ContentScoreInput, location?: string): ScoreResult {
  let score = 0;
  const evidence: string[] = [];
  if (content.unique_local_data) { score += 20; evidence.push("unique local data"); }
  if (content.multi_source) { score += 10; evidence.push("multi-source"); }
  if (content.value_beyond_template) { score += 5; evidence.push("value beyond template"); }
  if (content.differentiation_rate && content.differentiation_rate >= 60) { score += 3; evidence.push("differentiation >= 60%"); }
  return { score: Math.min(100, score), measured: false, evidence: evidence.join(", "), unknown_reason: "Content quality score is structural — actual uniqueness requires plagiarism check" };
}

export function scoreBrandCustomization(content: ContentScoreInput): ScoreResult {
  let score = 0;
  const evidence: string[] = [];
  if (content.brand_colors) { score += 10; evidence.push("brand colors"); }
  if (content.brand_fonts) { score += 10; evidence.push("brand fonts"); }
  if (content.brand_logo) { score += 5; evidence.push("brand logo"); }
  if (content.brand_tone) { score += 3; evidence.push("brand tone"); }
  return { score: Math.min(100, score), measured: false, evidence: evidence.join(", "), unknown_reason: "Brand score is structural — actual brand compliance requires visual audit" };
}

export function scoreAllCategories(content: ContentScoreInput, layout: string | undefined, industry: string, location: string | undefined): Record<string, ScoreResult> {
  return {
    design_quality: scoreDesignQuality(content, layout),
    conversion: scoreConversionOpt(content),
    mobile: scoreMobileOpt(content),
    seo: scoreSeoFeatures(content),
    aeo: scoreAeoOpt(content),
    geo: scoreGeoOpt(content, location),
    performance: scorePerformanceOpt(content),
    accessibility: scoreAccessibilityOpt(content),
    content: scoreContentQuality(content, location),
    brand: scoreBrandCustomization(content),
  };
}

export const BENCHMARK_CATEGORY_WEIGHTS: Record<string, number> = {
  design_quality: 15,
  conversion: 15,
  mobile: 12,
  seo: 12,
  aeo: 10,
  geo: 10,
  performance: 8,
  accessibility: 8,
  content: 5,
  brand: 5,
};

export function computeWeightedOverall(scores: Record<string, number>): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [cat, score] of Object.entries(scores)) {
    weightedSum += score * (BENCHMARK_CATEGORY_WEIGHTS[cat] || 1);
    totalWeight += BENCHMARK_CATEGORY_WEIGHTS[cat] || 1;
  }
  return Math.round(weightedSum / totalWeight);
}

export function generateCategoryRecommendation(category: string, ourScore: number, benchmarkAvg: number, gap: number): string {
  if (gap >= 5) return `Exceeds top 5 generators by ${gap} points. Maintain current quality.`;
  if (gap >= -3) return `On par with top generators. Minor improvements possible.`;

  const recommendations: Record<string, string> = {
    design_quality: "Enhance visual hierarchy, typography spacing, and add premium imagery",
    conversion: "Add urgency signals, trust badges, stronger CTAs, and social proof",
    mobile: "Optimize touch targets, responsive breakpoints, and mobile-specific UX",
    seo: "Add semantic HTML, schema markup, optimize meta tags, and generate sitemap",
    aeo: "Add FAQ schema, answer-first content blocks, and structured data for AI Overview capture",
    geo: "Add local business schema, NAP consistency, local landmarks, and Google Business Profile integration",
    performance: "Optimize images, add lazy loading, reduce JS bundle, enable CDN",
    accessibility: "Improve contrast to AAA, add ARIA labels, ensure keyboard navigation, screen reader support",
    content: "Add unique local data, increase content differentiation above 60%, use 3+ sources per page",
    brand: "Align colors, fonts, imagery, and tone of voice with brand guidelines",
  };

  return recommendations[category] || "Review and enhance this category to meet benchmark standards.";
}