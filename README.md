# FinDashGPT

FinDashGPT is a full‑stack dashboard designed for single‑family offices and
institutional investors.  The application delivers a comprehensive,
auto‑refreshing view of global markets, macroeconomic releases and
private‑equity activity.  It is built in TypeScript using a Node.js
backend (Express + SQLite) and a React/Next.js frontend (Tailwind CSS
and Recharts).  A cron scheduler updates the data every two hours and
API endpoints feed the frontend.  The project includes unit tests with
Jest and a CI/CD pipeline for automated testing and deployment.

## Features

1. **Global Markets Snapshot** – live quotes for major equity indices
   (S&P 500, Nasdaq 100, EURO STOXX 50, Nikkei 225), rates & credit
   (UST 2/10/30‑yr, German Bund 10‑yr, IG & HY spreads), commodities
   (Brent, WTI, gold, copper), G10 FX crosses and DXY, and crypto
   (BTC, ETH).  Data are grouped by category and visualised as bar
   charts.

2. **Key Economic Releases & Surprises** – latest CPI, PPI, payrolls,
   PMI and retail sales for the US, Eurozone and China; Citigroup
   Economic Surprise Indices (CESI) shown as spark‑lines; a rolling
   12‑month recession‑probability chart.  A tabular layout makes it
   easy to compare releases across regions.

3. **Private‑Equity Heat Map** – quarterly capital raised, dry
   powder and deal count by strategy (Buyout, Growth, VC,
   Distressed, Infrastructure, Real Estate); median purchase‑price
   multiples and leverage multiples by region; YTD fundraising league
   table (top 10 general partners); ILPA compliance score per
   strategy.

4. **Actionable Commentary** – auto‑generated macro summary (≈250
   words), with one risk to monitor, one opportunity to explore and a
   list of what changed in the last two hours.  Commentary is
   generated on the server using the most recent data.

5. **Dark‑Mode & Responsiveness** – a theme toggle switches between
   light and dark modes; the layout adapts gracefully from mobile
   through desktop.

6. **Data Integrity** – data updates run on a two‑hour schedule via
   `node‑cron`.  Each update retries failed API calls up to three
   times before flagging a “Data delayed” status.  All records are
   stored in SQLite with timestamps so the frontend can display the
   last refresh time in UTC.

7. **Testing & CI/CD** – Jest unit tests cover the data fetchers,
   commentary generator and frontend components.  Code coverage
   thresholds ensure that at least 80 % of backend functions are
   tested.  A GitHub Action checks out the code, installs
   dependencies, runs tests and deploys the frontend to Vercel or
   Netlify on each push to the `main` branch.

## Architecture

```
┌─────────────────────────────────────────────┐
│             Frontend (Next.js)             │
│  React components (Recharts, Tailwind)     │
│  API calls to /api/*                       │
└──────────────┬──────────────────────────────┘
               │
               │ REST
               ▼
┌─────────────────────────────────────────────┐
│              Backend (Express)             │
│  API routes /api/markets, /api/economics,  │
│  /api/pe, /api/commentary                  │
│  Cron scheduler (node‑cron) runs every 2h  │
│  Data ingestion modules:                   │
│    • fetchMarkets – queries FRED/Alpha     │
│    • fetchEconomic – queries FRED/Nasdaq   │
│    • fetchPrivateEquity – parses EDGAR/PE  │
│  Commentary generator                      │
└──────────────┬──────────────────────────────┘
               │
               │ SQLite (better‑sqlite3)
               ▼
        data.db – persist markets, economics,
                     pe_metrics tables

```

### File tree (abridged)

```
fndash/
├── backend/
│   ├── package.json         # backend dependencies and scripts
│   ├── tsconfig.json        # TypeScript compiler config
│   ├── jest.config.js       # Jest config with coverage thresholds
│   ├── src/backend/
│   │   ├── index.ts        # entry point bootstrapping server and cron
│   │   ├── server.ts       # Express server and API routes
│   │   ├── cron.ts         # 2‑hour update scheduler
│   │   ├── database.ts     # SQLite schema and helpers
│   │   ├── commentary.ts   # auto‑generated commentary
│   │   └── data/
│   │       ├── fetchMarkets.ts       # fetch global markets
│   │       ├── fetchEconomic.ts      # fetch macro releases
│   │       └── fetchPrivateEquity.ts # fetch PE metrics
│   └── tests/
│       └── fetchFunctions.test.ts    # unit tests for data modules
├── frontend/
│   ├── package.json         # frontend dependencies and scripts
│   ├── tsconfig.json        # TypeScript config for Next.js
│   ├── next.config.js       # Next.js config
│   ├── tailwind.config.js   # Tailwind config (dark mode)
│   ├── postcss.config.js    # PostCSS config
│   ├── jest.config.js       # Jest config for frontend
│   ├── styles/
│   │   └── globals.css       # import Tailwind directives and custom theme
│   └── pages/
│       ├── _app.tsx         # global CSS import and dark‑mode init
│       └── index.tsx        # dashboard page with charts and tables
├── README.md                # project overview and setup
└── .env.example             # environment variables template
```

## API choices and trade‑offs

| Data set        | Source (suggested)                          | Rationale & trade‑off                                                   |
|-----------------|--------------------------------------------|-------------------------------------------------------------------------|
| Equity indices  | **Alpha Vantage** (`TIME_SERIES_DAILY`)     | Free tier covers major indices but has rate limits (5 calls/min).       |
| Rates & spreads | **FRED** (UST/Bund yields, BAML OAS)        | Reliable, extensive macro database; requires API key; daily frequency.  |
| Commodities     | **FRED** (spot prices) / **Nasdaq Data Link** | FRED offers benchmark commodity prices; Nasdaq provides more breadth.    |
| FX & DXY        | **Alpha Vantage** (`FX_DAILY`)              | Free and simple; limited to ~500 calls/day.                             |
| Crypto          | **CoinGecko** (free public API)             | Wide coverage, no key needed, generous rate limits.                     |
| Macro releases  | **FRED** & **Nasdaq Data Link**             | Provide CPI, PPI, payrolls, PMI, retail sales; unify via FRED key.      |
| Surprise indices| **Citigroup CESI** via third‑party datasets | Not freely available; proxies can be calculated from FRED releases.     |
| PE fundraising  | **SEC EDGAR Form D** + scraping aggregator  | Free filings show capital raised by fund; scraping requires parser and  |
|                 |                                            | cross‑referencing; commercial alternatives (Preqin, PitchBook) are paid. |
| Multiples       | **Public market data** / surveys            | Usually compiled by investment banks; approximate using industry surveys.|

Trade‑off summary:  FRED and Alpha Vantage provide solid coverage for
rates, indices and macro data at no cost but have daily or minute
limits; their APIs are stable and well‑documented.  CoinGecko offers
free crypto prices.  Data for PE metrics are hardest to obtain
programmatically and often require manual Form D parsing or paid
subscriptions; this template uses illustrative values to demonstrate
the UI and architecture.

## Environment variables

Create a `.env` file at the project root (never commit sensitive keys)
with the following contents:

```ini
# FRED API key (https://fred.stlouisfed.org/docs/api/api_key.html)
FRED_API_KEY=your_fred_api_key

# Alpha Vantage API key (https://www.alphavantage.co)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# Nasdaq Data Link API key (optional)
NASDAQ_API_KEY=your_nasdaq_key

# Any other keys or tokens

```

## Setup and development

1. **Install dependencies**

   ```bash
   # backend
   cd fndash/backend
   npm install

   # frontend
   cd ../frontend
   npm install
   ```

2. **Populate environment** – copy `.env.example` to `.env` in the root
   and insert your API keys.

3. **Run the backend in development mode**

   ```bash
   cd backend
   npm run start
   ```

   The server listens on port `3001` by default and exposes REST
   endpoints under `/api`.

4. **Run the frontend**

   ```bash
   cd ../frontend
   npm run dev
   ```

   Visit `http://localhost:3000` in your browser to see the dashboard.

5. **Testing**

   ```bash
   # backend tests
   cd backend
   npm run test

   # frontend tests
   cd ../frontend
   npm run test
   ```

   The backend has 80 % coverage requirements enforced by Jest.

6. **Production build & deployment**

   - Build the frontend: `npm run build` in `frontend`.  The output
     directory (`.next`) can be deployed to Vercel or Netlify.
   - Use the provided GitHub Action (`.github/workflows/ci.yml`) to
     install dependencies, run tests and deploy on push to `main`.
   - Set environment variables on the hosting platform to supply API
     keys; the frontend uses `NEXT_PUBLIC_API_BASE_URL` to reach the
     backend.

## Compliance and disclaimer

FinDashGPT is a research tool.  It **does not provide investment
advice** and should not be relied upon to make financial decisions.
Data are sourced from third‑party providers under their terms of
service and may be delayed or inaccurate.  Users are responsible for
ensuring compliance with API providers’ usage policies, especially when
deploying the dashboard in a commercial setting.  All timestamps are
displayed in UTC.