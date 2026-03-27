import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { founders as mockFounders } from "@/data/mock";

export async function GET() {
  try {
    const sql = getDb();

    const countResult = await sql`SELECT COUNT(*)::int AS total FROM founders`;
    if ((countResult[0]?.total ?? 0) === 0) {
      return NextResponse.json({ founders: mockFounders });
    }

    // Fetch all founders
    const founderRows = await sql`SELECT * FROM founders ORDER BY name`;

    const founders = await Promise.all(
      founderRows.map(async (f: Record<string, unknown>) => {
        const fid = f.id;

        const [companies, legalEvents, controversyEvents, impactScores] = await Promise.all([
          sql`SELECT fc.role, fc.start_date, fc.end_date, c.name as company_name
              FROM founder_companies fc
              LEFT JOIN companies c ON c.id = fc.company_id
              WHERE fc.founder_id = ${fid}
              ORDER BY fc.start_date`,
          sql`SELECT * FROM founder_legal_events WHERE founder_id = ${fid} ORDER BY event_date DESC`,
          sql`SELECT * FROM founder_controversy_events WHERE founder_id = ${fid} ORDER BY event_date DESC`,
          sql`SELECT * FROM founder_impact_scores WHERE founder_id = ${fid} ORDER BY score_date DESC LIMIT 5`,
        ]);

        return {
          id: f.id,
          name: f.name,
          title: f.title,
          netWorthBand: f.net_worth_band,
          photoUrl: f.photo_url,
          companies: companies.map((c: Record<string, unknown>) => ({
            name: c.company_name ?? "",
            role: c.role ?? "",
            startYear: c.start_date ? new Date(c.start_date as string).getFullYear() : 0,
            endYear: c.end_date ? new Date(c.end_date as string).getFullYear() : null,
          })),
          legalEvents: legalEvents.map((e: Record<string, unknown>) => ({
            date: e.event_date ? (e.event_date as string).slice(0, 10) : "",
            eventType: e.event_type,
            description: e.description,
            severity: e.severity,
            outcome: e.outcome,
            relatedCompany: e.company_id ? "" : undefined,
          })),
          controversyEvents: controversyEvents.map((e: Record<string, unknown>) => ({
            date: e.event_date ? (e.event_date as string).slice(0, 10) : "",
            eventType: e.event_type,
            headline: e.headline,
            impactLevel: e.impact_level,
            relatedCompany: e.company_id ? "" : undefined,
          })),
          impactScore: impactScores.length > 0 ? Number(impactScores[0].founder_risk_score) : 50,
          companyImpacts: impactScores.map((s: Record<string, unknown>) => ({
            company: "",
            eventDescription: s.pattern_summary ?? "",
            glassdoorBefore: Number(s.sentiment_delta_post) + 3.5,
            glassdoorAfter: 3.5,
            lawsuitSpikePct: Number(s.lawsuit_delta_post_pct) || 0,
          })),
        };
      })
    );

    return NextResponse.json({ founders });
  } catch {
    return NextResponse.json({ founders: mockFounders });
  }
}
