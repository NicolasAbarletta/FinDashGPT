import DB from '../src/backend/database';
import { fetchMarkets } from '../src/backend/data/fetchMarkets';
import { fetchEconomic } from '../src/backend/data/fetchEconomic';
import { fetchPrivateEquity } from '../src/backend/data/fetchPrivateEquity';
import { generateCommentary } from '../src/backend/commentary';

// Basic unit tests for the data fetchers and commentary generator.  These
// tests run against an in‑memory SQLite database to avoid disk I/O.
describe('Data fetchers and commentary', () => {
  let db: DB;
  beforeEach(() => {
    // Use an in‑memory database by passing ':memory:' to better‑sqlite3.
    db = new DB(':memory:');
  });

  test('fetchMarkets populates markets table', async () => {
    await fetchMarkets(db);
    const quotes = db.getLatestMarketQuotes();
    expect(quotes.length).toBeGreaterThan(0);
    const equities = db.getLatestMarketQuotes('equities');
    expect(equities.find((q) => q.symbol === 'SPX')).toBeDefined();
  });

  test('fetchEconomic populates economics table', async () => {
    await fetchEconomic(db);
    const releases = db.getLatestEconomicReleases();
    expect(releases.length).toBeGreaterThan(0);
    expect(releases.find((r) => r.indicator === 'CPI' && r.country === 'US')).toBeDefined();
  });

  test('fetchPrivateEquity populates pe_metrics table', async () => {
    await fetchPrivateEquity(db);
    const metrics = db.getLatestPEMetrics();
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics.find((m) => m.metric === 'Capital Raised' && m.strategy === 'Buyout')).toBeDefined();
  });

  test('generateCommentary returns a non‑empty summary', async () => {
    await fetchMarkets(db);
    const commentary = generateCommentary(db);
    expect(commentary.summary).not.toHaveLength(0);
    expect(commentary.risk).toContain('Monitor');
    expect(commentary.opportunity).toContain('dislocations');
    expect(Array.isArray(commentary.changes)).toBe(true);
  });
});