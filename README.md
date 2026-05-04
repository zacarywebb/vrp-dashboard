# VRP Strategy Dashboard

A full-stack quantitative options strategy dashboard. The frontend visualizes a systematic variance risk premium (VRP) harvesting strategy backtested across 51 liquid ETFs from 2018–2025. The screener runs every weekday after market close via GitHub Actions, pulling live market data to compute fresh signal readings — no manual intervention required.

**[Live demo →](https://zacarywebb.github.io/vrp-dashboard/)**

---

## What it is

The variance risk premium is the persistent spread between implied volatility (what options buyers pay) and realized volatility (what actually happens). Because market participants structurally overpay for options as portfolio hedges, this spread can be systematically harvested by selling options under the right conditions.

This project implements that idea end-to-end: a signal framework that identifies favorable conditions, an iron condor trade structure with embedded risk management, a full historical backtest, and a live daily screener.

---

## Strategy

**Three signals must all pass before a trade is considered:**

| Signal | Logic |
|---|---|
| VRP spread | IV must exceed realized vol by ≥1%, sustained over a 75-day rolling window — ensures the premium is structural, not a blip |
| IV percentile | Current IV must rank in the bottom 50% of its trailing 1-year range — counterintuitively, low IV produces the best short-vol returns |
| Term structure | Each ticker's 10-day realized vol must not significantly exceed its 60-day realized vol — ratio below 0.98 signals near-term stress |

**Trade structure:** Iron condors — sell 25-delta strangle, buy 5-delta wings, 30 DTE. Defined max loss from entry.

**Risk management (parameter-optimized via sweep across 1,500 combinations):**
- Profit target at 30% of max credit
- Stop-loss at 3× credit received
- Max 8% of capital per position, 50% total margin deployed, 8 concurrent positions

---

## Live screener

Every weekday at 5pm ET, a GitHub Actions workflow in the private strategy repo:

1. Fetches closing prices for all 51 ETFs via Yahoo Finance
2. Fetches volatility data from FRED — VIX and VIX3M for SPY, CBOE volatility indices (VXEEM, GVZ, OVX) for EEM/GLD/USO, and beta-scaled VIX estimates for all other tickers
3. Computes realized volatility (Yang-Zhang estimator), VRP spread, IV percentile, and term structure ratio for each ticker
4. Scores each ticker 0–3 and writes the results to `src/data/screener.json`
5. Commits the file to this repo, triggering an automatic Pages redeploy

The Screener page always shows the most recent signal snapshot with its date. No server is required — the data is baked into the static build.

---

## Stack

**Frontend**
- React, Vite
- All charts rendered on HTML Canvas
- Static JSON data bundled at build time; falls back nicely when no backend is running (backend is held in private repo)

**Backend** (private repo)
- Python — pandas, numpy, scipy, yfinance
- `signals.py` — three-signal framework and screener engine
- `quant.py` — Yang-Zhang realized vol, Black-Scholes pricing, iron condor construction
- `backtest.py` — full simulation engine with position sizing via OLS regression
- `api.py` — FastAPI server for local development (live equity curve, trade log, screener)
- `sweep.py` — parameter optimization across 1,500 signal/risk combinations

**Automation**
- GitHub Actions cron: runs screener daily, pushes updated data to this repo
- GitHub Pages: deploys on every push to `main`

---

## Running locally

```bash
npm install
npm run dev    # static demo at http://localhost:5173
```

To connect the live backend (requires the private strategy repo):

```bash
# Terminal 1 — API server
python3 -m uvicorn api:app --reload --port 8000

# Terminal 2 — frontend
npm run dev
```

When the backend is reachable, the nav shows "Live data" and the Screener page enables a manual Refresh button that triggers a fresh scan on demand.
