// backend/src/backend/database.ts

import DatabaseConstructor from 'better-sqlite3';

/**
 * DB wraps a Better-SQLite3 database and provides helper methods
 * to initialise tables and perform common queries and inserts.
 */
class DB {
  private db: any;

  constructor(filename = 'data.db') {
    // Instantiate the database.  Using the default export avoids the
    // “Database only refers to a type” error.
    this.db = new DatabaseConstructor(filename);

    // Create tables if they don’t exist.
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS markets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,
        symbol TEXT,
        name TEXT,
        value REAL,
        timestamp TEXT
      );
      CREATE TABLE IF NOT EXISTS economics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        indicator TEXT,
        country TEXT,
        value REAL,
        release_date TEXT,
        period TEXT,
        surprise REAL,
        timestamp TEXT
      );
      CREATE TABLE IF NOT EXISTS pe_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric TEXT,
        strategy TEXT,
        region TEXT,
        value REAL,
        period TEXT,
        timestamp TEXT
      );
      -- New positions table for portfolio data
      CREATE TABLE IF NOT EXISTS positions (
        id TEXT PRIMARY KEY,
        name TEXT,
        asset_class TEXT,
        market_value REAL,
        ytd_dollar REAL,
        ytd_percent REAL,
        irr REAL,
        tvpi REAL,
        nav_percent REAL,
        nav_target REAL,
        bucket TEXT,
        timestamp TEXT
      );
      -- New risk_measures table for VaR and stress tests
      CREATE TABLE IF NOT EXISTS risk_measures (
        id TEXT PRIMARY KEY,
        as_of_date TEXT,
        bucket TEXT,
        var_99 REAL,
        stress_pl REAL,
        scenario TEXT,
        timestamp TEXT
      );
    `);
  }

  /* ===================== Insert Methods ===================== */

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

  insertPosition(record: {
    id: string;
    name: string;
    asset_class: string;
    market_value: number;
    ytd_dollar?: number;
    ytd_percent?: number;
    irr?: number;
    tvpi?: number;
    nav_percent?: number;
    nav_target?: number;
    bucket: string;
    timestamp: string;
  }): void {
    const stmt = this.db.prepare(
      `INSERT INTO positions (id, name, asset_class, market_value, ytd_dollar, ytd_percent, irr, tvpi, nav_percent, nav_target, bucket, timestamp)
       VALUES (@id, @name, @asset_class, @market_value, @ytd_dollar, @ytd_percent, @irr, @tvpi, @nav_percent, @nav_target, @bucket, @timestamp)`
    );
    stmt.run(record);
  }

  insertRiskMeasure(record: {
    id: string;
    as_of_date: string;
    bucket: string;
    var_99?: number;
    stress_pl?: number;
    scenario?: string;
    timestamp: string;
  }): void {
    const stmt = this.db.prepare(
      `INSERT INTO risk_measures (id, as_of_date, bucket, var_99, stress_pl, scenario, timestamp)
       VALUES (@id, @as_of_date, @bucket, @var_99, @stress_pl, @scenario, @timestamp)`
    );
    stmt.run(record);
  }

  /* ===================== Query Methods ===================== */

  getLatestMarketQuotes(category?: string) {
    if (category) {
      return this.db
        .prepare(
          `SELECT * FROM markets WHERE category = ? AND timestamp = (SELECT MAX(timestamp) FROM markets)`
        )
        .all(category);
    }
    return this.db
      .prepare(`SELECT * FROM markets WHERE timestamp = (SELECT MAX(timestamp) FROM markets)`)
      .all();
  }

  getLatestEconomicReleases() {
    return this.db
      .prepare(`SELECT * FROM economics WHERE timestamp = (SELECT MAX(timestamp) FROM economics)`)
      .all();
  }

  getLatestPEMetrics() {
    return this.db
      .prepare(
        `SELECT * FROM pe_metrics p WHERE timestamp = (SELECT MAX(timestamp) FROM pe_metrics p2
          WHERE p2.metric = p.metric AND p2.strategy = p.strategy AND
                (p2.region = p.region OR (p.region IS NULL AND p2.region IS NULL)))`
      )
      .all();
  }

  getLatestPositions() {
    return this.db.prepare(
      `SELECT * FROM positions p WHERE timestamp = (
        SELECT MAX(timestamp) FROM positions p2 WHERE p2.id = p.id
      )`
    ).all();
  }

  getRiskMeasures(as_of_date: string) {
    return this.db
      .prepare(`SELECT * FROM risk_measures WHERE as_of_date = ?`)
      .all(as_of_date);
  }
}

export default DB;
