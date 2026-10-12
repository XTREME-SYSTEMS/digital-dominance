import {
  scoreAllCategories,
  computeWeightedOverall,
  generateCategoryRecommendation,
  type ContentScoreInput,
} from "../../shared/templateScoring.ts";

// ============================================================
// Website Benchmark System
// Benchmarks templates against top 5 website generators (2026):
// Wix, GoDaddy Airo, Hostinger AI, Squarespace, Figma Make
// Uses all categories that judge a website's quality
// ============================================================

interface BenchmarkRequest {
  templateContent: ContentScoreInput;
  templateLayout?: string;
  industry: string;
  location?: string;
  compareAgainst?: string[];
}

interface CategoryScore {
  category: string;
  weight: number;
  ourScore: number;
  benchmarkAvg: number;
  gap: number;
  status: "exceeds" | "meets" | "below" | "critical";
  generatorScores: Record<string, number>;
  recommendation: string;
}

export async function handler(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const body: BenchmarkRequest = await req.json();
    const { templateContent, templateLayout, industry, location } = body;

    if (!templateContent || !industry) {
      return new Response(JSON.stringify({ error: "Template content and industry required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // Top 5 generators benchmark data (2026 ratings)
    const generators = {
      wix: { rating: 5.0, categories: { design_quality: 90, conversion: 88, mobile: 92, seo: 85, aeo: 70, geo: 80, performance: 82, accessibility: 88, content: 75, brand: 90 } },
      godaddy_airo: { rating: 4.5, categories: { design_quality: 78, conversion: 82, mobile: 85, seo: 80, aeo: 65, geo: 75, performance: 80, accessibility: 78, content: 70, brand: 75 } },
      hostinger_ai: { rating: 4.8, categories: { design_quality: 82, conversion: 85, mobile: 88, seo: 82, aeo: 72, geo: 78, performance: 88, accessibility: 80, content: 72, brand: 78 } },
      squarespace: { rating: 4.7, categories: { design_quality: 95, conversion: 80, mobile: 90, seo: 85, aeo: 68, geo: 72, performance: 82, accessibility: 85, content: 78, brand: 92 } },
      figma_make: { rating: 4.6, categories: { design_quality: 93, conversion: 75, mobile: 85, seo: 70, aeo: 60, geo: 65, performance: 85, accessibility: 90, content: 75, brand: 88 } },
    };

    // Score our template across all categories
    const ourScores = scoreAllCategories(templateContent, templateLayout, industry, location);
    const overallScore = computeWeightedOverall(ourScores);

    // Build comparison across all categories
    const categoryResults: CategoryScore[] = [];
    const categories = [
      { id: "design_quality", name: "Design Quality", weight: 15 },
      { id: "conversion", name: "Conversion Optimization", weight: 15 },
      { id: "mobile", name: "Mobile Optimization", weight: 12 },
      { id: "seo", name: "SEO Features", weight: 12 },
      { id: "aeo", name: "AEO (AI Engine)", weight: 10 },
      { id: "geo", name: "GEO (Local Search)", weight: 10 },
      { id: "performance", name: "Performance & Speed", weight: 8 },
      { id: "accessibility", name: "Accessibility (WCAG 2.1)", weight: 8 },
      { id: "content", name: "Content Quality", weight: 5 },
      { id: "brand", name: "Brand Customization", weight: 5 },
    ];

    let categoriesExceeding = 0;
    let categoriesBelow = 0;
    let categoriesCritical = 0;

    for (const cat of categories) {
      const ourScore = ourScores[cat.id] || 0;
      const generatorScores: Record<string, number> = {};
      let benchmarkSum = 0;

      for (const [gen, data] of Object.entries(generators)) {
        const genScore = data.categories[cat.id] || 0;
        generatorScores[gen] = genScore;
        benchmarkSum += genScore;
      }
      const benchmarkAvg = Math.round(benchmarkSum / Object.keys(generators).length);

      const gap = ourScore - benchmarkAvg;
      let status: CategoryScore["status"];
      if (gap >= 5) { status = "exceeds"; categoriesExceeding++; }
      else if (gap >= -3) { status = "meets"; }
      else if (gap >= -10) { status = "below"; categoriesBelow++; }
      else { status = "critical"; categoriesCritical++; }

      const recommendation = generateCategoryRecommendation(cat.id, ourScore, benchmarkAvg, gap);

      categoryResults.push({
        category: cat.name,
        weight: cat.weight,
        ourScore,
        benchmarkAvg,
        gap,
        status,
        generatorScores,
        recommendation,
      });
    }

    const benchmarkOverallAvg = Math.round(
      Object.values(generators).reduce((sum, g) => sum + g.rating * 20, 0) / Object.keys(generators).length
    );

    const overallGap = overallScore - benchmarkOverallAvg;
    let overallStatus: "dominant" | "competitive" | "behind" | "critical";
    if (overallGap >= 5) overallStatus = "dominant";
    else if (overallGap >= -3) overallStatus = "competitive";
    else if (overallGap >= -10) overallStatus = "behind";
    else overallStatus = "critical";

    const enhancementPriority = categoryResults
      .filter((c) => c.status === "below" || c.status === "critical")
      .sort((a, b) => a.gap - b.gap)
      .map((c) => ({
        category: c.category,
        currentScore: c.ourScore,
        benchmarkAvg: c.benchmarkAvg,
        gap: c.gap,
        recommendation: c.recommendation,
        priority: c.status === "critical" ? "critical" : "high",
      }));

    return new Response(
      JSON.stringify({
        status: "success",
        industry,
        location: location || "nationwide",
        templateLayout: templateLayout || "default",
        overallScore,
        benchmarkOverallAvg,
        overallGap,
        overallStatus,
        categoriesExceeding,
        categoriesBelow,
        categoriesCritical,
        totalCategories: categories.length,
        categoryResults,
        enhancementPriority,
        generatorsBenchmarked: Object.entries(generators).map(([id, data]) => ({
          id,
          name: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          rating: data.rating,
          overallScore: Math.round(
            Object.values(data.categories).reduce((s, v) => s + v, 0) / Object.keys(data.categories).length
          ),
        })),
        mandate: {
          targetScore: 100,
          currentScore: overallScore,
          distanceTo100: 100 - overallScore,
          mustEnhance: overallScore < 100,
          criticalCategories: categoriesCritical,
          estimatedCyclesToConverge: Math.ceil((100 - overallScore) / 8),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Benchmark system error:", err);
    return new Response(
      JSON.stringify({ error: err.message, status: "failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export default handler;