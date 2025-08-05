/* frontend/pages/index.tsx
   ---------------------------------------------------------------
   Dashboard page – corrected fetch paths & robust base-URL logic
*/

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ---------- Types ---------- */

interface MarketRecord {
  category: string;
  symbol: string;
  name: string;
  value: number;
  timestamp: string;
}

interface EconRecord {
  indicator: string;
  country: string;
  value: number;
  release_date: string;
  period?: string;
  surprise?: number;
  timestamp: string;
}

interface PEMetric {
  metric: string;
  strategy: string;
  region?: string;
  value: number;
  period?: string;
  timestamp: string;
}

interface Commentary {
  summary: string;
  risk: string;
  opportunity: string;
  changes: string[];
}

/* ---------- Component ---------- */

export default function Home() {
  /* State */
  const [markets, setMarkets] = useState<MarketRecord[]>([]);
  const [economics, setEconomics] = useState<EconRecord[]>([]);
  const [peMetrics, setPeMetrics] = useState<PEMetric[]>([]);
  const [commentary, setCommentary] = useState<Commentary | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  /* Base-URL helper */
  const apiBaseRaw =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  // ensure no trailing slash
  const apiBase = apiBaseRaw.replace(/\/+$/, '');

  /* Fetch once + every 2 h */
  const fetchData = async () => {
    try {
      const [mRes, eRes, pRes, cRes] = await Promise.all([
        fetch(`${apiBase}/markets`).then((r) => r.json()),
        fetch(`${apiBase}/economics`).then((r) => r.json()),
        fetch(`${apiBase}/pe_metrics`).then((r) => r.json()),
        fetch(`${apiBase}/commentary`).then((r) => r.json()),
      ]);

      /* Back-end returns arrays directly – adapt if you changed response shape */
      setMarkets(mRes);
      setEconomics(eRes);
      setPeMetrics(pRes);
      setCommentary(cRes);

      /* Latest timestamp */
      const times: string[] = [
        ...markets.map((m) => m.timestamp),
        ...economics.map((e) => e.timestamp),
        ...peMetrics.map((p) => p.timestamp),
      ];
      setLastUpdate(times.sort().reverse()[0] ?? null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data', err);
    }
  };

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 2 * 60 * 60 * 1000); // 2 h
    return () => clearInterval(id);
  }, []);

  /* Utility */
  const formatTimestamp = (ts: string) =>
    new Date(ts).toLocaleString('en-US', { timeZone: 'UTC' });

  /* Group markets by category */
  const marketsByCategory = markets.reduce<Record<string, MarketRecord[]>>(
    (acc, rec) => {
      if (!acc[rec.category]) acc[rec.category] = [];
      acc[rec.category].push(rec);
      return acc;
    },
    {}
  );

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">
          FinDash Global Markets Dashboard
        </h1>
        <button
          onClick={() => {
            const root = document.documentElement;
            if (root.classList.contains('dark')) {
              root.classList.remove('dark');
              localStorage.setItem('theme', 'light');
            } else {
              root.classList.add('dark');
              localStorage.setItem('theme', 'dark');
            }
          }}
          className="px-3 py-1 rounded border border-gray-400 dark:border-gray-600"
        >
          Toggle Theme
        </button>
      </header>

      {/* 1. Global Markets Snapshot */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          1. Global Markets Snapshot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(marketsByCategory).map(([cat, data]) => (
            <div
              key={cat}
              className="bg-white dark:bg-gray-800 p-4 rounded shadow"
            >
              <h3 className="font-medium mb-2 capitalize">{cat}</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical">
                    <XAxis
                      type="number"
                      domain={[
                        0,
                        Math.max(...data.map((d) => d.value)) * 1.2,
                      ]}
                      hide
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 10 }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ... ECONOMICS, PE, COMMENTARY SECTIONS UNCHANGED ... */}
      {/* (Keep the rest of your JSX exactly as you had it) */}

      {/* Footer */}
      <footer className="text-xs text-gray-500 dark:text-gray-400 mt-12">
        <p>
          Last update (UTC):{' '}
          {lastUpdate ? formatTimestamp(lastUpdate) : 'N/A'} – Data refreshes
          every 2 hours. No investment advice.
        </p>
      </footer>
    </div>
  );
}
