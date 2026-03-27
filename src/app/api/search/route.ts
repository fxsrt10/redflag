import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { searchAll } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";

  if (!q) {
    return NextResponse.json({ companies: [], founders: [], watchlist: [] });
  }

  try {
    const sql = getDb();

    // Check if DB has data
    const countResult = await sql`SELECT COUNT(*)::int AS total FROM companies`;
    const dbTotal = countResult[0]?.total ?? 0;

    if (dbTotal === 0) {
      return NextResponse.json(searchAll(q));
    }

    const pattern = `%${q}%`;

    // Search companies, founders, and forbes_30u30 in parallel
    const [companyRows, founderRows, watchlistRows] = await Promise.all([
      sql`
        SELECT
          c.id, c.name, c.ticker, c.legal_name, c.industry,
          c.size_bucket, c.employee_count, c.hq_state, c.website, c.logo_url,
          rs.overall_score AS risk_overall,
          rs.risk_level
        FROM companies c
        LEFT JOIN LATERAL (
          SELECT overall_score, risk_level FROM risk_scores
          WHERE company_id = c.id
          ORDER BY score_date DESC
          LIMIT 1
        ) rs ON true
        WHERE
          c.name ILIKE ${pattern}
          OR c.ticker ILIKE ${pattern}
        ORDER BY c.name ASC
        LIMIT 8
      `,
      sql`
        SELECT id, name, title, net_worth_band, photo_url
        FROM founders
        WHERE name ILIKE ${pattern}
        ORDER BY name ASC
        LIMIT 5
      `,
      sql`
        SELECT id, name, list_year, category, company_name, current_status, photo_url
        FROM forbes_30u30
        WHERE
          name ILIKE ${pattern}
          OR company_name ILIKE ${pattern}
        ORDER BY name ASC
        LIMIT 5
      `,
    ]);

    const companies = companyRows.map((row: Record<string, unknown>) => ({
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
      riskScore: {
        overall: Number(row.risk_overall) || 0,
        riskLevel: (row.risk_level as string) || "moderate",
      },
    }));

    const founders = founderRows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      title: row.title,
      netWorthBand: row.net_worth_band,
      photoUrl: row.photo_url,
    }));

    const watchlist = watchlistRows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      listYear: row.list_year,
      category: row.category,
      companyName: row.company_name,
      currentStatus: row.current_status,
      photoUrl: row.photo_url,
    }));

    return NextResponse.json({ companies, founders, watchlist });
  } catch {
    // DB not available — fall back to mock search
    return NextResponse.json(searchAll(q));
  }
}
