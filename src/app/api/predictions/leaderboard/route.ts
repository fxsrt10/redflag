import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { companies as mockCompanies } from "@/data/mock";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeHorizon = searchParams.get("timeHorizon") || "90d";
  const industry = searchParams.get("industry");

  try {
    const sql = getDb();

    // Check if predictions exist
    const countResult = await sql`
      SELECT COUNT(*)::int AS total FROM layoff_predictions
      WHERE time_horizon = ${timeHorizon}
    `;
    const dbTotal = countResult[0]?.total ?? 0;

    if (dbTotal === 0) {
      // Fall back to mock predictions based on existing risk scores
      return fallbackToMockPredictions(timeHorizon, industry);
    }

    const rows = await sql`
      SELECT
        lp.probability,
        lp.risk_tier,
        lp.confidence,
        lp.time_horizon,
        lp.prediction_date,
        lp.signals,
        lp.top_factors,
        c.id AS company_id,
        c.name AS company_name,
        c.ticker,
        c.industry,
        c.size_bucket,
        c.employee_count,
        c.logo_url
      FROM layoff_predictions lp
      JOIN companies c ON c.id = lp.company_id
      WHERE lp.time_horizon = ${timeHorizon}
        AND (${industry}::text IS NULL OR c.industry ILIKE '%' || ${industry} || '%')
        AND lp.prediction_date = (
          SELECT MAX(prediction_date) FROM layoff_predictions
          WHERE company_id = lp.company_id AND time_horizon = lp.time_horizon
        )
      ORDER BY lp.probability DESC
      LIMIT 20
    `;

    const leaderboard = rows.map((row: Record<string, unknown>) => ({
      companyId: row.company_id,
      companyName: row.company_name,
      ticker: row.ticker,
      industry: row.industry,
      sizeBucket: row.size_bucket,
      employeeCount: row.employee_count,
      logoUrl: row.logo_url,
      probability: Number(row.probability) || 0,
      riskTier: row.risk_tier,
      confidence: Number(row.confidence) || 0,
      timeHorizon: row.time_horizon,
      predictionDate: row.prediction_date,
      signals: row.signals,
      topFactors: row.top_factors,
    }));

    return NextResponse.json({ leaderboard, timeHorizon });
  } catch {
    return fallbackToMockPredictions(timeHorizon, industry);
  }
}

function fallbackToMockPredictions(
  timeHorizon: string,
  industry: string | null
) {
  // Generate mock predictions from risk scores of existing companies
  let filtered = [...mockCompanies];

  if (industry) {
    filtered = filtered.filter((c) =>
      c.industry.toLowerCase().includes(industry.toLowerCase())
    );
  }

  // Convert risk scores to layoff probabilities
  const horizonMultiplier =
    timeHorizon === "30d" ? 0.6 : timeHorizon === "90d" ? 1.0 : 1.3;

  const leaderboard = filtered
    .map((c) => {
      const baseProb = Math.min(
        0.95,
        (c.riskScore.overall / 100) * horizonMultiplier
      );
      const probability = Math.round(baseProb * 1000) / 1000;

      let riskTier: string;
      if (probability >= 0.8) riskTier = "very_high";
      else if (probability >= 0.6) riskTier = "high";
      else if (probability >= 0.4) riskTier = "moderate";
      else if (probability >= 0.2) riskTier = "low";
      else riskTier = "very_low";

      const topFactors: string[] = [];
      if (c.riskScore.filingRate > 60) topFactors.push("High lawsuit filing rate");
      if (c.riskScore.sentimentTrend > 60) topFactors.push("Declining employee sentiment");
      if (c.riskScore.warnSignal > 50) topFactors.push("WARN Act filing signals");
      if (c.riskScore.filingAcceleration > 50) topFactors.push("Accelerating legal filings");
      if (c.glassdoor.trend === "declining" || c.glassdoor.trend === "rapidly_declining") {
        topFactors.push("Glassdoor rating trending down");
      }
      if (topFactors.length === 0) topFactors.push("Moderate risk indicators");

      return {
        companyId: c.id,
        companyName: c.name,
        ticker: c.ticker,
        industry: c.industry,
        sizeBucket: c.sizeBucket,
        employeeCount: c.employeeCount,
        logoUrl: c.logoUrl || null,
        probability,
        riskTier,
        confidence: Math.round((0.5 + Math.random() * 0.4) * 1000) / 1000,
        timeHorizon,
        predictionDate: new Date().toISOString().split("T")[0],
        signals: {
          riskScore: c.riskScore.overall,
          glassdoorTrend: c.glassdoor.trend,
          lawsuitCount: c.lawsuits.totalFilings12mo,
        },
        topFactors,
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 20);

  return NextResponse.json({ leaderboard, timeHorizon });
}
