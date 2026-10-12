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

export function scoreDesignQuality(content: ContentScoreInput, layout?: string): number {
  let score = 72;
  if (layout === "bento_box" || layout === "glassmorphism") score += 12;
  else if (layout === "bold_minimal" || layout === "split_screen") score += 10;
  else if (layout === "kinetic_typography" || layout === "three_d_hero") score += 8;
  else if (layout) score += 5;
  if (content.hero && content.hero.length > 100) score += 5;
  if (content.gallery) score += 5;
  if (content.testimonials && content.testimonials.length >= 3) score += 3;
  if (content.video) score += 3;
  return Math.min(100, score);
}

export function scoreConversionOpt(content: ContentScoreInput): number {
  let score = 68;
  if (content.hero && /call|book|quote|free|now/i.test(content.hero)) score += 12;
  if (content.cta_buttons && content.cta_buttons.length >= 2) score += 10;
  if (content.trust_badges) score += 5;
  if (content.urgency_signals) score += 5;
  return Math.min(100, score);
}

export function scoreMobileOpt(content: ContentScoreInput): number {
  let score = 78;
  if (content.responsive) score += 12;
  if (content.touch_targets_optimized) score += 5;
  if (content.lazy_loaded) score += 5;
  return Math.min(100, score);
}

export function scoreSeoFeatures(content: ContentScoreInput): number {
  let score = 62;
  if (content.meta_title && content.meta_title.length > 30) score += 10;
  if (content.meta_description && content.meta_description.length > 120) score += 10;
  if (content.schema_markup) score += 10;
  if (content.semantic_html) score += 5;
  if (content.sitemap) score += 3;
  return Math.min(100, score);
}

export function scoreAeoOpt(content: ContentScoreInput): number {
  let score = 55;
  if (content.faq && content.faq.length >= 5) score += 20;
  if (content.faq_schema) score += 10;
  if (content.answer_first_content) score += 10;
  if (content.structured_data) score += 5;
  return Math.min(100, score);
}

export function scoreGeoOpt(content: ContentScoreInput, location?: string): number {
  let score = 55;
  if (location) score += 15;
  if (content.local_schema) score += 10;
  if (content.nap_consistent) score += 10;
  if (content.local_landmarks) score += 5;
  if (content.google_business_profile) score += 5;
  return Math.min(100, score);
}

export function scorePerformanceOpt(content: ContentScoreInput): number {
  let score = 72;
  if (content.image_optimized) score += 10;
  if (content.lazy_loaded) score += 10;
  if (content.minimal_js) score += 5;
  if (content.cdn_enabled) score += 3;
  return Math.min(100, score);
}

export function scoreAccessibilityOpt(content: ContentScoreInput): number {
  let score = 68;
  if (content.aria_labels) score += 10;
  if (content.keyboard_nav) score += 10;
  if (content.contrast_aaa) score += 8;
  if (content.screen_reader) score += 4;
  return Math.min(100, score);
}

export function scoreContentQuality(content: ContentScoreInput, location?: string): number {
  let score = 62;
  if (content.unique_local_data) score += 20;
  if (content.multi_source) score += 10;
  if (content.value_beyond_template) score += 5;
  if (content.differentiation_rate && content.differentiation_rate >= 60) score += 3;
  return Math.min(100, score);
}

export function scoreBrandCustomization(content: ContentScoreInput): number {
  let score = 72;
  if (content.brand_colors) score += 10;
  if (content.brand_fonts) score += 10;
  if (content.brand_logo) score += 5;
  if (content.brand_tone) score += 3;
  return Math.min(100, score);
}

export function scoreAllCategories(content: ContentScoreInput, layout: string | undefined, industry: string, location: string | undefined): Record<string, number> {
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