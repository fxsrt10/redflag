// ============================================
// RedFlag — SEC EDGAR Data Collector
// ============================================

const USER_AGENT = "RedFlag/1.0 contact@redflag.app";
const RATE_LIMIT_MS = 100; // 10 req/s = 100ms between requests

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SecEdgarResult {
  cik: string;
  companyName: string;
  revenues: QuarterlyDataPoint[];
  netIncomes: QuarterlyDataPoint[];
  employeeCounts: EmployeeDataPoint[];
  restructuring8kFilings: RestructuringFiling[];
  fetchedAt: string;
  errors: string[];
}

export interface QuarterlyDataPoint {
  period: string; // e.g. "2024-Q3"
  endDate: string; // e.g. "2024-09-30"
  value: number;
  form: string; // e.g. "10-Q", "10-K"
}

export interface EmployeeDataPoint {
  date: string;
  count: number;
  form: string;
}

export interface RestructuringFiling {
  filedDate: string;
  formType: string;
  description: string;
  accessionNumber: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

let lastRequestTime = 0;

async function rateLimitedFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await sleep(RATE_LIMIT_MS - elapsed);
  }
  lastRequestTime = Date.now();

  const response = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`SEC EDGAR HTTP ${response.status}: ${url}`);
  }

  return response;
}

// ---------------------------------------------------------------------------
// Company facts extraction
// ---------------------------------------------------------------------------

interface CompanyFactsResponse {
  cik: number;
  entityName: string;
  facts: {
    "us-gaap"?: Record<string, FactConcept>;
    dei?: Record<string, FactConcept>;
  };
}

interface FactConcept {
  label: string;
  description: string;
  units: Record<string, FactUnit[]>;
}

interface FactUnit {
  start?: string;
  end: string;
  val: number;
  accn: string;
  fy: number;
  fp: string; // "Q1", "Q2", "Q3", "FY"
  form: string;
  filed: string;
  frame?: string;
}

function extractQuarterlyData(
  facts: CompanyFactsResponse["facts"],
  namespace: "us-gaap" | "dei",
  conceptNames: string[]
): QuarterlyDataPoint[] {
  const ns = facts[namespace];
  if (!ns) return [];

  for (const concept of conceptNames) {
    const factConcept = ns[concept];
    if (!factConcept) continue;

    const units = factConcept.units["USD"] ?? factConcept.units["shares"] ?? [];
    if (units.length === 0) continue;

    // Filter to quarterly reports (10-Q and 10-K)
    const quarterly = units
      .filter(
        (u) =>
          (u.form === "10-Q" || u.form === "10-K") &&
          u.fp !== undefined
      )
      .map((u) => ({
        period: `${u.fy}-${u.fp}`,
        endDate: u.end,
        value: u.val,
        form: u.form,
      }))
      // Sort by end date ascending
      .sort((a, b) => a.endDate.localeCompare(b.endDate));

    // Deduplicate by period (keep latest filing)
    const seen = new Map<string, QuarterlyDataPoint>();
    for (const dp of quarterly) {
      seen.set(dp.period, dp);
    }

    return Array.from(seen.values());
  }

  return [];
}

function extractEmployeeCounts(
  facts: CompanyFactsResponse["facts"]
): EmployeeDataPoint[] {
  const dei = facts.dei;
  if (!dei) return [];

  const concept = dei["EntityNumberOfEmployeesFormedEntities"] ?? dei["EntityNumberOfEmployees"];
  if (!concept) return [];

  const units = concept.units["pure"] ?? concept.units["number"] ?? Object.values(concept.units)[0] ?? [];

  return units
    .filter((u) => u.form === "10-K" || u.form === "10-Q")
    .map((u) => ({
      date: u.end,
      count: u.val,
      form: u.form,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ---------------------------------------------------------------------------
// 8-K restructuring search
// ---------------------------------------------------------------------------

interface EftsSearchResponse {
  hits?: {
    hits?: Array<{
      _id: string;
      _source: {
        file_date: string;
        form_type: string;
        display_names?: string[];
        entity_name?: string;
      };
    }>;
    total?: { value: number };
  };
}

async function search8kRestructuring(
  companyName: string
): Promise<RestructuringFiling[]> {
  const query = encodeURIComponent(
    `"reduction in force" "${companyName}"`
  );
  const url = `https://efts.sec.gov/LATEST/search-index?q=${query}&forms=8-K&dateRange=custom&startdt=${getDateMonthsAgo(12)}&enddt=${getTodayDate()}`;

  try {
    const response = await rateLimitedFetch(url);
    const data = (await response.json()) as EftsSearchResponse;

    if (!data.hits?.hits) return [];

    return data.hits.hits.map((hit) => ({
      filedDate: hit._source.file_date,
      formType: hit._source.form_type,
      description: `8-K filing mentioning reduction in force for ${companyName}`,
      accessionNumber: hit._id,
      url: `https://www.sec.gov/Archives/edgar/data/${hit._id.replace(/-/g, "")}`,
    }));
  } catch (err) {
    console.warn(
      `[sec-edgar] Failed to search 8-K restructuring for ${companyName}:`,
      (err as Error).message
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetches company financial data from SEC EDGAR.
 *
 * @param cik - The company's Central Index Key (zero-padded to 10 digits)
 * @param companyName - The company's name (used for 8-K text search)
 */
export async function fetchSecEdgarData(
  cik: string,
  companyName: string
): Promise<SecEdgarResult> {
  const errors: string[] = [];
  const paddedCik = cik.padStart(10, "0");

  console.log(`[sec-edgar] Fetching data for CIK ${paddedCik} (${companyName})...`);

  // Fetch company facts
  let revenues: QuarterlyDataPoint[] = [];
  let netIncomes: QuarterlyDataPoint[] = [];
  let employeeCounts: EmployeeDataPoint[] = [];

  try {
    const factsUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`;
    const response = await rateLimitedFetch(factsUrl);
    const factsData = (await response.json()) as CompanyFactsResponse;

    revenues = extractQuarterlyData(factsData.facts, "us-gaap", [
      "Revenues",
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "SalesRevenueNet",
      "RevenueFromContractWithCustomerIncludingAssessedTax",
    ]);

    netIncomes = extractQuarterlyData(factsData.facts, "us-gaap", [
      "NetIncomeLoss",
      "ProfitLoss",
      "NetIncomeLossAvailableToCommonStockholdersBasic",
    ]);

    employeeCounts = extractEmployeeCounts(factsData.facts);

    console.log(
      `[sec-edgar] Found ${revenues.length} revenue entries, ` +
        `${netIncomes.length} net income entries, ` +
        `${employeeCounts.length} employee count entries`
    );
  } catch (err) {
    const msg = `Failed to fetch company facts: ${(err as Error).message}`;
    console.error(`[sec-edgar] ${msg}`);
    errors.push(msg);
  }

  // Search for 8-K restructuring filings
  const restructuring8kFilings = await search8kRestructuring(companyName);
  console.log(
    `[sec-edgar] Found ${restructuring8kFilings.length} 8-K restructuring filing(s)`
  );

  return {
    cik: paddedCik,
    companyName,
    revenues,
    netIncomes,
    employeeCounts,
    restructuring8kFilings,
    fetchedAt: new Date().toISOString(),
    errors,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDateMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}
