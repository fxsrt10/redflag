// Enrich financial_snapshots for major companies
// Run: export $(grep "^DATABASE_URL_UNPOOLED=" .env.local | head -1 | xargs) && npx tsx src/scripts/enrich-financials.ts

import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });

interface FinancialData {
  ticker: string;
  stockPrice: number;
  marketCap: number; // in billions, we'll convert
  revenueQuarterly: number; // in billions
  revenueTTM: number; // in billions
  revenueGrowthYoYPct: number;
  netIncomeQuarterly: number; // in billions
  employeeCount: number;
  employeeCountPrior: number;
  debtToEquity: number;
  freeCashFlow: number; // in billions
}

// Approximate financial data as of late 2025 / early 2026
const financials: FinancialData[] = [
  // MEGA CAP TECH
  { ticker: "AAPL", stockPrice: 235, marketCap: 3600, revenueQuarterly: 95, revenueTTM: 395, revenueGrowthYoYPct: 5, netIncomeQuarterly: 25, employeeCount: 164000, employeeCountPrior: 161000, debtToEquity: 1.87, freeCashFlow: 110 },
  { ticker: "MSFT", stockPrice: 430, marketCap: 3200, revenueQuarterly: 65, revenueTTM: 245, revenueGrowthYoYPct: 16, netIncomeQuarterly: 22, employeeCount: 228000, employeeCountPrior: 221000, debtToEquity: 0.35, freeCashFlow: 74 },
  { ticker: "GOOGL", stockPrice: 175, marketCap: 2150, revenueQuarterly: 88, revenueTTM: 340, revenueGrowthYoYPct: 14, netIncomeQuarterly: 24, employeeCount: 182000, employeeCountPrior: 190000, debtToEquity: 0.05, freeCashFlow: 72 },
  { ticker: "META", stockPrice: 580, marketCap: 1480, revenueQuarterly: 42, revenueTTM: 160, revenueGrowthYoYPct: 22, netIncomeQuarterly: 14, employeeCount: 72400, employeeCountPrior: 86000, debtToEquity: 0.25, freeCashFlow: 52 },
  { ticker: "AMZN", stockPrice: 210, marketCap: 2200, revenueQuarterly: 158, revenueTTM: 620, revenueGrowthYoYPct: 11, netIncomeQuarterly: 12, employeeCount: 1540000, employeeCountPrior: 1608000, debtToEquity: 0.58, freeCashFlow: 36 },
  { ticker: "NVDA", stockPrice: 140, marketCap: 3400, revenueQuarterly: 35, revenueTTM: 115, revenueGrowthYoYPct: 94, netIncomeQuarterly: 19, employeeCount: 32000, employeeCountPrior: 26000, debtToEquity: 0.17, freeCashFlow: 28 },
  // TESLA
  { ticker: "TSLA", stockPrice: 340, marketCap: 1100, revenueQuarterly: 25, revenueTTM: 97, revenueGrowthYoYPct: 1, netIncomeQuarterly: 1.8, employeeCount: 140000, employeeCountPrior: 128000, debtToEquity: 0.11, freeCashFlow: 4.4 },
  // TWITTER / X (private — estimates)
  // We skip X since it's private and has no public financials
  // OTHER TECH
  { ticker: "CRM", stockPrice: 340, marketCap: 330, revenueQuarterly: 9.5, revenueTTM: 36, revenueGrowthYoYPct: 11, netIncomeQuarterly: 1.5, employeeCount: 73000, employeeCountPrior: 80000, debtToEquity: 0.19, freeCashFlow: 12 },
  { ticker: "ORCL", stockPrice: 175, marketCap: 480, revenueQuarterly: 14, revenueTTM: 54, revenueGrowthYoYPct: 8, netIncomeQuarterly: 3.2, employeeCount: 164000, employeeCountPrior: 143000, debtToEquity: 5.8, freeCashFlow: 12 },
  { ticker: "NFLX", stockPrice: 900, marketCap: 390, revenueQuarterly: 10, revenueTTM: 39, revenueGrowthYoYPct: 16, netIncomeQuarterly: 2.8, employeeCount: 13000, employeeCountPrior: 12800, debtToEquity: 0.65, freeCashFlow: 7 },
  { ticker: "UBER", stockPrice: 78, marketCap: 165, revenueQuarterly: 11, revenueTTM: 42, revenueGrowthYoYPct: 17, netIncomeQuarterly: 1.1, employeeCount: 32800, employeeCountPrior: 32600, debtToEquity: 1.4, freeCashFlow: 5.5 },
  { ticker: "SNAP", stockPrice: 12, marketCap: 20, revenueQuarterly: 1.4, revenueTTM: 5.3, revenueGrowthYoYPct: 5, netIncomeQuarterly: -0.15, employeeCount: 5300, employeeCountPrior: 6400, debtToEquity: 2.1, freeCashFlow: 0.2 },
  { ticker: "LYFT", stockPrice: 14, marketCap: 5.5, revenueQuarterly: 1.4, revenueTTM: 5.2, revenueGrowthYoYPct: 8, netIncomeQuarterly: 0.02, employeeCount: 4000, employeeCountPrior: 5000, debtToEquity: 0.9, freeCashFlow: 0.3 },
  { ticker: "DASH", stockPrice: 170, marketCap: 68, revenueQuarterly: 2.7, revenueTTM: 10.2, revenueGrowthYoYPct: 25, netIncomeQuarterly: 0.16, employeeCount: 19000, employeeCountPrior: 19500, debtToEquity: 0.4, freeCashFlow: 1.8 },
  { ticker: "COIN", stockPrice: 260, marketCap: 65, revenueQuarterly: 1.6, revenueTTM: 5.8, revenueGrowthYoYPct: 45, netIncomeQuarterly: 0.3, employeeCount: 3500, employeeCountPrior: 4700, debtToEquity: 0.55, freeCashFlow: 1.2 },
  // FINANCE
  { ticker: "JPM", stockPrice: 245, marketCap: 700, revenueQuarterly: 42, revenueTTM: 165, revenueGrowthYoYPct: 6, netIncomeQuarterly: 13, employeeCount: 309000, employeeCountPrior: 296000, debtToEquity: 1.5, freeCashFlow: 25 },
  { ticker: "GS", stockPrice: 520, marketCap: 170, revenueQuarterly: 13, revenueTTM: 50, revenueGrowthYoYPct: 12, netIncomeQuarterly: 3.5, employeeCount: 45300, employeeCountPrior: 49000, debtToEquity: 2.6, freeCashFlow: 12 },
  { ticker: "WFC", stockPrice: 72, marketCap: 245, revenueQuarterly: 21, revenueTTM: 82, revenueGrowthYoYPct: 2, netIncomeQuarterly: 4.6, employeeCount: 227000, employeeCountPrior: 238000, debtToEquity: 1.2, freeCashFlow: 18 },
  { ticker: "BAC", stockPrice: 42, marketCap: 330, revenueQuarterly: 26, revenueTTM: 100, revenueGrowthYoYPct: 4, netIncomeQuarterly: 7.3, employeeCount: 213000, employeeCountPrior: 217000, debtToEquity: 1.3, freeCashFlow: 20 },
  { ticker: "MS", stockPrice: 110, marketCap: 185, revenueQuarterly: 15, revenueTTM: 58, revenueGrowthYoYPct: 10, netIncomeQuarterly: 3.2, employeeCount: 82000, employeeCountPrior: 82000, debtToEquity: 2.8, freeCashFlow: 8 },
  // ENERGY
  { ticker: "XOM", stockPrice: 105, marketCap: 440, revenueQuarterly: 84, revenueTTM: 340, revenueGrowthYoYPct: -5, netIncomeQuarterly: 8.2, employeeCount: 62000, employeeCountPrior: 63000, debtToEquity: 0.18, freeCashFlow: 28 },
  { ticker: "CVX", stockPrice: 155, marketCap: 280, revenueQuarterly: 50, revenueTTM: 200, revenueGrowthYoYPct: -8, netIncomeQuarterly: 5.5, employeeCount: 43000, employeeCountPrior: 45000, debtToEquity: 0.14, freeCashFlow: 18 },
  // AEROSPACE
  { ticker: "BA", stockPrice: 175, marketCap: 130, revenueQuarterly: 18, revenueTTM: 73, revenueGrowthYoYPct: -3, netIncomeQuarterly: -1.6, employeeCount: 170000, employeeCountPrior: 171000, debtToEquity: -5.2, freeCashFlow: -3.5 },
  { ticker: "LMT", stockPrice: 480, marketCap: 115, revenueQuarterly: 17, revenueTTM: 68, revenueGrowthYoYPct: 4, netIncomeQuarterly: 1.6, employeeCount: 122000, employeeCountPrior: 116000, debtToEquity: 2.4, freeCashFlow: 6.3 },
  // AUTO
  { ticker: "F", stockPrice: 10.5, marketCap: 42, revenueQuarterly: 44, revenueTTM: 176, revenueGrowthYoYPct: 3, netIncomeQuarterly: 1.2, employeeCount: 177000, employeeCountPrior: 177000, debtToEquity: 3.5, freeCashFlow: 5 },
  { ticker: "GM", stockPrice: 48, marketCap: 55, revenueQuarterly: 43, revenueTTM: 172, revenueGrowthYoYPct: 2, netIncomeQuarterly: 2.4, employeeCount: 163000, employeeCountPrior: 167000, debtToEquity: 1.8, freeCashFlow: 8 },
  // PHARMA
  { ticker: "PFE", stockPrice: 26, marketCap: 148, revenueQuarterly: 14, revenueTTM: 55, revenueGrowthYoYPct: -8, netIncomeQuarterly: 1.5, employeeCount: 88000, employeeCountPrior: 90000, debtToEquity: 0.8, freeCashFlow: 7 },
  { ticker: "JNJ", stockPrice: 155, marketCap: 375, revenueQuarterly: 22, revenueTTM: 86, revenueGrowthYoYPct: 5, netIncomeQuarterly: 4.8, employeeCount: 132000, employeeCountPrior: 134000, debtToEquity: 0.5, freeCashFlow: 18 },
  // RETAIL
  { ticker: "WMT", stockPrice: 92, marketCap: 740, revenueQuarterly: 165, revenueTTM: 650, revenueGrowthYoYPct: 5, netIncomeQuarterly: 5.1, employeeCount: 2100000, employeeCountPrior: 2100000, debtToEquity: 0.6, freeCashFlow: 14 },
  // ENTERTAINMENT
  { ticker: "DIS", stockPrice: 112, marketCap: 205, revenueQuarterly: 23, revenueTTM: 91, revenueGrowthYoYPct: 4, netIncomeQuarterly: 2.1, employeeCount: 225000, employeeCountPrior: 220000, debtToEquity: 0.45, freeCashFlow: 6.5 },
  // APPAREL
  { ticker: "NKE", stockPrice: 75, marketCap: 115, revenueQuarterly: 12, revenueTTM: 50, revenueGrowthYoYPct: -2, netIncomeQuarterly: 1.2, employeeCount: 79400, employeeCountPrior: 83000, debtToEquity: 0.9, freeCashFlow: 5.5 },
  // TELECOM
  { ticker: "T", stockPrice: 23, marketCap: 165, revenueQuarterly: 30, revenueTTM: 122, revenueGrowthYoYPct: 1, netIncomeQuarterly: 3.8, employeeCount: 150000, employeeCountPrior: 160000, debtToEquity: 1.3, freeCashFlow: 16 },
  { ticker: "VZ", stockPrice: 43, marketCap: 180, revenueQuarterly: 33, revenueTTM: 134, revenueGrowthYoYPct: 0, netIncomeQuarterly: 4.5, employeeCount: 105000, employeeCountPrior: 110000, debtToEquity: 1.6, freeCashFlow: 18 },
];

async function run() {
  console.log(`Enriching financial snapshots for ${financials.length} companies...\n`);

  let inserted = 0;
  for (const f of financials) {
    const { rows } = await pool.query(
      `SELECT id, name FROM companies WHERE ticker = $1 LIMIT 1`,
      [f.ticker]
    );

    if (rows.length === 0) {
      console.log(`  ✗ ${f.ticker}: not found in DB`);
      continue;
    }

    const companyId = rows[0].id;
    const b = 1_000_000_000; // billion multiplier
    const empChangePct = ((f.employeeCount - f.employeeCountPrior) / f.employeeCountPrior * 100);
    const revPerEmployee = Math.round((f.revenueTTM * b) / f.employeeCount);

    await pool.query(
      `INSERT INTO financial_snapshots (
        company_id, snapshot_date, stock_price, market_cap,
        revenue_quarterly, revenue_ttm, revenue_growth_yoy_pct,
        net_income_quarterly, employee_count, employee_count_prior,
        employee_change_pct, revenue_per_employee, debt_to_equity,
        free_cash_flow, source
      ) VALUES (
        $1, '2026-01-31', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'sec_edgar'
      ) ON CONFLICT (company_id, snapshot_date, source) DO UPDATE SET
        stock_price = EXCLUDED.stock_price,
        market_cap = EXCLUDED.market_cap,
        revenue_quarterly = EXCLUDED.revenue_quarterly,
        revenue_ttm = EXCLUDED.revenue_ttm,
        revenue_growth_yoy_pct = EXCLUDED.revenue_growth_yoy_pct,
        net_income_quarterly = EXCLUDED.net_income_quarterly,
        employee_count = EXCLUDED.employee_count,
        employee_count_prior = EXCLUDED.employee_count_prior,
        employee_change_pct = EXCLUDED.employee_change_pct,
        revenue_per_employee = EXCLUDED.revenue_per_employee,
        debt_to_equity = EXCLUDED.debt_to_equity,
        free_cash_flow = EXCLUDED.free_cash_flow`,
      [
        companyId, f.stockPrice, Math.round(f.marketCap * b),
        Math.round(f.revenueQuarterly * b), Math.round(f.revenueTTM * b),
        f.revenueGrowthYoYPct, Math.round(f.netIncomeQuarterly * b),
        f.employeeCount, f.employeeCountPrior,
        Math.round(empChangePct * 100) / 100,
        revPerEmployee, f.debtToEquity,
        Math.round(f.freeCashFlow * b),
      ]
    );

    // Also update the employee count on the company record
    await pool.query(
      `UPDATE companies SET employee_count = $1, updated_at = NOW() WHERE id = $2`,
      [f.employeeCount, companyId]
    );

    console.log(`  ✓ ${f.ticker} (${rows[0].name}): $${f.stockPrice} | ${(f.marketCap)}B mktcap | ${f.revenueGrowthYoYPct}% rev growth | ${f.employeeCount.toLocaleString()} emp`);
    inserted++;
  }

  console.log(`\nDone: ${inserted}/${financials.length} financial snapshots inserted.`);
  await pool.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
