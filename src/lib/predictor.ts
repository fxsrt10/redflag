// ============================================
// RedFlag — Layoff Predictor Engine
// ============================================

import type { RiskScore, GlassdoorSnapshot, LawsuitSummary, LayoffEvent } from "@/types";

// ---------------------------------------------------------------------------
// Input / Output types
// ---------------------------------------------------------------------------

export interface FinancialData {
  /** Quarterly revenues ordered oldest-to-newest (at least 2 needed for YoY) */
  quarterlyRevenues: { quarter: string; revenue: number }[];
  /** Employee counts ordered oldest-to-newest */
  employeeCounts: { date: string; count: number }[];
  /** Most recent 90-day stock prices (oldest first) */
  stockPrices90d: { date: string; close: number }[];
  /** Free cash flow for most recent quarter */
  freeCashFlow: number | null;
  /** Cash burn rate per quarter (negative = burning) */
  burnRatePerQuarter: number | null;
}

export interface SentimentData {
  glassdoor: GlassdoorSnapshot | null;
}

export interface LawsuitData {
  summary: LawsuitSummary | null;
}

export interface NewsData {
  /** Count of articles matching layoff keywords in last 30 days */
  layoffArticleCount30d: number;
  /** Count of articles matching layoff keywords in prior 30 days */
  layoffArticleCountPrior30d: number;
  /** Total articles mentioning company in last 30 days (for density calc) */
  totalArticleCount30d: number;
}

export interface IndustryPeersData {
  /** Number of peer companies that announced layoffs in last 6 months */
  peersWithLayoffs6mo: number;
  /** Total number of peer companies tracked */
  totalPeersTracked: number;
}

export interface WarnFilingData {
  /** Number of WARN Act filings in last 12 months */
  warnFilings12mo: number;
}

export interface SecFilingData {
  /** Whether recent 8-K filings contain restructuring language */
  has8kRestructuringLanguage: boolean;
  /** Count of 8-K filings with restructuring language in last 12 months */
  restructuring8kCount12mo: number;
}

export interface PredictorInput {
  financial: FinancialData;
  sentiment: SentimentData;
  lawsuit: LawsuitData;
  news: NewsData;
  industryPeers: IndustryPeersData;
  warnFiling: WarnFilingData;
  secFiling: SecFilingData;
}

export type RiskTier = "very_low" | "low" | "moderate" | "high" | "very_high";

export interface SignalContribution {
  signal: string;
  rawScore: number; // 0-100
  weight: number;
  weighted: number;
  description: string;
  hasRealData: boolean;
}

export interface LayoffPrediction {
  probability: number; // 0-1
  riskTier: RiskTier;
  weightedSum: number; // 0-100
  confidence: number; // 0-1 ratio of real data signals
  topFactors: { signal: string; description: string; contribution: number }[];
  signals: SignalContribution[];
  computedAt: string; // ISO timestamp
}

// ---------------------------------------------------------------------------
// Signal weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  revenueDecline: 0.2,
  employeeTrajectory: 0.15,
  stockDecline: 0.12,
  cashFlow: 0.1,
  industryContagion: 0.1,
  glassdoorSentiment: 0.08,
  newsDensity: 0.08,
  lawsuitAcceleration: 0.07,
  warnFiling: 0.05,
  restructuring8k: 0.05,
} as const;

// ---------------------------------------------------------------------------
// Individual signal scorers — each returns 0-100 and a boolean for real data
// ---------------------------------------------------------------------------

function scoreRevenueDecline(
  financial: FinancialData
): { score: number; hasData: boolean; description: string } {
  const revs = financial.quarterlyRevenues;
  if (revs.length < 5) {
    return { score: 50, hasData: false, description: "Insufficient revenue data" };
  }
  // Compare most recent quarter to same quarter one year ago
  const recent = revs[revs.length - 1].revenue;
  const yearAgo = revs[revs.length - 5]?.revenue ?? revs[0].revenue;
  if (yearAgo <= 0) {
    return { score: 50, hasData: false, description: "Invalid prior revenue" };
  }
  const changePct = ((recent - yearAgo) / yearAgo) * 100;
  // Map: -30% or worse -> 100, +20% or better -> 0
  const score = clamp(mapRange(changePct, 20, -30, 0, 100), 0, 100);
  const direction = changePct >= 0 ? "up" : "down";
  return {
    score,
    hasData: true,
    description: `Revenue ${direction} ${Math.abs(changePct).toFixed(1)}% YoY`,
  };
}

function scoreEmployeeTrajectory(
  financial: FinancialData
): { score: number; hasData: boolean; description: string } {
  const counts = financial.employeeCounts;
  if (counts.length < 2) {
    return { score: 50, hasData: false, description: "Insufficient employee data" };
  }
  const recent = counts[counts.length - 1].count;
  const prior = counts[0].count;
  if (prior <= 0) {
    return { score: 50, hasData: false, description: "Invalid prior employee count" };
  }
  const changePct = ((recent - prior) / prior) * 100;
  // Shrinking workforce is a strong signal: -20% -> 100, +15% -> 0
  const score = clamp(mapRange(changePct, 15, -20, 0, 100), 0, 100);
  const direction = changePct >= 0 ? "grown" : "shrunk";
  return {
    score,
    hasData: true,
    description: `Workforce has ${direction} ${Math.abs(changePct).toFixed(1)}%`,
  };
}

function scoreStockDecline(
  financial: FinancialData
): { score: number; hasData: boolean; description: string } {
  const prices = financial.stockPrices90d;
  if (prices.length < 2) {
    return { score: 50, hasData: false, description: "Insufficient stock data" };
  }
  const start = prices[0].close;
  const end = prices[prices.length - 1].close;
  if (start <= 0) {
    return { score: 50, hasData: false, description: "Invalid stock price data" };
  }
  const changePct = ((end - start) / start) * 100;
  // -40% or worse -> 100, +20% or better -> 0
  const score = clamp(mapRange(changePct, 20, -40, 0, 100), 0, 100);
  const direction = changePct >= 0 ? "up" : "down";
  return {
    score,
    hasData: true,
    description: `Stock ${direction} ${Math.abs(changePct).toFixed(1)}% over 90 days`,
  };
}

function scoreCashFlow(
  financial: FinancialData
): { score: number; hasData: boolean; description: string } {
  if (financial.freeCashFlow === null && financial.burnRatePerQuarter === null) {
    return { score: 50, hasData: false, description: "No cash flow data" };
  }
  // If we have FCF, negative is bad
  if (financial.freeCashFlow !== null) {
    // Normalize: deeply negative -> 100, strongly positive -> 0
    // Use a reference range of -500M to +500M mapped to 100 to 0
    const fcf = financial.freeCashFlow;
    const score = clamp(mapRange(fcf, 500_000_000, -500_000_000, 0, 100), 0, 100);
    const state = fcf >= 0 ? "positive" : "negative";
    return {
      score,
      hasData: true,
      description: `Free cash flow is ${state} ($${formatCompact(fcf)})`,
    };
  }
  // Burn rate: higher burn -> higher risk
  const burn = financial.burnRatePerQuarter!;
  const score = clamp(mapRange(burn, 0, -200_000_000, 0, 100), 0, 100);
  return {
    score,
    hasData: true,
    description: `Burn rate: $${formatCompact(Math.abs(burn))}/quarter`,
  };
}

function scoreIndustryContagion(
  peers: IndustryPeersData
): { score: number; hasData: boolean; description: string } {
  if (peers.totalPeersTracked === 0) {
    return { score: 50, hasData: false, description: "No industry peer data" };
  }
  const ratio = peers.peersWithLayoffs6mo / peers.totalPeersTracked;
  // 0% peers with layoffs -> 0, 60%+ -> 100
  const score = clamp(mapRange(ratio, 0, 0.6, 0, 100), 0, 100);
  return {
    score,
    hasData: true,
    description: `${peers.peersWithLayoffs6mo}/${peers.totalPeersTracked} peers had layoffs recently`,
  };
}

function scoreGlassdoorSentiment(
  sentiment: SentimentData
): { score: number; hasData: boolean; description: string } {
  if (!sentiment.glassdoor) {
    return { score: 50, hasData: false, description: "No Glassdoor data" };
  }
  const gd = sentiment.glassdoor;
  // Combine overall rating + trend
  // Rating: 1.0 -> 100 risk, 5.0 -> 0 risk
  const ratingScore = clamp(mapRange(gd.overall, 5, 1, 0, 100), 0, 100);
  // Trend modifier
  const trendBonus: Record<string, number> = {
    improving: -15,
    stable: 0,
    declining: 15,
    rapidly_declining: 30,
  };
  const score = clamp(ratingScore + (trendBonus[gd.trend] ?? 0), 0, 100);
  return {
    score,
    hasData: true,
    description: `Glassdoor ${gd.overall.toFixed(1)}/5, trend: ${gd.trend.replace("_", " ")}`,
  };
}

function scoreNewsDensity(
  news: NewsData
): { score: number; hasData: boolean; description: string } {
  if (news.totalArticleCount30d === 0 && news.layoffArticleCount30d === 0) {
    return { score: 50, hasData: false, description: "No news data" };
  }
  // Density = layoff articles / total articles
  const density =
    news.totalArticleCount30d > 0
      ? news.layoffArticleCount30d / news.totalArticleCount30d
      : 0;
  // Acceleration of layoff mentions
  const accel =
    news.layoffArticleCountPrior30d > 0
      ? news.layoffArticleCount30d / news.layoffArticleCountPrior30d
      : news.layoffArticleCount30d > 0
        ? 2
        : 0;
  // Combine: density (0-0.5 -> 0-60) + acceleration (1-3 -> 0-40)
  const densityPart = clamp(mapRange(density, 0, 0.5, 0, 60), 0, 60);
  const accelPart = clamp(mapRange(accel, 1, 3, 0, 40), 0, 40);
  const score = clamp(densityPart + accelPart, 0, 100);
  return {
    score,
    hasData: true,
    description: `${news.layoffArticleCount30d} layoff articles in 30 days (density ${(density * 100).toFixed(0)}%)`,
  };
}

function scoreLawsuitAcceleration(
  lawsuit: LawsuitData
): { score: number; hasData: boolean; description: string } {
  if (!lawsuit.summary) {
    return { score: 50, hasData: false, description: "No lawsuit data" };
  }
  const accel = lawsuit.summary.filingAcceleration;
  const rate = lawsuit.summary.filingsPerThousandEmployees;
  // Acceleration: 0.5 (decelerating) -> 0, 3.0 (tripling) -> 70
  const accelScore = clamp(mapRange(accel, 0.5, 3, 0, 70), 0, 70);
  // Filing rate: 0 -> 0, 5+ per 1000 employees -> 30
  const rateScore = clamp(mapRange(rate, 0, 5, 0, 30), 0, 30);
  const score = clamp(accelScore + rateScore, 0, 100);
  return {
    score,
    hasData: true,
    description: `Lawsuit acceleration: ${accel.toFixed(1)}x, ${rate.toFixed(1)} filings per 1K employees`,
  };
}

function scoreWarnFiling(
  warn: WarnFilingData
): { score: number; hasData: boolean; description: string } {
  // Any WARN filing is a very strong signal
  const count = warn.warnFilings12mo;
  if (count === 0) {
    return { score: 0, hasData: true, description: "No WARN filings in last 12 months" };
  }
  // 1 filing -> 60, 3+ -> 100
  const score = clamp(mapRange(count, 0, 3, 0, 100), 60, 100);
  return {
    score,
    hasData: true,
    description: `${count} WARN Act filing(s) in last 12 months`,
  };
}

function scoreRestructuring8k(
  sec: SecFilingData
): { score: number; hasData: boolean; description: string } {
  if (!sec.has8kRestructuringLanguage && sec.restructuring8kCount12mo === 0) {
    return { score: 0, hasData: true, description: "No 8-K restructuring language detected" };
  }
  const count = sec.restructuring8kCount12mo;
  // 1 filing -> 50, 3+ -> 100
  const score = clamp(mapRange(count, 0, 3, 0, 100), 0, 100);
  return {
    score,
    hasData: true,
    description: `${count} 8-K filing(s) with restructuring language`,
  };
}

// ---------------------------------------------------------------------------
// Main prediction function
// ---------------------------------------------------------------------------

export function computeLayoffPrediction(data: PredictorInput): LayoffPrediction {
  const signalResults = [
    { key: "revenueDecline" as const, ...scoreRevenueDecline(data.financial) },
    { key: "employeeTrajectory" as const, ...scoreEmployeeTrajectory(data.financial) },
    { key: "stockDecline" as const, ...scoreStockDecline(data.financial) },
    { key: "cashFlow" as const, ...scoreCashFlow(data.financial) },
    { key: "industryContagion" as const, ...scoreIndustryContagion(data.industryPeers) },
    { key: "glassdoorSentiment" as const, ...scoreGlassdoorSentiment(data.sentiment) },
    { key: "newsDensity" as const, ...scoreNewsDensity(data.news) },
    { key: "lawsuitAcceleration" as const, ...scoreLawsuitAcceleration(data.lawsuit) },
    { key: "warnFiling" as const, ...scoreWarnFiling(data.warnFiling) },
    { key: "restructuring8k" as const, ...scoreRestructuring8k(data.secFiling) },
  ];

  const SIGNAL_LABELS: Record<string, string> = {
    revenueDecline: "Revenue Decline (YoY)",
    employeeTrajectory: "Employee Count Trajectory",
    stockDecline: "Stock Price Decline (90-day)",
    cashFlow: "Free Cash Flow / Burn Rate",
    industryContagion: "Industry Contagion",
    glassdoorSentiment: "Glassdoor Sentiment Trend",
    newsDensity: "News Signal Density",
    lawsuitAcceleration: "Lawsuit Acceleration",
    warnFiling: "WARN Filing History",
    restructuring8k: "8-K Restructuring Language",
  };

  const signals: SignalContribution[] = signalResults.map((r) => {
    const weight = WEIGHTS[r.key];
    return {
      signal: SIGNAL_LABELS[r.key],
      rawScore: r.score,
      weight,
      weighted: r.score * weight,
      description: r.description,
      hasRealData: r.hasData,
    };
  });

  const weightedSum = signals.reduce((sum, s) => sum + s.weighted, 0);

  // Sigmoid transformation
  const probability = sigmoid(weightedSum, 0.08, 50);

  // Risk tier
  const riskTier = getRiskTier(probability);

  // Confidence = ratio of signals with real data
  const realCount = signals.filter((s) => s.hasRealData).length;
  const confidence = realCount / signals.length;

  // Top 3 factors by weighted contribution (descending)
  const sortedSignals = [...signals].sort((a, b) => b.weighted - a.weighted);
  const topFactors = sortedSignals.slice(0, 3).map((s) => ({
    signal: s.signal,
    description: s.description,
    contribution: s.weighted,
  }));

  return {
    probability: round(probability, 4),
    riskTier,
    weightedSum: round(weightedSum, 2),
    confidence: round(confidence, 2),
    topFactors,
    signals,
    computedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Mock prediction from existing risk score
// ---------------------------------------------------------------------------

export function computeMockPrediction(riskScore: number): LayoffPrediction {
  // Map 0-100 risk score to a probability using the same sigmoid
  const probability = sigmoid(riskScore, 0.08, 50);
  const riskTier = getRiskTier(probability);

  const mockSignals: SignalContribution[] = [
    {
      signal: "Revenue Decline (YoY)",
      rawScore: clamp(riskScore * 1.1, 0, 100),
      weight: WEIGHTS.revenueDecline,
      weighted: clamp(riskScore * 1.1, 0, 100) * WEIGHTS.revenueDecline,
      description: "Estimated from composite risk score",
      hasRealData: false,
    },
    {
      signal: "Employee Count Trajectory",
      rawScore: clamp(riskScore * 0.9, 0, 100),
      weight: WEIGHTS.employeeTrajectory,
      weighted: clamp(riskScore * 0.9, 0, 100) * WEIGHTS.employeeTrajectory,
      description: "Estimated from composite risk score",
      hasRealData: false,
    },
    {
      signal: "Stock Price Decline (90-day)",
      rawScore: clamp(riskScore * 0.8, 0, 100),
      weight: WEIGHTS.stockDecline,
      weighted: clamp(riskScore * 0.8, 0, 100) * WEIGHTS.stockDecline,
      description: "Estimated from composite risk score",
      hasRealData: false,
    },
    {
      signal: "Free Cash Flow / Burn Rate",
      rawScore: riskScore,
      weight: WEIGHTS.cashFlow,
      weighted: riskScore * WEIGHTS.cashFlow,
      description: "Estimated from composite risk score",
      hasRealData: false,
    },
    {
      signal: "Industry Contagion",
      rawScore: clamp(riskScore * 0.7, 0, 100),
      weight: WEIGHTS.industryContagion,
      weighted: clamp(riskScore * 0.7, 0, 100) * WEIGHTS.industryContagion,
      description: "Estimated from composite risk score",
      hasRealData: false,
    },
    {
      signal: "Glassdoor Sentiment Trend",
      rawScore: clamp(riskScore * 0.85, 0, 100),
      weight: WEIGHTS.glassdoorSentiment,
      weighted: clamp(riskScore * 0.85, 0, 100) * WEIGHTS.glassdoorSentiment,
      description: "Estimated from composite risk score",
      hasRealData: false,
    },
    {
      signal: "News Signal Density",
      rawScore: clamp(riskScore * 0.6, 0, 100),
      weight: WEIGHTS.newsDensity,
      weighted: clamp(riskScore * 0.6, 0, 100) * WEIGHTS.newsDensity,
      description: "Estimated from composite risk score",
      hasRealData: false,
    },
    {
      signal: "Lawsuit Acceleration",
      rawScore: clamp(riskScore * 0.75, 0, 100),
      weight: WEIGHTS.lawsuitAcceleration,
      weighted: clamp(riskScore * 0.75, 0, 100) * WEIGHTS.lawsuitAcceleration,
      description: "Estimated from composite risk score",
      hasRealData: false,
    },
    {
      signal: "WARN Filing History",
      rawScore: riskScore > 70 ? 60 : 0,
      weight: WEIGHTS.warnFiling,
      weighted: (riskScore > 70 ? 60 : 0) * WEIGHTS.warnFiling,
      description: "Estimated from composite risk score",
      hasRealData: false,
    },
    {
      signal: "8-K Restructuring Language",
      rawScore: riskScore > 60 ? 50 : 0,
      weight: WEIGHTS.restructuring8k,
      weighted: (riskScore > 60 ? 50 : 0) * WEIGHTS.restructuring8k,
      description: "Estimated from composite risk score",
      hasRealData: false,
    },
  ];

  const weightedSum = mockSignals.reduce((sum, s) => sum + s.weighted, 0);
  const sortedSignals = [...mockSignals].sort((a, b) => b.weighted - a.weighted);

  return {
    probability: round(probability, 4),
    riskTier,
    weightedSum: round(weightedSum, 2),
    confidence: 0,
    topFactors: sortedSignals.slice(0, 3).map((s) => ({
      signal: s.signal,
      description: s.description,
      contribution: s.weighted,
    })),
    signals: mockSignals,
    computedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function sigmoid(x: number, k: number, midpoint: number): number {
  return 1 / (1 + Math.exp(-k * (x - midpoint)));
}

function getRiskTier(probability: number): RiskTier {
  if (probability < 0.1) return "very_low";
  if (probability < 0.25) return "low";
  if (probability < 0.5) return "moderate";
  if (probability < 0.75) return "high";
  return "very_high";
}

/** Linearly map value from [inLow, inHigh] to [outLow, outHigh] */
function mapRange(
  value: number,
  inLow: number,
  inHigh: number,
  outLow: number,
  outHigh: number
): number {
  if (inLow === inHigh) return (outLow + outHigh) / 2;
  return outLow + ((value - inLow) / (inHigh - inLow)) * (outHigh - outLow);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}
