import React from 'react';

/**
 * PrivateEquityPanel lists the top private‑equity or illiquid
 * positions by NAV.  It accepts the full positions array and
 * filters for buckets containing the word "private" (case
 * insensitive).  Positions are sorted by market value in descending
 * order and the top ten are displayed along with IRR and TVPI
 * where available.  Table rows alternate background colour for
 * readability.
 */
interface Position {
  id: string;
  name: string;
  market_value: number;
  irr?: number;
  tvpi?: number;
  bucket: string;
}

interface PrivateEquityPanelProps {
  positions: Position[];
}

export default function PrivateEquityPanel({ positions }: PrivateEquityPanelProps) {
  const pePositions = React.useMemo(() => {
    return positions
      .filter((p) => p.bucket.toLowerCase().includes('private'))
      .sort((a, b) => (b.market_value ?? 0) - (a.market_value ?? 0))
      .slice(0, 10);
  }, [positions]);

  if (pePositions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <h3 className="font-medium mb-2">Top 10 Private‑Equity Positions by NAV</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-1 px-2">Name</th>
              <th className="py-1 px-2">NAV</th>
              <th className="py-1 px-2">IRR</th>
              <th className="py-1 px-2">TVPI</th>
            </tr>
          </thead>
          <tbody>
            {pePositions.map((p, idx) => (
              <tr
                key={p.id}
                className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}
              >
                <td className="py-1 px-2 truncate max-w-xs" title={p.name}>{p.name}</td>
                <td className="py-1 px-2">{(p.market_value ?? 0).toLocaleString()}</td>
                <td className="py-1 px-2">
                  {p.irr != null ? `${(p.irr * 100).toFixed(1)}%` : '—'}
                </td>
                <td className="py-1 px-2">
                  {p.tvpi != null ? p.tvpi.toFixed(2) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}