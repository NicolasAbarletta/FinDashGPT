import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

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

export default function Home() {
  const [markets, setMarkets] = useState<MarketRecord[]>([]);
  const [economics, setEconomics] = useState<EconRecord[]>([]);
  const [peMetrics, setPeMetrics] = useState<PEMetric[]>([]);
  const [commentary, setCommentary] = useState<Commentary | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

  const fetchData = async () => {
    try {
      const [mRes, eRes, pRes, cRes] = await Promise.all([
        fetch(`${apiBase}/markets`).then((res) => res.json()),
        fetch(`${apiBase}/economics`).then((res) => res.json()),
        fetch(`${apiBase}/pe`).then((res) => res.json()),
        fetch(`${apiBase}/commentary`).then((res) => res.json())
      ]);
      setMarkets(mRes.data || []);
      setEconomics(eRes.data || []);
      setPeMetrics(pRes.data || []);
      setCommentary(cRes.commentary);
      // Determine latest update across endpoints.
      const times = [mRes.lastUpdate, eRes.lastUpdate, pRes.lastUpdate, cRes.lastUpdate].filter(Boolean);
      setLastUpdate(times.sort().reverse()[0] || null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 2 hours (7200000 ms)
    const interval = setInterval(fetchData, 1000 * 60 * 60 * 2);
    return () => clearInterval(interval);
  }, []);

  // Organise markets by category for charts.
  const marketsByCategory = markets.reduce<Record<string, MarketRecord[]>>((acc, record) => {
    if (!acc[record.category]) acc[record.category] = [];
    acc[record.category].push(record);
    return acc;
  }, {});

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString('en-US', { timeZone: 'UTC' });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">FinDash Global Markets Dashboard</h1>
        <button
          onClick={() => {
            if (document.documentElement.classList.contains('dark')) {
              document.documentElement.classList.remove('dark');
              localStorage.setItem('theme', 'light');
            } else {
              document.documentElement.classList.add('dark');
              localStorage.setItem('theme', 'dark');
            }
          }}
          className="px-3 py-1 rounded border border-gray-400 dark:border-gray-600"
        >
          Toggle Theme
        </button>
      </header>
      {/* Global Markets Snapshot */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Global Markets Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(marketsByCategory).map((cat) => {
            const data = marketsByCategory[cat];
            return (
              <div key={cat} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h3 className="font-medium mb-2 capitalize">{cat}</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                      <XAxis type="number" domain={[0, Math.max(...data.map((d) => d.value)) * 1.2]} hide={true} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                      <Bar dataKey="value" fill="#3b82f6" />
                      <Tooltip />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* Economic Releases & Surprises */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">2. Key Economic Releases & Surprises</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-1 px-2">Indicator</th>
                <th className="py-1 px-2">Country</th>
                <th className="py-1 px-2">Value</th>
                <th className="py-1 px-2">Surprise</th>
                <th className="py-1 px-2">Period</th>
                <th className="py-1 px-2">Release Date</th>
              </tr>
            </thead>
            <tbody>
              {economics.map((r, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                  <td className="py-1 px-2">{r.indicator}</td>
                  <td className="py-1 px-2">{r.country}</td>
                  <td className="py-1 px-2">{r.value}</td>
                  <td className="py-1 px-2">{r.surprise ?? '—'}</td>
                  <td className="py-1 px-2">{r.period ?? '—'}</td>
                  <td className="py-1 px-2">{r.release_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Surprise indices spark-lines */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {['US', 'EZ', 'CN'].map((country) => {
            const cesi = economics
              .filter((e) => e.indicator === 'CESI' && e.country === country)
              .map((e) => ({ name: e.period || '', value: e.value }));
            return (
              <div key={country} className="bg-white dark:bg-gray-800 p-4 rounded shadow">
                <h4 className="font-medium mb-2">CESI – {country}</h4>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cesi}>
                      <XAxis dataKey="name" hide={true} />
                      <YAxis hide={true} domain={['auto', 'auto']} />
                      <Line type="monotone" dataKey="value" stroke="#ef4444" dot={false} />
                      <Tooltip />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
        {/* Recession probability chart */}
        <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h4 className="font-medium mb-2">US Recession Probability (Next 12 months)</h4>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={economics
                  .filter((e) => e.indicator === 'RecessionProb' && e.country === 'US')
                  .map((e) => ({ name: e.period || '', value: e.value }))}
              >
                <XAxis dataKey="name" hide={true} />
                <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Line type="monotone" dataKey="value" stroke="#10b981" dot={true} />
                <Tooltip formatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      {/* Private Equity Heat Map */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">3. Private‑Equity Heat Map</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-1 px-2">Metric</th>
                <th className="py-1 px-2">Strategy</th>
                <th className="py-1 px-2">Region</th>
                <th className="py-1 px-2">Value</th>
                <th className="py-1 px-2">Period</th>
              </tr>
            </thead>
            <tbody>
              {peMetrics.map((m, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                  <td className="py-1 px-2">{m.metric}</td>
                  <td className="py-1 px-2">{m.strategy}</td>
                  <td className="py-1 px-2">{m.region ?? '—'}</td>
                  <td className="py-1 px-2">{m.value}</td>
                  <td className="py-1 px-2">{m.period ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {/* Actionable Commentary */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">4. Actionable Commentary</h2>
        {commentary ? (
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow space-y-4">
            <p>{commentary.summary}</p>
            <p className="font-semibold">Risk: <span className="font-normal">{commentary.risk}</span></p>
            <p className="font-semibold">Opportunity: <span className="font-normal">{commentary.opportunity}</span></p>
            <div>
              <p className="font-semibold mb-1">What changed in the last 2 hrs?</p>
              <ul className="list-disc list-inside">
                {commentary.changes.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p>Loading commentary…</p>
        )}
      </section>
      {/* Footer */}
      <footer className="text-xs text-gray-500 dark:text-gray-400 mt-12">
        <p>
          Last update (UTC): {lastUpdate ? formatTimestamp(lastUpdate) : 'N/A'} – Data refreshes every 2 hours. No investment advice.
        </p>
      </footer>
    </div>
  );
}