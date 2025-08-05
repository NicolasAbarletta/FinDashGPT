import cron from 'node-cron';
import DB from './database';
import { fetchMarkets } from './data/fetchMarkets';
import { fetchEconomic } from './data/fetchEconomic';
import { fetchPrivateEquity } from './data/fetchPrivateEquity';

const db = new DB();

// Define the schedule: run every 2 hours on the hour (e.g., 00:00, 02:00, ...).
const schedule = '0 */2 * * *';

async function updateAll() {
  try {
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] Running scheduled update`);
    await fetchMarkets(db);
    await fetchEconomic(db);
    await fetchPrivateEquity(db);
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] Update completed`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error during scheduled update', err);
  }
}

cron.schedule(schedule, updateAll);

// Immediately run one update on startup.
updateAll().catch((err) => console.error('Initial update error', err));