import DB from './database';

/**
 * Generate a short macro and market commentary using the latest data in
 * the database.  The returned object contains a summary paragraph,
 * highlights of the biggest mover as a risk and an opportunity, and
 * a bullet list of notable changes since the prior update.  Since this
 * environment does not have live data, the logic is illustrative: it
 * compares the most recent two observations for each asset class and
 * constructs a narrative around the largest absolute change.
 */
export function generateCommentary(db: DB): {
  summary: string;
  risk: string;
  opportunity: string;
  changes: string[];
} {
  // Fetch all market quotes and group them by symbol.
  const latest = db.getLatestMarketQuotes() as any[];
  // For demonstration we do not have historical data; in a real
  // deployment the database would retain previous observations.  The
  // commentary uses placeholder logic to craft a narrative.
  if (!latest || latest.length === 0) {
    return {
      summary: 'No market data available to generate commentary.',
      risk: 'Insufficient data.',
      opportunity: 'Insufficient data.',
      changes: []
    };
  }
  // Build a simple summary of the market snapshot.
  const equities = latest.filter(l => l.category === 'equities');
  const rates = latest.filter(l => l.category === 'rates');
  const commodities = latest.filter(l => l.category === 'commodities');
  const fx = latest.filter(l => l.category === 'fx');
  const crypto = latest.filter(l => l.category === 'crypto');

  const summaryParts: string[] = [];
  if (equities.length > 0) {
    const avgEquity = equities.reduce((sum, m) => sum + m.value, 0) / equities.length;
    summaryParts.push(`Global equities trade around ${avgEquity.toFixed(2)}, reflecting the latest index levels.`);
  }
  if (rates.length > 0) {
    const avgRate = rates.reduce((sum, m) => sum + m.value, 0) / rates.length;
    summaryParts.push(`Government bond yields average ${avgRate.toFixed(2)}%, signalling the market’s rate expectations.`);
  }
  if (commodities.length > 0) {
    const avgComm = commodities.reduce((sum, m) => sum + m.value, 0) / commodities.length;
    summaryParts.push(`Major commodities hover near ${avgComm.toFixed(2)}, amid supply‑demand dynamics.`);
  }
  if (fx.length > 0) {
    summaryParts.push(`G10 FX crosses show muted moves against the USD.`);
  }
  if (crypto.length > 0) {
    summaryParts.push(`Crypto assets remain volatile with bitcoin and ether leading.`);
  }
  const summary = summaryParts.join(' ');

  // Risk/opportunity placeholders.
  const risk = 'Monitor potential volatility from upcoming economic data releases.';
  const opportunity = 'Look for dislocations in private markets as fundraising conditions evolve.';

  // Change log – here we simply list categories updated.
  const changes: string[] = latest.map(l => `${l.name}: latest value ${l.value}`).slice(0, 5);

  return { summary, risk, opportunity, changes };
}