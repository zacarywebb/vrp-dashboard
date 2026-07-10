import { COLORS, MONO, CARD } from "../theme";
import { Callout } from "../components/ui";

const PAPERS = [
  {
    section: "Why the variance risk premium exists",
    color: "accent",
    papers: [
      {
        title: "Variance Risk Premiums",
        authors: "Carr & Wu · Review of Financial Studies, 2009",
        url: "https://academic.oup.com/rfs/article-abstract/22/3/1311/1581057",
        note: "The canonical measurement. Synthesizes variance swap rates from option portfolios and documents persistently negative variance risk premia across indexes — option buyers systematically overpay for variance. This is the premium the whole strategy harvests.",
      },
      {
        title: "Delta-Hedged Gains and the Negative Market Volatility Risk Premium",
        authors: "Bakshi & Kapadia · Review of Financial Studies, 2003",
        url: "https://academic.oup.com/rfs/article-abstract/16/2/527/1579962",
        note: "Shows delta-hedged option portfolios systematically lose money — direct evidence that sellers of volatility are compensated. Underperformance grows when volatility is high, consistent with a risk premium rather than mispricing.",
      },
    ],
  },
  {
    section: "The signals",
    color: "teal",
    papers: [
      {
        title: "Expected Stock Returns and Variance Risk Premia",
        authors: "Bollerslev, Tauchen & Zhou · Review of Financial Studies, 2009",
        url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=948309",
        note: "The VRP is countercyclical — largest after volatility shocks — and high VRP predicts high subsequent returns, beating classic predictors at quarterly horizons. This is the economic backbone of both our VRP-persistence gate and the inverted IV-percentile filter: elevated IV plus a calm term structure marks the post-stress window where sellers are best paid.",
      },
      {
        title: "Cross-Section of Option Returns and Volatility",
        authors: "Goyal & Saretto · Journal of Financial Economics, 2009",
        url: "https://www.sciencedirect.com/science/article/abs/pii/S0304405X09001251",
        note: "Sorting names by the gap between implied and historical volatility produces large, robust option-selling returns — volatility mean-reverts and buyers overreact. Our daily VRP ranking of candidates is this result applied to ETFs; the within-ticker z-score variant follows their long-run-anchor logic.",
      },
      {
        title: "Risk Premia and the VIX Term Structure",
        authors: "Johnson · Journal of Financial and Quantitative Analysis, 2017",
        url: "https://bauer.uh.edu/departments/finance/documents/seminars/Johnson_020712.pdf",
        note: "The slope of the VIX term structure carries most of the information about future short-vol returns. Backwardation predicts poor short-volatility performance — the reason our term-structure gate refuses entries when short-dated vol trades above long-dated.",
      },
    ],
  },
  {
    section: "Structure and asymmetry",
    color: "amber",
    papers: [
      {
        title: "Downside Variance Risk Premium",
        authors: "Feunou, Jahan-Parvar & Okou · Federal Reserve FEDS, 2015",
        url: "https://www.federalreserve.gov/econresdata/feds/2015/files/2015020pap.pdf",
        note: "Decomposes the VRP into upside and downside components: nearly all of the premium is compensation for downside variance. Selling upside variance (short calls) collects little theoretical edge — the motivation for testing asymmetric condor deltas.",
      },
      {
        title: "Good and Bad Variance Premia and Expected Returns",
        authors: "Kilic & Shaliastovich · Management Science, 2019",
        url: "https://www.bankofcanada.ca/wp-content/uploads/2017/12/swp2017-58.pdf",
        note: "Investors dislike bad (downside) uncertainty and will pay to shed it, but actually like good (upside) uncertainty. Separating the two components sharpens return predictability — and explains why symmetric short-vol structures leave money on the table.",
      },
      {
        title: "Event-Day Options",
        authors: "Wright · NBER Working Paper 28306, 2021",
        url: "https://www.nber.org/system/files/working_papers/w28306/w28306.pdf",
        note: "Around scheduled macro announcements (FOMC especially), a large share of the implied-variance spike is risk premium — but realized moves can exceed implieds for short tenors. Motivates testing an FOMC entry blackout.",
      },
    ],
  },
  {
    section: "Statistical honesty",
    color: "red",
    papers: [
      {
        title: "The Deflated Sharpe Ratio: Correcting for Selection Bias, Non-Normality and Non-Stationarity",
        authors: "Bailey & López de Prado · Journal of Portfolio Management, 2014",
        url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2460551",
        note: "If you test N configurations and report the best, the expected maximum Sharpe under pure luck grows with N. This framework is why every trial in this project is pre-registered and counted, why selection runs on training data only, and why the first version's 4.5 Sharpe was recognized as indistinguishable from noise.",
      },
    ],
  },
];

export default function ResearchPage() {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: COLORS.text, margin: "0 0 8px" }}>Research foundations</h2>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0, maxWidth: 700, lineHeight: 1.6 }}>
          Every signal in this strategy is either taken from, or was stress-tested against, the academic
          literature on variance risk premia. Annotations explain what each paper contributes to this
          implementation — including the places where our own data disagreed with published folklore.
        </p>
      </div>

      {PAPERS.map((sec, i) => (
        <div key={i} style={{ marginBottom: 36 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS[sec.color], margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 1 }}>
            {sec.section}
          </h3>
          <div style={{ display: "grid", gap: 12 }}>
            {sec.papers.map((p, j) => (
              <a key={j} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ ...CARD, borderLeft: `2px solid ${COLORS[sec.color]}`, padding: "16px 20px", transition: "background 0.15s" }}
                     onMouseEnter={(e) => e.currentTarget.style.background = COLORS.surfaceHover}
                     onMouseLeave={(e) => e.currentTarget.style.background = COLORS.surface}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{p.title}</span>
                    <span style={{ fontSize: 11, color: COLORS.accent, fontFamily: MONO, whiteSpace: "nowrap" }}>paper ↗</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textDim, margin: "4px 0 10px", fontFamily: MONO }}>{p.authors}</div>
                  <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.65, margin: 0 }}>{p.note}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}

      <Callout tone="amber" title="A note on folklore vs evidence:">
        the most cited practitioner rule in this space — "sell premium when IV percentile is low" —
        failed in this framework once portfolio-level costs and regime gates were applied, and the
        academic literature (Bollerslev-Tauchen-Zhou above) actually predicts the opposite. Published
        results, including these, deserve out-of-sample skepticism; that is what the forward paper
        track on the Screener page is for.
      </Callout>
    </div>
  );
}
