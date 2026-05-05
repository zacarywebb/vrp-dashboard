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

## Statistical robustness

The backtest reports a Sharpe Ratio of 4.51 and a 97.7% win rate. Both figures warrant scrutiny — not because the underlying edge is fake, but because simulation artifacts and selection bias from testing 1,500 parameter combinations can inflate observed performance. This section applies the Bailey & López de Prado (2014) framework to quantify exactly how much.

### The two-part question

The Sharpe Ratio estimator has two independent problems here:

1. **Non-normality.** Short-volatility returns are not Gaussian. Most days produce small theta gains; occasionally a vol spike produces a large loss. The resulting distribution has skewness of −1.94 and full kurtosis of 64.19 (vs. 3.0 for a normal distribution). This makes the standard Sharpe estimator overconfident — its confidence interval is artificially narrow.

2. **Selection bias.** Running 1,500 parameter combinations and reporting the best one's Sharpe is a multiple-testing experiment. Even if every combination had zero true edge, the winner would show an inflated observed Sharpe just from random variation.

The Probabilistic Sharpe Ratio (PSR) fixes problem one. The Deflated Sharpe Ratio (DSR) fixes both simultaneously.

### PSR — correcting for fat tails and negative skew

The PSR replaces the naive Sharpe confidence interval with one that accounts for non-normality:

```
PSR(SR_b) = Φ[ (SR̂ − SR_b) × √(T−1) / √(1 − γ₃·SR̂ + (γ₄−1)/4·SR̂²) ]
```

The denominator correction factor is **1.68×**, meaning the effective z-score is 7.30 rather than the naive 12.28. Despite the correction, the results are strong:

| Benchmark | PSR | Meaning |
|---|---|---|
| SR > 0 | ~100% | Strategy almost certainly has positive edge |
| SR > 1.0 | ~100% | Edge very likely exceeds a passive benchmark |
| SR > 2.0 | 99.998% | Near-certainty of meaningful risk-adjusted returns |

The PSR confirms the sign of the edge is real. The VRP is a well-documented, structurally persistent phenomenon — options buyers consistently overpay for protection. This shows up clearly even after correcting for the non-normal return distribution.

### DSR — correcting for 1,500 tested combinations

The DSR sets the PSR benchmark to the *expected maximum Sharpe* that blind random search across N=1,500 parameter combinations would produce by chance. This is derived from the empirical spread of performance across the sweep:

```
SR* = SD(SR_k) × [(1 − γ_E) · Φ⁻¹(1 − 1/N) + γ_E · Φ⁻¹(1 − 1/(N·e))]
    = 1.247 × 3.36
    = 4.20
```

The reported Sharpe of 4.51 exceeds this expected maximum by **0.31 units**. The DSR — the probability the selected parameter set genuinely beats what chance selection from 1,500 trials would find — is:

**DSR = 69.2%**

There is roughly a **1-in-3 chance** the selected parameters are not meaningfully better than a lucky draw from the sweep. This is not a comfortable margin.

### Minimum track record

For DSR ≥ 95% confidence given N=1,500 trials, the required number of daily observations is:

**79.6 years** — against a current track record of 7.4 years.

This is the quantified form of a universal problem in systematic strategy development: the more parameter combinations you test, the longer the out-of-sample track record needed to distinguish genuine optimization from curve-fitting. 1,500 combinations × one decade of data is not resolvable with any reasonable amount of additional backtested history.

### What this means

The statistical picture splits cleanly into two tiers:

**The sign is validated.** PSR provides near-certainty that the true Sharpe exceeds 2.0 even after non-normality corrections. The VRP is a real structural premium — not a backtest artifact — and this implementation captures it.

**The magnitude is not.** The DSR of 69.2% means the specific magnitude of the reported Sharpe (4.51) cannot be distinguished from lucky parameterization with the available data. The synthetic IV proxy further muddies this: if real-world implied volatility behaves more noisily than the beta-scaled VIX estimates used here (which it does), actual portfolio vol is higher, which compresses the SR estimate and collapses DSR toward zero.

The honest interpretation: treat the backtest figures as upper bounds. The strategy likely produces real, positive, risk-adjusted returns. Whether the live Sharpe is 1.5 or 3.0 is a question that can only be answered with real options fills and forward time — not more backtesting.

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
