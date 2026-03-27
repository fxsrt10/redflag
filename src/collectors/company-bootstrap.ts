// ============================================
// RedFlag — Company Bootstrap Collector
// Uses SEC EDGAR (free, unlimited) as primary data source
// ============================================

import { getPool, closePool } from "./db";

// ---------------------------------------------------------------------------
// Default tickers (89 across 10 industries)
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

// SEC EDGAR industry code -> RedFlag industry mapping
const SIC_TO_INDUSTRY: Record<string, string> = {
  "7372": "Tech", "7371": "Tech", "7374": "Tech", "7379": "Tech",
  "3674": "Tech / Semiconductors", "3672": "Tech / Semiconductors",
  "5961": "Tech", "5045": "Tech", "5734": "Tech",
  "4813": "Telecom", "4812": "Telecom", "4899": "Telecom",
  "6022": "Finance", "6020": "Finance", "6021": "Finance",
  "6199": "Finance", "6211": "Finance", "6282": "Finance",
  "1311": "Energy", "2911": "Energy", "1381": "Energy", "1382": "Energy",
  "2834": "Pharma", "2836": "Pharma", "2835": "Pharma",
  "5912": "Pharma", "6324": "Healthcare",
  "3711": "Automotive", "3714": "Automotive",
  "3721": "Aerospace", "3812": "Aerospace", "3760": "Aerospace",
  "5311": "Retail", "5331": "Retail", "5411": "Retail", "5912": "Retail",
  "7812": "Entertainment", "7819": "Entertainment",
  "3559": "Industrial", "3523": "Industrial", "3699": "Industrial",
};

// ---------------------------------------------------------------------------
// SEC EDGAR: fetch company tickers file (maps ticker -> CIK + name)
// ---------------------------------------------------------------------------

interface EdgarTickerEntry {
  cik_str: number;
  ticker: string;
  title: string;
}

let tickerMap: Record<string, EdgarTickerEntry> | null = null;

async function getEdgarTickerMap(): Promise<Record<string, EdgarTickerEntry>> {
  if (tickerMap) return tickerMap;

  console.log("[bootstrap] Fetching SEC EDGAR ticker map...");
  const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: { "User-Agent": "RedFlag/1.0 contact@redflag.app" },
  });

  if (!res.ok) throw new Error(`EDGAR ticker fetch failed: ${res.status}`);

  const data = (await res.json()) as Record<string, EdgarTickerEntry>;
  tickerMap = {};
  for (const entry of Object.values(data)) {
    tickerMap[entry.ticker.toUpperCase()] = entry;
  }
  console.log(`[bootstrap] Loaded ${Object.keys(tickerMap).length} tickers from EDGAR`);
  return tickerMap;
}

// ---------------------------------------------------------------------------
// SEC EDGAR: fetch company facts (employees, revenue, etc.)
// ---------------------------------------------------------------------------

interface CompanyFacts {
  entityName: string;
  cik: number;
  facts?: {
    dei?: Record<string, { units: Record<string, Array<{ val: number; end: string; form: string }>> }>;
    "us-gaap"?: Record<string, { units: Record<string, Array<{ val: number; end: string; form: string }>> }>;
  };
}

async function fetchCompanyFacts(cik: number): Promise<CompanyFacts | null> {
  const paddedCik = String(cik).padStart(10, "0");
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "RedFlag/1.0 contact@redflag.app" },
    });
    if (!res.ok) return null;
    return (await res.json()) as CompanyFacts;
  } catch {
    return null;
  }
}

function getLatestFact(facts: CompanyFacts, namespace: string, concept: string): number | null {
  const ns = namespace === "dei" ? facts.facts?.dei : facts.facts?.["us-gaap"];
  if (!ns?.[concept]) return null;

  const units = ns[concept].units;
  const entries = units["USD"] || units["pure"] || Object.values(units)[0];
  if (!entries || entries.length === 0) return null;

  // Get the most recent 10-K or 10-Q filing
  const sorted = [...entries]
    .filter((e) => e.form === "10-K" || e.form === "10-Q")
    .sort((a, b) => b.end.localeCompare(a.end));

  return sorted[0]?.val ?? null;
}

// ---------------------------------------------------------------------------
// SEC EDGAR: fetch company submissions (SIC code, addresses)
// ---------------------------------------------------------------------------

interface CompanySubmissions {
  name: string;
  cik: number;
  sic: string;
  sicDescription: string;
  stateOfIncorporation: string;
  addresses: {
    business: { stateOrCountry: string; city: string };
    mailing: { stateOrCountry: string; city: string };
  };
  website?: string;
  exchanges: string[];
  tickers: string[];
}

async function fetchCompanySubmissions(cik: number): Promise<CompanySubmissions | null> {
  const paddedCik = String(cik).padStart(10, "0");
  const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "RedFlag/1.0 contact@redflag.app" },
    });
    if (!res.ok) return null;
    return (await res.json()) as CompanySubmissions;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Size bucket determination
// ---------------------------------------------------------------------------

function getSizeBucket(employeeCount: number): "micro" | "small" | "mid" | "large" | "mega" {
  if (employeeCount < 50) return "micro";
  if (employeeCount < 500) return "small";
  if (employeeCount < 5000) return "mid";
  if (employeeCount < 50000) return "large";
  return "mega";
}

// ---------------------------------------------------------------------------
// Bootstrap single company
// ---------------------------------------------------------------------------

async function bootstrapSingleCompany(ticker: string): Promise<{ ticker: string; success: boolean; error?: string }> {
  try {
    const map = await getEdgarTickerMap();
    const entry = map[ticker.toUpperCase()];

    if (!entry) {
      return { ticker, success: false, error: "Not found in SEC EDGAR ticker list" };
    }

    // Fetch company details from EDGAR
    const [submissions, facts] = await Promise.all([
      fetchCompanySubmissions(entry.cik_str),
      fetchCompanyFacts(entry.cik_str),
    ]);

    if (!submissions) {
      return { ticker, success: false, error: "Could not fetch SEC submissions" };
    }

    const employeeCount = facts ? (getLatestFact(facts, "dei", "EntityNumberOfEmployees") ?? 0) : 0;
    const sic = submissions.sic || "";
    const industry = SIC_TO_INDUSTRY[sic] || submissions.sicDescription || "Other";
    const hqState = submissions.addresses?.business?.stateOrCountry || "";
    const companyName = submissions.name || entry.title;
    const sizeBucket = employeeCount > 0 ? getSizeBucket(employeeCount) : "mid";

    // Insert into database (matching actual schema columns)
    const pool = getPool();
    await pool.query(
      `INSERT INTO companies (name, ticker, legal_name, industry, size_bucket, employee_count, hq_state, website, sec_cik, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (ticker) DO UPDATE SET
         name = EXCLUDED.name,
         legal_name = EXCLUDED.legal_name,
         industry = EXCLUDED.industry,
         size_bucket = EXCLUDED.size_bucket,
         employee_count = COALESCE(NULLIF(EXCLUDED.employee_count, 0), companies.employee_count),
         hq_state = EXCLUDED.hq_state,
         sec_cik = EXCLUDED.sec_cik,
         updated_at = NOW()`,
      [
        companyName,
        ticker,
        companyName,
        industry,
        sizeBucket,
        employeeCount || null,
        hqState,
        "", // website — EDGAR doesn't provide this reliably
        String(entry.cik_str),
      ]
    );

    console.log(`  ✓ ${ticker}: ${companyName} (${industry}, ${employeeCount > 0 ? employeeCount.toLocaleString() + " emp" : "emp unknown"}, ${hqState})`);
    return { ticker, success: true };
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`  ✗ ${ticker}: ${msg}`);
    return { ticker, success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function bootstrapCompanies(tickers: string[] = DEFAULT_TICKERS): Promise<void> {
  // First, add a unique constraint on ticker if it doesn't exist
  const pool = getPool();
  try {
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker) WHERE ticker IS NOT NULL`);
  } catch {
    // Index may already exist
  }

  console.log(`\n[bootstrap] Starting bootstrap for ${tickers.length} companies using SEC EDGAR...\n`);

  const results: Array<{ ticker: string; success: boolean; error?: string }> = [];

  // Process in batches of 5 (SEC rate limit: 10 req/s, we make 2-3 per company)
  const BATCH_SIZE = 5;
  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((t) => bootstrapSingleCompany(t)));
    results.push(...batchResults);

    // Rate limit pause
    if (i + BATCH_SIZE < tickers.length) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success);

  console.log(`\n[bootstrap] Done: ${succeeded}/${tickers.length} companies bootstrapped.`);
  if (failed.length > 0) {
    console.log(`[bootstrap] Failed (${failed.length}):`);
    failed.forEach((f) => console.log(`  - ${f.ticker}: ${f.error}`));
  }

  await closePool();
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

if (require.main === module || process.argv[1]?.endsWith("company-bootstrap.ts")) {
  const envTickers = process.env.BOOTSTRAP_TICKERS;
  const tickers = envTickers ? envTickers.split(",").map((t) => t.trim()).filter(Boolean) : DEFAULT_TICKERS;
  bootstrapCompanies(tickers).catch((err) => {
    console.error("[bootstrap] Fatal error:", err);
    process.exit(1);
  });
}
