import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Stub import — replace with real predictor when available
// import { predict } from "@/lib/predictor";

const CRON_SECRET = process.env.CRON_SECRET;

const TIME_HORIZONS = ["30d", "90d", "180d"] as const;

export async function POST(request: NextRequest) {
  // Validate CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = authHeader?.replace("Bearer ", "");

  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();
    const today = new Date().toISOString().split("T")[0];

    // Get all companies
    const companies = await sql`SELECT id, name, employee_count, industry FROM companies`;

    if (companies.length === 0) {
      return NextResponse.json({ updated: 0, message: "No companies found in database" });
    }

    let updated = 0;

    for (const company of companies) {
      const companyId = company.id;

      // Fetch signals for prediction in parallel
      const [financialRows, sentimentRows, lawsuitRows, newsRows, riskRows] =
        await Promise.all([
          sql`
            SELECT * FROM financial_snapshots
            WHERE company_id = ${companyId}
            ORDER BY snapshot_date DESC
            LIMIT 2
          `,
          sql`
            SELECT * FROM sentiment_snapshots
            WHERE company_id = ${companyId}
            ORDER BY snapshot_date DESC
            LIMIT 2
          `,
          sql`
            SELECT COUNT(*)::int AS count
            FROM lawsuits
            WHERE company_id = ${companyId}
              AND filed_date >= CURRENT_DATE - INTERVAL '6 months'
          `,
          sql`
            SELECT COUNT(*)::int AS total,
                   SUM(CASE WHEN is_layoff_related THEN 1 ELSE 0 END)::int AS layoff_related
            FROM news_items
            WHERE company_id = ${companyId}
              AND published_date >= CURRENT_DATE - INTERVAL '3 months'
          `,
          sql`
            SELECT * FROM risk_scores
            WHERE company_id = ${companyId}
            ORDER BY score_date DESC
            LIMIT 1
          `,
        ]);

      // Build signal object for the predictor
      const latestFinancial = financialRows[0];
      const priorFinancial = financialRows[1];
      const latestSentiment = sentimentRows[0];
      const priorSentiment = sentimentRows[1];
      const latestRisk = riskRows[0];
      const lawsuitCount = lawsuitRows[0]?.count ?? 0;
      const layoffNewsCount = newsRows[0]?.layoff_related ?? 0;

      const signals = {
        riskScore: latestRisk ? Number(latestRisk.overall_score) : null,
        riskLevel: latestRisk?.risk_level ?? null,
        glassdoorCurrent: latestSentiment
          ? Number(latestSentiment.overall_rating)
          : null,
        glassdoorDelta:
          latestSentiment && priorSentiment
            ? Number(latestSentiment.overall_rating) -
              Number(priorSentiment.overall_rating)
            : null,
        revenueGrowthPct: latestFinancial
          ? Number(latestFinancial.revenue_growth_yoy_pct)
          : null,
        employeeChangePct: latestFinancial
          ? Number(latestFinancial.employee_change_pct)
          : null,
        stockPriceChange30d: latestFinancial
          ? Number(latestFinancial.price_change_30d_pct)
          : null,
        stockPriceChange90d: latestFinancial
          ? Number(latestFinancial.price_change_90d_pct)
          : null,
        revenuePerEmployee: latestFinancial
          ? Number(latestFinancial.revenue_per_employee)
          : null,
        priorRevenuePerEmployee: priorFinancial
          ? Number(priorFinancial.revenue_per_employee)
          : null,
        debtToEquity: latestFinancial
          ? Number(latestFinancial.debt_to_equity)
          : null,
        freeCashFlow: latestFinancial
          ? Number(latestFinancial.free_cash_flow)
          : null,
        lawsuitCount6mo: lawsuitCount,
        layoffNewsCount3mo: layoffNewsCount,
      };

      // Run prediction for each time horizon
      // When @/lib/predictor is ready, replace stubPredict with: predict(signals, horizon)
      for (const horizon of TIME_HORIZONS) {
        const prediction = stubPredict(signals, horizon);

        await sql`
          INSERT INTO layoff_predictions (
            company_id, prediction_date, probability, risk_tier,
            confidence, time_horizon, signals, top_factors
          ) VALUES (
            ${companyId}, ${today}, ${prediction.probability},
            ${prediction.riskTier}, ${prediction.confidence},
            ${horizon}, ${JSON.stringify(signals)},
            ${prediction.topFactors}
          )
          ON CONFLICT (company_id, prediction_date, time_horizon)
          DO UPDATE SET
            probability = EXCLUDED.probability,
            risk_tier = EXCLUDED.risk_tier,
            confidence = EXCLUDED.confidence,
            signals = EXCLUDED.signals,
            top_factors = EXCLUDED.top_factors
        `;

        updated++;
      }
    }

    return NextResponse.json({ updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to compute layoff predictions", details: message },
      { status: 500 }
    );
  }
}

/**
 * Stub predictor — uses a heuristic model until the real ML predictor is ready.
 * Replace with: import { predict } from "@/lib/predictor"
 */
function stubPredict(
  signals: Record<string, unknown>,
  timeHorizon: string
): {
  probability: number;
  riskTier: string;
  confidence: number;
  topFactors: string[];
} {
  const horizonMultiplier =
    timeHorizon === "30d" ? 0.7 : timeHorizon === "90d" ? 1.0 : 1.2;

  let score = 0;
  const topFactors: string[] = [];

  // Risk score contribution (0-100 -> 0-0.3)
  const riskScore = Number(signals.riskScore) || 0;
  score += (riskScore / 100) * 0.3;
  if (riskScore >= 70) topFactors.push("High overall risk score");

  // Sentiment decline
  const glassdoorDelta = Number(signals.glassdoorDelta) || 0;
  if (glassdoorDelta < -0.3) {
    score += 0.15;
    topFactors.push("Significant Glassdoor rating decline");
  } else if (glassdoorDelta < 0) {
    score += 0.05;
  }

  // Revenue decline
  const revenueGrowth = Number(signals.revenueGrowthPct) || 0;
  if (revenueGrowth < -10) {
    score += 0.2;
    topFactors.push("Revenue declining >10% YoY");
  } else if (revenueGrowth < 0) {
    score += 0.1;
    topFactors.push("Negative revenue growth");
  }

  // Headcount already declining
  const empChange = Number(signals.employeeChangePct) || 0;
  if (empChange < -5) {
    score += 0.15;
    topFactors.push("Workforce already shrinking");
  }

  // Stock price decline
  const stockChange = Number(signals.stockPriceChange90d) || 0;
  if (stockChange < -20) {
    score += 0.1;
    topFactors.push("Stock price down >20% in 90 days");
  }

  // Lawsuit activity
  const lawsuits = Number(signals.lawsuitCount6mo) || 0;
  if (lawsuits > 20) {
    score += 0.1;
    topFactors.push("High lawsuit volume");
  }

  // Layoff-related news
  const layoffNews = Number(signals.layoffNewsCount3mo) || 0;
  if (layoffNews > 3) {
    score += 0.15;
    topFactors.push("Multiple layoff-related news articles");
  } else if (layoffNews > 0) {
    score += 0.05;
    topFactors.push("Layoff-related media coverage");
  }

  if (topFactors.length === 0) topFactors.push("Low risk indicators");

  // Apply horizon multiplier and clamp
  const probability =
    Math.round(Math.min(0.95, Math.max(0.01, score * horizonMultiplier)) * 1000) / 1000;

  // Determine tier
  let riskTier: string;
  if (probability >= 0.8) riskTier = "very_high";
  else if (probability >= 0.6) riskTier = "high";
  else if (probability >= 0.4) riskTier = "moderate";
  else if (probability >= 0.2) riskTier = "low";
  else riskTier = "very_low";

  // Confidence is lower when we have fewer signals
  const signalCount = Object.values(signals).filter((v) => v !== null).length;
  const maxSignals = Object.keys(signals).length;
  const confidence =
    Math.round(Math.max(0.3, (signalCount / maxSignals) * 0.9) * 1000) / 1000;

  return { probability, riskTier, confidence, topFactors };
}
