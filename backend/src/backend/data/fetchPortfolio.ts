// backend/src/backend/data/fetchPortfolio.ts

import DB from '../database';
import fetch from 'node-fetch';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetch positions from the Addepar API using basic authentication.
 * If the API is unavailable or credentials are missing, fall back to
 * reading a local Excel file in the /data directory.  The function
 * classifies each holding into a bucket (liquid/illiquid) and inserts
 * the result into the positions table.
 */
export async function fetchPortfolio(db: DB): Promise<void> {
  const key = process.env.ADDEPAR_KEY;
  const secret = process.env.ADDEPAR_SECRET;
  const viewId = process.env.ADDEPAR_VIEW_ID;

  try {
    if (key && secret && viewId) {
      // Attempt to fetch portfolio data via the Addepar API.
      const res = await fetch(
        `https://api.addepar.com/v1/portfolio/views/${viewId}/results?format=json`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!res.ok) {
        throw new Error(`Addepar API request failed with status ${res.status}`);
      }

      // Cast the JSON response to `any` to satisfy TypeScript’s type checker.
      const json: any = await res.json();

      if (Array.isArray(json?.rows)) {
        json.rows.forEach((row: any) => {
          const id = uuidv4();
          const record = {
            id,
            name: row.name,
            market_value: Number(row.market_value) || 0,
            ytd_dollar: Number(row.ytd_dollar) || 0,
            ytd_percent: Number(row.ytd_percent) || 0,
            irr: row.irr ? Number(row.irr) : undefined,
            tvpi: row.tvpi ? Number(row.tvpi) : undefined,
            nav_percent: row.nav_percent ? Number(row.nav_percent) : undefined,
            nav_target: row.nav_target ? Number(row.nav_target) : undefined,
            bucket: mapBucket(row),
            timestamp: new Date().toISOString()
          };
          db.insertPosition(record);
        });
        return;
      }
    }
  } catch (err) {
    // Fall through to file-based fallback.
    console.warn(`Addepar API fetch failed: ${err instanceof Error ? err.message : err}`);
  }

  // Fallback: read positions from an Excel or CSV file in backend/data.
  const workbook = XLSX.readFile('data/portfolio.xlsx');
  const sheet = workbook.Sheets['Portfolio View'];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: true });

  rows.forEach((row) => {
    const id = uuidv4();
    const record = {
      id,
      name: row.Name,
      market_value: Number(row.MarketValue) || 0,
      ytd_dollar: Number(row.YtdDollar) || 0,
      ytd_percent: Number(row.YtdPercent) || 0,
      irr: row.IRR ? Number(row.IRR) : undefined,
      tvpi: row.TVPI ? Number(row.TVPI) : undefined,
      nav_percent: row.NavPercent ? Number(row.NavPercent) : undefined,
      nav_target: row.NavTarget ? Number(row.NavTarget) : undefined,
      bucket: mapBucket(row),
      timestamp: new Date().toISOString()
    };
    db.insertPosition(record);
  });
}

/**
 * Simple helper to map Addepar instrument names or types into
 * high-level liquidity buckets.  Adjust this logic to suit your
 * portfolio’s naming conventions.
 */
function mapBucket(row: any): string {
  const type = (row.type || row.Category || '').toLowerCase();
  if (/stock|equity|eafe|em|us/.test(type)) return 'Liquid – Equities';
  if (/bond|fixed|ig|hy|em debt/.test(type)) return 'Liquid – Fixed Income';
  if (/commodity|gold|oil/.test(type)) return 'Liquid – Commodities';
  if (/crypto|bitcoin|ethereum/.test(type)) return 'Liquid – Crypto';
  if (/cash|money market/.test(type)) return 'Liquid – Cash';
  if (/private.*equity/.test(type)) return 'Illiquid – Private Equity';
  if (/real assets|real estate/.test(type)) return 'Illiquid – Private Real Assets';
  if (/credit/.test(type)) return 'Illiquid – Private Credit';
  if (/infrastructure/.test(type)) return 'Illiquid – Infrastructure';
  if (/co-invest/.test(type)) return 'Illiquid – Co-Invests';
  return 'Other';
}
