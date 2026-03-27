import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { companies as mockCompanies } from "@/data/mock";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry");
  const riskLevel = searchParams.get("riskLevel");
  const sort = searchParams.get("sort") || "risk";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  try {
    const sql = getDb();

    // Check if we have any companies in the DB
    const countResult = await sql`SELECT COUNT(*)::int AS total FROM companies`;
    const dbTotal = countResult[0]?.total ?? 0;

    if (dbTotal === 0) {
      // Fall back to mock data
      return fallbackToMock({ industry, riskLevel, sort, page, limit });
    }

    // Build the query with joins to latest risk_scores and sentiment_snapshots
    const rows = await sql`
      SELECT
        c.id,
        c.name,
        c.ticker,
        c.legal_name,
        c.industry,
        c.size_bucket,
        c.employee_count,
        c.hq_state,
        c.website,
        c.logo_url,
        rs.overall_score       AS risk_overall,
        rs.filing_rate_score   AS risk_filing_rate,
        rs.sentiment_trend_score AS risk_sentiment_trend,
        rs.theme_concentration_score AS risk_theme_concentration,
        rs.filing_acceleration_score AS risk_filing_acceleration,
        rs.warn_signal_score   AS risk_warn_signal,
        rs.industry_percentile AS risk_industry_percentile,
        rs.size_percentile     AS risk_size_percentile,
        rs.risk_level,
        ss.overall_rating      AS glassdoor_overall,
        ss.culture_rating      AS glassdoor_culture,
        ss.leadership_rating   AS glassdoor_leadership,
        ss.work_life_rating    AS glassdoor_work_life,
        ss.comp_rating         AS glassdoor_compensation,
        ss.career_opp_rating   AS glassdoor_career,
        ss.recommend_pct       AS glassdoor_recommend,
        ss.ceo_approval_pct    AS glassdoor_ceo_approval,
        ss.review_count        AS glassdoor_review_count
      FROM companies c
      LEFT JOIN LATERAL (
        SELECT * FROM risk_scores
        WHERE company_id = c.id
        ORDER BY score_date DESC
        LIMIT 1
      ) rs ON true
      LEFT JOIN LATERAL (
        SELECT * FROM sentiment_snapshots
        WHERE company_id = c.id
        ORDER BY snapshot_date DESC
        LIMIT 1
      ) ss ON true
      WHERE
        (${industry}::text IS NULL OR c.industry ILIKE '%' || ${industry} || '%')
        AND (${riskLevel}::text IS NULL OR rs.risk_level = ${riskLevel})
      ORDER BY
        CASE ${sort}
          WHEN 'risk' THEN rs.overall_score
          WHEN 'glassdoor' THEN ss.overall_rating
          WHEN 'lawsuits' THEN rs.filing_rate_score
          ELSE NULL
        END DESC NULLS LAST,
        CASE WHEN ${sort} = 'name' THEN c.name ELSE NULL END ASC NULLS LAST
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count with filters
    const filteredCount = await sql`
      SELECT COUNT(*)::int AS total
      FROM companies c
      LEFT JOIN LATERAL (
        SELECT risk_level FROM risk_scores
        WHERE company_id = c.id
        ORDER BY score_date DESC
        LIMIT 1
      ) rs ON true
      WHERE
        (${industry}::text IS NULL OR c.industry ILIKE '%' || ${industry} || '%')
        AND (${riskLevel}::text IS NULL OR rs.risk_level = ${riskLevel})
    `;

    const total = filteredCount[0]?.total ?? 0;

    const companies = rows.map(mapRowToCompany);

    return NextResponse.json({ companies, total, page });
  } catch {
    // DB not available — fall back to mock
    return fallbackToMock({ industry, riskLevel, sort, page, limit });
  }
}

function fallbackToMock({
  industry,
  riskLevel,
  sort,
  page,
  limit,
}: {
  industry: string | null;
  riskLevel: string | null;
  sort: string;
  page: number;
  limit: number;
}) {
  let filtered = [...mockCompanies];

  if (industry) {
    filtered = filtered.filter((c) =>
      c.industry.toLowerCase().includes(industry.toLowerCase())
    );
  }
  if (riskLevel) {
    filtered = filtered.filter((c) => c.riskScore.riskLevel === riskLevel);
  }

  // Sort
  switch (sort) {
    case "risk":
      filtered.sort((a, b) => b.riskScore.overall - a.riskScore.overall);
      break;
    case "glassdoor":
      filtered.sort((a, b) => b.glassdoor.overall - a.glassdoor.overall);
      break;
    case "lawsuits":
      filtered.sort(
        (a, b) => b.lawsuits.totalFilings12mo - a.lawsuits.totalFilings12mo
      );
      break;
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const companies = filtered.slice(offset, offset + limit);

  return NextResponse.json({ companies, total, page });
}

function mapRowToCompany(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    ticker: row.ticker,
    legalName: row.legal_name,
    industry: row.industry,
    sizeBucket: row.size_bucket,
    employeeCount: row.employee_count,
    hqState: row.hq_state,
    website: row.website,
    logoUrl: row.logo_url,
    glassdoor: {
      overall: Number(row.glassdoor_overall) || 0,
      culture: Number(row.glassdoor_culture) || 0,
      leadership: Number(row.glassdoor_leadership) || 0,
      workLife: Number(row.glassdoor_work_life) || 0,
      compensation: Number(row.glassdoor_compensation) || 0,
      careerOpportunities: Number(row.glassdoor_career) || 0,
      recommendPct: Number(row.glassdoor_recommend) || 0,
      ceoApprovalPct: Number(row.glassdoor_ceo_approval) || 0,
      reviewCount: Number(row.glassdoor_review_count) || 0,
      trend: "stable" as const,
    },
    riskScore: {
      overall: Number(row.risk_overall) || 0,
      filingRate: Number(row.risk_filing_rate) || 0,
      sentimentTrend: Number(row.risk_sentiment_trend) || 0,
      themeConcentration: Number(row.risk_theme_concentration) || 0,
      filingAcceleration: Number(row.risk_filing_acceleration) || 0,
      warnSignal: Number(row.risk_warn_signal) || 0,
      industryPercentile: Number(row.risk_industry_percentile) || 0,
      sizePercentile: Number(row.risk_size_percentile) || 0,
      riskLevel: (row.risk_level as string) || "moderate",
    },
  };
}
