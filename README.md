# VRP Strategy Dashboard

A quantitative options strategy dashboard built with React and Vite. Visualizes a systematic variance risk premium (VRP) harvesting strategy that uses iron condor structures across 51 liquid ETFs.

**[Live demo →](https://YOUR_USERNAME.github.io/vrp-dashboard/)**

## What it shows

**Strategy** — explains the three-signal framework (VRP spread, IV percentile, term structure), the iron condor structure, and an honest methodology section covering how the simulation works and what it doesn't capture.

**Backtest** — equity curve, performance metrics, exit breakdown, and full trade log from an out-of-sample simulation across 2018–2025.

**Screener** — a daily snapshot of signal readings across the ETF universe (live scan available when connected to the backend).

## Running locally

```bash
npm install
npm run dev          # static demo at http://localhost:5173
```

To connect to the live backend (requires the private strategy repo):
```bash
# Terminal 1
uvicorn api:app --reload --port 8000

# Terminal 2
npm run dev
```

When the backend is reachable, the screener shows live signal data and a Refresh button. Without it, the app falls back to the bundled snapshot data.

## Tech

- React 18, Vite 5
- All charts drawn on HTML Canvas (no chart library)
- FastAPI backend (private repo) serves `/api/backtest` and `/api/screener`
- Static data bundled at build time from real backtest CSV outputs

## Methodology note

Backtest results use estimated implied volatility (VIX-based proxies, not real options chains) and a theoretical Black-Scholes pricing model. The high simulated win rate (97.7%) and Sharpe ratio (4.51) are artifacts of the simulation approach — the Strategy page explains each effect in detail. Realistic live trading expectations: 85–92% win rate, 1.0–2.0 Sharpe, 15–35% CAGR.
