import { useMemo, useRef, useState } from "react";
import { COLORS, MONO, fmtMoney } from "../theme";

// ─── shared helpers ───────────────────────────────────────────

function niceTicks(min, max, n = 4) {
  if (!isFinite(min) || !isFinite(max) || min === max) return [min];
  const span = max - min;
  const step = Math.pow(10, Math.floor(Math.log10(span / n)));
  const err = (span / n) / step;
  const mult = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
  const s = step * mult;
  const ticks = [];
  for (let v = Math.ceil(min / s) * s; v <= max; v += s) ticks.push(v);
  return ticks;
}

// ─── EquityChart — equity line + drawdown panel + shared crosshair ───

export function EquityChart({ equity, height = 340 }) {
  const [hover, setHover] = useState(null);
  const [logScale, setLogScale] = useState(false);
  const ref = useRef(null);

  const W = 900, EQ_H = height * 0.68, DD_H = height * 0.32;
  const PAD = { l: 56, r: 12, t: 8, b: 20 };

  const model = useMemo(() => {
    if (!equity?.length) return null;
    const vals = equity.map((d) => (logScale ? Math.log(d.value) : d.value));
    const dds = equity.map((d) => d.dd);
    const vMin = Math.min(...vals), vMax = Math.max(...vals);
    const dMin = Math.min(...dds, -1);
    const iw = W - PAD.l - PAD.r;

    const x = (i) => PAD.l + (i / (equity.length - 1)) * iw;
    const yEq = (v) => PAD.t + (EQ_H - PAD.t) * (1 - (v - vMin) / (vMax - vMin || 1));
    const yDd = (v) => EQ_H + 14 + (DD_H - 34) * (v / dMin);

    const eqPath = equity.map((d, i) =>
      `${i ? "L" : "M"}${x(i).toFixed(1)},${yEq(logScale ? Math.log(d.value) : d.value).toFixed(1)}`).join("");
    const ddPath = equity.map((d, i) =>
      `${i ? "L" : "M"}${x(i).toFixed(1)},${yDd(d.dd).toFixed(1)}`).join("")
      + `L${x(equity.length - 1)},${yDd(0)}L${x(0)},${yDd(0)}Z`;

    // y ticks in real dollar space
    const realMin = Math.min(...equity.map((d) => d.value));
    const realMax = Math.max(...equity.map((d) => d.value));
    const yTicks = niceTicks(realMin, realMax, 4).map((v) => ({
      v, y: yEq(logScale ? Math.log(v) : v),
    })).filter((t) => isFinite(t.y));

    const n = equity.length;
    const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      x: x(Math.round(f * (n - 1))),
      label: equity[Math.round(f * (n - 1))].date.slice(0, 7),
    }));

    return { x, yEq, yDd, eqPath, ddPath, yTicks, xTicks, dMin };
  }, [equity, logScale]);

  if (!model) return null;

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const iw = W - PAD.l - PAD.r;
    const i = Math.round(((px - PAD.l) / iw) * (equity.length - 1));
    if (i >= 0 && i < equity.length) setHover(i);
  };

  const h = hover != null ? equity[hover] : null;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 6 }}>
        {["linear", "log"].map((s) => (
          <button key={s} onClick={() => setLogScale(s === "log")} style={{
            background: (s === "log") === logScale ? COLORS.accent + "20" : "transparent",
            border: `0.5px solid ${(s === "log") === logScale ? COLORS.accent + "60" : COLORS.border}`,
            borderRadius: 6, padding: "3px 10px", fontSize: 11, cursor: "pointer",
            color: (s === "log") === logScale ? COLORS.accent : COLORS.textDim, fontFamily: MONO,
          }}>{s}</button>
        ))}
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${height}`} style={{ width: "100%", display: "block", cursor: "crosshair" }}
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {model.yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke={COLORS.border} strokeWidth="0.5" />
            <text x={PAD.l - 8} y={t.y + 3} textAnchor="end" fontSize="10" fill={COLORS.textDim} fontFamily={MONO}>
              {fmtMoney(t.v)}
            </text>
          </g>
        ))}
        <path d={model.eqPath} fill="none" stroke={COLORS.green} strokeWidth="1.6" />
        <path d={model.ddPath} fill={COLORS.red + "30"} stroke={COLORS.red + "80"} strokeWidth="0.8" />
        <text x={PAD.l - 8} y={EQ_H + 24} textAnchor="end" fontSize="9" fill={COLORS.textDim} fontFamily={MONO}>DD</text>
        <text x={PAD.l - 8} y={model.yDd(model.dMin) + 3} textAnchor="end" fontSize="9" fill={COLORS.red} fontFamily={MONO}>
          {model.dMin.toFixed(0)}%
        </text>
        {model.xTicks.map((t, i) => (
          <text key={i} x={t.x} y={height - 4} textAnchor="middle" fontSize="10" fill={COLORS.textDim} fontFamily={MONO}>
            {t.label}
          </text>
        ))}
        {h && (
          <g>
            <line x1={model.x(hover)} x2={model.x(hover)} y1={PAD.t} y2={height - PAD.b}
                  stroke={COLORS.textMuted} strokeWidth="0.5" strokeDasharray="3 3" />
            <circle cx={model.x(hover)} cy={model.yEq(logScale ? Math.log(h.value) : h.value)} r="3.5" fill={COLORS.green} />
          </g>
        )}
      </svg>
      {h && (
        <div style={{
          position: "absolute", top: 30, left: hover / equity.length > 0.6 ? 70 : undefined,
          right: hover / equity.length > 0.6 ? undefined : 16,
          background: COLORS.bg + "f0", border: `0.5px solid ${COLORS.borderLight}`,
          borderRadius: 8, padding: "8px 12px", fontSize: 12, fontFamily: MONO, pointerEvents: "none",
        }}>
          <div style={{ color: COLORS.textMuted }}>{h.date}</div>
          <div style={{ color: COLORS.green, fontWeight: 600 }}>{fmtMoney(h.value)}</div>
          <div style={{ color: COLORS.red }}>dd {h.dd.toFixed(1)}%</div>
          <div style={{ color: COLORS.textDim }}>{h.open} open · {h.margin?.toFixed(0)}% margin</div>
        </div>
      )}
    </div>
  );
}

// ─── MonthlyHeatmap ───────────────────────────────────────────

export function MonthlyHeatmap({ monthly }) {
  const years = [...new Set(monthly.map((m) => m.year))].sort();
  const byKey = Object.fromEntries(monthly.map((m) => [`${m.year}-${m.month}`, m.ret]));
  const maxAbs = Math.max(4, ...monthly.map((m) => Math.abs(m.ret)));

  const color = (v) => {
    if (v == null) return "transparent";
    const t = Math.min(Math.abs(v) / maxAbs, 1);
    const alpha = Math.round((0.12 + 0.75 * t) * 255).toString(16).padStart(2, "0");
    return (v >= 0 ? COLORS.green : COLORS.red) + alpha;
  };

  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const cell = { width: 44, height: 26, textAlign: "center", fontSize: 11, fontFamily: MONO, borderRadius: 4 };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
        <thead>
          <tr>
            <th style={{ ...cell, color: COLORS.textDim, fontWeight: 400 }} />
            {months.map((m, i) => (
              <th key={i} style={{ ...cell, height: 18, color: COLORS.textDim, fontWeight: 400 }}>{m}</th>
            ))}
            <th style={{ ...cell, height: 18, color: COLORS.textMuted, fontWeight: 500 }}>YR</th>
          </tr>
        </thead>
        <tbody>
          {years.map((y) => {
            const yearRets = Array.from({ length: 12 }, (_, i) => byKey[`${y}-${i + 1}`]);
            const yr = yearRets.filter((v) => v != null).reduce((acc, v) => acc * (1 + v / 100), 1);
            const yrPct = (yr - 1) * 100;
            return (
              <tr key={y}>
                <td style={{ ...cell, color: COLORS.textMuted }}>{y}</td>
                {yearRets.map((v, i) => (
                  <td key={i} title={v != null ? `${y}-${String(i + 1).padStart(2, "0")}: ${v.toFixed(2)}%` : ""}
                      style={{ ...cell, background: color(v), color: v != null ? COLORS.text : COLORS.textDim }}>
                    {v != null ? v.toFixed(1) : ""}
                  </td>
                ))}
                <td style={{ ...cell, color: yrPct >= 0 ? COLORS.green : COLORS.red, fontWeight: 600 }}>
                  {yrPct.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── YearlyBars — strategy vs SPY ─────────────────────────────

export function YearlyBars({ yearly, height = 220 }) {
  if (!yearly?.length) return null;
  const W = 900;
  const PAD = { l: 44, r: 12, t: 16, b: 24 };
  const vals = yearly.flatMap((y) => [y.strategy, y.spy]).filter((v) => v != null);
  const min = Math.min(0, ...vals), max = Math.max(0, ...vals);
  const iw = W - PAD.l - PAD.r, ih = height - PAD.t - PAD.b;
  const y = (v) => PAD.t + ih * (1 - (v - min) / (max - min || 1));
  const group = iw / yearly.length;
  const bw = Math.min(22, group * 0.3);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: "100%", display: "block" }}>
      {niceTicks(min, max, 4).map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={COLORS.border} strokeWidth="0.5" />
          <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill={COLORS.textDim} fontFamily={MONO}>{t}%</text>
        </g>
      ))}
      <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke={COLORS.textDim} strokeWidth="0.8" />
      {yearly.map((d, i) => {
        const cx = PAD.l + group * (i + 0.5);
        return (
          <g key={i}>
            {d.strategy != null && (
              <rect x={cx - bw - 2} width={bw} y={Math.min(y(0), y(d.strategy))}
                    height={Math.abs(y(d.strategy) - y(0))}
                    fill={d.strategy >= 0 ? COLORS.green : COLORS.red} rx="2">
                <title>{d.year} strategy: {d.strategy}%</title>
              </rect>
            )}
            {d.spy != null && (
              <rect x={cx + 2} width={bw} y={Math.min(y(0), y(d.spy))}
                    height={Math.abs(y(d.spy) - y(0))} fill={COLORS.textDim} rx="2">
                <title>{d.year} SPY: {d.spy}%</title>
              </rect>
            )}
            <text x={cx} y={height - 8} textAnchor="middle" fontSize="10" fill={COLORS.textDim} fontFamily={MONO}>
              {String(d.year).slice(2)}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${W - 170}, 4)`} fontSize="10" fontFamily={MONO}>
        <rect width="10" height="10" fill={COLORS.green} rx="2" />
        <text x="14" y="9" fill={COLORS.textMuted}>Strategy</text>
        <rect x="80" width="10" height="10" fill={COLORS.textDim} rx="2" />
        <text x="94" y="9" fill={COLORS.textMuted}>SPY</text>
      </g>
    </svg>
  );
}

// ─── CreditScatter — real vs synthetic condor credit ──────────

export function CreditScatter({ samples, height = 300 }) {
  if (!samples?.length) return null;
  const W = 460;
  const PAD = { l: 44, r: 14, t: 14, b: 34 };
  const maxV = Math.max(...samples.map((s) => Math.max(s.real_credit, s.syn_credit))) * 1.08;
  const iw = W - PAD.l - PAD.r, ih = height - PAD.t - PAD.b;
  const x = (v) => PAD.l + (v / maxV) * iw;
  const y = (v) => PAD.t + ih * (1 - v / maxV);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: "100%", display: "block" }}>
      {niceTicks(0, maxV, 4).map((t, i) => (
        <g key={i}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={COLORS.border} strokeWidth="0.5" />
          <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill={COLORS.textDim} fontFamily={MONO}>${t}</text>
          <text x={x(t)} y={height - 20} textAnchor="middle" fontSize="9" fill={COLORS.textDim} fontFamily={MONO}>${t}</text>
        </g>
      ))}
      <line x1={x(0)} y1={y(0)} x2={x(maxV)} y2={y(maxV)} stroke={COLORS.textMuted} strokeWidth="0.8" strokeDasharray="4 4" />
      {samples.map((s, i) => (
        <circle key={i} cx={x(s.syn_credit)} cy={y(s.real_credit)} r="3.5"
                fill={COLORS.accent + "90"} stroke={COLORS.accent} strokeWidth="0.5">
          <title>{s.date}: synthetic ${s.syn_credit.toFixed(2)} / real ${s.real_credit.toFixed(2)} (ratio {s.credit_ratio})</title>
        </circle>
      ))}
      <text x={W / 2} y={height - 4} textAnchor="middle" fontSize="10" fill={COLORS.textMuted} fontFamily={MONO}>
        Synthetic credit ($/share)
      </text>
      <text x={12} y={height / 2} textAnchor="middle" fontSize="10" fill={COLORS.textMuted} fontFamily={MONO}
            transform={`rotate(-90 12 ${height / 2})`}>
        Real chain credit
      </text>
    </svg>
  );
}
