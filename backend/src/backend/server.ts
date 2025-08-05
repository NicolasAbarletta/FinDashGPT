import express from 'express';
import dotenv from 'dotenv';
import DB from './database';
import { fetchMarkets } from './data/fetchMarkets';
import { fetchEconomic } from './data/fetchEconomic';
import { fetchPrivateEquity } from './data/fetchPrivateEquity';
import { generateCommentary } from './commentary';

dotenv.config();

const db = new DB();

// Seed the database with initial values on startup.  In a real
// deployment this may not be necessary as the cron job will
// populate the tables regularly.  The seed ensures the API
// returns meaningful data during development.
async function seed() {
  await fetchMarkets(db);
  await fetchEconomic(db);
  await fetchPrivateEquity(db);
}
// Immediately seed.  Ignore errors.
seed().catch((err) => console.error('Seeding error', err));

const app = express();

// Utility to get last update timestamp for a table.
function getLastUpdate(): string | null {
  const tables = ['markets', 'economics', 'pe_metrics'];
  let latest: string | null = null;
  for (const table of tables) {
    const stmt = (db as any).db.prepare(`SELECT MAX(timestamp) as ts FROM ${table}`);
    const row = stmt.get();
    if (row && row.ts) {
      if (!latest || row.ts > latest) {
        latest = row.ts;
      }
    }
  }
  return latest;
}

app.get('/api/markets', (req, res) => {
  const category = req.query.category as string | undefined;
  const data = db.getLatestMarketQuotes(category);
  res.json({ data, lastUpdate: getLastUpdate() });
});

app.get('/api/economics', (req, res) => {
  const data = db.getLatestEconomicReleases();
  res.json({ data, lastUpdate: getLastUpdate() });
});

app.get('/api/pe', (req, res) => {
  const data = db.getLatestPEMetrics();
  res.json({ data, lastUpdate: getLastUpdate() });
});

// New endpoint: return latest portfolio positions grouped by bucket.  The
// frontend can further aggregate as needed.
app.get('/api/portfolio', (req, res) => {
  const data = db.getLatestPositions();
  res.json({ data, lastUpdate: getLastUpdate() });
});

// New endpoint: return risk measures for a given date (defaults to today).
app.get('/api/risk', (req, res) => {
  const dateParam = (req.query.date as string) || new Date().toISOString().substring(0, 10);
  const data = db.getRiskMeasures(dateParam);
  res.json({ data, lastUpdate: getLastUpdate() });
});

app.get('/api/commentary', (req, res) => {
  const commentary = generateCommentary(db);
  res.json({ commentary, lastUpdate: getLastUpdate() });
});

export default app;