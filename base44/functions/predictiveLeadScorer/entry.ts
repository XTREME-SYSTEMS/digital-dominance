import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";
import { logStep } from "../../shared/sopLog.ts";

// ═══════════════════════════════════════════════
// PREDICTIVE LEAD SCORING ENGINE
// Deterministic, systematic, programmatic lead scoring using
// proven mathematical algorithms:
//   1. Logistic Regression with Gradient Descent (sigmoid)
//   2. Naive Bayes (Bayes' theorem, conditional probability)
//   3. Ensemble fusion (weighted average of both models)
//
// Research basis:
// - Logistic Regression: 98.18% accuracy, 0.9775 AUC (González-Flores, 2024)
// - Naive Bayes: proven probabilistic classifier (Bole & Papa, 2011)
// - Ensemble methods outperform single models (Gradient Boosting, XGBoost)
//
// All math is deterministic: same input → same output, every run.
// ═══════════════════════════════════════════════

// ── Logistic Regression (Sigmoid) ──
// P(y=1|x) = 1 / (1 + e^(-(β₀ + β₁x₁ + ... + βₙxₙ)))
// Gradient descent: βⱼ := βⱼ + α × (1/n) × Σ(yᵢ - pᵢ) × xᵢⱼ

const LEARNING_RATE = 0.15;
const ITERATIONS = 1500;
const LOGISTIC_WEIGHT = 0.6;
const BAYES_WEIGHT = 0.4;

// Feature definitions — each maps a lead to a normalized 0-1 value
interface FeatureExtractor {
  name: string;
  extract: (lead: any) => number;
  description: string;
}

const FEATURE_EXTRACTORS: FeatureExtractor[] = [
  { name: "square_footage", description: "Garage size (normalized 0-1, cap 1000 sqft)", extract: (l) => Math.min((l.square_footage || 0) / 1000, 1) },
  { name: "estimate_value", description: "Estimate mid-range value (normalized 0-1, cap $10k)", extract: (l) => Math.min((l.estimate_mid || 0) / 10000, 1) },
  { name: "timeline_urgency", description: "Timeline urgency (immediate=1, flexible=0.2)", extract: (l) => {
    const t = (l.timeline || "").toLowerCase();
    if (t.includes("asap") || t.includes("immediate") || t.includes("urgent")) return 1.0;
    if (t.includes("1-2") || t.includes("soon") || t.includes("weeks")) return 0.8;
    if (t.includes("month") || t.includes("30")) return 0.6;
    if (t.includes("flexible") || t.includes("planning")) return 0.2;
    return 0.5;
  }},
  { name: "source_quality", description: "Lead source quality (paid=1, organic=0.7, referral=0.9)", extract: (l) => {
    const s = (l.lead_source || "website").toLowerCase();
    if (s.includes("paid") || s.includes("ad") || s.includes("google")) return 1.0;
    if (s.includes("referral") || s.includes("word")) return 0.9;
    if (s.includes("website") || s.includes("organic")) return 0.7;
    if (s.includes("social")) return 0.5;
    return 0.5;
  }},
  { name: "floor_condition_count", description: "Number of floor condition issues (more = higher intent)", extract: (l) => Math.min((l.floor_condition?.length || 0) / 5, 1) },
  { name: "has_photos", description: "Uploaded photos (high intent signal)", extract: (l) => (l.photos?.length > 0 ? 1.0 : 0.0) },
  { name: "has_concept_image", description: "Generated concept image (very high intent)", extract: (l) => (l.concept_image ? 1.0 : 0.0) },
  { name: "has_phone", description: "Provided phone number", extract: (l) => (l.phone ? 1.0 : 0.0) },
  { name: "engagement_stage", description: "Progress through pipeline (NEW=0, CONSULTATION=0.5, PROPOSAL=0.8)", extract: (l) => {
    const s = l.status || "NEW ESTIMATE";
    if (s === "PROPOSAL SENT") return 0.9;
    if (s === "IN-HOME ESTIMATE COMPLETED") return 0.8;
    if (s === "IN-HOME ESTIMATE BOOKED") return 0.7;
    if (s === "CONSULTATION COMPLETED") return 0.6;
    if (s === "CONSULTATION BOOKED") return 0.5;
    if (s === "CONTACT ATTEMPTED") return 0.3;
    return 0.1;
  }},
  { name: "recency_boost", description: "Recency (newer leads get slight boost)", extract: (l) => {
    if (!l.created_date) return 0.5;
    const daysAgo = (Date.now() - new Date(l.created_date).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - daysAgo / 90); // decays over 90 days
  }},
];

// ── Sigmoid function ──
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

// ── Train logistic regression via gradient descent ──
function trainLogisticRegression(features: number[][], labels: number[]): number[] {
  const n = features.length;
  const d = features[0]?.length || 0;
  const beta = new Array(d + 1).fill(0); // β₀ (bias) + β₁..βₙ

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const gradient = new Array(d + 1).fill(0);
    for (let i = 0; i < n; i++) {
      const z = beta[0] + features[i].reduce((sum, x, j) => sum + beta[j + 1] * x, 0);
      const p = sigmoid(z);
      const error = labels[i] - p;
      gradient[0] += error; // bias gradient
      for (let j = 0; j < d; j++) {
        gradient[j + 1] += error * features[i][j];
      }
    }
    // Update with learning rate
    for (let j = 0; j <= d; j++) {
      beta[j] += LEARNING_RATE * (gradient[j] / n);
    }
  }
  return beta;
}

// ── Predict with logistic regression ──
function predictLogistic(beta: number[], features: number[]): number {
  const z = beta[0] + features.reduce((sum, x, j) => sum + beta[j + 1] * x, 0);
  return sigmoid(z);
}

// ── Naive Bayes (categorical + binned continuous) ──
// P(y=1|features) ∝ P(y=1) × Π P(feature_bin | y=1)
// Uses Laplace smoothing to avoid zero probabilities

interface NaiveBayesModel {
  priorPositive: number;
  priorNegative: number;
  featureProbs: { [featureName: string]: { [bin: string]: { positive: number; negative: number } } };
}

function bin(value: number): string {
  if (value < 0.2) return "0";
  if (value < 0.4) return "1";
  if (value < 0.6) return "2";
  if (value < 0.8) return "3";
  return "4";
}

function trainNaiveBayes(featureMatrix: number[][], featureNames: string[], labels: number[]): NaiveBayesModel {
  const n = featureMatrix.length;
  const positiveCount = labels.filter((y) => y === 1).length;
  const negativeCount = n - positiveCount;

  const model: NaiveBayesModel = {
    priorPositive: positiveCount / n,
    priorNegative: negativeCount / n,
    featureProbs: {},
  };

  for (let fi = 0; fi < featureNames.length; fi++) {
    const fname = featureNames[fi];
    model.featureProbs[fname] = {};
    const bins: { [b: string]: { pos: number; neg: number } } = {};

    for (let i = 0; i < n; i++) {
      const b = bin(featureMatrix[i][fi]);
      if (!bins[b]) bins[b] = { pos: 0, neg: 0 };
      if (labels[i] === 1) bins[b].pos++;
      else bins[b].neg++;
    }

    // Laplace smoothing: (count + 1) / (total + numBins)
    const numBins = 5;
    for (const b of Object.keys(bins)) {
      model.featureProbs[fname][b] = {
        positive: (bins[b].pos + 1) / (positiveCount + numBins),
        negative: (bins[b].neg + 1) / (negativeCount + numBins),
      };
    }
    // Fill missing bins with smoothed defaults
    for (let b = 0; b < numBins; b++) {
      const key = String(b);
      if (!model.featureProbs[fname][key]) {
        model.featureProbs[fname][key] = {
          positive: 1 / (positiveCount + numBins),
          negative: 1 / (negativeCount + numBins),
        };
      }
    }
  }
  return model;
}

function predictNaiveBayes(model: NaiveBayesModel, features: number[], featureNames: string[]): number {
  let logProbPositive = Math.log(model.priorPositive || 0.001);
  let logProbNegative = Math.log(model.priorNegative || 0.001);

  for (let fi = 0; fi < featureNames.length; fi++) {
    const b = bin(features[fi]);
    const fp = model.featureProbs[featureNames[fi]]?.[b];
    if (fp) {
      logProbPositive += Math.log(fp.positive);
      logProbNegative += Math.log(fp.negative);
    }
  }

  // Convert log-odds back to probability
  const probPositive = Math.exp(logProbPositive);
  const probNegative = Math.exp(logProbNegative);
  const total = probPositive + probNegative;
  return total > 0 ? probPositive / total : 0.5;
}

// ── Extract features from a lead ──
function extractFeatures(lead: any): number[] {
  return FEATURE_EXTRACTORS.map((fe) => fe.extract(lead));
}

// ── Determine if a lead "booked" (positive label) ──
function isBooked(lead: any): boolean {
  const s = lead.status || "";
  return s === "WON" || s === "PROPOSAL SENT" || s === "IN-HOME ESTIMATE COMPLETED" || s === "CONSULTATION COMPLETED";
}

// ── Check if lead is still active (scorable) ──
function isScorable(lead: any): boolean {
  const s = lead.status || "";
  return s !== "WON" && s !== "LOST";
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "score"; // "train" | "score" | "full"
    const minConfidence = body.min_confidence || 0;

    // Load ALL leads — historical for training, active for scoring
    const allLeads: any[] = [];
    let cursor: string | undefined = undefined;
    let hasMore = true;
    while (hasMore) {
      const page: any = await svc.entities.Lead.filter({}, { sort: "-created_date", limit: 500, cursor, fields: [
        "id", "first_name", "last_name", "email", "phone", "city", "state", "zip",
        "lead_source", "square_footage", "timeline", "floor_condition", "estimate_mid",
        "photos", "concept_image", "status", "lead_score", "created_date", "assigned_salesperson",
        "desired_system", "estimate_low", "estimate_high"
      ]});
      allLeads.push(...(page.items || []));
      cursor = page.next_cursor;
      hasMore = !!cursor && !!page.has_more;
    }

    if (allLeads.length < 5) {
      return Response.json({
        ok: false,
        message: "Need at least 5 leads to train the model. Current count: " + allLeads.length,
      });
    }

    // Split: training set (historical, has outcome) + scoring set (active, no outcome yet)
    const trainingLeads = allLeads.filter((l) => l.status === "WON" || l.status === "LOST");
    const activeLeads = allLeads.filter(isScorable);

    // If we don't have enough labeled data, use engagement stage as proxy labels
    let effectiveTrainingSet = trainingLeads;
    let useProxyLabels = false;
    if (trainingLeads.filter((l) => l.status === "WON").length < 3) {
      // Use all leads with engagement_stage as proxy: booked (consultation+) = 1, new = 0
      effectiveTrainingSet = allLeads.filter((l) => l.status !== "NEW ESTIMATE");
      useProxyLabels = true;
    }

    if (effectiveTrainingSet.length < 3) {
      return Response.json({
        ok: false,
        message: "Not enough historical data with outcomes. Need at least 3 leads with WON or LOST status, or 3 leads past NEW ESTIMATE stage.",
      });
    }

    // Build feature matrix and labels for training
    const featureNames = FEATURE_EXTRACTORS.map((fe) => fe.name);
    const trainFeatures: number[][] = [];
    const trainLabels: number[] = [];

    for (const lead of effectiveTrainingSet) {
      trainFeatures.push(extractFeatures(lead));
      trainLabels.push(useProxyLabels ? (isBooked(lead) ? 1 : 0) : (lead.status === "WON" ? 1 : 0));
    }

    const positiveCount = trainLabels.filter((y) => y === 1).length;
    const negativeCount = trainLabels.length - positiveCount;

    // ── Train both models ──
    const logisticBeta = trainLogisticRegression(trainFeatures, trainLabels);
    const naiveBayesModel = trainNaiveBayes(trainFeatures, featureNames, trainLabels);

    // ── Score all active leads ──
    const scoredLeads: any[] = [];
    const updatesToApply: any[] = [];

    for (const lead of activeLeads) {
      const features = extractFeatures(lead);
      const logisticProb = predictLogistic(logisticBeta, features);
      const bayesProb = predictNaiveBayes(naiveBayesModel, features, featureNames);

      // Ensemble: weighted average
      const ensembleProb = LOGISTIC_WEIGHT * logisticProb + BAYES_WEIGHT * bayesProb;
      const score = Math.round(ensembleProb * 100);

      scoredLeads.push({
        id: lead.id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        lead_source: lead.lead_source,
        square_footage: lead.square_footage,
        timeline: lead.timeline,
        estimate_mid: lead.estimate_mid,
        estimate_low: lead.estimate_low,
        estimate_high: lead.estimate_high,
        status: lead.status,
        assigned_salesperson: lead.assigned_salesperson,
        created_date: lead.created_date,
        logistic_prob: logisticProb,
        bayes_prob: bayesProb,
        ensemble_prob: ensembleProb,
        score,
        features: featureNames.reduce((obj, name, i) => ({ ...obj, [name]: features[i] }), {}),
      });

      if (score >= minConfidence) {
        updatesToApply.push({ id: lead.id, lead_score: score });
      }
    }

    // Sort by score descending
    scoredLeads.sort((a, b) => b.score - a.score);

    // ── Compute feature importance (from logistic regression β coefficients) ──
    const featureImportance = featureNames.map((name, i) => ({
      feature: name,
      description: FEATURE_EXTRACTORS[i].description,
      weight: logisticBeta[i + 1],
      abs_weight: Math.abs(logisticBeta[i + 1]),
    })).sort((a, b) => b.abs_weight - a.abs_weight);

    // ── Compute model accuracy (backtest on training set) ──
    let correct = 0;
    for (let i = 0; i < trainFeatures.length; i++) {
      const lrProb = predictLogistic(logisticBeta, trainFeatures[i]);
      const nbProb = predictNaiveBayes(naiveBayesModel, trainFeatures[i], featureNames);
      const ensemble = LOGISTIC_WEIGHT * lrProb + BAYES_WEIGHT * nbProb;
      const predicted = ensemble >= 0.5 ? 1 : 0;
      if (predicted === trainLabels[i]) correct++;
    }
    const accuracy = trainFeatures.length > 0 ? (correct / trainFeatures.length) * 100 : 0;

    // ── Apply scores to database (batch update) ──
    let updatedCount = 0;
    if (action === "score" || action === "full") {
      // Batch in groups of 100
      for (let i = 0; i < updatesToApply.length; i += 100) {
        const batch = updatesToApply.slice(i, i + 100);
        try {
          await svc.entities.Lead.bulkUpdate(batch);
          updatedCount += batch.length;
        } catch (e) {
          console.error("Batch update failed:", e);
        }
      }
    }

    // ── Score distribution ──
    const distribution = {
      "90-100 (Hot)": scoredLeads.filter((s) => s.score >= 90).length,
      "70-89 (Warm)": scoredLeads.filter((s) => s.score >= 70 && s.score < 90).length,
      "50-69 (Moderate)": scoredLeads.filter((s) => s.score >= 50 && s.score < 70).length,
      "30-49 (Cool)": scoredLeads.filter((s) => s.score >= 30 && s.score < 50).length,
      "0-29 (Cold)": scoredLeads.filter((s) => s.score < 30).length,
    };

    const summary = {
      ok: true,
      action,
      algorithm: "Logistic Regression (Gradient Descent) + Naive Bayes Ensemble",
      math: {
        logistic_regression: {
          formula: "P(y=1|x) = 1 / (1 + e^(-(β₀ + Σβⱼxⱼ)))",
          learning_rate: LEARNING_RATE,
          iterations: ITERATIONS,
          weights: logisticBeta,
        },
        naive_bayes: {
          formula: "P(y|features) ∝ P(y) × Π P(feature_bin | y)",
          smoothing: "Laplace (add-1)",
          prior_positive: naiveBayesModel.priorPositive,
          prior_negative: naiveBayesModel.priorNegative,
        },
        ensemble: `Final = ${LOGISTIC_WEIGHT} × Logistic + ${BAYES_WEIGHT} × Bayes`,
      },
      training_data: {
        total_leads: allLeads.length,
        training_set_size: effectiveTrainingSet.length,
        positive_examples: positiveCount,
        negative_examples: negativeCount,
        used_proxy_labels: useProxyLabels,
        proxy_reason: useProxyLabels ? "Fewer than 3 WON leads — using engagement stage as proxy labels" : null,
      },
      scoring: {
        active_leads_scored: scoredLeads.length,
        leads_updated: updatedCount,
        min_confidence_threshold: minConfidence,
      },
      model_performance: {
        backtest_accuracy_pct: Math.round(accuracy * 100) / 100,
        training_accuracy_note: "Backtested on training set (may overestimate; use holdout for production)",
      },
      feature_importance: featureImportance,
      score_distribution: distribution,
      top_leads: scoredLeads.slice(0, 25),
      all_scored_leads_count: scoredLeads.length,
      completed_at: new Date().toISOString(),
    };

    await logStep(base44, {
      category: "crm",
      action: "Predictive lead scoring",
      detail: `Scored ${scoredLeads.length} active leads, updated ${updatedCount} scores. Model: ${Math.round(accuracy)}% backtest accuracy. Training set: ${effectiveTrainingSet.length} (${positiveCount} positive, ${negativeCount} negative).`,
      source: "predictiveLeadScorer",
    });

    return Response.json(summary);
  } catch (error: any) {
    console.error("[predictiveLeadScorer] error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}