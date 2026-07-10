import { COLORS, MONO, CARD } from "../theme";
import { Section, StatCard, Spinner, Callout, TH, TD } from "../components/ui";
import { CreditScatter } from "../components/charts";

export default function ValidationPage({ data, loading }) {
  if (loading) return <Spinner />;
  const s = data?.summary;
  const samples = data?.samples ?? [];

  if (!s) {
    return <div style={{ color: COLORS.textDim, fontSize: 13, padding: 40, textAlign: "center" }}>
      No validation data — run validate_pricing.py then export_data.py
    </div>;
  }

  const skewRows = [
    { leg: "ATM level (vs VIX proxy)", model: `÷ ${(1 / 0.82).toFixed(2)}`, real: `÷ ${(1 / (1 / s.proxy_iv_vs_real_atm_mean)).toFixed(2)}` },
    { leg: "25Δ put IV / ATM", model: s.model_skew?.["25d_put"], real: s.real_skew_25d_put_mean },
    { leg: "5Δ put IV / ATM", model: s.model_skew?.["5d_put"], real: s.real_skew_5d_put_mean },
    { leg: "25Δ call IV / ATM", model: s.model_skew?.["25d_call"], real: s.real_skew_25d_call_mean },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: COLORS.text, margin: "0 0 8px" }}>Pricing validation</h2>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, maxWidth: 680, lineHeight: 1.6 }}>
          The backtest prices iron condors synthetically — so how wrong is it? For one date per month
          {" "}{s.period}, the same 25Δ/5Δ condor was built twice: once from <span style={{ color: COLORS.text }}>real {s.ticker} option
          chains</span> (bid/ask quotes, market deltas — DoltHub EOD database), once from the synthetic engine.
          {" "}{s.n_samples} head-to-head samples.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        <StatCard color={COLORS.green} label="Credit ratio (real ÷ synthetic)"
                  value={s.credit_ratio_median}
                  note={`Median across ${s.n_samples} months. IQR ${s.credit_ratio_iqr?.[0]}–${s.credit_ratio_iqr?.[1]}. Above 1.0 = the engine is conservative.`} />
        <StatCard color={COLORS.accent} label="Strike placement error"
                  value={`${s.strike_error_pct_of_spot_mean}%`}
                  note="Mean distance between synthetic and real strikes, as % of spot, averaged across all four legs." />
        <StatCard color={COLORS.teal} label="Real half-spread (near-the-money)"
                  value={`${s.half_spread_pct_of_mid_median}%`}
                  note="Median half bid/ask spread as % of mid on real chains. The cost model charges 2.5% — deliberately conservative." />
        <StatCard color={COLORS.amber} label="Calibration applied"
                  value="1.00"
                  note={`Measured ratio suggests ${s.recommended_credit_calibration}, deliberately NOT applied — the ~5% underpricing is kept as margin of safety.`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        <div style={{ ...CARD, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 4px" }}>Real vs synthetic credit</h3>
          <p style={{ fontSize: 12, color: COLORS.textDim, margin: "0 0 12px" }}>
            Each dot is one month. On the dashed line = perfect pricing.
          </p>
          <CreditScatter samples={samples} />
        </div>
        <div style={{ ...CARD, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, margin: "0 0 4px" }}>Volatility surface: model vs market</h3>
          <p style={{ fontSize: 12, color: COLORS.textDim, margin: "0 0 12px" }}>
            The skew multipliers in the engine were measured from these chains, then held fixed.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                <TH>Surface point</TH><TH>Engine</TH><TH>Measured (mean)</TH>
              </tr>
            </thead>
            <tbody>
              {skewRows.map((r, i) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                  <TD color={COLORS.text}>{r.leg}</TD>
                  <TD mono color={COLORS.accent}>{r.model}</TD>
                  <TD mono color={COLORS.teal}>{r.real}</TD>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.6, marginTop: 14 }}>
            The headline finding: CBOE-style vol indices sit ~22% above true ATM implied vol because they
            integrate the entire put-heavy skew. Pricing off raw VIX without this correction overstates
            condor credits — one of the two biggest error sources in the original version of this project.
          </p>
        </div>
      </div>

      <Callout tone="amber" title="Scope:">
        validation covers SPY only — the free chain database has thin coverage for the other 50 ETFs.
        The skew calibration is therefore extrapolated from SPY to the full universe, which is the largest
        remaining modeling risk (single-country and commodity ETFs have flatter or inverted skews).
      </Callout>

      <Section title="Sample detail" style={{ marginTop: 32 }}>
        <div style={{ ...CARD, borderRadius: 12, overflow: "auto", maxHeight: 420 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                {["Date", "Spot", "DTE", "Proxy IV", "Real ATM IV", "Synthetic credit", "Real credit", "Ratio"].map((h) => <TH key={h}>{h}</TH>)}
              </tr>
            </thead>
            <tbody>
              {samples.map((r, i) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${COLORS.border}` }}>
                  <TD mono>{r.date}</TD>
                  <TD mono>${r.spot}</TD>
                  <TD mono>{r.dte}</TD>
                  <TD mono>{(r.proxy_iv * 100).toFixed(1)}%</TD>
                  <TD mono>{r.real_atm_iv ? (r.real_atm_iv * 100).toFixed(1) + "%" : "—"}</TD>
                  <TD mono>${r.syn_credit.toFixed(2)}</TD>
                  <TD mono color={COLORS.text}>${r.real_credit.toFixed(2)}</TD>
                  <TD mono color={Math.abs(r.credit_ratio - 1) < 0.15 ? COLORS.green : COLORS.amber}>{r.credit_ratio}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
