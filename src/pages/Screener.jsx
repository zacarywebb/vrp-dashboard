import { useState } from "react";
import { COLORS, MONO, CARD } from "../theme";
import { Pill, Spinner, TH, TD } from "../components/ui";

export default function ScreenerPage({ data, loading, onRefresh, refreshing }) {
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
                          {r.ticker}{r.condor ? <span style={{ color: COLORS.textDim, marginLeft: 6 }}>{expanded === r.ticker ? "▾" : "▸"}</span> : ""}
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
