// ============================================
// RedFlag — Shared Database Connection for Collectors
// ============================================

import { Pool } from "@neondatabase/serverless";

let pool: Pool | null = null;

/**
 * Returns a shared connection pool for collector scripts.
 * Uses DATABASE_URL_UNPOOLED for direct connections (required by
 * long-running collector jobs that may hold transactions).
 */
export function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL_UNPOOLED is not set. Collectors require a direct (unpooled) connection string."
    );
  }

  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on("error", (err: Error) => {
    console.error("[db] Unexpected pool error:", err.message);
  });

  return pool;
}

/**
 * Gracefully close the shared pool. Call this when the collector
 * process is done (e.g. at the end of a GitHub Actions run).
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("[db] Connection pool closed.");
  }
}
