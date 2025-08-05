import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * AllocationDonut renders a doughnut chart showing the distribution of
 * portfolio market value across buckets.  It expects an array of
 * position objects with a market_value and bucket.  Buckets are
 * aggregated and the resulting totals are fed into a PieChart from
 * Recharts.  Colors are drawn from a small palette and cycle as
 * needed.  If no positions are provided, the chart will render
 * nothing.
 */
interface Position {
  id: string;
  name: string;
  market_value: number;
  bucket: string;
}

interface AllocationDonutProps {
  positions: Position[];
}

const COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#a78bfa', // purple
  '#f472b6', // pink
  '#f59e0b', // amber
  '#ef4444', // red
  '#14b8a6', // teal
  '#6b7280'  // gray
];

export default function AllocationDonut({ positions }: AllocationDonutProps) {
  // Aggregate market values by bucket using a memoised computation so
  // that recalculation only occurs when positions changes.  Missing
  // market values default to zero.
  const data = React.useMemo(() => {
    const buckets: Record<string, number> = {};
    positions.forEach((p) => {
      const value = p.market_value ?? 0;
      buckets[p.bucket] = (buckets[p.bucket] || 0) + value;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [positions]);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h3 className="font-medium mb-2">Allocation by Bucket</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="40%"
              outerRadius="80%"
              label={(entry) => `${entry.name}: ${(entry.value).toLocaleString()}`}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => value.toLocaleString()} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}