// ============================================
// RedFlag — Financial Modeling Prep Data Collector
// ============================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FmpResult {
  ticker: string;
  profile: FmpProfile | null;
  incomeStatements: FmpIncomeStatement[];
  stockPrices90d: FmpStockPrice[];
  fetchedAt: string;
  errors: string[];
}

export interface FmpProfile {
  companyName: string;
  symbol: string;
  exchange: string;
  industry: string;
  sector: string;
  country: string;
  fullTimeEmployees: number;
  description: string;
  ceo: string;
  website: string;
  image: string;
  city: string;
  state: string;
  mktCap: number;
  price: number;
  beta: number;
  ipoDate: string;
}

export interface FmpIncomeStatement {
  date: string;
  period: string; // "Q1", "Q2", "Q3", "Q4", "FY"
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  operatingExpenses: number;
  costOfRevenue: number;
  ebitda: number;
  eps: number;
  weightedAverageShsOut: number;
  calendarYear: string;
}

export interface FmpStockPrice {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  changePercent: number;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key) {
    throw new Error("FMP_API_KEY environment variable is not set");
  }
  return key;
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const apiKey = getApiKey();
  const base = `https://financialmodelingprep.com/api/v3${path}`;
  const searchParams = new URLSearchParams({ apikey: apiKey, ...params });
  return `${base}?${searchParams.toString()}`;
}

async function fmpFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`FMP HTTP ${response.status}: ${url.replace(/apikey=[^&]+/, "apikey=***")}`);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Individual data fetchers
// ---------------------------------------------------------------------------

interface FmpProfileRaw {
  companyName: string;
  symbol: string;
  exchange: string;
  industry: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  description: string;
  ceo: string;
  website: string;
  image: string;
  city: string;
  state: string;
  mktCap: number;
  price: number;
  beta: number;
  ipoDate: string;
}

async function fetchProfile(ticker: string): Promise<FmpProfile | null> {
  try {
    const url = buildUrl(`/profile/${ticker}`);
    const data = await fmpFetch<FmpProfileRaw[]>(url);

    if (!data || data.length === 0) return null;

    const p = data[0];
    return {
      companyName: p.companyName,
      symbol: p.symbol,
      exchange: p.exchange,
      industry: p.industry,
      sector: p.sector,
      country: p.country,
      fullTimeEmployees: parseInt(String(p.fullTimeEmployees), 10) || 0,
      description: p.description,
      ceo: p.ceo,
      website: p.website,
      image: p.image,
      city: p.city,
      state: p.state,
      mktCap: p.mktCap,
      price: p.price,
      beta: p.beta,
      ipoDate: p.ipoDate,
    };
  } catch (err) {
    console.error(
      `[fmp] Failed to fetch profile for ${ticker}:`,
      (err as Error).message
    );
    return null;
  }
}

interface FmpIncomeStatementRaw {
  date: string;
  period: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  operatingExpenses: number;
  costOfRevenue: number;
  ebitda: number;
  eps: number;
  weightedAverageShsOut: number;
  calendarYear: string;
}

async function fetchIncomeStatements(
  ticker: string
): Promise<FmpIncomeStatement[]> {
  try {
    const url = buildUrl(`/income-statement/${ticker}`, {
      period: "quarter",
      limit: "8",
    });
    const data = await fmpFetch<FmpIncomeStatementRaw[]>(url);

    if (!data || !Array.isArray(data)) return [];

    return data
      .map((item) => ({
        date: item.date,
        period: item.period,
        revenue: item.revenue,
        netIncome: item.netIncome,
        grossProfit: item.grossProfit,
        operatingIncome: item.operatingIncome,
        operatingExpenses: item.operatingExpenses,
        costOfRevenue: item.costOfRevenue,
        ebitda: item.ebitda,
        eps: item.eps,
        weightedAverageShsOut: item.weightedAverageShsOut,
        calendarYear: item.calendarYear,
      }))
      // Sort by date ascending (oldest first)
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error(
      `[fmp] Failed to fetch income statements for ${ticker}:`,
      (err as Error).message
    );
    return [];
  }
}

interface FmpHistoricalPriceResponse {
  symbol: string;
  historical: Array<{
    date: string;
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    changePercent: number;
  }>;
}

async function fetchStockPrices(ticker: string): Promise<FmpStockPrice[]> {
  try {
    const url = buildUrl(`/historical-price-full/${ticker}`, {
      timeseries: "90",
    });
    const data = await fmpFetch<FmpHistoricalPriceResponse>(url);

    if (!data?.historical || !Array.isArray(data.historical)) return [];

    return data.historical
      .map((item) => ({
        date: item.date,
        close: item.close,
        open: item.open,
        high: item.high,
        low: item.low,
        volume: item.volume,
        changePercent: item.changePercent,
      }))
      // Sort ascending (oldest first)
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error(
      `[fmp] Failed to fetch stock prices for ${ticker}:`,
      (err as Error).message
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Fetches financial data for a ticker from Financial Modeling Prep.
 * Requires FMP_API_KEY environment variable.
 */
export async function fetchFmpData(ticker: string): Promise<FmpResult> {
  const errors: string[] = [];
  const upperTicker = ticker.toUpperCase();

  console.log(`[fmp] Fetching data for ${upperTicker}...`);

  // Fetch all three endpoints in parallel
  const [profile, incomeStatements, stockPrices90d] = await Promise.all([
    fetchProfile(upperTicker).catch((err) => {
      errors.push(`Profile: ${(err as Error).message}`);
      return null;
    }),
    fetchIncomeStatements(upperTicker).catch((err) => {
      errors.push(`Income statements: ${(err as Error).message}`);
      return [] as FmpIncomeStatement[];
    }),
    fetchStockPrices(upperTicker).catch((err) => {
      errors.push(`Stock prices: ${(err as Error).message}`);
      return [] as FmpStockPrice[];
    }),
  ]);

  console.log(
    `[fmp] ${upperTicker}: profile=${profile ? "OK" : "MISSING"}, ` +
      `income=${incomeStatements.length} quarters, ` +
      `prices=${stockPrices90d.length} days`
  );

  return {
    ticker: upperTicker,
    profile,
    incomeStatements,
    stockPrices90d,
    fetchedAt: new Date().toISOString(),
    errors,
  };
}
