/**
 * Seed script — migrates mock data into Neon Postgres.
 *
 * Usage:
 *   npx tsx src/scripts/seed.ts
 *
 * Requires DATABASE_URL_UNPOOLED in .env.local at the project root.
 */

import { Pool } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// 1. Load environment
// ---------------------------------------------------------------------------

function loadEnv(): void {
  const envPath = resolve(__dirname, "../../.env.local");
  let raw: string;
  try {
    raw = readFileSync(envPath, "utf-8");
  } catch {
    console.error(`Could not read ${envPath}. Make sure .env.local exists.`);
    process.exit(1);
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

// ---------------------------------------------------------------------------
// 2. Import mock data (these rely on the @/* path alias resolved by tsx)
// ---------------------------------------------------------------------------

import { companies, founders, forbes30u30, forbes30u30YearStats, compensationEntries } from "@/data/mock";
import { layoffEvents } from "@/data/layoffs";

// ---------------------------------------------------------------------------
// 3. Helpers
// ---------------------------------------------------------------------------

const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

/** Parse a "YYYY-MM" or "YYYY-MM-DD" string into a DATE-safe string. */
function toDate(d: string): string {
  if (d.length === 7) return `${d}-01`; // "2024-03" -> "2024-03-01"
  return d;
}

/** Map source strings from mock to the DB enum. */
function mapCompSource(s: string): "levels_fyi" | "glassdoor" | "self_reported" {
  const lower = s.toLowerCase();
  if (lower.includes("levels")) return "levels_fyi";
  if (lower.includes("glassdoor")) return "glassdoor";
  return "self_reported";
}

// ---------------------------------------------------------------------------
// 4. Main seed logic
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  const connectionString = process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    console.error("DATABASE_URL_UNPOOLED is not set. Check .env.local.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  console.log(`\n========================================`);
  console.log(`  RedFlag — Database Seed`);
  console.log(`========================================\n`);

  // Map mock company id (e.g. "tesla") -> DB UUID
  const companyIdMap = new Map<string, string>();

  // Map mock founder id (e.g. "musk") -> DB UUID
  const founderIdMap = new Map<string, string>();

  // Map mock forbes id -> DB UUID
  const forbesIdMap = new Map<string, string>();

  // ------------------------------------------------------------------
  // A. COMPANIES
  // ------------------------------------------------------------------
  console.log(`[1/8] Seeding companies (${companies.length})...`);
  for (const c of companies) {
    const res = await pool.query(
      `INSERT INTO companies (name, ticker, legal_name, industry, size_bucket, employee_count, hq_state, website, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        c.name,
        c.ticker,
        c.legalName,
        c.industry,
        c.sizeBucket,
        c.employeeCount,
        c.hqState,
        c.website,
        c.logoUrl ?? null,
      ]
    );
    if (res.rows.length > 0) {
      companyIdMap.set(c.id, res.rows[0].id);
    } else {
      // Already exists — look it up by name
      const lookup = await pool.query(
        `SELECT id FROM companies WHERE name = $1 LIMIT 1`,
        [c.name]
      );
      if (lookup.rows.length > 0) {
        companyIdMap.set(c.id, lookup.rows[0].id);
      }
    }
  }
  console.log(`       -> ${companyIdMap.size} companies mapped.`);

  // ------------------------------------------------------------------
  // B. LAWSUITS (from company.lawsuits.recentCases)
  // ------------------------------------------------------------------
  let lawsuitCount = 0;
  console.log(`[2/8] Seeding lawsuits...`);
  for (const c of companies) {
    const dbCompanyId = companyIdMap.get(c.id);
    if (!dbCompanyId) continue;
    for (const l of c.lawsuits.recentCases) {
      await pool.query(
        `INSERT INTO lawsuits (company_id, case_number, court, filed_date, category, status, plaintiff_type, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [
          dbCompanyId,
          l.caseNumber,
          l.court,
          l.filedDate,
          l.category,
          l.status,
          l.plaintiffType,
          l.description,
        ]
      );
      lawsuitCount++;
    }
  }
  console.log(`       -> ${lawsuitCount} lawsuits inserted.`);

  // ------------------------------------------------------------------
  // C. SENTIMENT SNAPSHOTS (from company.glassdoor)
  // ------------------------------------------------------------------
  console.log(`[3/8] Seeding sentiment snapshots...`);
  let sentimentCount = 0;
  for (const c of companies) {
    const dbCompanyId = companyIdMap.get(c.id);
    if (!dbCompanyId) continue;
    const g = c.glassdoor;
    await pool.query(
      `INSERT INTO sentiment_snapshots
         (company_id, snapshot_date, overall_rating, culture_rating, leadership_rating,
          work_life_rating, comp_rating, career_opp_rating, review_count, recommend_pct, ceo_approval_pct, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'glassdoor')
       ON CONFLICT (company_id, snapshot_date, source) DO NOTHING`,
      [
        dbCompanyId,
        TODAY,
        g.overall,
        g.culture,
        g.leadership,
        g.workLife,
        g.compensation,
        g.careerOpportunities,
        g.reviewCount,
        g.recommendPct,
        g.ceoApprovalPct,
      ]
    );
    sentimentCount++;
  }
  console.log(`       -> ${sentimentCount} sentiment snapshots inserted.`);

  // ------------------------------------------------------------------
  // D. RISK SCORES (from company.riskScore)
  // ------------------------------------------------------------------
  console.log(`[4/8] Seeding risk scores...`);
  let riskCount = 0;
  for (const c of companies) {
    const dbCompanyId = companyIdMap.get(c.id);
    if (!dbCompanyId) continue;
    const r = c.riskScore;
    await pool.query(
      `INSERT INTO risk_scores
         (company_id, score_date, overall_score, filing_rate_score, sentiment_trend_score,
          theme_concentration_score, filing_acceleration_score, warn_signal_score,
          industry_percentile, size_percentile, risk_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (company_id, score_date) DO NOTHING`,
      [
        dbCompanyId,
        TODAY,
        r.overall,
        r.filingRate,
        r.sentimentTrend,
        r.themeConcentration,
        r.filingAcceleration,
        r.warnSignal,
        r.industryPercentile,
        r.sizePercentile,
        r.riskLevel,
      ]
    );
    riskCount++;
  }
  console.log(`       -> ${riskCount} risk scores inserted.`);

  // ------------------------------------------------------------------
  // E. COMPENSATION ENTRIES
  // ------------------------------------------------------------------
  console.log(`[5/8] Seeding compensation entries (${compensationEntries.length})...`);
  for (const ce of compensationEntries) {
    const dbCompanyId = companyIdMap.get(ce.companyId);
    if (!dbCompanyId) {
      console.warn(`       [WARN] No DB company for companyId="${ce.companyId}", skipping comp entry.`);
      continue;
    }
    await pool.query(
      `INSERT INTO compensation_entries
         (company_id, title, level, department, base_salary, total_comp, stock_value, bonus,
          location, years_experience, source, report_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT DO NOTHING`,
      [
        dbCompanyId,
        ce.title,
        ce.level,
        ce.department,
        ce.baseSalary,
        ce.totalComp,
        ce.stockValue,
        ce.bonus,
        ce.location,
        ce.yearsExperience,
        mapCompSource(ce.source),
        toDate(ce.reportDate),
      ]
    );
  }
  console.log(`       -> ${compensationEntries.length} compensation entries inserted.`);

  // ------------------------------------------------------------------
  // E2. COMPENSATION SUMMARIES (from company.compensation)
  // ------------------------------------------------------------------
  console.log(`       Seeding compensation summaries...`);
  let compSummaryCount = 0;
  for (const c of companies) {
    const dbCompanyId = companyIdMap.get(c.id);
    if (!dbCompanyId || !c.compensation) continue;
    const comp = c.compensation;
    await pool.query(
      `INSERT INTO compensation_summaries
         (company_id, snapshot_date, median_total_comp, median_base, comp_vs_peers_pct, sample_size)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (company_id, snapshot_date) DO NOTHING`,
      [
        dbCompanyId,
        TODAY,
        comp.medianTotalComp,
        comp.medianBase,
        comp.compVsPeers,
        comp.compByLevel.reduce((sum, l) => sum + l.count, 0),
      ]
    );
    compSummaryCount++;
  }
  console.log(`       -> ${compSummaryCount} compensation summaries inserted.`);

  // ------------------------------------------------------------------
  // F. FOUNDERS
  // ------------------------------------------------------------------
  console.log(`[6/8] Seeding founders (${founders.length})...`);
  for (const f of founders) {
    const res = await pool.query(
      `INSERT INTO founders (name, title, net_worth_band, photo_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [f.name, f.title, f.netWorthBand, f.photoUrl ?? null]
    );
    if (res.rows.length > 0) {
      founderIdMap.set(f.id, res.rows[0].id);
    } else {
      const lookup = await pool.query(
        `SELECT id FROM founders WHERE name = $1 LIMIT 1`,
        [f.name]
      );
      if (lookup.rows.length > 0) {
        founderIdMap.set(f.id, lookup.rows[0].id);
      }
    }

    const dbFounderId = founderIdMap.get(f.id);
    if (!dbFounderId) continue;

    // founder_companies
    for (const fc of f.companies) {
      // Try to resolve the company name to a DB UUID
      let dbCompanyId: string | null = null;
      if (fc.companyId) {
        dbCompanyId = companyIdMap.get(fc.companyId) ?? null;
      }
      if (!dbCompanyId) {
        // Try matching by name
        for (const [mockId, dbId] of companyIdMap.entries()) {
          const match = companies.find((c) => c.id === mockId);
          if (match && (match.name === fc.name || match.legalName === fc.name)) {
            dbCompanyId = dbId;
            break;
          }
        }
      }
      await pool.query(
        `INSERT INTO founder_companies (founder_id, company_id, role, start_date, end_date, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          dbFounderId,
          dbCompanyId,
          fc.role,
          fc.startYear ? `${fc.startYear}-01-01` : null,
          fc.endYear ? `${fc.endYear}-12-31` : null,
          true,
        ]
      );
    }

    // founder_legal_events
    for (const le of f.legalEvents) {
      let relatedCompanyId: string | null = null;
      if (le.relatedCompany) {
        for (const [mockId, dbId] of companyIdMap.entries()) {
          const match = companies.find((c) => c.id === mockId);
          if (match && (match.name === le.relatedCompany || match.legalName === le.relatedCompany)) {
            relatedCompanyId = dbId;
            break;
          }
        }
      }
      await pool.query(
        `INSERT INTO founder_legal_events
           (founder_id, company_id, event_date, event_type, role, description, severity)
         VALUES ($1, $2, $3, $4, 'defendant', $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          dbFounderId,
          relatedCompanyId,
          toDate(le.date),
          le.eventType,
          le.description,
          le.severity,
        ]
      );
    }

    // founder_controversy_events
    for (const ce of f.controversyEvents) {
      let relatedCompanyId: string | null = null;
      if (ce.relatedCompany) {
        for (const [mockId, dbId] of companyIdMap.entries()) {
          const match = companies.find((c) => c.id === mockId);
          if (match && (match.name === ce.relatedCompany || match.legalName === ce.relatedCompany)) {
            relatedCompanyId = dbId;
            break;
          }
        }
      }
      await pool.query(
        `INSERT INTO founder_controversy_events
           (founder_id, company_id, event_date, event_type, headline, impact_level)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          dbFounderId,
          relatedCompanyId,
          toDate(ce.date),
          ce.eventType,
          ce.headline,
          ce.impactLevel,
        ]
      );
    }

    // founder_impact_scores (one row per companyImpact)
    for (const ci of f.companyImpacts) {
      let ciCompanyId: string | null = null;
      for (const [mockId, dbId] of companyIdMap.entries()) {
        const match = companies.find((c) => c.id === mockId);
        if (match && (match.name === ci.company || match.legalName === ci.company)) {
          ciCompanyId = dbId;
          break;
        }
      }
      if (!ciCompanyId) continue;

      const sentimentDelta = ci.glassdoorAfter - ci.glassdoorBefore;
      await pool.query(
        `INSERT INTO founder_impact_scores
           (founder_id, company_id, score_date, founder_risk_score,
            controversy_count_12mo, personal_legal_count,
            sentiment_delta_post, lawsuit_delta_post_pct, pattern_summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (founder_id, company_id, score_date) DO NOTHING`,
        [
          dbFounderId,
          ciCompanyId,
          TODAY,
          f.impactScore,
          f.controversyEvents.length,
          f.legalEvents.length,
          sentimentDelta,
          ci.lawsuitSpikePct,
          ci.eventDescription,
        ]
      );
    }
  }
  console.log(`       -> ${founderIdMap.size} founders mapped (with companies, events, impacts).`);

  // ------------------------------------------------------------------
  // G. FORBES 30 UNDER 30
  // ------------------------------------------------------------------
  console.log(`[7/8] Seeding Forbes 30 Under 30 (${forbes30u30.length} people, ${forbes30u30YearStats.length} year stats)...`);
  for (const f of forbes30u30) {
    const res = await pool.query(
      `INSERT INTO forbes_30u30
         (name, list_year, category, company_name, age_at_listing, current_status, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [
        f.name,
        f.listYear,
        f.category,
        f.companyName,
        f.ageAtListing,
        f.currentStatus,
        f.photoUrl ?? null,
      ]
    );
    if (res.rows.length > 0) {
      forbesIdMap.set(f.id, res.rows[0].id);
    } else {
      const lookup = await pool.query(
        `SELECT id FROM forbes_30u30 WHERE name = $1 AND list_year = $2 LIMIT 1`,
        [f.name, f.listYear]
      );
      if (lookup.rows.length > 0) {
        forbesIdMap.set(f.id, lookup.rows[0].id);
      }
    }

    const dbForbesId = forbesIdMap.get(f.id);
    if (!dbForbesId) continue;

    for (const ev of f.events) {
      await pool.query(
        `INSERT INTO forbes_30u30_events
           (person_id, event_date, event_type, description, severity, outcome)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [
          dbForbesId,
          toDate(ev.date),
          ev.eventType,
          ev.description,
          ev.severity,
          ev.outcome,
        ]
      );
    }
  }

  // Year stats
  for (const ys of forbes30u30YearStats) {
    await pool.query(
      `INSERT INTO forbes_30u30_year_stats
         (list_year, total_listed, legal_events_count, persons_with_events,
          fraud_rate_pct, avg_years_to_event, most_common_event)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (list_year) DO NOTHING`,
      [
        ys.listYear,
        ys.totalListed,
        ys.legalEventsCount,
        ys.personsWithEvents,
        ys.fraudRatePct,
        ys.avgYearsToEvent,
        ys.mostCommonEvent,
      ]
    );
  }
  console.log(`       -> ${forbesIdMap.size} Forbes entries mapped, ${forbes30u30YearStats.length} year stats inserted.`);

  // ------------------------------------------------------------------
  // H. LAYOFF EVENTS -> warn_notices + news_items
  // ------------------------------------------------------------------
  console.log(`[8/8] Seeding layoff events (${layoffEvents.length}) into warn_notices & news_items...`);
  let warnCount = 0;
  let newsCount = 0;
  for (const le of layoffEvents) {
    const dbCompanyId = companyIdMap.get(le.companyId);
    if (!dbCompanyId) {
      console.warn(`       [WARN] No DB company for companyId="${le.companyId}", skipping layoff event "${le.id}".`);
      continue;
    }

    // Insert into warn_notices
    await pool.query(
      `INSERT INTO warn_notices
         (company_id, notice_date, employees_affected, reason, source_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [
        dbCompanyId,
        le.date,
        le.employeesAffected,
        le.reason,
        le.warnFilingUrl ?? le.sourceUrl,
      ]
    );
    warnCount++;

    // Also insert as a news item for the timeline
    await pool.query(
      `INSERT INTO news_items
         (company_id, published_date, title, source, url, sentiment, is_layoff_related)
       VALUES ($1, $2, $3, $4, $5, 'negative', true)
       ON CONFLICT DO NOTHING`,
      [
        dbCompanyId,
        le.date,
        le.source,
        le.type,
        le.sourceUrl,
      ]
    );
    newsCount++;
  }
  console.log(`       -> ${warnCount} warn notices, ${newsCount} news items inserted.`);

  // ------------------------------------------------------------------
  // Done
  // ------------------------------------------------------------------
  await pool.end();

  console.log(`\n========================================`);
  console.log(`  Seed complete!`);
  console.log(`  Companies:     ${companyIdMap.size}`);
  console.log(`  Founders:      ${founderIdMap.size}`);
  console.log(`  Forbes 30u30:  ${forbesIdMap.size}`);
  console.log(`  Layoff events: ${warnCount}`);
  console.log(`========================================\n`);
}

// ---------------------------------------------------------------------------
// 5. Run
// ---------------------------------------------------------------------------

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
