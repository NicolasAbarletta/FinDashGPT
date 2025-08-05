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

    // New tables for portfolio positions and risk analytics.  These tables
    // enable the dashboard to mirror Addepar’s portfolio view and store
    // risk measures computed via the EWMA model.
    const createPositions = `
      CREATE TABLE IF NOT EXISTS positions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        asset_class TEXT NOT NULL,
        market_value REAL NOT NULL,
        ytd_dollar REAL,
        ytd_percent REAL,
        irr REAL,
        tvpi REAL,
        nav_percent REAL,
        nav_target REAL,
        bucket TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `;
    const createPEFunds = `
      CREATE TABLE IF NOT EXISTS pe_funds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        vintage_year INTEGER,
        nav REAL,
        unfunded REAL,
        irr REAL,
        tvpi REAL,
        dpi REAL,
        compliance_score REAL,
        timestamp TEXT NOT NULL
      )
    `;
    const createCapitalCalls = `
      CREATE TABLE IF NOT EXISTS capital_calls (
        id TEXT PRIMARY KEY,
        fund_id TEXT NOT NULL,
        call_date TEXT NOT NULL,
        amount REAL NOT NULL,
        expected_distribution REAL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(fund_id) REFERENCES pe_funds(id) ON DELETE CASCADE
      )
    `;
    const createMacroData = `
      CREATE TABLE IF NOT EXISTS macro_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        indicator TEXT NOT NULL,
        value REAL NOT NULL
      )
    `;
    const createRiskMeasures = `
      CREATE TABLE IF NOT EXISTS risk_measures (
        id TEXT PRIMARY KEY,
        as_of_date TEXT NOT NULL,
        bucket TEXT NOT NULL,
        var_99 REAL,
        stress_pl REAL,
        scenario TEXT,
        timestamp TEXT NOT NULL
      )
    `;
    this.db.exec(createMarkets);
    this.db.exec(createEconomics);
    this.db.exec(createPE);
    this.db.exec(createPositions);
    this.db.exec(createPEFunds);
    this.db.exec(createCapitalCalls);
    this.db.exec(createMacroData);
    this.db.exec(createRiskMeasures);
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

  /**
   * Insert or upsert a portfolio position.  If a row with the same id
   * already exists it will be replaced.  The timestamp should be ISO
   * formatted (UTC).
   */
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
       VALUES (@id, @name, @asset_class, @market_value, @ytd_dollar, @ytd_percent, @irr, @tvpi, @nav_percent, @nav_target, @bucket, @timestamp)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name,
         asset_class=excluded.asset_class,
         market_value=excluded.market_value,
         ytd_dollar=excluded.ytd_dollar,
         ytd_percent=excluded.ytd_percent,
         irr=excluded.irr,
         tvpi=excluded.tvpi,
         nav_percent=excluded.nav_percent,
         nav_target=excluded.nav_target,
         bucket=excluded.bucket,
         timestamp=excluded.timestamp`
    );
    stmt.run(record);
  }

  /**
   * Retrieve the most recent snapshot of portfolio positions.  Grouping
   * by id ensures that only the latest entry per position is returned.
   */
  getLatestPositions() {
    const sql = `
      SELECT * FROM positions p
      WHERE timestamp = (
        SELECT MAX(timestamp) FROM positions p2
        WHERE p2.id = p.id
      )
    `;
    return this.db.prepare(sql).all();
  }

  /**
   * Insert a risk measure record.  Use a UUID for id in the caller.
   */
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

  /**
   * Retrieve risk measures for a specific date.  Returns an array of
   * measures by bucket.
   */
  getRiskMeasures(as_of_date: string) {
    const stmt = this.db.prepare(
      `SELECT * FROM risk_measures WHERE as_of_date = ?`
    );
    return stmt.all(as_of_date);
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