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
 * VaRHeatmap displays the 99 % one‑day parametric VaR for each bucket
 * of the portfolio.  The input risk array should contain objects
 * with a bucket and var_99 fields.  Values are transformed to
 * absolute magnitude and plotted on a bar chart.  A small colour
 * palette is used to differentiate buckets, cycling as needed.
 */
interface RiskMeasure {
  bucket: string;
  var_99?: number;
}

interface VaRHeatmapProps {
  risk: RiskMeasure[];
}

const COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#a78bfa', // purple
  '#14b8a6', // teal
  '#6b7280'  // gray
];

export default function VaRHeatmap({ risk }: VaRHeatmapProps) {
  const data = React.useMemo(
    () =>
      risk.map((rm) => ({
        name: rm.bucket,
        value: Math.abs(rm.var_99 ?? 0)
      })),
    [risk]
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h3 className="font-medium mb-2">99% 1‑Day VaR by Bucket</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => {
                // Format large numbers for readability (e.g. millions)
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
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}