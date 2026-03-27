import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { forbes30u30 as mockForbes, forbes30u30YearStats as mockYearStats } from "@/data/mock";

export async function GET() {
  try {
    const sql = getDb();

    const countResult = await sql`SELECT COUNT(*)::int AS total FROM forbes_30u30`;
    if ((countResult[0]?.total ?? 0) === 0) {
      return NextResponse.json({ people: mockForbes, yearStats: mockYearStats });
    }

    const personRows = await sql`SELECT * FROM forbes_30u30 ORDER BY list_year DESC, name`;

    const people = await Promise.all(
      personRows.map(async (p: Record<string, unknown>) => {
        const events = await sql`
          SELECT * FROM forbes_30u30_events
          WHERE person_id = ${p.id}
          ORDER BY event_date DESC
        `;

        return {
          id: p.id,
          name: p.name,
          listYear: p.list_year,
          category: p.category,
          companyName: p.company_name,
          ageAtListing: p.age_at_listing,
          photoUrl: p.photo_url,
          currentStatus: p.current_status,
          events: events.map((e: Record<string, unknown>) => ({
            date: e.event_date ? (e.event_date as string).slice(0, 10) : "",
            eventType: e.event_type,
            description: e.description,
            severity: e.severity,
            outcome: e.outcome,
          })),
        };
      })
    );

    const yearStatRows = await sql`SELECT * FROM forbes_30u30_year_stats ORDER BY list_year`;
    const yearStats = yearStatRows.map((y: Record<string, unknown>) => ({
      listYear: y.list_year,
      totalListed: y.total_listed,
      legalEventsCount: y.legal_events_count,
      personsWithEvents: y.persons_with_events,
      fraudRatePct: Number(y.fraud_rate_pct),
      avgYearsToEvent: Number(y.avg_years_to_event),
      mostCommonEvent: y.most_common_event,
    }));

    return NextResponse.json({ people, yearStats });
  } catch {
    return NextResponse.json({ people: mockForbes, yearStats: mockYearStats });
  }
}
