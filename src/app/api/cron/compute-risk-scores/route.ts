import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET;

// Weight formula for risk score components
const WEIGHTS = {
  filingRate: 0.25,
  sentimentTrend: 0.20,
  themeConcentration: 0.15,
  filingAcceleration: 0.20,
  warnSignal: 0.20,
};

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
    const companies = await sql`SELECT id, employee_count FROM companies`;

    if (companies.length === 0) {
      return NextResponse.json({ updated: 0, message: "No companies found in database" });
    }

    let updated = 0;

    for (const company of companies) {
      const companyId = company.id;
      const employeeCount = Number(company.employee_count) || 1;

      // Fetch latest data for this company in parallel
      const [sentimentRows, lawsuitRows, warnRows] = await Promise.all([
        sql`
          SELECT overall_rating, culture_rating, leadership_rating,
                 work_life_rating, comp_rating, career_opp_rating, recommend_pct
          FROM sentiment_snapshots
          WHERE company_id = ${companyId}
          ORDER BY snapshot_date DESC
          LIMIT 2
        `,
        sql`
          SELECT filed_date, category
          FROM lawsuits
          WHERE company_id = ${companyId}
            AND filed_date >= CURRENT_DATE - INTERVAL '12 months'
          ORDER BY filed_date DESC
        `,
        sql`
          SELECT notice_date, employees_affected
          FROM warn_notices
          WHERE company_id = ${companyId}
            AND notice_date >= CURRENT_DATE - INTERVAL '12 months'
          ORDER BY notice_date DESC
        `,
      ]);

      // --- Filing rate score (lawsuits per 1000 employees, scaled 0-100) ---
      const filingRate = (lawsuitRows.length / employeeCount) * 1000;
      const filingRateScore = Math.min(100, filingRate * 50); // 2 per 1000 = 100

      // --- Sentiment trend score ---
      let sentimentTrendScore = 50; // neutral default
      if (sentimentRows.length >= 2) {
        const current = Number(sentimentRows[0].overall_rating) || 3.0;
        const previous = Number(sentimentRows[1].overall_rating) || 3.0;
        const delta = previous - current; // positive delta = declining sentiment = higher risk
        sentimentTrendScore = Math.min(100, Math.max(0, 50 + delta * 25));
      } else if (sentimentRows.length === 1) {
        const rating = Number(sentimentRows[0].overall_rating) || 3.0;
        // Lower rating = higher risk
        sentimentTrendScore = Math.min(100, Math.max(0, (5 - rating) * 25));
      }

      // --- Theme concentration score ---
      // High concentration in negative categories = higher risk
      const categoryCounts: Record<string, number> = {};
      for (const l of lawsuitRows) {
        const cat = l.category || "other";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
      const categories = Object.values(categoryCounts);
      let themeConcentrationScore = 0;
      if (categories.length > 0) {
        const maxCat = Math.max(...categories);
        const totalCat = categories.reduce((a, b) => a + b, 0);
        themeConcentrationScore = Math.min(100, (maxCat / totalCat) * 100);
      }

      // --- Filing acceleration score ---
      // Compare recent 90 days vs prior 90 days
      const now = new Date();
      const d90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const d180Ago = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      const recent90 = lawsuitRows.filter(
        (l: Record<string, unknown>) => new Date(l.filed_date as string) >= d90Ago
      ).length;
      const prior90 = lawsuitRows.filter(
        (l: Record<string, unknown>) => {
          const d = new Date(l.filed_date as string);
          return d >= d180Ago && d < d90Ago;
        }
      ).length;

      let filingAccelerationScore = 50;
      if (prior90 > 0) {
        const ratio = recent90 / prior90;
        filingAccelerationScore = Math.min(100, Math.max(0, ratio * 50));
      } else if (recent90 > 0) {
        filingAccelerationScore = 75; // filings with no prior baseline
      }

      // --- WARN signal score ---
      const totalWarnAffected = warnRows.reduce(
        (sum: number, w: Record<string, unknown>) => sum + (Number(w.employees_affected) || 0),
        0
      );
      const warnPct = (totalWarnAffected / employeeCount) * 100;
      const warnSignalScore = Math.min(100, warnPct * 10); // 10% affected = 100

      // --- Overall score ---
      const overallScore = Math.round(
        filingRateScore * WEIGHTS.filingRate +
        sentimentTrendScore * WEIGHTS.sentimentTrend +
        themeConcentrationScore * WEIGHTS.themeConcentration +
        filingAccelerationScore * WEIGHTS.filingAcceleration +
        warnSignalScore * WEIGHTS.warnSignal
      );

      // Determine risk level
      let riskLevel: string;
      if (overallScore >= 75) riskLevel = "high";
      else if (overallScore >= 55) riskLevel = "elevated";
      else if (overallScore >= 35) riskLevel = "moderate";
      else riskLevel = "low";

      // Upsert into risk_scores
      await sql`
        INSERT INTO risk_scores (
          company_id, score_date, overall_score,
          filing_rate_score, sentiment_trend_score, theme_concentration_score,
          filing_acceleration_score, warn_signal_score,
          industry_percentile, size_percentile, risk_level
        ) VALUES (
          ${companyId}, ${today}, ${overallScore},
          ${Math.round(filingRateScore)}, ${Math.round(sentimentTrendScore)},
          ${Math.round(themeConcentrationScore)}, ${Math.round(filingAccelerationScore)},
          ${Math.round(warnSignalScore)},
          0, 0, ${riskLevel}
        )
        ON CONFLICT (company_id, score_date)
        DO UPDATE SET
          overall_score = EXCLUDED.overall_score,
          filing_rate_score = EXCLUDED.filing_rate_score,
          sentiment_trend_score = EXCLUDED.sentiment_trend_score,
          theme_concentration_score = EXCLUDED.theme_concentration_score,
          filing_acceleration_score = EXCLUDED.filing_acceleration_score,
          warn_signal_score = EXCLUDED.warn_signal_score,
          risk_level = EXCLUDED.risk_level
      `;

      updated++;
    }

    // Second pass: compute industry and size percentiles
    await sql`
      WITH ranked AS (
        SELECT
          rs.id,
          PERCENT_RANK() OVER (
            PARTITION BY c.industry ORDER BY rs.overall_score
          ) * 100 AS ind_pct,
          PERCENT_RANK() OVER (
            PARTITION BY c.size_bucket ORDER BY rs.overall_score
          ) * 100 AS size_pct
        FROM risk_scores rs
        JOIN companies c ON c.id = rs.company_id
        WHERE rs.score_date = ${today}
      )
      UPDATE risk_scores
      SET industry_percentile = ranked.ind_pct,
          size_percentile = ranked.size_pct
      FROM ranked
      WHERE risk_scores.id = ranked.id
    `;

    return NextResponse.json({ updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to compute risk scores", details: message },
      { status: 500 }
    );
  }
}
