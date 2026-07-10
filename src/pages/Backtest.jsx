import { useMemo, useState } from "react";
import { COLORS, MONO, CARD, fmtPct } from "../theme";
import { MetricCard, Pill, Section, StatCard, Spinner, TH, TD } from "../components/ui";
import { EquityChart, MonthlyHeatmap, YearlyBars } from "../components/charts";

const REASON_COLORS = {
  profit_target: COLORS.green,
  stop_loss: COLORS.red,
  time_exit: COLORS.amber,
  expiry: COLORS.purple,
};

function TradeExplorer({ trades }) {
  const [reason, setReason] = useState("all");
  const [ticker, setTicker] = useState("all");
  const [sortBy, setSortBy] = useState("exit");
  const [page, setPage] = useState(0);
  const PER_PAGE = 15;

  const tickers = useMemo(() => ["all", ...new Set(trades.map((t) => t.ticker))].sort(), [trades]);
  const reasons = ["all", ...new Set(trades.map((t) => t.reason))];

  const filtered = useMemo(() => {
    let rows = trades;
    if (reason !== "all") rows = rows.filter((t) => t.reason === reason);
    if (ticker !== "all") rows = rows.filter((t) => t.ticker === ticker);
    rows = [...rows];
    if (sortBy === "pnl") rows.sort((a, b) => b.pnl - a.pnl);
    else if (sortBy === "pnl_asc") rows.sort((a, b) => a.pnl - b.pnl);
    else rows.sort((a, b) => (a.exit < b.exit ? 1 : -1));
    return rows;
  }, [trades, reason, ticker, sortBy]);

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const shown = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const sel = {
    background: COLORS.surface, color: COLORS.textMuted, border: `0.5px solid ${COLORS.border}`,
    borderRadius: 6, padding: "4px 8px", fontSize: 12, fontFamily: MONO,
  };

  return (
    <div style={{ ...CARD, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 8, padding: "12px 14px", borderBottom: `0.5px solid ${COLORS.border}`, alignItems: "center" }}>
        <select value={ticker} onChange={(e) => { setTicker(e.target.value); setPage(0); }} style={sel}>
          {tickers.map((t) => <option key={t} value={t}>{t === "all" ? "All tickers" : t}</option>)}
        </select>
        <select value={reason} onChange={(e) => { setReason(e.target.value); setPage(0); }} style={sel}>
          {reasons.map((r) => <option key={r} value={r}>{r === "all" ? "All exits" : r.replace(/_/g, " ")}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={sel}>
          <option value="exit">Newest first</option>
          <option value="pnl">Biggest winners</option>
          <option value="pnl_asc">Biggest losers</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: 12, color: COLORS.textDim, fontFamily: MONO }}>
          {filtered.length.toLocaleString()} trades
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
            {["Ticker", "Entry", "Exit", "Days", "Strikes", "Credit", "Qty", "P&L", "P&L %", "Exit reason"].map((h) => <TH key={h}>{h}</TH>)}
          </tr>
        </thead>
        <tbody>
          {shown.map((t, i) => (
            <tr key={i} style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
              <TD mono color={COLORS.text} style={{ fontWeight: 600 }}>{t.ticker}</TD>
              <TD>{t.entry}</TD>
              <TD>{t.exit}</TD>
              <TD mono>{t.days}</TD>
              <TD mono style={{ fontSize: 11, color: COLORS.textDim }}>{t.strikes}</TD>
              <TD mono>${t.credit.toFixed(2)}</TD>
              <TD mono>{t.contracts}</TD>
              <TD mono color={t.pnl >= 0 ? COLORS.green : COLORS.red} style={{ fontWeight: 600 }}>
                {t.pnl >= 0 ? "+" : ""}{t.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </TD>
              <TD mono color={t.pnl_pct >= 0 ? COLORS.green : COLORS.red}>{t.pnl_pct >= 0 ? "+" : ""}{t.pnl_pct}%</TD>
              <TD><Pill active color={REASON_COLORS[t.reason]}>{t.reason.replace(/_/g, " ")}</Pill></TD>
            </tr>
          ))}
        </tbody>
      </table>
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 12, alignItems: "center" }}>
          <button disabled={page === 0} onClick={() => setPage(page - 1)} style={{ ...sel, cursor: page ? "pointer" : "default" }}>←</button>
          <span style={{ fontSize: 12, color: COLORS.textDim, fontFamily: MONO }}>{page + 1} / {pages}</span>
          <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)} style={{ ...sel, cursor: page < pages - 1 ? "pointer" : "default" }}>→</button>
        </div>
      )}
    </div>
  );
}

export default function BacktestPage({ data, dsr, loading }) {
  if (loading) return <Spinner />;
  const m = data?.metrics;
  const bench = data?.benchmark;
  const equity = data?.equity ?? [];
  const trades = data?.trades ?? [];
  const startYear = equity[0]?.date?.slice(0, 4) ?? "2018";
  const endYear = equity[equity.length - 1]?.date?.slice(0, 4) ?? "2025";

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: COLORS.text, margin: "0 0 8px" }}>Backtest results</h2>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
          Out-of-sample {startYear}–{endYear} · parameters selected on pre-2018 data only · daily
          mark-to-market · all execution costs charged
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 12 }}>
        <MetricCard label="Total return" value={fmtPct(m?.total_return_pct, 0)} color={COLORS.green}
                    sub={bench ? `SPY: ${fmtPct(bench.total_return_pct, 0)}` : ""} />
        <MetricCard label="CAGR" value={fmtPct(m?.cagr_pct)} color={COLORS.green}
                    sub={bench ? `SPY: ${fmtPct(bench.cagr_pct)}` : ""} />
        <MetricCard label="Sharpe" value={m?.sharpe} color={COLORS.accent}
                    sub={bench ? `SPY: ${bench.sharpe} · vol ${fmtPct(m?.vol_pct)}` : ""} />
        <MetricCard label="Max drawdown" value={fmtPct(m?.max_drawdown_pct)} color={COLORS.amber}
                    sub={bench ? `SPY: ${fmtPct(bench.max_drawdown_pct)}` : ""} />
        <MetricCard label="Win rate" value={fmtPct(m?.win_rate_pct)} color={COLORS.teal}
                    sub={m ? `PF ${m.profit_factor} · ${m.n_trades.toLocaleString()} trades` : ""} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          ["Sortino", m?.sortino], ["Calmar", m?.calmar],
          ["Avg win", m ? `$${m.avg_win.toLocaleString()}` : "—"],
          ["Avg loss", m ? `$${m.avg_loss.toLocaleString()}` : "—"],
          ["Avg days held", m?.avg_days_held],
        ].map(([l, v], i) => (
          <div key={i} style={{ ...CARD, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>{l}</span>
            <span style={{ fontSize: 15, fontWeight: 600, fontFamily: MONO, color: COLORS.text }}>{v ?? "—"}</span>
          </div>
        ))}
      </div>

      <Section title="Equity curve" sub="with drawdown — hover for daily detail">
        <div style={{ ...CARD, borderRadius: 12, padding: "16px 16px 8px" }}>
          {equity.length ? <EquityChart equity={equity} /> :
            <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textDim, fontSize: 13 }}>
              No equity data — run backtest.py then export_data.py
            </div>}
        </div>
      </Section>

      <Section title="Monthly returns" sub="% change in account equity, month over month">
        <div style={{ ...CARD, borderRadius: 12, padding: 16 }}>
          <MonthlyHeatmap monthly={data?.monthly ?? []} />
        </div>
      </Section>

      <Section title="Yearly returns vs SPY">
        <div style={{ ...CARD, borderRadius: 12, padding: 16 }}>
          <YearlyBars yearly={data?.yearly ?? []} />
        </div>
      </Section>

      {dsr?.test && (
        <Section title="Statistical robustness" sub="Bailey & López de Prado (2014) — PSR / DSR framework">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
            <StatCard color={COLORS.accent} label="Non-normality correction"
                      value={`${dsr.test.nonnormality_correction}×`}
                      note={`Short-vol returns: skew ${dsr.test.skew}, kurtosis ${dsr.test.kurtosis}. The SR confidence interval is widened accordingly.`} />
            <StatCard color={COLORS.green} label="P(true Sharpe > 0)"
                      value={`${(dsr.test.psr_vs_0 * 100).toFixed(1)}%`}
                      note={`Out-of-sample PSR on ${dsr.test.years} years. Selection-free — no parameter was chosen using this period.`} />
            <StatCard color={COLORS.teal} label="P(true Sharpe > 0.5)"
                      value={`${(dsr.test["psr_vs_0.5"] * 100).toFixed(1)}%`}
                      note="Probability the strategy genuinely beats a 0.5 Sharpe hurdle after fat-tail correction." />
            <StatCard color={COLORS.amber} label="DSR on parameter selection"
                      value={`${(dsr.selection.dsr * 100).toFixed(1)}%`}
                      note={`Best of ${dsr.selection.n_trials} train-only trials vs E[max]=${dsr.selection.expected_max_sharpe_null} under the null.`} />
          </div>
          <div style={{ ...CARD, padding: "18px 20px", fontSize: 13, color: COLORS.textMuted, lineHeight: 1.75 }}>
            <span style={{ color: COLORS.text, fontWeight: 500 }}>Read this honestly: </span>
            the out-of-sample evidence says the edge is <span style={{ color: COLORS.green }}>probably real</span>{" "}
            (~{(dsr.test.psr_vs_0 * 100).toFixed(0)}% probability the true Sharpe is positive) but{" "}
            <span style={{ color: COLORS.amber }}>not yet proven</span> — reaching 95% confidence needs
            ~{dsr.test.min_years_for_95pct_vs_0} years of track record and this test period provides {dsr.test.years}.
            The train-selection DSR of {(dsr.selection.dsr * 100).toFixed(0)}% is deliberately conservative (the trial
            spread mixes structural variants, inflating the luck benchmark), but its message stands: parameter selection
            adds uncertainty even at {dsr.selection.n_trials} trials. The previous version of this project swept{" "}
            <span style={{ fontFamily: MONO, color: COLORS.red }}>1,500</span> combinations over the full sample and
            reported the winner as a 4.51 Sharpe; this framework exists so that can't happen again. Thin, honestly
            measured edge beats impressive artifacts.
          </div>
        </Section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 12, marginBottom: 40 }}>
        <div style={{ ...CARD, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 16px" }}>Exit breakdown</h3>
          {(data?.exit_breakdown ?? []).map((e, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: COLORS.text }}>{e.label}</span>
                <span style={{ fontFamily: MONO, color: REASON_COLORS[e.reason] ?? COLORS.text }}>
                  {e.count} <span style={{ color: COLORS.textDim }}>({e.pct}%) · avg ${e.avg_pnl.toLocaleString()}</span>
                </span>
              </div>
              <div style={{ height: 3, background: COLORS.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${e.pct}%`, background: REASON_COLORS[e.reason] ?? COLORS.accent, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...CARD, borderRadius: 12, padding: 20, overflow: "auto", maxHeight: 320 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 12px" }}>P&L by ticker</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                {["Ticker", "Trades", "P&L", "Win %", "Avg days"].map((h) => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {(data?.per_ticker ?? []).map((t, i) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                  <TD mono color={COLORS.text} style={{ fontWeight: 600, padding: "6px 14px" }}>{t.ticker}</TD>
                  <TD mono style={{ padding: "6px 14px" }}>{t.trades}</TD>
                  <TD mono color={t.pnl >= 0 ? COLORS.green : COLORS.red} style={{ padding: "6px 14px" }}>
                    {t.pnl >= 0 ? "+" : ""}{t.pnl.toLocaleString()}
                  </TD>
                  <TD mono style={{ padding: "6px 14px" }}>{t.win_rate}%</TD>
                  <TD mono style={{ padding: "6px 14px" }}>{t.avg_days}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Section title="Trade explorer">
        <TradeExplorer trades={trades} />
      </Section>
    </div>
  );
}
