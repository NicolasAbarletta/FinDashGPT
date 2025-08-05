import DB from '../database';

/**
 * Fetch macroeconomic releases and surprise indices.  This function
 * inserts the latest values for CPI, PPI, payrolls, PMI and retail
 * sales for the US, Eurozone and China.  It also stores a simple
 * proxy for the Citigroup economic surprise index and a recession
 * probability reading.  When network connectivity is available,
 * replace these hard‑coded values with API calls to FRED or other
 * sources (e.g., Nasdaq Data Link).  The data model includes a
 * release date to distinguish between monthly releases and a
 * timestamp to indicate when the record was ingested.
 */
export async function fetchEconomic(db: DB): Promise<void> {
  const now = new Date().toISOString();
  // Example macroeconomic data; replace with API calls.
  const data = [
    // US
    { indicator: 'CPI', country: 'US', value: 3.1, release_date: '2025-07-31', period: 'Jun 2025', surprise: -0.1 },
    { indicator: 'PPI', country: 'US', value: 2.5, release_date: '2025-07-31', period: 'Jun 2025', surprise: 0.2 },
    { indicator: 'Payrolls', country: 'US', value: 230.0, release_date: '2025-07-05', period: 'Jun 2025', surprise: -10.0 },
    { indicator: 'PMI', country: 'US', value: 50.1, release_date: '2025-07-25', period: 'Jul 2025', surprise: -1.5 },
    { indicator: 'Retail Sales', country: 'US', value: 0.5, release_date: '2025-07-15', period: 'Jun 2025', surprise: 0.1 },
    // Eurozone
    { indicator: 'CPI', country: 'EZ', value: 2.8, release_date: '2025-07-31', period: 'Jun 2025', surprise: 0.0 },
    { indicator: 'PPI', country: 'EZ', value: 1.9, release_date: '2025-07-31', period: 'Jun 2025', surprise: -0.3 },
    { indicator: 'Payrolls', country: 'EZ', value: 150.0, release_date: '2025-07-05', period: 'Jun 2025', surprise: 5.0 },
    { indicator: 'PMI', country: 'EZ', value: 49.0, release_date: '2025-07-25', period: 'Jul 2025', surprise: -0.8 },
    { indicator: 'Retail Sales', country: 'EZ', value: 0.2, release_date: '2025-07-15', period: 'Jun 2025', surprise: -0.1 },
    // China
    { indicator: 'CPI', country: 'CN', value: 1.2, release_date: '2025-07-31', period: 'Jun 2025', surprise: 0.1 },
    { indicator: 'PPI', country: 'CN', value: -2.0, release_date: '2025-07-31', period: 'Jun 2025', surprise: -0.2 },
    { indicator: 'Payrolls', country: 'CN', value: 70.0, release_date: '2025-07-05', period: 'Jun 2025', surprise: -3.0 },
    { indicator: 'PMI', country: 'CN', value: 51.0, release_date: '2025-07-25', period: 'Jul 2025', surprise: 0.5 },
    { indicator: 'Retail Sales', country: 'CN', value: 3.5, release_date: '2025-07-15', period: 'Jun 2025', surprise: 0.3 },
    // Surprise indices (Citigroup Economic Surprise Index proxies)
    { indicator: 'CESI', country: 'US', value: -20.0, release_date: '2025-08-05', period: 'Aug 2025', surprise: null },
    { indicator: 'CESI', country: 'EZ', value: -5.0, release_date: '2025-08-05', period: 'Aug 2025', surprise: null },
    { indicator: 'CESI', country: 'CN', value: 15.0, release_date: '2025-08-05', period: 'Aug 2025', surprise: null },
    // Recession probability (rolling 12‑month) – this will be displayed as a chart on the front end.
    { indicator: 'RecessionProb', country: 'US', value: 0.25, release_date: '2025-08-05', period: 'next 12m', surprise: null }
  ];
  for (const row of data) {
    db.insertEconomicRelease({
      indicator: row.indicator,
      country: row.country,
      value: row.value,
      release_date: row.release_date,
      period: row.period,
      surprise: row.surprise === null ? undefined : row.surprise,
      timestamp: now
    });
  }
}