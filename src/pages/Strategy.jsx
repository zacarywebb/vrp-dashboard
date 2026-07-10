import { useState } from "react";
import { COLORS, MONO, CARD, fmtPct } from "../theme";
import { MetricCard, Callout } from "../components/ui";

export default function StrategyPage({ metrics, benchmark }) {
  const [activeSignal, setActiveSignal] = useState(0);
  const signals = [
    {
      name: "VRP spread",
      icon: "σ",
      color: COLORS.accent,
      desc: "Implied volatility must exceed realized volatility by at least 1%, sustained over a 75-day rolling window. This ensures the premium is structural — not a one-day anomaly.",
      detail: "The variance risk premium exists because market participants consistently overpay for options to hedge portfolio risk. IV reflects what buyers are willing to pay; RV reflects what actually happens. The gap is the edge.",
    },
    {
      name: "IV percentile",
      icon: "%",
      color: COLORS.teal,
      desc: "Current IV must rank in the TOP half of its trailing 1-year range — a reversal of this project's original rule, and of common short-vol folklore. Conditional on the other two gates, richer IV meant +2.5% per trade; cheap IV meant -1.0%.",
      detail: "The original design (and the paper behind it) filtered FOR low percentiles, citing platform-level decile studies. Train-period evidence from this engine's own trades showed the opposite once portfolio-level costs and the VRP/term-structure gates are in place: you get paid for selling premium when there is premium to sell. The filter was inverted in v2.1 — and the reversal, with the evidence, is documented rather than hidden.",
    },
    {
      name: "Term structure",
      icon: "∠",
      color: COLORS.amber,
      desc: "Each ticker's short-term realized vol must not significantly exceed its long-term realized vol. When the ratio drops below 0.98, near-term stress is elevated — stay out.",
      detail: "Computed per-ticker from 10-day vs 60-day Yang-Zhang realized volatility. For SPY, blended 50/50 with the actual VIX3M/VIX ratio from FRED. Every ETF gets its own independent reading.",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: COLORS.accent, marginBottom: 12, fontWeight: 600 }}>Systematic options strategy</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: COLORS.text, lineHeight: 1.2, margin: 0, marginBottom: 12 }}>
          Variance risk premium<br />harvesting
        </h1>
        <p style={{ fontSize: 15, color: COLORS.textMuted, maxWidth: 600, lineHeight: 1.7, margin: 0 }}>
          A quantitative strategy that captures the persistent spread between implied and realized
          volatility through defined-risk iron condors on 51 liquid ETFs. Simulated with a daily
          mark-to-market engine whose pricing is calibrated against real option chains — every
          number below survives realistic execution costs and honest position marking.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        <MetricCard label="CAGR (out-of-sample)" value={fmtPct(metrics?.cagr_pct)} color={COLORS.green}
                    sub={benchmark ? `SPY same period: ${fmtPct(benchmark.cagr_pct)}` : "2018–2025"} />
        <MetricCard label="Sharpe ratio" value={metrics?.sharpe ?? "—"} color={COLORS.accent}
                    sub={benchmark ? `SPY: ${benchmark.sharpe}` : "Daily MTM equity"} />
        <MetricCard label="Max drawdown" value={fmtPct(metrics?.max_drawdown_pct)} color={COLORS.amber}
                    sub={benchmark ? `SPY: ${fmtPct(benchmark.max_drawdown_pct)}` : ""} />
        <MetricCard label="Win rate" value={fmtPct(metrics?.win_rate_pct)} color={COLORS.teal}
                    sub={metrics ? `${metrics.n_trades.toLocaleString()} trades · PF ${metrics.profit_factor}` : "—"} />
      </div>

      <div style={{ marginBottom: 48 }}>
        <Callout tone="amber" title="These are simulated results with honest assumptions —">
          daily Black-Scholes repricing on a skew-calibrated IV surface, spread-crossing costs on
          every leg, entries lagged one day after signals. Synthetic pricing was validated against
          real SPY option chains (median credit within 5% — see the Validation tab). Still not
          real fills. Past simulated performance does not guarantee future results.
        </Callout>
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, marginBottom: 20 }}>Signal framework</h2>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0, border: `0.5px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ background: COLORS.surface, borderRight: `0.5px solid ${COLORS.border}` }}>
            {signals.map((s, i) => (
              <div key={i} onClick={() => setActiveSignal(i)} style={{
                padding: "16px 20px", cursor: "pointer", transition: "all 0.2s",
                background: activeSignal === i ? COLORS.surfaceHover : "transparent",
                borderBottom: i < 2 ? `0.5px solid ${COLORS.border}` : "none",
                borderLeft: activeSignal === i ? `2px solid ${s.color}` : "2px solid transparent",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                    background: s.color + "18", color: s.color, fontSize: 14, fontWeight: 700, fontFamily: MONO,
                  }}>{s.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: activeSignal === i ? COLORS.text : COLORS.textMuted }}>{s.name}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 28 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: signals[activeSignal].color, marginBottom: 10, fontWeight: 600 }}>
              Signal {activeSignal + 1} of 3
            </div>
            <p style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.7, margin: "0 0 16px" }}>{signals[activeSignal].desc}</p>
            <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.7, margin: 0, padding: "12px 16px", background: COLORS.surface, borderRadius: 8, borderLeft: `2px solid ${signals[activeSignal].color}` }}>
              {signals[activeSignal].detail}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, marginBottom: 20 }}>Trade structure</h2>
        <div style={{ ...CARD, borderRadius: 12, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Iron condor</span>
            <span style={{ fontSize: 12, color: COLORS.textDim }}>16Δ short / 5Δ long · 30 DTE · entered the day after the signal · top 3 candidates per day, ranked by VRP</span>
          </div>
          <svg viewBox="0 0 600 160" style={{ width: "100%", height: 160 }}>
            <line x1="30" y1="120" x2="570" y2="120" stroke={COLORS.border} strokeWidth="0.5" />
            <line x1="30" y1="80" x2="570" y2="80" stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="4 4" />
            <path d={`M30,120 L120,120 L180,40 L300,40 L420,40 L480,120 L570,120`} fill="none" stroke={COLORS.green} strokeWidth="2" />
            <path d={`M30,120 L120,120 L180,40 L300,40 L420,40 L480,120 L570,120 L570,160 L30,160 Z`} fill={COLORS.green + "08"} />
            {[
              { x: 120, label: "Long put", sub: "5Δ", color: COLORS.accent },
              { x: 220, label: "Short put", sub: "25Δ", color: COLORS.green },
              { x: 380, label: "Short call", sub: "25Δ", color: COLORS.green },
              { x: 480, label: "Long call", sub: "5Δ", color: COLORS.accent },
            ].map((s, i) => (
              <g key={i}>
                <circle cx={s.x} cy={s.x > 200 && s.x < 400 ? 40 : 120} r="4" fill={s.color} />
                <text x={s.x} y={16} textAnchor="middle" fontSize="10" fill={COLORS.textMuted} fontFamily={MONO}>{s.label}</text>
                <text x={s.x} y={28} textAnchor="middle" fontSize="9" fill={COLORS.textDim} fontFamily={MONO}>{s.sub}</text>
              </g>
            ))}
            <text x="300" y="56" textAnchor="middle" fontSize="10" fill={COLORS.green} fontFamily={MONO}>Max profit zone</text>
          </svg>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
            {[
              { label: "Profit target", val: "50% of credit", desc: "Buy back when the spread halves" },
              { label: "Stop-loss", val: "2× credit", desc: "On true buyback cost, marked daily" },
              { label: "Time exit", val: "7 DTE", desc: "Dodge the gamma week before expiry" },
              { label: "Position cap", val: "5% risk / trade", desc: "≤40% total margin, 10 positions" },
            ].map((r, i) => (
              <div key={i} style={{ padding: "12px 16px", background: COLORS.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, fontFamily: MONO }}>{r.val}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Simulation methodology</h2>
        <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20, lineHeight: 1.6, maxWidth: 720 }}>
          There is no free per-ticker options history, so the backtest prices condors synthetically —
          but every layer of that synthesis is either marked to market daily or measured against real data.
          An earlier version of this project used a theta-decay shortcut instead of repricing and produced
          a 97% win rate and 4.5 Sharpe; rebuilding the engine honestly is what produced the numbers you see now.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[
            {
              color: COLORS.accent, title: "Pricing: skew-calibrated Black-Scholes",
              body: "Each leg is priced at its own implied volatility: the VIX-proxy level is scaled down to true ATM (VIX ≈ 1.22× ATM IV, measured), then adjusted by delta — 25Δ puts at 1.20× ATM, 5Δ puts at 1.72×, calls below ATM. All numbers measured from 60 months of real SPY chains.",
              foot: "Result: synthetic credits land within ~5% of real market credits (median).",
            },
            {
              color: COLORS.teal, title: "P&L: daily mark-to-market",
              body: "Every open position is repriced every day with current spot, current IV, and remaining time. Profit targets and stops trigger on the true cost of buying the spread back — not on a decay heuristic. The equity curve carries real vega and gamma exposure.",
              foot: "Result: the Sharpe ratio is computed from an equity curve that actually moves.",
            },
            {
              color: COLORS.amber, title: "Costs: every leg, both ways",
              body: "Entry and exit each cross half the bid/ask spread on all four legs (2.5% of leg price, 2¢ floor) plus $0.65/contract commissions. Expiration settles at intrinsic value, cost-free. Real SPY spreads measured in validation are tighter than this model — costs lean conservative.",
              foot: "Result: ~15–20% of gross credit is consumed by friction.",
            },
            {
              color: COLORS.purple, title: "Hygiene: no lookahead, split discipline",
              body: "Signals computed on day t trigger entries at day t+1 prices. All selection — a 36-combination exit-parameter sweep plus 5 structural experiments (spread sides, regime gates) — used pre-2018 data only; everything after 2018 is untouched out-of-sample. The position-sizing regression is also fit on pre-2018 trades only.",
              foot: "Result: the headline numbers come from a period no parameter ever saw.",
            },
          ].map((c, i) => (
            <div key={i} style={{ ...CARD, borderLeft: `2px solid ${c.color}`, padding: "18px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.color, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>{c.title}</div>
              <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, margin: "0 0 10px" }}>{c.body}</p>
              <p style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>{c.foot}</p>
            </div>
          ))}
        </div>

        <Callout tone="red" title="What still isn't modeled:">
          per-ticker IV surfaces (non-SPY tickers use beta-scaled VIX with SPY's skew), early assignment,
          intraday stop execution (stops fill at the close), and liquidity differences across the universe.
          These are the honest residual risks between this simulation and live trading.
        </Callout>
      </div>

      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, marginBottom: 20 }}>Universe coverage</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {[
            { cat: "Broad equity", n: 5, tickers: "SPY, QQQ, IWM, DIA, MDY", color: COLORS.accent },
            { cat: "Sectors", n: 17, tickers: "XLF, XLE, XLK, XLV, SMH...", color: COLORS.teal },
            { cat: "Commodities", n: 7, tickers: "GLD, SLV, USO, UNG, GDX...", color: COLORS.amber },
            { cat: "Fixed income", n: 9, tickers: "TLT, IEF, HYG, LQD, JNK...", color: COLORS.purple },
            { cat: "International", n: 13, tickers: "EEM, EFA, FXI, EWZ, EWJ...", color: COLORS.green },
          ].map((c, i) => (
            <div key={i} style={{ ...CARD, padding: 16, borderTop: `2px solid ${c.color}` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.color, fontFamily: MONO }}>{c.n}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, marginTop: 4 }}>{c.cat}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 6 }}>{c.tickers}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
