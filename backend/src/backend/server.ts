/* backend/src/backend/server.ts
   ---------------------------------------------------------------
   Express API – CORS-enabled, refresh endpoint, friendly root
*/

import express from 'express';
import cors    from 'cors';                    // NEW
import dotenv  from 'dotenv';
import DB from './database';
import { fetchMarkets }       from './data/fetchMarkets';
import { fetchEconomic }      from './data/fetchEconomic';
import { fetchPrivateEquity } from './data/fetchPrivateEquity';
import { generateCommentary } from './commentary';

dotenv.config();

const db = new DB();

/* Pull fresh data from all sources */
async function refreshAll() {
  await fetchMarkets(db);
  await fetchEconomic(db);
  await fetchPrivateEquity(db);
}

/* Seed once at startup so the dashboard isn’t empty */
refreshAll().catch((err) => console.error('Initial seed error:', err));

const app = express();
app.use(cors());                               // allow dashboard requests

/* ---------- Helpers ---------- */

function getLastUpdate(): string | null {
  const tables = ['markets', 'economics', 'pe_metrics'];
  let latest: string | null = null;
  for (const t of tables) {
    const row = (db as any).db
      .prepare(`SELECT MAX(timestamp) AS ts FROM ${t}`)
      .get();
    if (row && row.ts && (!latest || row.ts > latest)) latest = row.ts;
  }
  return latest;
}

/* ---------- Public API ---------- */

app.get('/', (_req, res) =>
  res.send(
    'FinDash API ✔ – try /health • /markets • /economics • /pe_metrics • /commentary'
  )
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', updated: getLastUpdate() });
});

app.get('/markets', (req, res) => {
  const category = req.query.category as string | undefined;
  res.json(db.getLatestMarketQuotes(category));
});

app.get('/economics', (_req, res) => {
  res.json(db.getLatestEconomicReleases());
});

app.get('/pe_metrics', (_req, res) => {
  res.json(db.getLatestPEMetrics());
});

app.get('/commentary', (_req, res) => {
  res.json(generateCommentary(db));
});

/* ---------- Cron / manual refresh ---------- */

app.get('/tasks/refresh', async (_req, res) => {
  try {
    await refreshAll();
    res.json({
      status: 'ok',
      message: 'Data refreshed',
      updated: getLastUpdate(),
    });
  } catch (err: any) {
    console.error('Refresh error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

export default app;

