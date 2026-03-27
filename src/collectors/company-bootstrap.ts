// ============================================
// RedFlag — Company Bootstrap Collector
// ============================================

import { getPool, closePool } from "./db";
import { fetchFmpData } from "./fmp-financials";

// ---------------------------------------------------------------------------
// Default tickers (100+ across industries)
// ---------------------------------------------------------------------------

export const DEFAULT_TICKERS: string[] = [
  // Tech (25)
  "AAPL", "MSFT", "GOOGL", "META", "AMZN",
  "NVDA", "CRM", "ADBE", "ORCL", "INTC",
  "AMD", "NOW", "SNOW", "PLTR", "COIN",
  "SNAP", "LYFT", "DASH", "UBER", "SQ",
  "SHOP", "TWLO", "ZM", "DDOG", "NET",
  // Finance (10)
  "JPM", "GS", "MS", "BAC", "C",
  "WFC", "BLK", "AXP", "SCHW", "COF",
  // Energy (9)
  "XOM", "CVX", "SLB", "COP", "OXY",
  "EOG", "PSX", "VLO", "MPC",
  // Auto (6)
  "F", "GM", "TM", "RIVN", "LCID", "STLA",
  // Pharma (9)
  "PFE", "JNJ", "MRK", "ABBV", "LLY",
  "UNH", "BMY", "AMGN", "GILD",
  // Retail (7)
  "WMT", "TGT", "COST", "HD", "LOW", "TJX", "ROST",
  // Aerospace (6)
  "BA", "LMT", "RTX", "NOC", "GD", "HII",
  // Media (6)
  "DIS", "NFLX", "CMCSA", "WBD", "PARA", "FOXA",
  // Industrial (8)
  "HON", "CAT", "DE", "MMM", "GE", "PTC", "EMR", "ITW",
  // Telecom (3)
  "T", "VZ", "TMUS",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BootstrapResult {
  ticker: string;
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// SEC CIK lookup
// ---------------------------------------------------------------------------

async function lookupCik(ticker: string): Promise<string | null> {
  try {
    const url = `https://efts.sec.gov/LATEST/search-index?q=${encodeURIComponent(ticker)}&dateRange=custom`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "RedFlag/1.0 contact@redflag.app",
        Accept: "application/json",
      },
    });

    if (!response.ok) return null;

    const data = await response.json() as {
      hits?: {
        hits?: Array<{
          _source?: { entity_id?: string };
        }>;
      };
    };

    const entityId = data.hits?.hits?.[0]?._source?.entity_id;
    return entityId ?? null;
  } catch (err) {
    console.warn(
      `[bootstrap] CIK lookup failed for ${ticker}:`,
      (err as Error).message
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Size bucket determination
// ---------------------------------------------------------------------------

function getSizeBucket(
  employeeCount: number
): "micro" | "small" | "mid" | "large" | "mega" {
  if (employeeCount < 50) return "micro";
  if (employeeCount < 500) return "small";
  if (employeeCount < 5000) return "mid";
  if (employeeCount < 50000) return "large";
  return "mega";
}

// ---------------------------------------------------------------------------
// Database insertion
// ---------------------------------------------------------------------------

async function upsertCompany(data: {
  ticker: string;
  name: string;
  industry: string;
  sector: string;
  employeeCount: number;
  hqState: string;
  hqCity: string;
  website: string;
  logoUrl: string;
  description: string;
  ceo: string;
  mktCap: number;
  cik: string | null;
  sizeBucket: string;
  exchange: string;
  country: string;
}): Promise<void> {
  const pool = getPool();

  await pool.query(
    `INSERT INTO companies (
      ticker, name, legal_name, industry, sector, employee_count,
      hq_state, hq_city, website, logo_url, description, ceo,
      market_cap, cik, size_bucket, exchange, country,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17,
      NOW()
    )
    ON CONFLICT (ticker) DO UPDATE SET
      name = EXCLUDED.name,
      industry = EXCLUDED.industry,
      sector = EXCLUDED.sector,
      employee_count = EXCLUDED.employee_count,
      hq_state = EXCLUDED.hq_state,
      hq_city = EXCLUDED.hq_city,
      website = EXCLUDED.website,
      logo_url = EXCLUDED.logo_url,
      description = EXCLUDED.description,
      ceo = EXCLUDED.ceo,
      market_cap = EXCLUDED.market_cap,
      cik = COALESCE(EXCLUDED.cik, companies.cik),
      size_bucket = EXCLUDED.size_bucket,
      exchange = EXCLUDED.exchange,
      country = EXCLUDED.country,
      updated_at = NOW()`,
    [
      data.ticker,
      data.name,
      data.name, // legal_name defaults to name
      data.industry,
      data.sector,
      data.employeeCount,
      data.hqState,
      data.hqCity,
      data.website,
      data.logoUrl,
      data.description,
      data.ceo,
      data.mktCap,
      data.cik,
      data.sizeBucket,
      data.exchange,
      data.country,
    ]
  );
}

// ---------------------------------------------------------------------------
// Single ticker bootstrap
// ---------------------------------------------------------------------------

async function bootstrapSingleCompany(
  ticker: string
): Promise<BootstrapResult> {
  try {
    console.log(`[bootstrap] Processing ${ticker}...`);

    // Fetch FMP profile (includes industry, sector, employees, HQ, website)
    const fmpData = await fetchFmpData(ticker);

    if (!fmpData.profile) {
      return {
        ticker,
        success: false,
        error: "No profile data available from FMP",
      };
    }

    const profile = fmpData.profile;

    // Look up SEC CIK (non-blocking — we proceed even if it fails)
    const cik = await lookupCik(ticker);

    // Insert into database
    await upsertCompany({
      ticker,
      name: profile.companyName,
      industry: profile.industry,
      sector: profile.sector,
      employeeCount: profile.fullTimeEmployees,
      hqState: profile.state,
      hqCity: profile.city,
      website: profile.website,
      logoUrl: profile.image,
      description: profile.description.slice(0, 1000),
      ceo: profile.ceo,
      mktCap: profile.mktCap,
      cik,
      sizeBucket: getSizeBucket(profile.fullTimeEmployees),
      exchange: profile.exchange,
      country: profile.country,
    });

    console.log(
      `[bootstrap] ${ticker}: ${profile.companyName} ` +
        `(${profile.sector} / ${profile.industry}, ` +
        `${profile.fullTimeEmployees.toLocaleString()} employees` +
        `${cik ? `, CIK: ${cik}` : ""})`
    );

    return { ticker, success: true };
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`[bootstrap] ${ticker} failed: ${msg}`);
    return { ticker, success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Bootstraps a list of companies into the database.
 * For each ticker: fetches FMP profile, looks up SEC CIK, and inserts/updates
 * the companies table.
 *
 * @param tickers - Array of stock ticker symbols to bootstrap.
 *                  Defaults to DEFAULT_TICKERS if empty.
 */
export async function bootstrapCompanies(
  tickers: string[] = DEFAULT_TICKERS
): Promise<void> {
  const tickerList = tickers.length > 0 ? tickers : DEFAULT_TICKERS;

  console.log(
    `[bootstrap] Starting bootstrap for ${tickerList.length} companies...`
  );

  const results: BootstrapResult[] = [];

  // Process in batches of 5 to avoid rate limits
  const BATCH_SIZE = 5;
  for (let i = 0; i < tickerList.length; i += BATCH_SIZE) {
    const batch = tickerList.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((ticker) => bootstrapSingleCompany(ticker))
    );
    results.push(...batchResults);

    // Brief pause between batches to respect rate limits
    if (i + BATCH_SIZE < tickerList.length) {
      await sleep(1000);
    }
  }

  // Summary
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success);

  console.log(
    `\n[bootstrap] Complete: ${succeeded}/${tickerList.length} companies bootstrapped successfully.`
  );

  if (failed.length > 0) {
    console.log(`[bootstrap] Failed tickers:`);
    for (const f of failed) {
      console.log(`  - ${f.ticker}: ${f.error}`);
    }
  }

  await closePool();
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);
  const tickers = args.length > 0 ? args.map((t) => t.toUpperCase()) : DEFAULT_TICKERS;
  bootstrapCompanies(tickers).catch((err) => {
    console.error("[bootstrap] Fatal error:", err);
    process.exit(1);
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
