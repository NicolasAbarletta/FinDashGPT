// backend/src/backend/database.ts
// --------------------------------
// We import better-sqlite3’s default export (a constructor function)
// and treat it as `any` to avoid missing-types compiler errors.
// This lets us keep "strict": true while skipping external lib checks.

import BetterSqlite3 from 'better-sqlite3';

/**
 * Lightweight wrapper around a better-sqlite3 database instance.
 * Provides helper methods for inserting and querying markets,
 * economic releases, and private-equity metrics.
 */
class DB {
  // Use `any` so we don’t depend on community type stubs.
  // Runtime safety is fine for this prototype.
  private db: any;

  constructor(filename: string = 'data.db') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.db = new (BetterSqlite3 as any)(filename);
    this.initialise();
  }

  /** Create tables if they don’t exist (idempotent). */
  private initialise(): void {
    this.db.exec(`PRAGMA foreign_keys = ON`);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS markets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category   TEXT NOT NULL,
        symbol     TEXT NOT NULL,
        name       TEXT NOT NULL,
        value      REAL NOT NULL,
        timestamp  TEXT NOT NULL
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS economics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        indicator    TEXT NOT NULL,
        country      TEXT NOT NULL,
        value        REAL NOT NULL,
        release_date TEXT NOT NULL,
        period       TEXT,
        surprise     REAL,
        timestamp    TEXT NOT NULL
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pe_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric    TEXT NOT NULL,
        strategy  TEXT NOT NULL,
        region    TEXT,
        value     REAL,
        period    TEXT,
        timestamp TEXT NOT NULL
      )
    `);
  }

  /* ---------- Markets ---------- */

  insertMarketQuote(record: {
    category: string;
    symbol: string;
    name: string;
    value: number;
    timestamp: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO markets (category, symbol, name, value, timestamp)
      VALUES (@category, @symbol, @name, @value, @timestamp)
    `);
    stmt.run(record);
  }

  getLatestMarketQuotes(category?: string) {
    let sql = `
      SELECT *
      FROM markets m
      WHERE timestamp = (
        SELECT MAX(timestamp) FROM markets m2 WHERE m2.symbol = m.symbol
      )
    `;
    return category
      ? this.db.prepare(sql + ' AND category = ?').all(category)
      : this.db.prepare(sql).all();
  }

  /* ---------- Economics ---------- */

  insertEconomicRelease(record: {
    indicator: string;
    country: string;
    value: number;
    release_date: string;
    period?: string;
    surprise?: number;
    timestamp: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO economics
        (indicator, country, value, release_date, period, surprise, timestamp)
      VALUES (@indicator, @country, @value, @release_date, @period, @surprise, @timestamp)
    `);
    stmt.run(record);
  }

  getLatestEconomicReleases() {
    return this.db.prepare(`
      SELECT *
      FROM economics e
      WHERE timestamp = (
        SELECT MAX(timestamp)
        FROM economics e2
        WHERE e2.indicator = e.indicator AND e2.country = e.country
      )
    `).all();
  }

  /* ---------- Private-equity metrics ---------- */

  insertPEMetric(record: {
    metric: string;
    strategy: string;
    region?: string;
    value: number;
    period?: string;
    timestamp: string;
  }): void {
    const stmt = this.db.prepare(`
      INSERT INTO pe_metrics
        (metric, strategy, region, value, period, timestamp)
      VALUES (@metric, @strategy, @region, @value, @period, @timestamp)
    `);
    stmt.run(record);
  }

  getLatestPEMetrics() {
    return this.db.prepare(`
      SELECT *
      FROM pe_metrics p
      WHERE timestamp = (
        SELECT MAX(timestamp)
        FROM pe_metrics p2
        WHERE p2.metric   = p.metric
          AND p2.strategy = p.strategy
          AND IFNULL(p2.region, '') = IFNULL(p.region, '')
      )
    `).all();
  }
}

export default DB;
