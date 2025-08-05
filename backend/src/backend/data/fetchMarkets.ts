import fetch from 'node-fetch';
import DB from '../database';

/**
 * Fetch latest market quotes from external APIs.  In production this
 * function would call a combination of FRED, Alpha Vantage, Coingecko and
 * other providers to retrieve real‑time prices for equities, rates,
 * commodities, FX and crypto.  Since the execution environment here
 * cannot perform outbound HTTP requests, this implementation returns
 * illustrative static data.  Each record includes the asset category,
 * a unique symbol, a descriptive name, the latest value and the
 * current timestamp in ISO format.
 */
export async function fetchMarkets(db: DB): Promise<void> {
  const now = new Date().toISOString();
  // Example data – replace with API calls when network connectivity is
  // available and provide your API keys via environment variables.
  const sampleData = [
    // Equities
    { category: 'equities', symbol: 'SPX', name: 'S&P 500', value: 4500.25 },
    { category: 'equities', symbol: 'NDX', name: 'Nasdaq 100', value: 15400.85 },
    { category: 'equities', symbol: 'SX5E', name: 'EURO STOXX 50', value: 4200.55 },
    { category: 'equities', symbol: 'NKY', name: 'Nikkei 225', value: 33000.75 },
    // Rates (yield in percent)
    { category: 'rates', symbol: 'US2Y', name: 'UST 2yr', value: 4.50 },
    { category: 'rates', symbol: 'US10Y', name: 'UST 10yr', value: 4.20 },
    { category: 'rates', symbol: 'US30Y', name: 'UST 30yr', value: 4.10 },
    { category: 'rates', symbol: 'DE10Y', name: 'German Bund 10yr', value: 2.55 },
    { category: 'rates', symbol: 'IGSpread', name: 'IG Credit Spread', value: 1.25 },
    { category: 'rates', symbol: 'HYSpread', name: 'HY Credit Spread', value: 4.75 },
    // Commodities (price in USD or USD per barrel)
    { category: 'commodities', symbol: 'Brent', name: 'Brent Crude', value: 85.50 },
    { category: 'commodities', symbol: 'WTI', name: 'WTI Crude', value: 81.30 },
    { category: 'commodities', symbol: 'Gold', name: 'Gold', value: 1950.00 },
    { category: 'commodities', symbol: 'Copper', name: 'Copper', value: 4.50 },
    // FX (USD vs others; DXY index)
    { category: 'fx', symbol: 'DXY', name: 'US Dollar Index', value: 102.50 },
    { category: 'fx', symbol: 'EURUSD', name: 'EUR/USD', value: 1.10 },
    { category: 'fx', symbol: 'JPYUSD', name: 'USD/JPY', value: 145.50 },
    { category: 'fx', symbol: 'GBPUSD', name: 'GBP/USD', value: 1.29 },
    { category: 'fx', symbol: 'AUDUSD', name: 'AUD/USD', value: 0.67 },
    // Crypto
    { category: 'crypto', symbol: 'BTCUSD', name: 'Bitcoin', value: 58000.00 },
    { category: 'crypto', symbol: 'ETHUSD', name: 'Ethereum', value: 3800.00 }
  ];
  for (const record of sampleData) {
    db.insertMarketQuote({ ...record, timestamp: now });
  }
}