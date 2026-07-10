import { useEffect, useState } from "react";
import { COLORS, MONO } from "./theme";
import StrategyPage from "./pages/Strategy";
import BacktestPage from "./pages/Backtest";
import ValidationPage from "./pages/Validation";
import ScreenerPage from "./pages/Screener";

import backtestStatic from "./data/backtest.json";
import screenerStatic from "./data/screener.json";
import validationStatic from "./data/validation.json";
import dsrStatic from "./data/dsr.json";
import paperStatic from "./data/paper.json";

const NAV_ITEMS = ["Strategy", "Backtest", "Validation", "Screener"];

function useApi(path, fallback, onLive) {
  const [state, setState] = useState({ data: null, loading: true });
  useEffect(() => {
    fetch(path)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setState({ data, loading: false });
        onLive?.();
      })
      .catch(() => setState({ data: fallback, loading: false }));
  }, [path]);
  return [state, setState];
}

export default function App() {
  const [page, setPage] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [backtest] = useApi("/api/backtest", backtestStatic, () => setIsLive(true));
  const [validation] = useApi("/api/validation", validationStatic);
  const [dsr] = useApi("/api/dsr", dsrStatic);
  const [screener, setScreener] = useApi("/api/screener", screenerStatic);
  const [paper] = useApi("/api/paper", paperStatic);

  const handleScreenerRefresh = () => {
    setRefreshing(true);
    fetch("/api/screener/refresh", { method: "POST" })
      .then(() => {
        const poll = setInterval(() => {
          fetch("/api/screener")
            .then((r) => r.json())
            .then((data) => {
              if (data.as_of) {
                setScreener({ data, loading: false });
                setRefreshing(false);
                clearInterval(poll);
              }
            })
            .catch(() => { setRefreshing(false); clearInterval(poll); });
        }, 5000);
        setTimeout(() => { clearInterval(poll); setRefreshing(false); }, 300000);
      })
      .catch(() => setRefreshing(false));
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
          <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, fontFamily: MONO, letterSpacing: -0.5 }}>
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
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: backtest.loading ? COLORS.amber : isLive ? COLORS.green : COLORS.textDim }} />
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>
            {backtest.loading ? "Connecting…" : isLive ? "Live data" : "Demo — snapshot data"}
          </span>
        </div>
      </nav>

      <main style={{ maxWidth: 1020, margin: "0 auto", padding: "40px 24px 80px" }}>
        {page === 0 && <StrategyPage metrics={backtest.data?.metrics} benchmark={backtest.data?.benchmark} />}
        {page === 1 && <BacktestPage data={backtest.data} dsr={dsr.data} loading={backtest.loading} />}
        {page === 2 && <ValidationPage data={validation.data} loading={validation.loading} />}
        {page === 3 && (
          <ScreenerPage
            data={screener.data}
            paper={paper.data}
            loading={screener.loading}
            onRefresh={handleScreenerRefresh}
            refreshing={refreshing}
          />
        )}
      </main>

      <footer style={{ borderTop: `0.5px solid ${COLORS.border}`, padding: "20px 32px", maxWidth: 1020, margin: "0 auto" }}>
        <p style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.7, margin: 0 }}>
          For informational and educational purposes only — not investment advice, not an offer or
          solicitation. All performance figures are hypothetical simulation results using estimated
          volatility surfaces; they do not represent actual trading. Past performance, simulated or
          real, does not guarantee future results.
        </p>
      </footer>
    </div>
  );
}
