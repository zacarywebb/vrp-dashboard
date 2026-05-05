import { useState, useEffect, useRef } from "react";
import backtestStatic from "./data/backtest.json";
import screenerStatic from "./data/screener.json";

const COLORS = {
  bg: "#0a0a0f",
  surface: "#12121a",
  surfaceHover: "#1a1a25",
  border: "#1e1e2e",
  borderLight: "#2a2a3a",
  text: "#e8e6e3",
  textMuted: "#8a8a9a",
  textDim: "#5a5a6a",
  accent: "#6366f1",
  accentDim: "#4f46e5",
  green: "#10b981",
  greenDim: "#059669",
  red: "#ef4444",
  redDim: "#dc2626",
  amber: "#f59e0b",
  teal: "#14b8a6",
  purple: "#a78bfa",
};

const COLOR_KEY = { green: COLORS.green, red: COLORS.red, amber: COLORS.amber };

const NAV_ITEMS = ["Strategy", "Backtest", "Screener"];

// ─── Components ───────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: `2px solid ${COLORS.border}`,
        borderTopColor: COLORS.accent,
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: COLORS.surface, borderRadius: 10, padding: "16px 20px",
      border: `0.5px solid ${COLORS.border}`, minWidth: 0,
    }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: color || COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Pill({ children, active, color }) {
  const bg = active ? (color || COLORS.green) + "18" : "transparent";
  const fg = active ? (color || COLORS.green) : COLORS.textDim;
  const bdr = active ? (color || COLORS.green) + "40" : COLORS.border;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
      background: bg, color: fg, border: `0.5px solid ${bdr}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: fg }} />
      {children}
    </span>
  );
}

function MiniChart({ data, width = "100%", height = 200, color = COLORS.accent }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !data.length) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const vals = data.map(d => d.value);
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const pad = 8;
    const w = rect.width - pad * 2, h = rect.height - pad * 2;

    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad + (i / (data.length - 1)) * w;
      const y = pad + h - ((d.value - mn) / (mx - mn)) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.lineTo(pad + w, pad + h);
    ctx.lineTo(pad, pad + h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, rect.height);
    grad.addColorStop(0, color + "30");
    grad.addColorStop(1, color + "00");
    ctx.fillStyle = grad;
    ctx.fill();
  }, [data, color]);

  return <canvas ref={canvasRef} style={{ width, height, display: "block" }} />;
}

// ─── Pages ────────────────────────────────────────────────

function StrategyPage({ metrics }) {
  const [activeSignal, setActiveSignal] = useState(0);
  const signals = [
    {
      name: "VRP spread",
      icon: "σ",
      color: COLORS.accent,
      desc: "Implied volatility must exceed realized volatility by at least 1%, sustained over a 75-day rolling window. This ensures the premium is structural — not a one-day anomaly.",
      detail: "The variance risk premium exists because market participants consistently overpay for options to hedge portfolio risk. IV reflects what buyers are willing to pay; RV reflects what actually happens. The gap is your edge.",
    },
    {
      name: "IV percentile",
      icon: "%",
      color: COLORS.teal,
      desc: "Current IV must rank in the bottom half of its trailing 1-year distribution. Counterintuitively, low IV percentiles produce the best risk-adjusted returns for volatility sellers.",
      detail: "When nobody's panicking, hedging demand still keeps IV artificially rich relative to realized outcomes. High IV percentiles signal stress regimes where realized vol can spike and crush short positions.",
    },
    {
      name: "Term structure",
      icon: "∠",
      color: COLORS.amber,
      desc: "Each ticker's short-term realized vol must not significantly exceed its long-term realized vol. When the ratio drops below 0.98, near-term stress is elevated — stay out.",
      detail: "Computed per-ticker from 10-day vs 60-day Yang-Zhang realized volatility. For SPY, blended 50/50 with the actual VIX3M/VIX ratio from FRED. Every ETF gets its own independent reading.",
    },
  ];

  const fmt = (val, suffix = "%") => val != null ? `${val}${suffix}` : "—";

  return (
    <div>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: COLORS.accent, marginBottom: 12, fontWeight: 600 }}>Systematic options strategy</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: COLORS.text, lineHeight: 1.2, margin: 0, marginBottom: 12 }}>
          Variance risk premium<br />harvesting
        </h1>
        <p style={{ fontSize: 15, color: COLORS.textMuted, maxWidth: 560, lineHeight: 1.7, margin: 0 }}>
          A quantitative strategy that captures the persistent spread between implied and realized volatility through iron condor structures on 51 liquid ETFs. Three independent signals filter for favorable conditions; embedded risk management caps losses at 3× credit received.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 48 }}>
        <MetricCard label="Backtest CAGR" value={fmt(metrics?.cagr_pct)} color={COLORS.green} sub="Out-of-sample, 2018–2025" />
        <MetricCard label="Sharpe ratio" value={metrics?.sharpe ?? "—"} color={COLORS.accent} sub="Annualized" />
        <MetricCard label="Max drawdown" value={fmt(metrics?.max_drawdown_pct)} color={COLORS.amber} sub="vs -75% before risk mgmt" />
        <MetricCard label="Win rate" value={fmt(metrics?.win_rate_pct)} color={COLORS.teal} sub={metrics ? `${metrics.n_trades.toLocaleString()} trades` : "—"} />
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
                    background: s.color + "18", color: s.color, fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
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
        <div style={{ background: COLORS.surface, borderRadius: 12, border: `0.5px solid ${COLORS.border}`, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Iron condor</span>
            <span style={{ fontSize: 12, color: COLORS.textDim }}>25Δ short / 5Δ long · 30 DTE</span>
          </div>
          <svg viewBox="0 0 600 160" style={{ width: "100%", height: 160 }}>
            <line x1="30" y1="120" x2="570" y2="120" stroke={COLORS.border} strokeWidth="0.5" />
            <line x1="30" y1="80" x2="570" y2="80" stroke={COLORS.border} strokeWidth="0.5" strokeDasharray="4 4" />
            <path d={`M30,120 L120,120 L180,40 L300,40 L420,40 L480,120 L570,120`} fill="none" stroke={COLORS.green} strokeWidth="2" />
            <path d={`M30,120 L120,120 L180,40 L300,40 L420,40 L480,120 L570,120 L570,160 L30,160 Z`} fill={COLORS.green + "08"} />
            <path d="M30,140 L120,140 L180,148 L300,148 L420,148 L480,140 L570,140" fill="none" stroke={COLORS.red + "60"} strokeWidth="1" strokeDasharray="3 3" />
            {[
              { x: 120, label: "Long put", sub: "5Δ", color: COLORS.accent },
              { x: 220, label: "Short put", sub: "25Δ", color: COLORS.green },
              { x: 380, label: "Short call", sub: "25Δ", color: COLORS.green },
              { x: 480, label: "Long call", sub: "5Δ", color: COLORS.accent },
            ].map((s, i) => (
              <g key={i}>
                <circle cx={s.x} cy={s.x > 200 && s.x < 400 ? 40 : 120} r="4" fill={s.color} />
                <text x={s.x} y={16} textAnchor="middle" fontSize="10" fill={COLORS.textMuted} fontFamily="JetBrains Mono, monospace">{s.label}</text>
                <text x={s.x} y={28} textAnchor="middle" fontSize="9" fill={COLORS.textDim} fontFamily="JetBrains Mono, monospace">{s.sub}</text>
              </g>
            ))}
            <text x="300" y="56" textAnchor="middle" fontSize="10" fill={COLORS.green} fontFamily="JetBrains Mono, monospace">Max profit zone</text>
          </svg>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
            {[
              { label: "Stop-loss", val: "3× credit", desc: "Let spreads breathe" },
              { label: "Profit target", val: "30% of max", desc: "Small bites, less exposure" },
              { label: "Position cap", val: "8% capital", desc: "50% max margin deployed" },
            ].map((r, i) => (
              <div key={i} style={{ padding: "12px 16px", background: COLORS.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{r.val}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Simulation methodology</h2>
        <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
          Although the daily signal generator uses real-time options data, the backtest does not use real options market data (I'm too broke for that right now). Understanding what the model simulates — and what it doesn't — is essential for interpreting the results honestly.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, borderLeft: `2px solid ${COLORS.accent}`, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>How options are priced</div>
            <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, margin: "0 0 10px" }}>
              Strikes and premiums are computed from Black-Scholes using each day's closing price and an <em>estimated</em> implied volatility — not actual options chain quotes. For SPY, IV comes directly from the VIX. For EEM, GLD, and USO, their CBOE vol indices are used. For all other tickers, IV is approximated by scaling the VIX by each ETF's rolling realized-vol ratio vs SPY.
            </p>
            <p style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>
              This proxy is smooth by construction — it never sees the sudden, discontinuous IV spikes that real options markets produce. The practical effect is that the signals look cleaner than they would with true per-ticker IV surfaces.
            </p>
          </div>

          <div style={{ background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, borderLeft: `2px solid ${COLORS.teal}`, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.teal, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>How P&L is estimated</div>
            <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, margin: "0 0 10px" }}>
              There is no daily option repricing. Instead, the simulation uses a sqrt-of-time theta model: as time elapses, the position is marked as having earned a fraction of its theoretical credit proportional to <code style={{ color: COLORS.accent, fontSize: 12 }}>√(days_held / 30)</code>. Profit target fires when this exceeds 30% of the original credit.
            </p>
            <p style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>
              In live trading, closing an iron condor requires buying back all four legs at market prices. A market maker will not let you exit at theoretical mid — you pay the spread on every leg. This cost isn't captured here.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, borderLeft: `2px solid ${COLORS.amber}`, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.amber, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Why the win rate is high</div>
            <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, margin: "0 0 10px" }}>
              Iron condors with 25Δ short strikes and a 30% profit target are structurally high-win-rate trades — even in live markets, 70–85% is achievable. The elevated 97.7% here reflects two simulation effects: the smooth IV proxy rarely produces sudden repricing shocks, and the sqrt-theta model lets profit targets fire within 7–14 days before anything adverse can happen.
            </p>
            <p style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>
              Realistic live win rate with real options data: <span style={{ color: COLORS.amber }}>85–92%</span>.
            </p>
          </div>

          <div style={{ background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, borderLeft: `2px solid ${COLORS.purple}`, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.purple, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Why the Sharpe is elevated</div>
            <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, margin: "0 0 10px" }}>
              Sharpe is computed from daily changes in total capital. Most days no position opens or closes — theta just decays quietly, and daily capital barely moves. The daily return distribution has near-zero variance punctuated by small positive spikes (profit targets). That structure produces a deceptively high Sharpe. A proper calculation would mark every open position to market daily.
            </p>
            <p style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>
              Realistic live Sharpe with daily MTM: <span style={{ color: COLORS.purple }}>1.5–2.5</span>.
            </p>
          </div>

          <div style={{ background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, borderLeft: `2px solid ${COLORS.red}`, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.red, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>What live trading changes</div>
            <p style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.7, margin: "0 0 10px" }}>
              Real execution adds friction on all four legs simultaneously — bid/ask spread alone can consume 20–40% of the theoretical credit on large positions. IV surfaces behave differently from the smooth beta-VIX proxy. And closing early at a profit requires crossing the spread, not transacting at Black-Scholes mid.
            </p>
            <p style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>
              Realistic live CAGR range: <span style={{ color: COLORS.red }}>20%-40%</span>. Still a meaningful edge — the VRP is structural — but not necessarily the simulated figures.
            </p>
          </div>
        </div>

        <div style={{
          background: COLORS.amber + "08", borderRadius: 10,
          border: `0.5px solid ${COLORS.amber}30`, padding: "14px 18px",
          display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ color: COLORS.amber, fontSize: 16, lineHeight: 1 }}>⚠</span>
          <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.7, margin: 0 }}>
            <span style={{ color: COLORS.amber, fontWeight: 600 }}>Backtest results are hypothetical.</span>{" "}
            All figures were generated by a simulation using estimated IV and theoretical Black-Scholes pricing. They do not represent actual trades, real options market fills, or verified performance. Past simulated results are not indicative of future live trading outcomes.
          </p>
        </div>
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
            <div key={i} style={{ padding: "16px", background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, borderTop: `2px solid ${c.color}` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.color, fontFamily: "'JetBrains Mono', monospace" }}>{c.n}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, marginTop: 4 }}>{c.cat}</div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 6 }}>{c.tickers}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BacktestPage({ data, loading }) {
  const [showAll, setShowAll] = useState(false);

  if (loading) return <Spinner />;

  const equity = data?.equity ?? [];
  const trades = data?.trades ?? [];
  const metrics = data?.metrics;
  const exitBreakdown = data?.exit_breakdown ?? [];
  const displayed = showAll ? trades : trades.slice(0, 6);

  const startDate = equity[0]?.date?.slice(0, 4) ?? "2018";
  const endDate = equity[equity.length - 1]?.date?.slice(0, 4) ?? "2025";

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: COLORS.text, margin: "0 0 8px" }}>Backtest results</h2>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
          Out-of-sample period: Jan {startDate} — Dec {endDate} · Trained on 2007–2017 · 51 ETFs
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 32 }}>
        <MetricCard label="Total return" value={metrics ? `${metrics.total_return_pct.toLocaleString()}%` : "—"} color={COLORS.green} />
        <MetricCard label="CAGR" value={metrics ? `${metrics.cagr_pct}%` : "—"} color={COLORS.green} />
        <MetricCard label="Sharpe" value={metrics?.sharpe ?? "—"} color={COLORS.accent} />
        <MetricCard label="Max DD" value={metrics ? `${metrics.max_drawdown_pct}%` : "—"} color={COLORS.amber} />
        <MetricCard label="Win rate" value={metrics ? `${metrics.win_rate_pct}%` : "—"} color={COLORS.teal} />
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, margin: 0 }}>Statistical robustness</h3>
          <span style={{ fontSize: 11, color: COLORS.textDim }}>Bailey & López de Prado (2014) — PSR / DSR framework</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, borderTop: `2px solid ${COLORS.accent}`, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Non-normality correction</div>
            <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent }}>1.68×</div>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4, lineHeight: 1.5 }}>CI widened by fat tails (κ=64.2) and left skew (γ₃=−1.94). Effective z-score: 7.30 vs naive 12.28.</div>
          </div>
          <div style={{ background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, borderTop: `2px solid ${COLORS.green}`, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>PSR — true SR &gt; 2.0</div>
            <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: COLORS.green }}>99.998%</div>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4, lineHeight: 1.5 }}>Probability the strategy's true Sharpe exceeds 2.0, after adjusting for non-normal returns.</div>
          </div>
          <div style={{ background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, borderTop: `2px solid ${COLORS.amber}`, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Deflated Sharpe Ratio</div>
            <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: COLORS.amber }}>69.2%</div>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4, lineHeight: 1.5 }}>Probability selected params (SR 4.51) beat what random search across 1,500 combinations finds by chance (expected max: 4.20).</div>
          </div>
          <div style={{ background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, borderTop: `2px solid ${COLORS.red}`, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Min. track record for 95% DSR</div>
            <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: COLORS.red }}>79.6 yr</div>
            <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4, lineHeight: 1.5 }}>Current: 7.4 yr. Statistical validation of the selected parameter set requires data that doesn't exist.</div>
          </div>
        </div>

        <div style={{ background: COLORS.surface, borderRadius: 10, border: `0.5px solid ${COLORS.border}`, padding: "18px 20px", fontSize: 13, color: COLORS.textMuted, lineHeight: 1.75 }}>
          <span style={{ color: COLORS.text, fontWeight: 500 }}>What this means: </span>
          The PSR analysis gives near-certain confidence that the strategy has {" "}
          <span style={{ color: COLORS.green }}>real, positive edge</span> — the VRP is structurally persistent, and the evidence for it survives even aggressive non-normality corrections. But the{" "}
          <span style={{ color: COLORS.amber }}>DSR of 69.2%</span> exposes a harder problem: the reported Sharpe of 4.51 barely exceeds the expected maximum SR that random selection from 1,500 parameter combinations would produce (4.20). The gap is{" "}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent }}>0.31 SR units</span>, and validating a difference that small with enough confidence requires roughly{" "}
          <span style={{ color: COLORS.red }}>80 years of data</span>. Conclusion: the sign of the edge is robust; the specific magnitude is not.
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Equity curve</h3>
        <div style={{ background: COLORS.surface, borderRadius: 12, border: `0.5px solid ${COLORS.border}`, padding: "20px 20px 12px" }}>
          {equity.length > 0 ? (
            <>
              <MiniChart data={equity} height={240} color={COLORS.green} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textDim, marginTop: 8 }}>
                <span>{equity[0]?.date}</span>
                <span>{equity[Math.floor(equity.length * 0.33)]?.date}</span>
                <span>{equity[Math.floor(equity.length * 0.66)]?.date}</span>
                <span>{equity[equity.length - 1]?.date}</span>
              </div>
            </>
          ) : (
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textDim, fontSize: 13 }}>
              No equity data — run backtest.py first
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        <div style={{ background: COLORS.surface, borderRadius: 12, border: `0.5px solid ${COLORS.border}`, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 16px" }}>Exit breakdown</h3>
          {exitBreakdown.map((e, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: COLORS.text }}>{e.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: COLOR_KEY[e.color] ?? COLORS.text }}>
                  {e.count} <span style={{ color: COLORS.textDim }}>({e.pct}%)</span>
                </span>
              </div>
              <div style={{ height: 3, background: COLORS.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${e.pct}%`, background: COLOR_KEY[e.color] ?? COLORS.accent, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: COLORS.surface, borderRadius: 12, border: `0.5px solid ${COLORS.border}`, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 16px" }}>Position sizing model</h3>
          <div style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace", lineHeight: 2 }}>
            <div>E[return] = <span style={{ color: COLORS.accent }}>β₀</span> + <span style={{ color: COLORS.green }}>β₁</span>·VRP + <span style={{ color: COLORS.teal }}>β₂</span>·IVPct + <span style={{ color: COLORS.amber }}>β₃</span>·TS</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ color: COLORS.accent }}>β₀ = -0.157</span>{"  "}
              <span style={{ color: COLORS.green }}>β₁ = 0.237</span>
            </div>
            <div>
              <span style={{ color: COLORS.teal }}>β₂ = 0.000</span>{"  "}
              <span style={{ color: COLORS.amber }}>β₃ = 0.240</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 12 }}>
            Trained on {metrics ? `${Math.round(metrics.n_trades * 0.76).toLocaleString()}` : "—"} samples via OLS regression. Higher predicted returns → larger position allocation.
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Trade log</h3>
        <div style={{ background: COLORS.surface, borderRadius: 12, border: `0.5px solid ${COLORS.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                {["Ticker", "Entry", "Exit", "Strikes", "Credit", "P&L", "Exit reason"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((t, i) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{t.ticker}</td>
                  <td style={{ padding: "10px 14px", color: COLORS.textMuted }}>{t.entry}</td>
                  <td style={{ padding: "10px 14px", color: COLORS.textMuted }}>{t.exit}</td>
                  <td style={{ padding: "10px 14px", color: COLORS.textDim, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{t.strikes}</td>
                  <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>${t.credit.toFixed(2)}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: t.pnl >= 0 ? COLORS.green : COLORS.red }}>
                    {t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Pill active={t.reason === "profit_target"} color={t.reason === "profit_target" ? COLORS.green : t.reason === "stop_loss" ? COLORS.red : COLORS.amber}>
                      {t.reason.replace(/_/g, " ")}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {trades.length > 6 && (
            <div style={{ padding: 12, textAlign: "center" }}>
              <button onClick={() => setShowAll(!showAll)} style={{
                background: "transparent", border: `0.5px solid ${COLORS.border}`, borderRadius: 8,
                color: COLORS.textMuted, padding: "6px 16px", fontSize: 12, cursor: "pointer",
              }}>
                {showAll ? "Show less" : `Show all ${trades.length.toLocaleString()} trades`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScreenerPage({ data, loading, onRefresh, refreshing }) {
  const [sortBy, setSortBy] = useState("score");
  const rows = data?.results ?? [];
  const asOf = data?.as_of;

  const sorted = [...rows].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    if (sortBy === "vrp") return b.vrp - a.vrp;
    if (sortBy === "ivPct") return a.ivPct - b.ivPct;
    if (sortBy === "ts") return b.ts - a.ts;
    return 0;
  });

  const passes = sorted.filter(r => r.score === 3);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: COLORS.text, margin: "0 0 8px" }}>Daily screener</h2>
          <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
            Scanning {rows.length || 51} ETFs{asOf ? ` · As of ${asOf} (scans after market close each market day)` : ""}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onRefresh} disabled={refreshing} style={{
            background: "transparent", border: `0.5px solid ${COLORS.border}`, borderRadius: 6,
            padding: "5px 12px", fontSize: 11, cursor: refreshing ? "default" : "pointer",
            color: refreshing ? COLORS.textDim : COLORS.textMuted,
          }}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <span style={{ fontSize: 12, color: COLORS.textDim }}>Sort by</span>
          {["score", "vrp", "ivPct", "ts"].map(s => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              background: sortBy === s ? COLORS.accent + "20" : "transparent",
              border: `0.5px solid ${sortBy === s ? COLORS.accent + "60" : COLORS.border}`,
              borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer",
              color: sortBy === s ? COLORS.accent : COLORS.textMuted,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {s === "ivPct" ? "IV %" : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div style={{
            background: COLORS.surface, borderRadius: 12, border: `0.5px solid ${COLORS.border}`,
            padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: passes.length > 0 ? COLORS.green : COLORS.amber }} />
            {passes.length > 0 ? (
              <>
                <span style={{ fontSize: 13, color: COLORS.text }}>{passes.length} ticker{passes.length > 1 ? "s" : ""} pass all 3 filters.</span>
                <span style={{ fontSize: 12, color: COLORS.textDim }}>{passes.map(r => r.ticker).join(", ")}</span>
              </>
            ) : rows.length === 0 ? (
              <span style={{ fontSize: 13, color: COLORS.text }}>No screener data. Click Refresh to run a live scan.</span>
            ) : (
              <>
                <span style={{ fontSize: 13, color: COLORS.text }}>No tickers currently pass all 3 filters.</span>
                <span style={{ fontSize: 12, color: COLORS.textDim }}>Elevated IV percentiles across the board — strategy says stay out.</span>
              </>
            )}
          </div>

          {sorted.length > 0 && (
            <div style={{ background: COLORS.surface, borderRadius: 12, border: `0.5px solid ${COLORS.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                    {["Ticker", "Price", "Score", "VRP", "IV pct", "Term str", "Signals"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `0.5px solid ${COLORS.border}`, background: r.score >= 2 ? COLORS.accent + "06" : "transparent" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{r.ticker}</td>
                      <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>${r.close.toFixed(2)}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 24, height: 24, borderRadius: 6, fontSize: 13, fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: r.score >= 3 ? COLORS.green + "20" : r.score >= 2 ? COLORS.accent + "20" : COLORS.border,
                          color: r.score >= 3 ? COLORS.green : r.score >= 2 ? COLORS.accent : COLORS.textDim,
                        }}>{r.score}</span>
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", color: r.vrpP ? COLORS.green : COLORS.red }}>{r.vrp.toFixed(3)}</td>
                      <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", color: r.ivP ? COLORS.green : COLORS.red }}>{r.ivPct}%</td>
                      <td style={{ padding: "10px 14px", fontFamily: "'JetBrains Mono', monospace", color: r.tsP ? COLORS.green : COLORS.red }}>{r.ts.toFixed(3)}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Pill active={r.vrpP} color={COLORS.green}>VRP</Pill>
                          <Pill active={r.ivP} color={COLORS.teal}>IV%</Pill>
                          <Pill active={r.tsP} color={COLORS.amber}>TS</Pill>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState(0);
  const [backtestData, setBacktestData] = useState(null);
  const [screenerData, setScreenerData] = useState(null);
  const [backtestLoading, setBacktestLoading] = useState(true);
  const [screenerLoading, setScreenerLoading] = useState(true);
  const [screenerRefreshing, setScreenerRefreshing] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch("/api/backtest")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setBacktestData(data); setIsLive(true); setBacktestLoading(false); })
      .catch(() => { setBacktestData(backtestStatic); setBacktestLoading(false); });
  }, []);

  useEffect(() => {
    fetch("/api/screener")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setScreenerData(data); setScreenerLoading(false); })
      .catch(() => { setScreenerData(screenerStatic); setScreenerLoading(false); });
  }, []);

  const handleScreenerRefresh = () => {
    setScreenerRefreshing(true);
    fetch("/api/screener/refresh", { method: "POST" })
      .then(() => {
        // poll until cache is updated (up to 5 min)
        const poll = setInterval(() => {
          fetch("/api/screener")
            .then(r => r.json())
            .then(data => {
              if (data.as_of) {
                setScreenerData(data);
                setScreenerRefreshing(false);
                clearInterval(poll);
              }
            })
            .catch(() => { setScreenerRefreshing(false); clearInterval(poll); });
        }, 5000);
        setTimeout(() => { clearInterval(poll); setScreenerRefreshing(false); }, 300000);
      })
      .catch(() => setScreenerRefreshing(false));
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", color: COLORS.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 56, borderBottom: `0.5px solid ${COLORS.border}`,
        position: "sticky", top: 0, background: COLORS.bg + "e0", backdropFilter: "blur(12px)", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -0.5 }}>
            <span style={{ color: COLORS.accent }}>VRP</span>strategy
          </span>
          <div style={{ display: "flex", gap: 0 }}>
            {NAV_ITEMS.map((item, i) => (
              <button key={item} onClick={() => setPage(i)} style={{
                background: page === i ? COLORS.surfaceHover : "transparent",
                border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer",
                color: page === i ? COLORS.text : COLORS.textMuted, fontWeight: page === i ? 500 : 400,
                transition: "all 0.15s",
              }}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: backtestLoading ? COLORS.amber : isLive ? COLORS.green : COLORS.textDim }} />
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>
            {backtestLoading ? "Connecting…" : isLive ? "Live data" : "Demo — snapshot data"}
          </span>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
        {page === 0 && <StrategyPage metrics={backtestData?.metrics} />}
        {page === 1 && <BacktestPage data={backtestData} loading={backtestLoading} />}
        {page === 2 && (
          <ScreenerPage
            data={screenerData}
            loading={screenerLoading}
            onRefresh={handleScreenerRefresh}
            refreshing={screenerRefreshing}
            isLive={isLive}
          />
        )}
      </main>
    </div>
  );
}
