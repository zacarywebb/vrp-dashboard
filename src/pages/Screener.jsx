import { useState } from "react";
import { COLORS, MONO, CARD } from "../theme";
import { Pill, Spinner, TH, TD } from "../components/ui";

function PaperTrack({ paper }) {
  if (!paper?.equity?.length) return null;
  const eq = paper.equity;
  const start = 100000;
  const cur = eq[eq.length - 1].value;
  const ret = ((cur / start) - 1) * 100;
  const closed = paper.closed ?? [];
  const wins = closed.filter((t) => t.pnl > 0).length;
  const days = eq.length;

  return (
    <div style={{ ...CARD, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: 0 }}>Forward paper track</h3>
        <span style={{ fontSize: 11, color: COLORS.textDim }}>
          live signals traded on a simulated $100K account since {paper.started} — the strategy's real out-of-sample test, built one day at a time
        </span>
      </div>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        {[
          ["Equity", `$${cur.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, ret >= 0 ? COLORS.green : COLORS.red],
          ["Return", `${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%`, ret >= 0 ? COLORS.green : COLORS.red],
          ["Open positions", paper.open?.length ?? 0, COLORS.text],
          ["Closed trades", closed.length ? `${closed.length} (${wins} wins)` : "0", COLORS.text],
          ["Trading days", days, COLORS.textMuted],
        ].map(([l, v, c], i) => (
          <div key={i}>
            <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
            <div style={{ fontSize: 17, fontWeight: 600, fontFamily: MONO, color: c }}>{v}</div>
          </div>
        ))}
      </div>
      {paper.open?.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: COLORS.textMuted, fontFamily: MONO }}>
          {paper.open.map((p) => (
            <span key={p.ticker} style={{ marginRight: 16 }}>
              {p.ticker} {p.A.toFixed(0)}/{p.B.toFixed(0)}/{p.C.toFixed(0)}/{p.D.toFixed(0)} ×{p.contracts}
              <span style={{ color: COLORS.textDim }}> exp {p.expiry}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScreenerPage({ data, paper, loading, onRefresh, refreshing }) {
  const [sortBy, setSortBy] = useState("score");
  const [expanded, setExpanded] = useState(null);
  const rows = data?.results ?? [];
  const asOf = data?.as_of;

  const sorted = [...rows].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    if (sortBy === "vrp") return b.vrp - a.vrp;
    if (sortBy === "ivPct") return a.ivPct - b.ivPct;
    if (sortBy === "ts") return b.ts - a.ts;
    return 0;
  });

  const passes = sorted.filter((r) => r.score === 3);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: COLORS.text, margin: "0 0 8px" }}>Daily screener</h2>
          <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
            Scanning {rows.length || 51} ETFs{asOf ? ` · as of ${asOf} (updates after each market close)` : ""}
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
          {["score", "vrp", "ivPct", "ts"].map((s) => (
            <button key={s} onClick={() => setSortBy(s)} style={{
              background: sortBy === s ? COLORS.accent + "20" : "transparent",
              border: `0.5px solid ${sortBy === s ? COLORS.accent + "60" : COLORS.border}`,
              borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer",
              color: sortBy === s ? COLORS.accent : COLORS.textMuted, fontFamily: MONO,
            }}>
              {s === "ivPct" ? "IV %" : s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          <PaperTrack paper={paper} />
          <div style={{ ...CARD, borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: passes.length > 0 ? COLORS.green : COLORS.amber }} />
            {passes.length > 0 ? (
              <>
                <span style={{ fontSize: 13, color: COLORS.text }}>{passes.length} ticker{passes.length > 1 ? "s" : ""} pass all 3 filters.</span>
                <span style={{ fontSize: 12, color: COLORS.textDim }}>
                  {passes.map((r) => r.ticker).join(", ")} — click a row for the suggested condor.
                </span>
              </>
            ) : rows.length === 0 ? (
              <span style={{ fontSize: 13, color: COLORS.text }}>No screener data. Click Refresh to run a live scan.</span>
            ) : (
              <>
                <span style={{ fontSize: 13, color: COLORS.text }}>No tickers currently pass all 3 filters.</span>
                <span style={{ fontSize: 12, color: COLORS.textDim }}>The strategy stays in cash when conditions are unfavorable.</span>
              </>
            )}
          </div>

          {sorted.length > 0 && (
            <div style={{ ...CARD, borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                    {["Ticker", "Price", "Score", "VRP", "IV pct", "Term str", "Signals"].map((h) => <TH key={h}>{h}</TH>)}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => (
                    <>
                      <tr key={r.ticker}
                          onClick={() => r.condor && setExpanded(expanded === r.ticker ? null : r.ticker)}
                          style={{
                            borderBottom: `0.5px solid ${COLORS.border}`,
                            background: r.score >= 3 ? COLORS.green + "06" : r.score >= 2 ? COLORS.accent + "06" : "transparent",
                            cursor: r.condor ? "pointer" : "default",
                          }}>
                        <TD mono color={COLORS.text} style={{ fontWeight: 600 }}>
                          {r.ticker}
                          {r.ivSrc === "real" && (
                            <span title="IV from real option chains (DoltHub)" style={{
                              marginLeft: 6, fontSize: 9, padding: "1px 5px", borderRadius: 4,
                              background: COLORS.teal + "20", color: COLORS.teal, fontWeight: 600,
                            }}>IV✓</span>
                          )}
                          {r.condor ? <span style={{ color: COLORS.textDim, marginLeft: 6 }}>{expanded === r.ticker ? "▾" : "▸"}</span> : ""}
                        </TD>
                        <TD mono>${r.close.toFixed(2)}</TD>
                        <TD>
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 24, height: 24, borderRadius: 6, fontSize: 13, fontWeight: 700, fontFamily: MONO,
                            background: r.score >= 3 ? COLORS.green + "20" : r.score >= 2 ? COLORS.accent + "20" : COLORS.border,
                            color: r.score >= 3 ? COLORS.green : r.score >= 2 ? COLORS.accent : COLORS.textDim,
                          }}>{r.score}</span>
                        </TD>
                        <TD mono color={r.vrpP ? COLORS.green : COLORS.red}>{r.vrp.toFixed(3)}</TD>
                        <TD mono color={r.ivP ? COLORS.green : COLORS.red}>{r.ivPct}%</TD>
                        <TD mono color={r.tsP ? COLORS.green : COLORS.red}>{r.ts.toFixed(3)}</TD>
                        <TD>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Pill active={r.vrpP} color={COLORS.green}>VRP</Pill>
                            <Pill active={r.ivP} color={COLORS.teal}>IV%</Pill>
                            <Pill active={r.tsP} color={COLORS.amber}>TS</Pill>
                          </div>
                        </TD>
                      </tr>
                      {expanded === r.ticker && r.condor && (
                        <tr key={r.ticker + "-detail"} style={{ borderBottom: `0.5px solid ${COLORS.border}`, background: COLORS.bg }}>
                          <td colSpan={7} style={{ padding: "14px 18px" }}>
                            <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, color: COLORS.textMuted }}>Suggested 30-DTE condor</span>
                              <span style={{ fontFamily: MONO, fontSize: 13, color: COLORS.text }}>
                                <span style={{ color: COLORS.accent }}>+P {r.condor.A.toFixed(0)}</span>{"  "}
                                <span style={{ color: COLORS.green }}>−P {r.condor.B.toFixed(0)}</span>{"  "}
                                <span style={{ color: COLORS.green }}>−C {r.condor.C.toFixed(0)}</span>{"  "}
                                <span style={{ color: COLORS.accent }}>+C {r.condor.D.toFixed(0)}</span>
                              </span>
                              <span style={{ fontFamily: MONO, fontSize: 13, color: COLORS.green }}>credit ≈ ${r.condor.credit}/sh</span>
                              <span style={{ fontFamily: MONO, fontSize: 13, color: COLORS.amber }}>max loss ${r.condor.max_loss}/sh</span>
                              <span style={{ fontFamily: MONO, fontSize: 13, color: COLORS.textMuted }}>{r.condor.credit_pct}% of width</span>
                              <span style={{ fontSize: 11, color: COLORS.textDim }}>Synthetic estimate — verify against the live chain before trading.</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
