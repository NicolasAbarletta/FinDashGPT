import Database from 'better-sqlite3';

/**
 * Create and manage a SQLite database.  This module is responsible for
 * initialising the schema and providing simple helper functions for CRUD
 * operations.  The database file will be created at runtime in the root
 * of the project (under backend/data.db).  If the file already exists it
 * will be reused.  The schema has three high‑level tables:
 *
 * markets   – real‑time or delayed quotes for major indices, rates,
 *              commodities, FX and crypto.  Each row records a single
 *              observation with a category and symbol identifier.
 * economics – macroeconomic releases and surprise indices, keyed by
 *              indicator and country.  Each observation includes a
 *              release date and, where relevant, a surprise value.
 * pe_metrics – private equity statistics such as capital raised,
 *              dry powder, multiples and league tables.  Strategy and
 *              region differentiate segments.
 */
class DB {
  private db: Database.Database;

  constructor(filename: string = 'data.db') {
    this.db = new Database(filename);
    this.initialise();
  }

  /**
   * Initialise the database schema.  This method is idempotent and can be
   * called multiple times without side effects.  It creates tables if
   * they do not already exist.
   */
  private initialise(): void {
    const pragma = `PRAGMA foreign_keys = ON`;
    this.db.exec(pragma);
    const createMarkets = `
      CREATE TABLE IF NOT EXISTS markets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        value REAL NOT NULL,
        timestamp TEXT NOT NULL
      )
    `;
    const createEconomics = `
      CREATE TABLE IF NOT EXISTS economics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        indicator TEXT NOT NULL,
        country TEXT NOT NULL,
        value REAL NOT NULL,
        release_date TEXT NOT NULL,
        period TEXT,
        surprise REAL,
        timestamp TEXT NOT NULL
      )
    `;
    const createPE = `
      CREATE TABLE IF NOT EXISTS pe_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric TEXT NOT NULL,
        strategy TEXT NOT NULL,
        region TEXT,
        value REAL,
        period TEXT,
        timestamp TEXT NOT NULL
      )
    `;
    this.db.exec(createMarkets);
    this.db.exec(createEconomics);
    this.db.exec(createPE);
  }

  /**
   * Insert a market quote into the database.
   */
  insertMarketQuote(record: {
    category: string;
    symbol: string;
    name: string;
    value: number;
    timestamp: string;
  }): void {
    const stmt = this.db.prepare(
      `INSERT INTO markets (category, symbol, name, value, timestamp)
       VALUES (@category, @symbol, @name, @value, @timestamp)`
    );
    stmt.run(record);
  }

  /**
   * Retrieve the latest market quotes for each unique symbol within a
   * category.  This convenience function returns an array of the most
   * recent observations.
   */
  getLatestMarketQuotes(category?: string) {
    let sql = `
      SELECT * FROM markets m
      WHERE timestamp = (
        SELECT MAX(timestamp)
        FROM markets m2
        WHERE m2.symbol = m.symbol
      )
    `;
    if (category) {
      sql += ` AND category = ?`;
      return this.db.prepare(sql).all(category);
    }
    return this.db.prepare(sql).all();
  }

  insertEconomicRelease(record: {
    indicator: string;
    country: string;
    value: number;
    release_date: string;
    period?: string;
    surprise?: number;
    timestamp: string;
  }): void {
    const stmt = this.db.prepare(
      `INSERT INTO economics (indicator, country, value, release_date, period, surprise, timestamp)
       VALUES (@indicator, @country, @value, @release_date, @period, @surprise, @timestamp)`
    );
    stmt.run(record);
  }

  getLatestEconomicReleases() {
    // Return the most recent record per indicator/country combination.
    const sql = `
      SELECT * FROM economics e
      WHERE timestamp = (
        SELECT MAX(timestamp) FROM economics e2
        WHERE e2.indicator = e.indicator AND e2.country = e.country
      )
    `;
    return this.db.prepare(sql).all();
  }

  insertPEMetric(record: {
    metric: string;
    strategy: string;
    region?: string;
    value: number;
    period?: string;
    timestamp: string;
  }): void {
    const stmt = this.db.prepare(
      `INSERT INTO pe_metrics (metric, strategy, region, value, period, timestamp)
       VALUES (@metric, @strategy, @region, @value, @period, @timestamp)`
    );
    stmt.run(record);
  }

  getLatestPEMetrics() {
    const sql = `
      SELECT * FROM pe_metrics p
      WHERE timestamp = (
        SELECT MAX(timestamp) FROM pe_metrics p2
        WHERE p2.metric = p.metric AND p2.strategy = p.strategy AND (p2.region = p.region OR (p.region IS NULL AND p2.region IS NULL))
      )
    `;
    return this.db.prepare(sql).all();
  }
}

export default DB;