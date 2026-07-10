import { COLORS, MONO, CARD } from "../theme";

export function MetricCard({ label, value, sub, color }) {
  return (
    <div style={{ ...CARD, padding: "16px 20px", minWidth: 0 }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: color || COLORS.text, fontFamily: MONO }}>{value ?? "—"}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function Pill({ children, active, color }) {
  const fg = active ? (color || COLORS.green) : COLORS.textDim;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
      background: active ? fg + "18" : "transparent", color: fg,
      border: `0.5px solid ${active ? fg + "40" : COLORS.border}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: fg }} />
      {children}
    </span>
  );
}

export function Section({ title, sub, children, style }) {
  return (
    <div style={{ marginBottom: 40, ...style }}>
      {title && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: sub ? 4 : 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: 0 }}>{title}</h3>
          {sub && <span style={{ fontSize: 12, color: COLORS.textDim }}>{sub}</span>}
        </div>
      )}
      {sub && <div style={{ marginBottom: 16 }} />}
      {children}
    </div>
  );
}

export function StatCard({ label, value, note, color, borderColor }) {
  return (
    <div style={{ ...CARD, borderTop: `2px solid ${borderColor || color || COLORS.accent}`, padding: "16px 20px" }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: MONO, color: color || COLORS.text }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4, lineHeight: 1.5 }}>{note}</div>}
    </div>
  );
}

export function Callout({ tone = "amber", title, children }) {
  const c = COLORS[tone] || COLORS.amber;
  return (
    <div style={{
      background: c + "08", borderRadius: 10, border: `0.5px solid ${c}30`,
      padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <span style={{ color: c, fontSize: 16, lineHeight: 1 }}>⚠</span>
      <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.7, margin: 0 }}>
        {title && <span style={{ color: c, fontWeight: 600 }}>{title} </span>}
        {children}
      </p>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: `2px solid ${COLORS.border}`, borderTopColor: COLORS.accent,
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export const TH = ({ children }) => (
  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{children}</th>
);

export const TD = ({ children, mono, color, style }) => (
  <td style={{ padding: "10px 14px", color: color || COLORS.textMuted, fontFamily: mono ? MONO : undefined, ...style }}>{children}</td>
);
