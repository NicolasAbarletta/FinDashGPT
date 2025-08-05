import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

/**
 * ScenarioTester visualises the projected P&L impact on each bucket
 * under a simple stress scenario (±100 bp rates, −2σ equities,
 * ±$20 oil).  The risk array should contain objects with a
 * bucket and stress_pl fields.  Negative values are coloured red,
 * positives green.  This component assumes stress_pl values are
 * stored on the risk measure records (see computeRisk).  If no
 * stress_pl is provided, zero is used.
 */
interface RiskMeasure {
  bucket: string;
  stress_pl?: number;
}

interface ScenarioTesterProps {
  risk: RiskMeasure[];
}

export default function ScenarioTester({ risk }: ScenarioTesterProps) {
  const data = React.useMemo(
    () =>
      risk.map((rm) => ({
        name: rm.bucket,
        value: rm.stress_pl ?? 0
      })),
    [risk]
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h3 className="font-medium mb-2">Stress Scenario P&L</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => {
                if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}b`;
                if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}m`;
                if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
                return v.toFixed(0);
              }}
            />
            <Tooltip
              formatter={(v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value < 0 ? '#ef4444' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
        Scenario: ±100 bp rates, −2σ equities, ±$20 oil
      </p>
    </div>
  );
}