import fetch from 'node-fetch';
import * as XLSX from 'xlsx';
import DB from '../database';

/*
 * Fetch portfolio positions from the Addepar API (Portfolio/Query) and
 * store them in the positions table.  If the API call fails, the
 * function attempts to parse a local XLSX file as a fallback.  The
 * XLSX file must have a sheet named "Portfolio View" with columns
 * matching id, name, assetClass, marketValue, YTD $ and YTD %.
 */
export async function fetchPortfolio(db: DB): Promise<void> {
  const now = new Date().toISOString();
  const key = process.env.ADDEPAR_KEY;
  const secret = process.env.ADDEPAR_SECRET;
  const viewId = process.env.ADDEPAR_VIEW_ID;
  const baseUrl = process.env.ADDEPAR_BASE_URL || 'https://api.addepar.com';
  let positions: any[] = [];
  if (key && secret) {
    const authHeader =
      'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
    const endpoint = viewId
      ? `${baseUrl}/v1/portfolio/views/${viewId}/results?format=json`
      : `${baseUrl}/v1/portfolio/query`;
    const opts: any = {
      method: viewId ? 'GET' : 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      }
    };
    if (!viewId) {
      opts.body = JSON.stringify({
        query: {
          type: 'positions',
          fields: [
            'id',
            'name',
            'assetClass',
            'marketValue',
            'ytdDollar',
            'ytdPercent'
          ]
        }
      });
    }
    try {
      const res = await fetch(endpoint, opts);
      if (res.ok) {
        const json = await res.json();
        positions = (viewId ? json.results : json.data) || [];
      } else {
        console.error('Addepar API error:', res.status);
      }
    } catch (err) {
      console.error('Addepar fetch error', err);
    }
  }
  // Fallback to XLSX if no positions were fetched
  if (!positions || positions.length === 0) {
    const filePath = process.env.ADDEPAR_XLSX_PATH;
    if (filePath) {
      try {
        const buf = require('fs').readFileSync(filePath);
        const workbook = XLSX.read(buf, { type: 'buffer' });
        const sheet = workbook.Sheets['Portfolio View'];
        if (sheet) {
          positions = XLSX.utils.sheet_to_json(sheet);
        }
      } catch (err) {
        console.error('XLSX fallback error', err);
      }
    }
  }
  // Classify and insert
  for (const row of positions) {
    const assetClass: string = row.assetClass || row.asset_class || '';
    const bucket = mapBucket(assetClass);
    db.insertPosition({
      id: String(row.id || row.ID || Math.random().toString(36)),
      name: row.name || row.Name,
      asset_class: assetClass,
      market_value: Number(row.marketValue || row['Market Value'] || 0),
      ytd_dollar: row.ytdDollar || row['YTD $'],
      ytd_percent: row.ytdPercent || row['YTD %'],
      irr: row.irr || row.IRR,
      tvpi: row.tvpi || row.TVPI,
      bucket,
      timestamp: now
    });
  }
}

/**
 * Map a raw asset class string into a high‑level bucket (Liquid vs
 * Illiquid and subcategories).  This mirrors the classification used
 * in the FinDashPro scaffold.  Adjust the cases as needed for your
 * portfolio.
 */
function mapBucket(assetClass: string): string {
  const cls = assetClass.toLowerCase();
  if (
    cls.includes('stock') ||
    cls.includes('equity') ||
    cls.includes('us') ||
    cls.includes('eafe') ||
    cls.includes('emerging')
  )
    return 'Liquid';
  if (
    cls.includes('investment grade') ||
    cls.includes('ig') ||
    cls.includes('hy') ||
    cls.includes('high yield') ||
    cls.includes('em debt') ||
    cls.includes('emerging market debt') ||
    cls.includes('commodity') ||
    cls.includes('crypto') ||
    cls.includes('cash')
  )
    return 'Liquid';
  if (cls.includes('private equity')) return 'Illiquid: Private Equity';
  if (cls.includes('real asset')) return 'Illiquid: Real Assets';
  if (cls.includes('private credit')) return 'Illiquid: Private Credit';
  if (cls.includes('infrastructure')) return 'Illiquid: Infrastructure';
  if (cls.includes('co-invest')) return 'Illiquid: Co‑investments';
  return 'Other';
}