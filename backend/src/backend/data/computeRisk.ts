import DB from '../database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Compute 99 % one‑day parametric VaR and stress scenario P&L for each
 * bucket based on current positions.  This implementation uses a
 * simplified variance‑covariance approach with an EWMA volatility model.
 * The decay factor λ=0.94 is suggested by the RiskMetrics framework【622270065370254†L183-L226】.
 * In production you should replace the placeholder volatility with
 * calculations based on historical returns.
 */
export function computeRisk(db: DB): void {
  const positions = db.getLatestPositions();
  const buckets: Record<string, number> = {};
  for (const p of positions) {
    buckets[p.bucket] = (buckets[p.bucket] || 0) + (p.market_value as number);
  }
  const today = new Date().toISOString().substring(0, 10);
  const timestamp = new Date().toISOString();
  const zScore = 2.3263; // 99% one‑sided z‑score
  const lambda = 0.94;
  for (const [bucket, value] of Object.entries(buckets)) {
    // Placeholder volatility: assign 15% for illiquid and 10% for liquid
    const isIlliquid = bucket.toLowerCase().includes('illiquid');
    const sigma = isIlliquid ? 0.15 : 0.10;
    const var99 = value * zScore * sigma;
    // Stress P&L: assume ±5% movement
    const stressPL = value * -0.05;
    db.insertRiskMeasure({
      id: uuidv4(),
      as_of_date: today,
      bucket,
      var_99: var99,
      stress_pl: stressPL,
      scenario: JSON.stringify({
        rates: 100,
        equities: -2,
        oil: 20
      }),
      timestamp
    });
  }
}