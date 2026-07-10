# VRP Strategy Dashboard

A quantitative options strategy that harvests the **variance risk premium** — the persistent
gap between implied and realized volatility — by selling defined-risk iron condors on 51 liquid
ETFs. This repo is the dashboard; the backtest engine, screener, and research live in a
companion repo and publish here automatically.

**[Live demo →](https://zacarywebb.github.io/vrp-dashboard/)**

## Results (out-of-sample, 2018–2025)

| Metric | Strategy | SPY buy & hold |
|---|---|---|
| CAGR | 17.2% | 13.8% |
| Sharpe (excess) | 1.51 | 0.62 |
| Max drawdown | -8.9% | -33.7% |
| Win rate | 83.9% (503 trades) | — |
| Correlation to SPY | 0.14 | 1.0 |

Parameters were selected on pre-2018 data only; the test period never touched selection. An
earlier version of this project reported a 4.5 Sharpe / 97% win rate — those were simulation
artifacts (no daily mark-to-market, flat-vol pricing), and the rebuild that fixed them is the
main story of the dashboard's Backtest and Validation tabs.

## The signals — and why they work

A trade needs the variance premium to be present, structural, and free of near-term stress:

- **VRP spread** (IV − realized vol, positive and persistent). Option buyers systematically
  overpay for convexity, so IV exceeds subsequent RV on average — the premium the whole
  strategy collects (*Carr & Wu 2009; Bakshi & Kapadia 2003*).
- **IV percentile — top half of its 1-year range.** This is inverted from common folklore: the
  VRP is *countercyclical* and highest after volatility rises, so you get paid most when there
  is premium to sell (*Bollerslev, Tauchen & Zhou 2009*). Our own trade data agreed — the
  low-IV rule was filtering out the profitable trades.
- **Term structure** (per-ticker short vs long realized vol; VIX3M/VIX for SPY). Backwardation
  flags acute stress where short-vol strategies bleed — stay out (*Johnson 2017*).
- **Long-run anchor** (IV must also clear 1-year realized vol). Volatility mean-reverts to its
  long-run level, so that's the benchmark that matters (*Goyal & Saretto 2009*).

**Trade:** sell a 16Δ strangle, buy 5Δ wings, 30 DTE, one day after the signal. Rank the day's
candidates by VRP and take the top 3. Manage at 75% of credit, stop at 2× credit, skip the days
around scheduled FOMC meetings.

## Statistical honesty

A short-vol backtest that looks amazing usually is. Two guardrails keep this one grounded:

- **Every improvement is pre-registered and tested on training data only**, then confirmed on a
  test period no parameter ever saw. Rejected ideas (VVIX gates, single-sided books, leverage,
  asymmetric deltas) are documented alongside the adopted ones.
- **Deflated Sharpe Ratio** (Bailey & López de Prado 2014) counts every one of the ~60 trials
  run, so selection bias is quantified rather than hidden. On the untouched test period, the
  probabilistic Sharpe puts ~92% odds that the true Sharpe exceeds 1.0 — likely real, though a
  live forward track (running now on the Screener tab) is the only thing that truly settles it.

Full methodology, pricing validation against real option chains, and annotated citations are on
the live dashboard.

## Stack

- **Frontend:** React + Vite, hand-rolled SVG charts, no chart library. Deployed to GitHub Pages.
- **Backend (companion repo):** Python — daily mark-to-market backtest engine, Black-Scholes
  pricing with a skew surface calibrated to real chains, FastAPI for the live API.
- **Data (all free):** Yahoo Finance (prices), FRED (VIX/VIX3M, T-bill rates), DoltHub
  (real option chains for validation + per-ticker IV), CBOE (VVIX).
- **Automation:** a GitHub Action runs the screener after each market close and pushes fresh
  signals + the paper-trading track record here.

## Disclaimer

For educational purposes only. All performance figures are hypothetical simulation results, not
actual trading. Past performance — simulated or real — does not guarantee future results.
