import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCompanyById, getFoundersByCompany, getCompensationByCompany } from "@/lib/data";
import { layoffEvents } from "@/data/layoffs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const sql = getDb();

    // Try to find the company by slug-style id or by UUID
    const companyRows = await sql`
      SELECT * FROM companies
      WHERE id::text = ${id} OR LOWER(name) = ${id.toLowerCase()}
      LIMIT 1
    `;

    if (companyRows.length === 0) {
      // Fall back to mock data
      return fallbackToMock(id);
    }

    const company = companyRows[0];
    const companyId = company.id;

    // Fetch all related data in parallel
    const [
      glassdoorRows,
      lawsuitRows,
      riskRows,
      compensationRows,
      predictionRows,
      newsRows,
      warnRows,
    ] = await Promise.all([
      sql`
        SELECT * FROM sentiment_snapshots
        WHERE company_id = ${companyId}
        ORDER BY snapshot_date DESC
        LIMIT 10
      `,
      sql`
        SELECT * FROM lawsuits
        WHERE company_id = ${companyId}
        ORDER BY filed_date DESC
        LIMIT 50
      `,
      sql`
        SELECT * FROM risk_scores
        WHERE company_id = ${companyId}
        ORDER BY score_date DESC
        LIMIT 1
      `,
      sql`
        SELECT * FROM compensation_summaries
        WHERE company_id = ${companyId}
        ORDER BY snapshot_date DESC
        LIMIT 1
      `,
      sql`
        SELECT * FROM layoff_predictions
        WHERE company_id = ${companyId}
        ORDER BY prediction_date DESC
        LIMIT 5
      `,
      sql`
        SELECT * FROM news_items
        WHERE company_id = ${companyId}
        ORDER BY published_date DESC
        LIMIT 20
      `,
      sql`
        SELECT * FROM warn_notices
        WHERE company_id = ${companyId}
        ORDER BY notice_date DESC
        LIMIT 10
      `,
    ]);

    const latestGlassdoor = glassdoorRows[0];
    const latestRisk = riskRows[0];
    const latestComp = compensationRows[0];

    // Category counts for lawsuits
    const categoryCounts: Record<string, number> = {};
    for (const l of lawsuitRows) {
      const cat = l.category || "other";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const employeeCount = Number(company.employee_count) || 1;

    const result = {
      id: company.id,
      name: company.name,
      ticker: company.ticker,
      legalName: company.legal_name,
      industry: company.industry,
      sizeBucket: company.size_bucket,
      employeeCount: company.employee_count,
      hqState: company.hq_state,
      website: company.website,
      logoUrl: company.logo_url,
      glassdoor: latestGlassdoor
        ? {
            overall: Number(latestGlassdoor.overall_rating) || 0,
            culture: Number(latestGlassdoor.culture_rating) || 0,
            leadership: Number(latestGlassdoor.leadership_rating) || 0,
            workLife: Number(latestGlassdoor.work_life_rating) || 0,
            compensation: Number(latestGlassdoor.comp_rating) || 0,
            careerOpportunities: Number(latestGlassdoor.career_opp_rating) || 0,
            recommendPct: Number(latestGlassdoor.recommend_pct) || 0,
            ceoApprovalPct: Number(latestGlassdoor.ceo_approval_pct) || 0,
            reviewCount: Number(latestGlassdoor.review_count) || 0,
            trend: "stable",
          }
        : null,
      lawsuits: {
        totalFilings12mo: lawsuitRows.length,
        employmentFilings12mo: lawsuitRows.filter(
          (l: Record<string, unknown>) =>
            ["discrimination", "harassment", "retaliation", "wage_hour", "wrongful_termination"].includes(
              l.category as string
            )
        ).length,
        filingsPerThousandEmployees:
          Math.round((lawsuitRows.length / employeeCount) * 1000 * 100) / 100,
        topCategories,
        filingAcceleration: 1.0,
        recentCases: lawsuitRows.slice(0, 5).map((l: Record<string, unknown>) => ({
          id: l.id,
          caseNumber: l.case_number,
          court: l.court,
          filedDate: l.filed_date,
          category: l.category,
          status: l.status,
          plaintiffType: l.plaintiff_type,
          description: l.description,
          sourceUrl: l.source_url,
        })),
      },
      riskScore: latestRisk
        ? {
            overall: Number(latestRisk.overall_score) || 0,
            filingRate: Number(latestRisk.filing_rate_score) || 0,
            sentimentTrend: Number(latestRisk.sentiment_trend_score) || 0,
            themeConcentration: Number(latestRisk.theme_concentration_score) || 0,
            filingAcceleration: Number(latestRisk.filing_acceleration_score) || 0,
            warnSignal: Number(latestRisk.warn_signal_score) || 0,
            industryPercentile: Number(latestRisk.industry_percentile) || 0,
            sizePercentile: Number(latestRisk.size_percentile) || 0,
            riskLevel: latestRisk.risk_level || "moderate",
          }
        : null,
      compensation: latestComp
        ? {
            medianTotalComp: Number(latestComp.median_total_comp) || 0,
            medianBase: Number(latestComp.median_base) || 0,
            compVsPeers: Number(latestComp.comp_vs_peers_pct) || 0,
            compByLevel: [],
          }
        : null,
      layoffPredictions: predictionRows.map((p: Record<string, unknown>) => ({
        predictionDate: p.prediction_date,
        probability: Number(p.probability) || 0,
        riskTier: p.risk_tier,
        confidence: Number(p.confidence) || 0,
        timeHorizon: p.time_horizon,
        signals: p.signals,
        topFactors: p.top_factors,
      })),
      news: newsRows.map((n: Record<string, unknown>) => ({
        id: n.id,
        publishedDate: n.published_date,
        title: n.title,
        source: n.source,
        url: n.url,
        sentiment: n.sentiment,
        isLayoffRelated: n.is_layoff_related,
      })),
      warnNotices: warnRows.map((w: Record<string, unknown>) => ({
        id: w.id,
        state: w.state,
        noticeDate: w.notice_date,
        effectiveDate: w.effective_date,
        employeesAffected: w.employees_affected,
        reason: w.reason,
        sourceUrl: w.source_url,
      })),
      glassdoorHistory: glassdoorRows.map((s: Record<string, unknown>) => ({
        date: s.snapshot_date,
        overall: Number(s.overall_rating) || 0,
        culture: Number(s.culture_rating) || 0,
        leadership: Number(s.leadership_rating) || 0,
        workLife: Number(s.work_life_rating) || 0,
        compensation: Number(s.comp_rating) || 0,
        careerOpportunities: Number(s.career_opp_rating) || 0,
      })),
    };

    return NextResponse.json(result);
  } catch {
    // DB not available — fall back to mock
    return fallbackToMock(id);
  }
}

function fallbackToMock(id: string) {
  const company = getCompanyById(id);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const founders = getFoundersByCompany(company.name);
  const compensation = getCompensationByCompany(company.id);
  const companyLayoffs = layoffEvents.filter((e) => e.companyId === id);

  return NextResponse.json({
    ...company,
    founders,
    compensationEntries: compensation,
    layoffEvents: companyLayoffs,
    layoffPredictions: [],
    news: [],
    warnNotices: [],
    glassdoorHistory: [],
  });
}
