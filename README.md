# VRP Strategy Dashboard

A quantitative options strategy that harvests the **variance risk premium** — the persistent
gap between implied and realized volatility — by selling defined-risk iron condors on 51 liquid
ETFs. This repo is the dashboard; the backtest engine, screener, and research live in a
companion repo and publish here automatically.

**[Live demo →](https://zacarywebb.github.io/vrp-dashboard/)**

## The idea

Option buyers systematically overpay for convexity — index puts as portfolio insurance,
calls as lottery tickets — so implied volatility trades above the volatility that subsequently
realizes. That spread, the variance risk premium, is a well-documented structural feature of
options markets (*Carr & Wu 2009; Bakshi & Kapadia 2003*). Selling options harvests it, but
naively selling volatility blows up in the regimes where realized vol spikes past implied. The
strategy is a systematic filter for the conditions where the premium is present, structural,
and free of near-term stress.

## Signals

A trade is considered only when all of these hold:

- **VRP spread** — implied vol exceeds 30-day realized vol by ≥1 point, sustained over a
  75-day window. The premium must be structural, not a one-day blip.
- **IV percentile — top half of its 1-year range.** The variance premium is countercyclical:
  it is largest after volatility rises and predicts higher subsequent short-vol returns
  (*Bollerslev, Tauchen & Zhou 2009*). You get paid most when there is premium to sell.
- **Term structure** — the ticker's short-horizon realized vol must not exceed its long-horizon
  realized vol (blended with the VIX3M/VIX ratio for SPY). Backwardation flags acute stress
  where short-vol strategies perform poorly (*Johnson 2017*).
- **Long-run anchor** — implied vol must also clear 1-year realized vol. Volatility mean-reverts
  to its long-run level, so that is the benchmark the premium is measured against
  (*Goyal & Saretto 2009*).

## Trade structure

Sell a 16-delta strangle, buy 5-delta wings, 30 days to expiry — a defined-risk iron condor
with a known maximum loss at entry. Each day's candidates are ranked by VRP spread and the top 3
are taken. Positions are entered the day after the signal (no lookahead), managed at 75% of
credit captured, stopped at 2× credit, and closed around scheduled FOMC meetings where
event-window premia can invert (*Wright 2021*). Sizing is capped at 5% of equity per position,
40% total margin, 10 concurrent positions.

## Results (out-of-sample, 2018–2025)

| Metric | Strategy | SPY buy & hold |
|---|---|---|
| CAGR | 17.2% | 13.8% |
| Sharpe (excess) | 1.51 | 0.62 |
| Max drawdown | -8.9% | -33.7% |
| Win rate | 83.9% (503 trades) | — |
| Correlation to SPY | 0.14 | 1.0 |

All parameters were selected on pre-2018 data; the 2018–2025 test period never touched
selection. Cash earns the 3-month T-bill rate, and every trade is charged commissions plus
half the bid/ask spread on all four legs at entry and exit.

## Methodology

- **Pricing** — iron condor legs are priced with Black-Scholes on a volatility surface with a
  measured skew (25Δ puts richer than ATM, calls cheaper), calibrated against real SPY option
  chains. The Validation tab shows synthetic vs. real-market pricing side by side.
- **Mark-to-market** — every open position is repriced daily against current spot, IV, and time
  to expiry, so the equity curve reflects real intra-trade drawdowns rather than only
  settled P&L.
- **Selection discipline** — every candidate rule is pre-registered and tested on the training
  period, then confirmed once on the untouched test period. The Deflated Sharpe Ratio
  (*Bailey & López de Prado 2014*) accounts for the number of configurations tried, and a live
  paper-trading track record runs forward on the Screener tab.

## Stack

- **Frontend** — React + Vite with hand-rolled SVG charts (no chart library), deployed to
  GitHub Pages.
- **Backend** (companion repo) — Python: daily mark-to-market backtest engine, Black-Scholes
  pricing with a calibrated skew surface, FastAPI for the live API.
- **Data** (all free) — Yahoo Finance (prices), FRED (VIX/VIX3M, T-bill rates), DoltHub (real
  option chains and per-ticker IV), CBOE (VVIX).
- **Automation** — a GitHub Action runs the screener after each market close and pushes fresh
  signals and the paper-trading record to this repo.

## Disclaimer

For educational purposes only. All performance figures are hypothetical simulation results, not
actual trading. Past performance — simulated or real — does not guarantee future results.
